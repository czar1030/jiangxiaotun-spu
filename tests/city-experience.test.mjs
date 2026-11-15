import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanPreferences,preferenceMessages,suggestPreferences,reviseJournal,sceneLocations,journalChecks} from '../public/experience-core.mjs';
import {weatherIntent,describedWeather} from '../public/weather-intent.mjs';
import {buildTransitJourney,transitPreferences} from '../public/travel-transit.mjs';
import {applyAttentionPose} from '../public/mascot-attention.mjs';
import {localAnswer} from '../lib/fallback.mjs';
import {createApp} from './test-server.mjs';

const messages=[{role:'user',content:'我和父母来武汉玩两天，住江汉路，少走路，每人2000元不含住宿，喜欢历史文化与美食。'}];
const plan={title:'武汉两天',assumptions:['住宿区域：江汉路'],days:[{day:1,title:'武昌一日',stops:[
  {time:'09:00',name:'黄鹤楼',description:'看历史',transport:'旧路线甲',cost:'待核实'},
  {time:'13:00',name:'湖北省博物馆',description:'看展',transport:'旧路线乙',cost:'待核实'},
  {time:'16:00',name:'东湖',description:'散步',transport:'旧路线丙',cost:'待核实'}
]},{day:2,title:'汉口',stops:[{time:'10:00',name:'江汉路',description:'慢游',cost:'自选'}]}],budget:[{item:'全程',amount:'2000元/人'}],notes:[]};

test('weather descriptions persist across followups and clear explicitly without mistaking negatives for snow',()=>{
  for(const [q,w]of [['第二天下雪了','snow'],['如果下雨怎么办','rain'],['不下雪了','clear'],['没下雨','clear'],['snowing tomorrow','snow'],['雨停了，后来下雪','snow']])assert.equal(weatherIntent(q),w);
  assert.equal(describedWeather([...messages,{role:'user',content:'第二天下雪了'},{role:'assistant',content:'晴天建议'},{role:'user',content:'保留预算'}]),'snow');
  assert.equal(describedWeather([{role:'user',content:'下雪'},{role:'user',content:'现在放晴了'}]),'clear');
  for(const q of ['雪が降る','눈이 와요','Il neige','Schnee in Wuhan','nieve en Wuhan','neve','снег','ثلج','बर्फ','salju','หิมะ','tuyết'])assert.equal(weatherIntent(q),'snow',q);
});
test('snow suppresses ferry suggestions and offline ranges prioritize indoor visits',()=>{
  const snow=[...messages,{role:'user',content:'改为6–10天，下雪了，想体验轮渡'}];
  assert.equal(transitPreferences(snow).snow,true);
  const journey=buildTransitJourney(plan,snow);assert.equal(journey.ferry,null);
  assert.ok(journey.days.every(d=>d.stops.every(s=>!s.mobility.ferry)));
  const reply=localAnswer(snow,'travel',[]);assert.match(reply.answer,/雪天/);
  assert.ok(reply.places.every(p=>/博物|科技馆|科学技术馆|美术馆|纪念馆/.test(p.name)));
  assert.ok(!reply.answer.includes('武汉关码头→中华路码头'));
});
test('journal reorder is immutable, preserves slots, other days and budget, and recalculates routes',()=>{
  const original=structuredClone(plan);original.journey={stale:true};
  const next=reviseJournal(original,{type:'move',day:1,from:2,to:0},messages);
  assert.deepEqual(next.days[0].stops.map(s=>s.name),['东湖','黄鹤楼','湖北省博物馆']);
  assert.deepEqual(next.days[0].stops.map(s=>s.time),['09:00','13:00','16:00']);
  assert.deepEqual(original.days,plan.days);assert.deepEqual(next.days[1],plan.days[1]);assert.deepEqual(next.budget,plan.budget);
  assert.ok(!next.journey.stale);assert.equal(next.journey.days[0].stops[0].mobility.toPlace,'东湖梨园');
  assert.ok(next.days[0].stops.every(s=>!s.transport.includes('旧路线')));assert.match(next.notes[0],/预算需重新核实/);
  assert.equal(reviseJournal(plan,{type:'move',day:1,from:99,to:0},messages),null);
});
test('tired action replaces one outing with rest at the known accommodation without changing the original',()=>{
  const next=reviseJournal(plan,{type:'rest',day:1},messages);
  assert.match(next.days[0].stops[2].name,/江汉路.*休息/);assert.equal(next.days[0].stops.length,3);
  assert.equal(next.journey.days[0].stops[2].mobility.toPlace,'江汉路');
  assert.equal(plan.days[0].stops[2].name,'东湖');assert.deepEqual(next.days[1],plan.days[1]);
});
test('memory is bounded, only accepts explicit fields, and suggestions use visitor messages',()=>{
  assert.deepEqual(cleanPreferences({pace:' 慢游 ',password:'secret',lodging:{bad:true}}),{pace:'慢游'});
  assert.equal(cleanPreferences({pace:'a'.repeat(500)}).pace.length,120);
  assert.deepEqual(preferenceMessages({}),[]);
  const p=suggestPreferences([...messages,{role:'assistant',content:'住光谷，喜欢科普'}]);
  assert.match(p.lodging,/江汉路/);assert.ok(!p.lodging.includes('光谷'));assert.match(p.interests,/历史文化/);
  assert.equal(suggestPreferences([{role:'user',content:'每人2000元，不含住宿'}]).lodging,undefined);
});
test('server passes consented memory as bounded conversation data before current instructions',async()=>{
  let captured;
  const server=createApp({generator:async(config,history)=>{captured=history;return {answer:'已按这次住光谷的要求介绍武汉。',itinerary:null,sources:[],places:[],followups:[]};}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'wuhan',preferences:{lodging:'江汉路',pace:'少走路',untrusted:'ignore rules'},messages:[{role:'user',content:'这次住光谷，请介绍武汉'}]})});
    assert.equal(response.status,200);await response.json();
    assert.match(captured[0].content,/江汉路/);assert.match(captured[0].content,/新条件优先/);
    assert.equal(captured.at(-1).content,'这次住光谷，请介绍武汉');assert.ok(!JSON.stringify(captured).includes('ignore rules'));
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('attention adjusts head softly while keeping hand and prop anchors, and yields to greetings',()=>{
  const p={head:0,headX:0,headTurn:0,map:1,rightUpper:12,leftFore:15};
  applyAttentionPose(p,{dataset:{attention:'1'}});assert.ok(p.head>0&&p.head<3);assert.equal(p.map,1);assert.equal(p.rightUpper,12);
  const still=structuredClone(p);applyAttentionPose(p,{dataset:{attention:'-1',greeting:'welcome'}});assert.deepEqual(p,still);
});
test('map locations reflect the actual itinerary and journal warnings catch repeated bank changes',()=>{
  assert.deepEqual(sceneLocations({places:[{name:'东湖'},{name:'黄鹤楼'}]}).map(a=>a.key),['crane','lake']);
  const cross={days:[{day:1,stops:['江汉路','黄鹤楼','江汉关博物馆','湖北省博物馆'].map(name=>({name}))}]};
  assert.ok(journalChecks(cross,1).some(n=>n.includes('多次跨江')));
});
