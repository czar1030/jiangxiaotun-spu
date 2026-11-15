import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {restingSoftPose,softGreetingPose,softIdlePose,sleepySoftPose} from '../public/mascot-soft-motion.mjs';
import {greetingMotion,sampleGreeting} from '../public/mascot-motion.mjs';
import {travelPose,travelArms} from '../public/travel-motion.mjs';
import {communityPose} from '../public/community-motion.mjs';
import {softSleeve} from '../public/soft-sleeve.mjs';
import {handPose} from '../public/hand-posing.mjs';
import {renderSoftRig} from '../public/mascot-soft-rig.mjs';
import {renderCommunityRig} from '../public/community-rig.mjs';

const wrap=a=>((a+180)%360+360)%360-180;
const close=(a,b,message)=>assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-7,message);
// Apply the emitted SVG transform, independent of the renderer's hand solver.
function transformed(transform,x,y){
 const terms=[...transform.matchAll(/(translate|rotate|scale)\(([^)]*)\)/g)].reverse();
 for(const [,kind,values]of terms){
  const [a,b]=values.trim().split(/[ ,]+/).map(Number);
  if(kind==='translate'){x+=a;y+=b||0;}
  if(kind==='scale'){x*=a;y*=b??a;}
  if(kind==='rotate'){const r=a*Math.PI/180,c=Math.cos(r),s=Math.sin(r);[x,y]=[x*c-y*s,x*s+y*c];}
 }
 return {x,y};
}
async function rigAsset(asset,selector){
 const source=await readFile(new URL(`../public/assets/jiangxiaotun-v5/${asset}.svg`,import.meta.url),'utf8');
 const attrs={};
 const names=[...source.matchAll(new RegExp(`data-${selector}="([^"]+)"`,'g'))].map(m=>m[1]);
 return {source,attrs,rig:Object.fromEntries(names.map(name=>[name,{setAttribute(key,value){(attrs[name]??={})[key]=String(value);}}]))};
}

test('every gesture keeps the hand pointing out of the cuff with a bounded wrist bend',()=>{
 const wave=greetingMotion('wave'),welcome=greetingMotion('welcome');
 const clips=[
  [48,t=>{const p=travelPose(t);return Object.assign(p,travelArms(p));}],
  [32,communityPose],[42,restingSoftPose],
  [8,t=>softGreetingPose(restingSoftPose(),sampleGreeting(wave,t),'waving',t)],
  [7,t=>softGreetingPose(restingSoftPose(),sampleGreeting(welcome,t),'welcome',t)],
  [18,t=>sleepySoftPose(restingSoftPose(),t)],
  [7,t=>softIdlePose(restingSoftPose(),'bored',t)],
 ];
 for(const [duration,pose]of clips)for(let i=0;i<=duration*60;i++){
  const p=pose(i/60);
  for(const side of ['right','left']){
   const sleeve=softSleeve(p,side),hand=handPose(p,side,sleeve);
   const tangent=Math.atan2(-(sleeve.wrist.x-sleeve.elbow.x),sleeve.wrist.y-sleeve.elbow.y)*180/Math.PI;
   assert.ok(Math.abs(wrap(hand.angle-tangent))<=26.000001,`${side} wrist twisted at ${i/60}s`);
   assert.doesNotMatch(hand.outline,/NaN|Infinity/);
   assert.ok(Math.hypot(hand.contact.x-sleeve.wrist.x,hand.contact.y-sleeve.wrist.y)<15,'Grip lies inside the palm');
  }
 }
});

test('the magnifier, paper edge and telescope share the visible finger contact throughout the performance',async()=>{
 const {attrs,rig}=await rigAsset('travel','travel');
 for(let i=0;i<=48*30;i++){
  const p=travelPose(i/30);Object.assign(p,travelArms(p));renderSoftRig(rig,p,i/30,true);
  const right=transformed(attrs.rightPalm.transform,0,12),left=transformed(attrs.leftPalm.transform,0,12);
  close(transformed(attrs.glass.transform,0,24),right,'Magnifier slipped out of fingers');
  close(transformed(attrs.scope.transform,37,3),right,'Telescope slipped out of fingers');
  close(transformed(attrs.map.transform,89,0),left,'Map edge slipped out of fingers');
  if(i/30>=7&&i/30<=15){
   const lens=transformed(attrs.glass.transform,0,-28);
   const a=transformed(attrs.map.transform,-89,-50),b=transformed(attrs.map.transform,89,57);
   assert.ok(lens.x>a.x-10&&lens.x<b.x+10,'Lens scans the paper');
   assert.ok(lens.y>a.y-20&&lens.y<b.y,'Lens remains over the paper surface');
  }
 }
});

test('a single visible hand contour replaces the old stacked finger and palm drawings in every shared rig',async()=>{
 for(const [asset,selector,pose,render]of [
  ['reception','soft',restingSoftPose,renderSoftRig],
  ['travel','travel',t=>{const p=travelPose(t);return Object.assign(p,travelArms(p));},renderSoftRig],
  ['community','community',communityPose,renderCommunityRig],
 ]){
  const {source,attrs,rig}=await rigAsset(asset,selector);
  for(const side of ['right','left'])assert.equal([...source.matchAll(new RegExp(`data-${selector}="${side}HandModel"`,'g'))].length,1);
  for(let t=0;t<48;t+=.2){
   render(rig,pose(t),t,true);
   for(const side of ['right','left']){
    for(const kind of ['Open','Grip','Relaxed','Rub','Wave'])assert.equal(attrs[side+kind].opacity,'0');
    assert.match(attrs[side+'HandShape'].d,/^M.*Z$/);
   }
  }
 }
});
