// Reproducible functional audit. Saves business results only; never credentials.
import {mkdirSync,writeFileSync,readdirSync,readFileSync} from 'node:fs';
import {resolve,relative,extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createApp,root} from '../server.mjs';
import {composerGuidance} from '../public/composer-guidance.mjs';
const out=resolve(root,'qa/site-audit');mkdirSync(out,{recursive:true});
const live=process.argv.includes('--live');
const summary=[];
async function run(mode){
  const app=createApp();await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${app.address().port}`;
  async function ask(question,name,history=[],previousItinerary){
    const messages=[...history,{role:'user',content:question}],start=Date.now();
    try{
      const response=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,locale:'zh-CN',localOnly:!live,messages,previousItinerary}),signal:AbortSignal.timeout(315000)});
      const reply=await response.json();
      writeFileSync(resolve(out,`${live?'live':'local'}-${name}.json`),JSON.stringify(reply,null,2));
      const row={name,question,status:response.status,seconds:Math.round((Date.now()-start)/1000),mode:reply.meta?.mode,code:reply.meta?.code,generation:reply.meta?.generation,photos:reply.places?.filter(p=>p.image).map(p=>p.name)||[],unmatched:reply.places?.filter(p=>!p.image).map(p=>p.name)||[],days:reply.itinerary?.days?.length||0,followups:reply.followups||[]};
      summary.push(row);console.log(JSON.stringify(row));return {messages,reply};
    }catch(error){const row={name,error:error.name};summary.push(row);console.log(JSON.stringify(row));}
  }
  try{
    for(const [i,q] of composerGuidance(mode,'zh-CN').questions.entries()){
      const result=await ask(q,`${mode}-${i+1}`);
      if(live&&i===0&&result?.reply.followups?.length)await ask(result.reply.followups[0],`${mode}-followup`,[...result.messages,{role:'assistant',content:result.reply.answer}]);
    }
    if(live&&mode==='travel'){
      const q='我和父母在武汉玩两天，住江汉路，每人600元不含住宿和往返交通，少走路，坐地铁，有条件坐一次轮渡，不安排高铁。请直接安排。';
      const first=await ask(q,'travel-exact');
      if(first)await ask('第二天下雨，保留其他条件，帮我调整。','travel-rain',[...first.messages,{role:'assistant',content:first.reply.answer}],first.reply.itinerary);
      if(process.argv.includes('--long'))await ask('我和父母来武汉玩8天，住江汉路，每人预算3000元不含住宿，不去黄鹤楼，不想走太多路，喜欢历史美食。请直接安排完整8天行程，以地铁为主，天气适合时可选一次轮渡，不安排高铁。','travel-eight');
    }
  }finally{await new Promise(r=>app.close(r));}
}
if(process.argv.includes('--assets')){
  const app=createApp();await new Promise(r=>app.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${app.address().port}`,files=[];
  function walk(dir){for(const f of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,f.name);if(f.isDirectory())walk(path);else files.push(path);}}walk(resolve(root,'public'));
  const bad=[],references=new Set(),syntaxErrors=[];
  for(const file of files){
    const url='/'+relative(resolve(root,'public'),file).replaceAll('\\','/');references.add(url);
    if(['.html','.mjs','.js','.css','.svg'].includes(extname(file))){
      const text=readFileSync(file,'utf8');
      for(const m of text.matchAll(/["'`(](\/(?:assets|materials)\/[^\s"'`<>)}$]+)["'`)]/g))if(!m[1].endsWith('/'))references.add(m[1]);
      for(const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?)["']([^"']+)["']/g)){
        if(m[1].startsWith('.')||m[1].startsWith('/'))references.add(new URL(m[1],base+url).pathname);
      }
      if(['.mjs','.js'].includes(extname(file))){const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8',windowsHide:true});if(check.status!==0)syntaxErrors.push({file:relative(root,file),error:check.stderr});}
    }
  }
  try{for(const url of references){const response=await fetch(base+url,{method:'HEAD'});if(!response.ok)bad.push({url,status:response.status});}}
  finally{await new Promise(r=>app.close(r));}
  const report={files:files.length,checked:references.size,bad,syntaxErrors};writeFileSync(resolve(out,'assets.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}else{
  // Separate instances keep QA traffic independent from visitors' rate limits.
  const results=await Promise.allSettled(['wuhan','travel','community','saig'].map(run));
  for(const result of results)if(result.status==='rejected')console.log(result.reason?.message);
  writeFileSync(resolve(out,`${live?'live':'local'}-summary.json`),JSON.stringify(summary,null,2));
}
