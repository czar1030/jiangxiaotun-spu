import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {synthesizePresenterSpeech} from '../lib/presenter-speech.mjs';
import {presenterTopics,presenterAudition} from '../public/presenter-content.mjs';

const samples=[...Object.entries(presenterTopics).map(([id,topic])=>[id,topic.greeting]),['audition',presenterAudition]];
const records=[];
// Generate two at a time, respecting the speech service's process limit.
for(let start=0;start<samples.length;start+=2){
  const batch=await Promise.allSettled(samples.slice(start,start+2).map(async([id,text])=>{
    const audio=await synthesizePresenterSpeech({text,voice:'zh-CN-XiaoyiNeural',rate:0,locale:'zh-CN'});
    const file=`${id}-imperial-v2.mp3`;await writeFile(new URL(`../public/assets/presenter/voices/${file}`,import.meta.url),audio);
    records.push({file,text,bytes:audio.length,sha256:createHash('sha256').update(audio).digest('hex')});
    console.log(`已生成 ${file} (${audio.length} bytes)`);
  }));
  for(const result of batch)if(result.status==='rejected')throw result.reason;
}
await writeFile(new URL('../public/assets/presenter/voices/provenance-v2.json',import.meta.url),JSON.stringify({
  voice:'zh-CN-XiaoyiNeural',engine:'Microsoft neural speech via edge-tts 7.3.1',pitch:'-12Hz',rate:'+4%',volume:'+12%',
  target:'保留少女帝王音的音色，去掉拖沓与有气无力的听感；说话利落、有底气。',
  feedback:'2026-11-12 用户：音色没有太大问题，就说话有气无力的像个僵尸。',
  status:'用户于2026-11-12确认：很好，不错。声音定了，剩下继续。音色、节奏与力度作为默认版本锁定。',approvedAt:'2026-11-12',clone:false,
  supersedes:'provenance.json',files:records,generatedAt:new Date().toISOString()
},null,2)+'\n');
