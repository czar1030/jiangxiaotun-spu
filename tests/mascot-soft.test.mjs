import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {receptionCycle,restingSoftPose,softIdlePose,softGreetingPose,advanceSoftPose,sleepyCycle,sleepySoftPose,softRecoveryPose,easeIdleEntry} from '../public/mascot-soft-motion.mjs';
import {renderSoftRig} from '../public/mascot-soft-rig.mjs';
import {renderCommunityRig} from '../public/community-rig.mjs';
import {communityPose} from '../public/community-motion.mjs';
import {travelPose,travelArms} from '../public/travel-motion.mjs';
import {greetingMotion,sampleGreeting} from '../public/mascot-motion.mjs';
import {softSleeve} from '../public/soft-sleeve.mjs';
import {bodySpace} from '../public/body-space.mjs';

test('whole-body greetings keep the waving palm outside the face and reset the complete posture',()=>{
 const clip=greetingMotion('wave');
 for(const base of [restingSoftPose(5),communityPose(8),{...travelPose(9),...travelArms(travelPose(9))}]){
  let previous;
  for(let i=0;i<=clip.duration/1000*120;i++){
   const time=i/120,p=softGreetingPose({...base},sampleGreeting(clip,time),'waving',time);
   const wrist=softSleeve(p,'right').wrist;
   if(wrist.y<500)assert.ok(wrist.x<335,'Palm clears the cheek throughout the greeting');
   assert.equal(p.laptop,0);assert.equal(p.map,0);assert.equal(p.scope,0);
   assert.equal(p.leftHeel,0);assert.equal(p.rightHeel,0);
   if(previous){
    assert.ok(Math.hypot(p.shift-previous.shift,p.lift-previous.lift)<.2,'Weight is transferred without a teleport');
    assert.ok(Math.abs(p.head-previous.head)<.25,'Head joins the torso without a sharp snap');
   }
   previous=p;
  }
  for(const key of ['chest','headTurn','headPitch','knee','waveHand','palmCurl','shoulderRight','shoulderLeft'])assert.ok(Math.abs(previous[key])<1e-8,`${key} must not leak into the next action`);
 }
});

test('moving hems connect to the calves while supporting shoes remain planted',async()=>{
 const {rig,attrs}=await rigAsset('reception','soft');
 for(const time of [0,.3,.85,1.6,2.5,4.3,5.2]){
  const clip=greetingMotion('wave'),p=softGreetingPose(restingSoftPose(),sampleGreeting(clip,time),'waving',time);
  renderSoftRig(rig,p,time);
  for(const [side,x]of [['left',397],['right',491]]){
   const top=attrs[side+'Leg'].d.match(/^M([^ ]+) ([^L]+)/).slice(1).map(Number);
   const expected=bodySpace(p,time).point(x,791);
   assert.ok(Math.hypot(top[0]-expected.x,top[1]-expected.y)<1e-8,'Leg reaches the moving hem');
  }
  assert.equal(attrs.leftFoot.transform,'rotate(0 455 944)');assert.equal(attrs.rightFoot.transform,'rotate(0 493 944)');
 }
});

test('telescope calves meet their rotated socks through heel raise, hold and lowering',async()=>{
 const {rig,attrs}=await rigAsset('travel','travel');
 for(const time of [0,26,28.6,29,29.8,30.8,34,38.5,39.2,40.5,41.3,43,47.9]){
  const p=travelPose(time);Object.assign(p,travelArms(p));renderSoftRig(rig,p,time,true);
  for(const [side,x1,x2,pivot,angle] of [['left',397,456,455,p.leftHeel],['right',491,551,493,-p.rightHeel]]){
   const values=attrs[side+'Leg'].d.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/g).map(Number);
   const radians=angle*Math.PI/180;
   const rotate=(x,y)=>({x:pivot+(x-pivot)*Math.cos(radians)-(y-944)*Math.sin(radians),y:944+(x-pivot)*Math.sin(radians)+(y-944)*Math.cos(radians)});
   for(const [index,x] of [[6,x2+3],[8,x1-3]]){
    const cuff=rotate(x,864);
    assert.ok(Math.hypot(values[index]-cuff.x,values[index+1]-cuff.y)<1e-8,`${side} calf must overlap its moving sock at ${time}s`);
   }
   const hem=bodySpace(p,time,true).point(x1,791);
   assert.ok(Math.hypot(values[0]-hem.x,values[1]-hem.y)<1e-8,'Upper calf stays attached to hem');
   assert.equal(attrs[side+'Foot'].transform,`rotate(${angle} ${pivot} 944)`,'Shoe keeps its planted toe pivot');
  }
 }
});

test('secondary cloth motion is bounded at 30/60/120 Hz without moving hand or prop anchors',()=>{
 const clip=greetingMotion('wave');
 for(const rate of [30,60,120]){
  const p=restingSoftPose(),velocity={};let maxFlex=0,maxRibbon=0;
  for(let i=0;i<7*rate;i++){
   const target=softGreetingPose(restingSoftPose(),sampleGreeting(clip,i/rate),'waving',i/rate);
   advanceSoftPose(p,target,velocity,1/rate);
   for(const side of ['right','left']){
    const sleeve=softSleeve(p,side),still=softSleeve({...p,[side+'Fabric']:0},side);
    assert.deepEqual(sleeve.wrist,still.wrist,'Fabric drag must not break the grip');
    assert.deepEqual(sleeve.shoulder,still.shoulder,'Shoulder remains sewn to bodice');
    assert.ok(Math.abs(p[side+'Fabric'])<3.7,'No loose elastic arm distortion');
   }
   maxFlex=Math.max(maxFlex,Math.abs(p.rightFabric));maxRibbon=Math.max(maxRibbon,Math.abs(p.ribbonDrag));
  }
  assert.ok(maxFlex>.3,'Visible fabric overlap');assert.ok(maxRibbon>.1,'Ribbon follows the trunk');
  for(let i=0;i<3*rate;i++)advanceSoftPose(p,restingSoftPose(),velocity,1/rate);
  for(const key of ['rightFabric','leftFabric','skirtDrag','ribbonDrag'])assert.ok(Math.abs(p[key])<.001,'Cloth settles without perpetual sway');
 }
});

async function rigAsset(file,selector){
 const svg=await readFile(new URL(`../public/assets/jiangxiaotun-v5/${file}.svg`,import.meta.url),'utf8');
 const names=[...svg.matchAll(new RegExp(`data-${selector}="([^"]+)"`,'g'))].map(m=>m[1]);
 assert.equal(new Set(names).size,names.length,`${file}: unique layers`);
 const attrs={};
 const rig=Object.fromEntries(names.map(name=>[name,{setAttribute(key,value){
  assert.doesNotMatch(String(value),/NaN|Infinity|undefined/,`${file} ${name}.${key}`);
  (attrs[name]??={})[key]=value;
 }}]));
 return {svg,rig,attrs};
}

test('every scene has complete soft layers and isolated paint definitions',async()=>{
 const ids=new Set();
 for(const [file,selector,pose,renderer]of [
  ['reception','soft',restingSoftPose(),renderSoftRig],
  ['travel','travel',{...travelPose(9),...travelArms(travelPose(9))},renderSoftRig],
  ['community','community',communityPose(8),renderCommunityRig]
 ]){
  const {svg,rig}=await rigAsset(file,selector);
  for(const [,id]of svg.matchAll(/\bid="([^"]+)"/g)){
   assert.ok(!ids.has(id),`Cross-scene paint collision: ${id}`);ids.add(id);
  }
  renderer(rig,pose,8,true);
  for(const kind of ['wave','welcome']){
   const {frames}=greetingMotion(kind);
   for(let i=0;i<frames.length;i+=3)renderer(rig,softGreetingPose({...pose},frames[i],kind==='wave'?'waving':'welcome',i/60),i/60);
  }
  for(const kind of ['curious','bored','sleepy'])for(let i=0;i<=120;i++){
   const idle=softIdlePose({...pose},kind,i/20);renderer(rig,idle,i/20);
  }
 }
});

test('travel fabric meets the wrist and the telescope follows the palm contact throughout the cycle',async()=>{
 const {handPose}=await import('../public/hand-posing.mjs');
 const {rig,attrs}=await rigAsset('travel','travel');
 for(let i=0;i<=48*60;i++){
  const p=travelPose(i/60);Object.assign(p,travelArms(p));renderSoftRig(rig,p,i/60);
  for(const side of ['left','right']){
   const fabric=softSleeve(p,side);
   const palm=attrs[side+'Palm'].transform.match(/translate\(([^ ]+) ([^)]+)\)/).slice(1).map(Number);
   assert.ok(Math.hypot(palm[0]-fabric.wrist.x,palm[1]-fabric.wrist.y)<1e-8);
   assert.equal(attrs[side+'Upper'].opacity,'0');assert.equal(attrs[side+'Hand'].opacity,'0');
  }
  const wrist=handPose(p,'right',softSleeve(p,'right')).contact;
  const scope=attrs.scope.transform.match(/translate\(([^ ]+) ([^)]+)\)/).slice(1).map(Number);
  assert.ok(Math.hypot(scope[0]-wrist.x,scope[1]-wrist.y)<1e-8);
 }
});

test('reception has relaxed arms and spaced gestures with planted feet and a seamless loop',()=>{
 let previous,highest=Infinity,lowest=-Infinity;
 for(let i=0;i<=receptionCycle*120;i++){
  const p=restingSoftPose(i/120),right=softSleeve(p,'right'),left=softSleeve(p,'left');
  for(const key of ['leftHeel','rightHeel'])assert.equal(p[key],0,'Supporting soles stay planted');
  assert.ok(Math.abs(p.lift)<2.2&&Math.abs(p.shift)<2.3,'Intentional weight changes stay within the base of support');
  assert.ok(Math.abs(p.lean)<1&&p.knee>=0&&p.knee<1.7);assert.ok(Math.abs(p.bodySquash)<.006);
  assert.ok(left.wrist.x-right.wrist.x>100,'Hands remain on their own sides');
  assert.ok(right.wrist.y>620,'Routine gesture stays below the face');
  highest=Math.min(highest,right.wrist.y);lowest=Math.max(lowest,right.wrist.y);
  if(previous)for(const key of Object.keys(p))assert.ok(Math.abs(p[key]-previous[key])<.65,key);
  previous=p;
 }
 const rest=restingSoftPose(0);
 assert.ok(rest.rightUpper<20&&rest.leftUpper<20,'Elbows hang naturally instead of bracing sideways');
 assert.ok(lowest-highest>70,'The costume-adjusting gesture is visible, not numerical noise');
 assert.equal(rest.relaxRight,1);assert.equal(rest.relaxLeft,1);
 for(const time of [0,9,18,27,37,41])assert.ok(Math.abs(restingSoftPose(time).head)<.001,'Quiet intervals');
 for(const key of Object.keys(rest))assert.ok(Math.abs(rest[key]-restingSoftPose(receptionCycle-.001)[key])<.002,key);
});

test('chin-rest eases out of the live resting pose before settling into its expression',()=>{
 const rest=restingSoftPose(5);
 const initial=softIdlePose({...rest},'bored',0);
 assert.equal(initial.rightUpper,rest.rightUpper);assert.equal(initial.rightFore,rest.rightFore);assert.equal(initial.bored,0);
 const settled=softIdlePose({...rest},'bored',3);
 assert.equal(settled.bored,1);assert.equal(settled.chin,1);assert.equal(settled.head,-7);
 assert.ok(softSleeve(settled,'right').wrist.y<530);
 const current={...settled},velocity={};
 for(let i=0;i<180;i++)advanceSoftPose(current,rest,velocity,1/60);
 for(const key of Object.keys(rest))assert.ok(Math.abs(current[key]-rest[key])<1e-5,key);
 const reduced={...settled};advanceSoftPose(reduced,rest,{},1/60,true);assert.deepEqual(reduced,rest);
});

test('all scenes settle with relaxed hands and without the rejected elbows-out stance',async()=>{
 for(const p of [restingSoftPose(0),communityPose(0),{...travelPose(0),...travelArms(travelPose(0))}]){
  for(const side of ['right','left']){
   assert.ok(Math.abs(p[side+'Upper'])<28,'No braced shoulders in a neutral stance');
   assert.ok(Math.abs(p[side+'Fore'])<25,'No bent-out elbows in a neutral stance');
   assert.equal(p[side==='right'?'relaxRight':'relaxLeft'],1,'Hands relax instead of displaying splayed fingers');
  }
 }
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 assert.match(html,/id="hero-portrait" src="\/assets\/jiangxiaotun-v5\/reception-rest\.webp/);
 const fallback=await readFile(new URL('../public/assets/jiangxiaotun-v5/reception-rest.webp',import.meta.url));
 assert.equal(fallback.subarray(8,12).toString(),'WEBP');
});

test('sleepy rubbing stays at the eye, clears props and loops without joint jumps in every rig',async()=>{
 for(const [file,selector,base,renderer]of [
  ['reception','soft',restingSoftPose(),renderSoftRig],
  ['travel','travel',{...travelPose(10),...travelArms(travelPose(10))},renderSoftRig],
  ['community','community',communityPose(8),renderCommunityRig]
 ]){
  const {rig,attrs}=await rigAsset(file,selector);
  assert.ok(rig.rightRub,`${file}: dedicated rounded rubbing hand`);
  let previous;
  for(let i=0;i<=sleepyCycle*120;i++){
   const t=i/120,p=sleepySoftPose({...base},t),wrist=softSleeve(p,'right').wrist;
   for(const key of ['laptop','opening','focus','map','glass','scope','chin','lift','leftHeel','rightHeel'])assert.equal(p[key],0,key);
   if(previous)for(const key of Object.keys(p))assert.ok(Math.abs(p[key]-previous[key])<1.9,`${file} ${key} ${t}`);
   if(t>=3&&t<=5){
    assert.ok(wrist.x>389&&wrist.x<399,'Knuckles stay beside the outer eye');
    assert.ok(wrist.y>489&&wrist.y<497,'Cuff stays below the eye, away from mouth');
    assert.equal(p.rub,1);assert.equal(p.sleepy,1);
   }
   if(i%6===0){renderer(rig,p,t,true);assert.equal(attrs.rightGrip.opacity,'0');}
   previous=p;
  }
  const first=sleepySoftPose({...base},0),last=sleepySoftPose({...base},sleepyCycle-.001);
  for(const key of Object.keys(first))assert.ok(Math.abs(first[key]-last[key])<.001,`${file} loop ${key}`);
 }
});

test('idle entry and recovery retain soft transitions and hold props away from the raised hand',()=>{
 const from=communityPose(8),target=sleepySoftPose({...from},0);
 const initial=easeIdleEntry({...target},from,0);
 for(const key of Object.keys(target))if(Number.isFinite(from[key]))assert.equal(initial[key],from[key]);
 assert.equal(easeIdleEntry({...target},from,.5).laptop,0,'Laptop clears before rubbing starts');
 const raised=sleepySoftPose({...from},4),recover=softRecoveryPose({...from}),current={...raised},velocity={};
 for(let i=0;i<84;i++)advanceSoftPose(current,softRecoveryPose({...from},raised,i/60),velocity,1/60);
 assert.ok(softSleeve(current,'right').wrist.y>700,'Hand is down before props return');
 assert.equal(softRecoveryPose({...from},raised,1.1).rub,0);
 for(const key of ['laptop','map','scope','glass','rub','chin'])assert.ok(current[key]<1e-4,key);
 const chin=softIdlePose(restingSoftPose(),'bored',10);
 for(let i=0;i<=150;i++){
  const elapsed=i/120,p=easeIdleEntry(sleepySoftPose({...from},elapsed),chin,elapsed),wrist=softSleeve(p,'right').wrist;
  assert.ok(wrist.y>=514,'Lowering a chin-rest never swings the fist up across the eye');
 }
});
