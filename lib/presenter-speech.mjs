import {spawn} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export const presenterVoices = Object.freeze([
  {id:'zh-CN-XiaoyiNeural',label:'小豚 · 少女帝王音',locale:'zh-CN'},
  {id:'zh-CN-XiaoxiaoNeural',label:'自然女声 · 沉稳备用',locale:'zh-CN'},
  {id:'en-US-JennyNeural',label:'Jenny · English',locale:'en-US'},
  {id:'Microsoft Huihui Desktop',label:'本机女声 · 离线备用',locale:'zh-CN'}
]);
const script=fileURLToPath(new URL('../scripts/presenter-speech.ps1',import.meta.url));
const scriptText=readFileSync(script,'utf8');
const neuralScript=fileURLToPath(new URL('../scripts/presenter-neural-speech.py',import.meta.url));
const python=process.env.PRESENTER_PYTHON||fileURLToPath(new URL(process.platform==='win32'?'../tools/voice-venv/Scripts/python.exe':'../tools/voice-venv/bin/python',import.meta.url));
const cache=new Map();let cacheSize=0,active=0;

export function synthesizePresenterSpeech(input,signal){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Object.assign(new Error('请求格式错误。'),{status:400});
  let {text,voice,rate=0,locale='zh-CN'}=input;
  if(typeof text!=='string'||!text.trim()||text.length>800)throw Object.assign(new Error('请将每段讲解控制在800字以内。'),{status:400});
  locale=typeof locale==='string'&&locale.length<=35?locale:'zh-CN';
  if(!presenterVoices.some(item=>item.id===voice))voice=locale.startsWith('zh')?presenterVoices[0].id:presenterVoices[2].id;
  rate=Number.isInteger(rate)?Math.max(-3,Math.min(3,rate)):0;
  const payload=JSON.stringify({text:text.trim(),voice,rate,locale});
  if(signal?.aborted)return Promise.reject(new Error('Aborted'));
  if(cache.has(payload))return Promise.resolve(cache.get(payload));
  const neural=voice.endsWith('Neural');
  if(neural&&!existsSync(python))throw Object.assign(new Error('自然语音尚未安装，请选择本机音色。'),{status:503});
  if(!neural&&process.platform!=='win32')throw Object.assign(new Error('本机语音暂不可用，请使用浏览器音色。'),{status:503});
  if(active>=2)throw Object.assign(new Error('小豚正在准备声音，请稍后重试。'),{status:429});
  active++;
  return new Promise((resolve,reject)=>{
    const child=spawn(neural?python:'powershell.exe',neural?[neuralScript]:['-NoProfile','-NonInteractive','-Command',scriptText],{windowsHide:true,stdio:['pipe','pipe','pipe']});
    const parts=[];let size=0,settled=false;
    const timeout=setTimeout(()=>finish(new Error('语音准备超时，请重试。')),45000);
    const abort=()=>finish(new Error('Aborted'));
    const finish=(error,audio)=>{
      if(settled)return;settled=true;clearTimeout(timeout);signal?.removeEventListener('abort',abort);active--;
      if(error){child.kill();reject(error);return;}
      while(cacheSize+audio.length>12*1024*1024&&cache.size){const key=cache.keys().next().value;cacheSize-=cache.get(key).length;cache.delete(key);}
      if(audio.length<12*1024*1024){cache.set(payload,audio);cacheSize+=audio.length;}
      resolve(audio);
    };
    signal?.addEventListener('abort',abort,{once:true});
    child.stdout.on('data',part=>{size+=part.length;if(size>16*1024*1024)finish(new Error('语音内容过长。'));else parts.push(part);});
    child.stderr.on('data',()=>{});
    child.on('error',()=>finish(new Error('本机语音暂不可用。')));
    child.stdin.on('error',()=>finish(new Error('本机语音暂不可用。')));
    child.on('close',code=>{
      const audio=Buffer.concat(parts);
      const valid=neural?audio.length>1000&&(audio.toString('ascii',0,3)==='ID3'||audio[0]===255):audio.toString('ascii',0,4)==='RIFF';
      if(code!==0||!valid)finish(new Error('自然女声暂时连接不上，请重试。'));
      else finish(null,audio);
    });
    child.stdin.end(payload,'utf8');
  });
}
