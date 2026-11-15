import test from 'node:test';
import assert from 'node:assert/strict';
import {requestedDays} from '../lib/travel-days.mjs';
import {sanitizeReply} from './test-server.mjs';
import {localAnswer} from '../lib/fallback.mjs';
import {travelPose,travelArms,solveArm,travelCycle,travelMotionRate,sampledTravelPose} from '../public/travel-motion.mjs';
import {dayRanges,accommodationGroups,travelCopy,travelPlannerCopy} from '../public/travel-copy.mjs';
import {plannerChoices} from '../public/travel-plan.mjs';
import {languages} from '../public/language-core.mjs';

test('travel duration covers every day through 30 without confusing a day-two revision',()=>{
 for(let day=1;day<=30;day++)assert.equal(requestedDays(`旅行天数: ${day} 天；第二天下雨`),day);
 for(const [text,value]of [['八天',8],['十天',10],['十一天',11],['二十天',20],['三十天',30],['45天',30],['半天',1],['第二天下雨',null]])assert.equal(requestedDays(text),value,text);
 const options=dayRanges.flatMap(([start,end])=>Array.from({length:end-start+1},(_,i)=>start+i));
 assert.deepEqual(options,Array.from({length:30},(_,i)=>i+1));
 assert.equal(new Set(accommodationGroups.flatMap(([,areas])=>areas)).size,20);
 for(const {code}of languages)for(const value of Object.values({...travelCopy(code),...travelPlannerCopy(code)}))assert.ok(value.trim());
});

test('a thirty-day itinerary survives sanitization and local planning',()=>{
 const input={answer:'参考行程',itinerary:{days:Array.from({length:30},(_,i)=>({day:i+1,title:`第${i+1}天`,stops:[]}))}};
 const result=sanitizeReply(input,[]);
 assert.equal(result.itinerary.days.length,30);assert.equal(result.itinerary.days.at(-1).day,30);
 for(const days of [8,15,30]){
  const reply=localAnswer([{role:'user',content:`来武汉${days}天，住江汉路，和父母，直接安排`}],'travel',[]);
  assert.equal(reply.itinerary.days.length,days);assert.equal(reply.itinerary.days.at(-1).day,days);
  assert.match(reply.answer,/资料路线/);
  if(days===8){assert.ok(reply.itinerary.days.every(d=>!d.title.startsWith('待细化')));assert.ok(reply.itinerary.days.slice(3).every(d=>d.stops.some(s=>/博物|美术|纪念|古琴台|江滩|黎黄陂|黄鹤楼/.test(s.name))));}
  if(days===30)assert.match(reply.answer,/待细化备选/);
 }
});

test('map and telescope motions keep hands reachable and have continuous transitions',()=>{
 let previous=travelPose(0);
 let previousAngle=null;
 for(let frame=1;frame<=travelCycle*travelMotionRate;frame++){
  const pose=sampledTravelPose(frame/travelMotionRate);
  assert.ok(Math.abs(pose.lift-previous.lift)<.3);
  assert.ok(Math.abs(pose.map-previous.map)<.03);
  for(const [x,y]of [[pose.rightX-398,pose.rightY-556],[542-pose.leftX,pose.leftY-556]]){
   assert.ok(Math.hypot(x,y)<166);
   const angles=solveArm(x,y,1),a=angles.upper*Math.PI/180,b=(angles.upper+angles.fore)*Math.PI/180;
   assert.ok(Math.abs(-83*(Math.sin(a)+Math.sin(b))-x)<.01);
   assert.ok(Math.abs(83*(Math.cos(a)+Math.cos(b))-y)<.01);
  }
  const angle=solveArm(pose.rightX-398,pose.rightY-556,1).upper;
  if(previousAngle!==null)assert.ok(Math.abs(angle-previousAngle)<3,'No shoulder-angle flip');
  previousAngle=angle;
  previous=pose;
 }
 assert.equal(travelPose(6).map,1);assert.equal(travelPose(34).scope,1);
 assert.equal(travelPose(34).lift,-9);
 assert.equal(travelPose(3.5).glass,0);assert.equal(travelPose(19).glass,0);assert.equal(travelPose(19).map,1);
 for(const key of Object.keys(travelPose(0)))assert.ok(Math.abs(travelPose(47.999)[key]-travelPose(0)[key])<.01,key);
});

test('planner ranges allow exact days and typed accommodation to take precedence',()=>{
 assert.equal(dayRanges.length,5);
 assert.deepEqual(plannerChoices({days:'6-10',exactDays:'3',area:'江汉路附近',customArea:'  徐东地铁站  '}),{duration:'3 天',area:'徐东地铁站',exactDays:3});
 assert.equal(plannerChoices({days:'21-30',exactDays:'30',area:'东湖／梨园'}).exactDays,30);
 for(const value of ['0','31','2.5','abc'])assert.throws(()=>plannerChoices({exactDays:value}),RangeError);
 const range=plannerChoices({days:'6-10',customArea:'楚河汉街'});
 assert.equal(range.exactDays,null);assert.equal(requestedDays(range.duration),null);
 for(const text of ['1–5 天','6-10天','21至30天'])assert.equal(requestedDays(text),null,text);
 const response=localAnswer([{role:'user',content:'先前计划两天'},{role:'user',content:`武汉旅游，旅行天数: ${range.duration}，住宿区域: 楚河汉街`}],'travel',[]);
 assert.equal(response.itinerary,null);assert.ok(response.places.length>=2);assert.match(response.answer,/住宿周边与交通/);
 assert.ok(response.answer.indexOf('江汉路')<response.answer.lastIndexOf('实际玩几天'));
 assert.equal(requestedDays(`${range.duration}；现在确定8天`),8);
 const typed=localAnswer([{role:'user',content:'武汉旅行，旅行天数: 3 天\n住宿区域: 徐东地铁站附近'}],'travel',[]);
 assert.ok(typed.itinerary.assumptions.some(value=>value.includes('徐东地铁站附近')));
});

test('map arms stay on separate sides throughout the performance, with continuous elbow changes',()=>{
 let previous;
 for(let frame=0;frame<=travelCycle*travelMotionRate;frame++){
  const pose=sampledTravelPose(frame/travelMotionRate),arms=travelArms(pose);
  const chain=(side,shoulder,mirror)=>{
   const a=arms[side+'Upper']*Math.PI/180,b=(arms[side+'Upper']+arms[side+'Fore'])*Math.PI/180;
   return [shoulder,shoulder-mirror*83*Math.sin(a),shoulder-mirror*83*(Math.sin(a)+Math.sin(b))];
  };
  const right=chain('right',398,1),left=chain('left',542,-1);
  // Whole arm segments, including the sleeves, need room between them.
  assert.ok(Math.min(...left)-Math.max(...right)>75,`Crossed arms at ${frame/travelMotionRate}s`);
  if(pose.map>0){assert.ok(right[1]<398);assert.ok(left[1]>542);}
  if(pose.raisedBend>0&&pose.raisedBend<1){assert.equal(pose.map,0);assert.equal(pose.glass,0);assert.equal(pose.scope,0);}
  if(previous)for(const key of Object.keys(arms))assert.ok(Math.abs(arms[key]-previous[key])<1.5,`Joint jump: ${key}`);
  previous=arms;
 }
});
