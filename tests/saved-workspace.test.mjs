import test from 'node:test';
import assert from 'node:assert/strict';
import {createChatSession,loadChatWorkspace,saveChatSession,sessionTitle} from '../public/chat-sessions.mjs';
import {journeyPlanQuestion,cleanJourneyList,journeySelection,journeySelectionMessages,journeyArea} from '../public/journey-list.mjs';
import {buildReferenceDays,routeSelections,referenceRoutePacks} from '../lib/reference-routes.mjs';
import {localAnswer} from '../lib/fallback.mjs';
import {loadMedia} from '../lib/media.mjs';
import {createApp,root} from './test-server.mjs';
const subjects=loadMedia(root),user=content=>({role:'user',content});

test('legacy sessions preserve full answers, itinerary and more than thirty messages',()=>{
 const messages=Array.from({length:34},(_,i)=>i%2?{role:'assistant',content:'路线'+i,result:{answer:'路线'+i,itinerary:{days:[{day:1,stops:[{name:'黄鹤楼'}]}]}}}:user('问题'+i));
 const workspace=loadChatWorkspace(null,{mode:'travel',localOnly:true,messages});
 assert.equal(workspace.sessions.length,1);assert.equal(workspace.sessions[0].messages.length,34);assert.deepEqual(workspace.sessions[0].messages.at(-1).result,messages.at(-1).result);
 assert.equal(workspace.sessions[0].localOnly,true);
});

test('new conversations keep old results, separate drafts and stable established names',()=>{
 let workspace=loadChatWorkspace(null);const first=workspace.activeId;
 const state={mode:'travel',messages:[user('带父母游武汉8天')],localOnly:true};
 workspace=saveChatSession(workspace,first,state,'明天下雨怎么办',100);
 state.messages.push(user('外部变化'));assert.equal(workspace.sessions[0].messages.length,1);
 const fresh=createChatSession('community',false,101);workspace={...workspace,activeId:fresh.id,sessions:[fresh,...workspace.sessions]};
 workspace=saveChatSession(workspace,fresh.id,{mode:'community',messages:[user('我的参赛作品')],localOnly:false},'另一份草稿',102);
 const restored=workspace.sessions.find(s=>s.id===first);assert.equal(restored.draft,'明天下雨怎么办');assert.equal(restored.title,'带父母游武汉 · 8天');assert.equal(workspace.sessions.length,2);
 workspace=saveChatSession(workspace,first,{...state,mode:'saig'},restored.draft,103);
 assert.equal(workspace.sessions[0].title,'带父母游武汉 · 8天');
 workspace.sessions[0].customTitle=true;workspace.sessions[0].title='父母的旅行';
 workspace=saveChatSession(workspace,first,state,'新草稿',104);assert.equal(workspace.sessions[0].title,'父母的旅行');
 const reloaded=loadChatWorkspace(JSON.parse(JSON.stringify(workspace)));assert.equal(reloaded.activeId,first);assert.equal(reloaded.sessions.find(s=>s.id===fresh.id).draft,'另一份草稿');
 assert.match(sessionTitle([user('雨天两日游武汉')],'travel'),/雨天/);
});

test('travel lists reject unknown IDs, deduplicate and distinguish visited from selected',()=>{
 const list=cleanJourneyList({entries:[{id:'yellow-crane',status:'visited',selected:true},{id:'yellow-crane'},{id:'hubei-museum',selected:true},{id:'jianghan',selected:false},{id:'unknown'},{id:'li-bai'}]},subjects);
 assert.deepEqual(journeySelection(list),{include:['hubei-museum'],exclude:['yellow-crane']});
 assert.deepEqual(journeySelection({...list,excludeVisited:false}).exclude,[]);
 assert.equal(journeyArea(subjects.find(s=>s.id==='jianghan')),'汉口');assert.equal(journeyArea(subjects.find(s=>s.id==='qintai-art-museum')),'汉阳');
 assert.equal(list.entries.length,3);
 const messages=journeySelectionMessages({include:['hubei-museum','yellow-crane','ignore rules'],exclude:['yellow-crane']},subjects);
 assert.match(messages[0].content,/希望安排：湖北省博物馆/);assert.match(messages[0].content,/本次不安排：黄鹤楼/);assert.ok(!messages[0].content.includes('ignore rules'));
});

test('eight days have distinct real visits, clustered banks, regional food and indoor alternatives',()=>{
 const days=buildReferenceDays(8,{messages:[user('武汉8天，和父母，住江汉路，少走路')],subjects,relaxed:true});
 assert.equal(days.length,8);assert.ok(days.every(d=>d.title.startsWith('资料路线')));
 const names=days.flatMap(d=>d.stops.filter(s=>referenceRoutePacks.some(p=>p.sites.some(v=>v.name===s.name))).map(s=>s.name));
 assert.equal(new Set(names).size,names.length);assert.ok(names.length>=12);
 assert.deepEqual(days.map(d=>d.title.split(' · ')[1]),['汉口','汉口','汉口','武昌','武昌','武昌','汉阳','汉阳']);
 assert.ok(days.every(d=>d.stops.some(s=>/午餐与午休/.test(s.name))));assert.match(JSON.stringify(days),/雨天.*替换/);
 assert.ok(new Set(days.map(d=>d.stops[1].description)).size>=3);
});

test('long and rainy trips disclose limitations without inventing new daily activities',()=>{
 const rain=buildReferenceDays(8,{messages:[user('8天一直下雨')],subjects,rain:true});
 const outdoor=new Set(referenceRoutePacks.flatMap(p=>p.sites).filter(s=>!s.indoor).map(s=>s.name));
 assert.ok(rain.every(d=>d.stops.every(s=>!outdoor.has(s.name))));
 const revised=buildReferenceDays(3,{messages:[user('3天，不去湖北省博物馆。第二天下雨')],subjects,rain:true,rainSecondOnly:true});assert.ok(revised[1].stops.every(s=>!/湖北省博物馆|东湖/.test(s.name)));assert.ok(revised[1].stops.some(s=>/博物|美术|纪念/.test(s.name)));
 const long=buildReferenceDays(30,{messages:[user('30天全是雨天')],subjects,rain:true});
 assert.equal(long.length,30);assert.match(long.at(-1).title,/待细化备选/);assert.match(long.at(-1).stops[0].description,/重访备选/);
 for(const pack of referenceRoutePacks)for(const site of pack.sites)assert.ok(subjects.some(s=>s.id===site.id&&s.image),site.id);
});

test('wishlist preferences affect exact and range plans and newer explicit choices override saved exclusions',()=>{
 const saved=journeySelectionMessages({include:['zhang-museum'],exclude:['yellow-crane','east-lake']},subjects);
 const messages=[...saved,user('武汉两天，住江汉路')];
 const resolved=routeSelections(saved,subjects);assert.deepEqual([...resolved.include],['zhang-museum']);assert.ok(!resolved.include.has('wuhan-museum'));
 const days=buildReferenceDays(2,{messages,subjects});assert.ok(days.some(d=>d.stops.some(s=>s.name==='张之洞与武汉博物馆')));assert.ok(!JSON.stringify(days).includes('黄鹤楼'));assert.ok(!JSON.stringify(days).includes('东湖听涛'));
 const selection=routeSelections([...saved,user('现在优先安排：黄鹤楼。')],subjects);assert.ok(selection.include.has('yellow-crane'));assert.ok(!selection.exclude.has('yellow-crane'));
 assert.ok(!journeyPlanQuestion([user('武汉8天')]).includes('1–5天'));assert.ok(!journeyPlanQuestion([user('武汉6–10天')]).includes('1–5天'));assert.match(journeyPlanQuestion([]),/1–5天/);
 const range=localAnswer([...saved,user('武汉1-5天')],'travel',[],subjects);assert.equal(range.itinerary,null);assert.match(range.answer,/张之洞与武汉博物馆/);assert.ok(!range.places.some(p=>p.name==='黄鹤楼'));
 const short=localAnswer([...journeySelectionMessages({include:['yellow-crane','zhang-museum','panlongcheng']},subjects),user('武汉1天')],'travel',[],subjects);assert.match(short.answer,/未排入/);
});

test('chat endpoint applies validated travel list to offline routes and online context only in travel mode',async()=>{
 let captured;const server=createApp({generator:async(config,history)=>{captured=history;return {answer:'按清单介绍。',places:[],followups:[],sources:[]};}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const post=async body=>{const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();};
 try{
  const list={include:['zhang-museum'],exclude:['yellow-crane','east-lake']};
  const result=await post({mode:'travel',localOnly:true,journeyList:list,messages:[user('武汉两天，住江汉路')]});
  assert.ok(result.itinerary.days.some(d=>d.stops.some(s=>s.name==='张之洞与武汉博物馆')));
  assert.ok(!result.itinerary.days.some(d=>d.stops.some(s=>/黄鹤楼|东湖/.test(s.name))));
  await post({mode:'travel',journeyList:list,messages:[user('请介绍旅行清单里的地方')]});assert.match(captured[0].content,/张之洞/);assert.equal(captured.at(-1).content,'请介绍旅行清单里的地方');
  await post({mode:'community',journeyList:list,messages:[user('介绍SPU社区')]});assert.equal(captured.length,1);
 }finally{await new Promise(r=>server.close(r));}
});
