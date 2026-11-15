import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const base='http://127.0.0.1:3210';
const revisionOnly=process.argv.includes('--revision-only');
const results=revisionOnly?JSON.parse(readFileSync('qa/languages/live-results.json','utf8')):[];
async function ask(label,locale,mode,messages){
 const response=await fetch(`${base}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locale,uiLocale:locale==='auto'?'zh-CN':locale,mode,messages}),signal:AbortSignal.timeout(120000)});
 const result=await response.json();results.push({label,messages,result});
 console.log(JSON.stringify({label,status:response.status,mode:result.meta?.mode,locale:result.meta?.locale,answer:result.answer?.slice(0,550),days:result.itinerary?.days?.length,photos:result.places?.filter(p=>p.image).length,sources:result.sources?.length}));
 mkdirSync('qa/languages',{recursive:true});writeFileSync('qa/languages/live-results.json',JSON.stringify(results,null,2));return result;
}
if(revisionOnly){
 const prior=results.find(item=>item.label==='English travel');
 const revised=await ask('English rain revision after day-number fix','en','travel',[...prior.messages,{role:'assistant',content:prior.result.answer+'\n'+JSON.stringify(prior.result.itinerary)},{role:'user',content:'It will rain on day 2. Please revise only that day and keep our other preferences.'}]);
 if(revised.meta?.mode!=='ai'||revised.itinerary?.days.map(d=>d.day).join(',')!=='1,2')throw new Error('The revised full itinerary did not preserve both travel days.');
 console.log('Verified: the full two-day itinerary retains day numbers 1 and 2.');process.exit(0);
}
const first=[{role:'user',content:'Plan a relaxed 2-day trip to Wuhan for me and my parents (3 adults), staying near Jianghan Road. Our budget is CNY 600 per person excluding hotels and travel to Wuhan. Limit walking, include rest breaks, and do not include Yellow Crane Tower. Give a plan directly.'}];
const travel=await ask('English travel','en','travel',first);
await ask('English rain revision','en','travel',[...first,{role:'assistant',content:travel.answer+'\n'+JSON.stringify(travel.itinerary)},{role:'user',content:'It will rain on day 2. Please revise only that day and keep our other preferences.'}]);
await ask('Japanese automatic reception','auto','community',[{role:'user',content:'プログラミングができなくてもSPUコミュニティに参加できますか？武漢の二つの拠点と、施設がすでに利用できるか教えてください。'}]);
await ask('Arabic SAIG','ar','saig',[{role:'user',content:'ما المطلوب للتسجيل في مسابقة SAIG، وما الموعد النهائي وكيف تحسب النتيجة؟'}]);
