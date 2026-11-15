import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {metroNetwork,metroRoute,resolveTransitLocation,transitPreferences,buildTransitJourney} from '../public/travel-transit.mjs';
import {routeCapsule,transitText} from '../public/transit-capsules.mjs';
import {createApp} from './test-server.mjs';

const messages=[{role:'user',content:'来武汉3天，直接安排\n住宿区域: 江汉路附近\n抵达车站: 武汉站\n铁路信息: 长沙出发，日期待定'}];
const plan={days:[{day:1,title:'过江看古城',stops:[{name:'黄鹤楼'},{name:'户部巷'},{name:'江汉路'}]}]};

test('metro journeys use adjacent official stations and continuous transfers in both directions',()=>{
 const destinations=['江汉路','司门口黄鹤楼','省博湖北日报','武汉火车站','汉口火车站','武昌火车站','武汉东站','梨园','钟家村'];
 for(const from of destinations)for(const to of destinations){
  const route=metroRoute(from,to);
  assert.ok(route,`${from} → ${to}`);
  assert.equal(route.from,from);assert.equal(route.to,to);
  if(from===to){assert.equal(route.kind,'local');continue;}
  assert.equal(route.legs[0].from,from);assert.equal(route.legs.at(-1).to,to);
  assert.equal(route.transfers,route.legs.length-1);
  assert.equal(route.stops,route.legs.reduce((n,l)=>n+l.stops,0));
  route.legs.forEach((leg,i)=>{
   const stations=metroNetwork.lines.find(l=>l.id===leg.line).stations;
   const start=stations.indexOf(leg.from),end=stations.indexOf(leg.to),step=Math.sign(end-start);
   assert.equal(leg.stops,Math.abs(end-start));
   assert.deepEqual(leg.stations,Array.from({length:leg.stops+1},(_,j)=>stations[start+j*step]));
   assert.equal(leg.direction,step>0?stations.at(-1):stations[0]);
   if(i)assert.equal(route.legs[i-1].to,leg.from);
  });
 }
 const crane=metroRoute('江汉路','司门口黄鹤楼');
 assert.deepEqual(crane.legs.map(l=>l.line),['2','5']);
 assert.equal(crane.legs[0].to,'积玉桥');
 assert.equal(resolveTransitLocation('武汉站').station,'武汉火车站');
 assert.notEqual(resolveTransitLocation('武汉站东广场').station,'武汉火车站');
 assert.equal(metroRoute('不存在的站','江汉路'),null);
 assert.equal(metroRoute('梨园','江汉路').transfers,1,'Tie favors fewer changes');
});

test('city travel keeps hotel links and ferry endpoints without railway arrival planning',()=>{
 const natural=[{role:'user',content:'来武汉2天，住江汉路附近，预算800，不含住宿及往返武汉交通。'}];
 assert.equal(transitPreferences(natural).lodging.station,'江汉路','Budget exclusion must not replace hotel location');
 const journey=buildTransitJourney(plan,messages);
 assert.equal(journey.arrival,undefined,'old conversations with rail details do not add a rail section');
 const [crane,hubu,back]=journey.days[0].stops;
 assert.equal(crane.mobility.from,'江汉路');
 assert.equal(crane.mobility.to,'司门口黄鹤楼');
 assert.equal(crane.mobility.ferry.from,'武汉关码头');
 assert.equal(crane.mobility.ferry.to,'中华路码头');
 assert.equal(hubu.mobility.kind,'local');
 assert.equal(back.mobility.ferry,undefined);
 assert.equal(journey.ferry,null);
 const reverse=buildTransitJourney({days:[{day:1,stops:[{name:'江汉关'}]}]},[{role:'user',content:'住宿区域: 黄鹤楼附近'}]);
 assert.equal(reverse.days[0].stops[0].mobility.ferry.from,'中华路码头');
 for(const request of ['不坐轮渡','不想坐船','不要轮渡','取消轮渡','明天下雨']){
  const revised=buildTransitJourney(plan,[...messages,{role:'user',content:request}]);
  assert.equal(revised.ferry,null);assert.ok(revised.days[0].stops.every(s=>!s.mobility.ferry));
 }
 const absent=buildTransitJourney(plan,[]);
 assert.equal(absent.arrival,undefined);
 assert.doesNotMatch(transitText({...journey,arrival:{station:'武汉站',info:'G1234'}}),/铁路抵达|G1234|12306/);
 assert.doesNotMatch(transitText(absent),/G\d{2,}|D\d{2,}|\d{2}:\d{2}/);
});

test('localized planner accommodation labels preserve the same hotel anchor',()=>{
 for(const code of ['en','ja','ko','fr','de','es','pt','it','ru','ar','hi','th','vi','id','zh-TW']){
  const pack=JSON.parse(readFileSync(new URL(`../public/locales/${code}.json`,import.meta.url),'utf8'));
  assert.equal(transitPreferences([{role:'user',content:`${pack['住宿区域']}: 江汉路附近`}]).lodging.station,'江汉路',code);
 }
});

test('an explicit ferry stop retains its pier direction and takes priority over an extra ferry suggestion',()=>{
 for(const [from,to] of [['中华路码头','武汉关码头'],['武汉关码头','中华路码头']]){
  const itinerary={days:[{day:1,stops:[{name:'黄鹤楼'},{name:`${from}—${to}（普通轮渡备选）`},{name:'江汉路'}]}]};
  const journey=buildTransitJourney(itinerary,messages);
  assert.ok(!journey.days[0].stops[0].mobility.ferry);
  const route=journey.days[0].stops[1].mobility;
  assert.equal(route.kind,'ferry');assert.equal(route.from,from);assert.equal(route.to,to);
  assert.equal(journey.ferry,null);
  assert.match(routeCapsule(route),/武汉轮渡/);
  assert.match(transitText(journey),/普通轮渡备选/);
 }
});

test('unknown addresses do not inherit a stale location or invented metro boarding station',()=>{
 const unknownHotel=buildTransitJourney(plan,[{role:'user',content:'住宿区域: 某个尚未确认的酒店'}]);
 assert.equal(unknownHotel.days[0].stops[0].mobility.kind,'unknown');
 const unknownStop=buildTransitJourney({days:[{day:1,stops:[{name:'黄鹤楼'},{name:'尚未定位的展馆'},{name:'湖北省博物馆'}]}]},messages);
 assert.equal(unknownStop.days[0].stops[2].mobility.kind,'unknown');
 const long=buildTransitJourney({days:Array.from({length:30},(_,i)=>({day:i+1,stops:[{name:'湖北省博物馆'}]}))},messages);
 assert.equal(long.days.length,30);
 assert.ok(long.days.every(d=>d.stops[0].mobility.from==='江汉路'&&d.returnRoute.to==='江汉路'));
});

test('expandable city transport cards escape place names and export transfers and ferry piers',()=>{
 const journey=buildTransitJourney(plan,messages);
 const metro=routeCapsule(journey.days[0].stops[0].mobility);
 assert.match(metro,/<details[^>]*>.*<summary>/);assert.match(metro,/积玉桥/);assert.match(metro,/上车/);assert.match(metro,/下车/);
 const html=routeCapsule({...journey.days[0].stops[0].mobility,fromPlace:'<script>alert(1)</script>'});
 assert.ok(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);
 const text=transitText(journey);
 for(const name of ['2号线','5号线','积玉桥','武汉关码头','中华路码头'])assert.ok(text.includes(name));
 assert.equal(routeCapsule({kind:'unknown'}),'');
});

test('HTTP local planner returns verified transport independently of model text',async()=>{
 const server=createApp({generator:async()=>{throw new Error('must not call model');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,mode:'travel',localOnly:true})});
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.meta.mode,'local');assert.equal(result.itinerary.days.length,3);
  assert.equal(result.itinerary.journey.arrival,undefined);
  assert.equal(result.itinerary.journey.days.at(-1).returnRoute.to,'江汉路');
  assert.ok(result.itinerary.journey.days.some(d=>d.stops.some(s=>s.mobility.kind==='metro')));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
