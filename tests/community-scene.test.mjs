import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {communityPose,communityCycle,communityGreetingPose,advanceCommunityPose} from '../public/community-motion.mjs';
import {renderCommunityRig} from '../public/community-rig.mjs';
import {softSleeve} from '../public/soft-sleeve.mjs';
import {greetingMotion} from '../public/mascot-motion.mjs';
import {communityCopy} from '../public/community-copy.mjs';
import {languages} from '../public/language-core.mjs';
import {companionShoulderOffset} from '../public/community-companion-motion.mjs';
import {miniPorpoiseLayout,basinCompanionLayout} from '../public/community-minis.mjs';

test('the basin companion fits below the tail without covering any original mini',()=>{
 const base={host:{left:767,top:266,width:340},
  walle:{left:614,right:729,bottom:657},echo:{left:689,width:247,bottom:667},
  feet:{left:882,right:972,bottom:666},baymax:{left:1061,width:100,bottom:640},tail:{bottom:598}};
 for(const factor of [1,280/340,.75])for(const compact of [false,true]){
  const anchors=Object.fromEntries(Object.entries(base).map(([name,box])=>[name,Object.fromEntries(Object.entries(box).map(([key,value])=>
   [key,['left','right'].includes(key)?base.host.left+(value-base.host.left)*factor:['top','bottom'].includes(key)?base.host.top+(value-base.host.top)*factor:value*factor]))]));
  const poses=miniPorpoiseLayout(anchors,compact),copy=structuredClone(poses);
  const p=basinCompanionLayout(anchors,poses,compact);assert.ok(p,`Space remains at scale ${factor}, compact ${compact}`);
  assert.deepEqual(poses,copy,'placing the new character does not move the ten minis');
  assert.ok(p.y-p.height+anchors.host.top>anchors.tail.bottom,'the bowl stays below the tail');
  assert.ok(p.x+anchors.host.left<anchors.baymax.left,'the companion stands to Baymax’s left');
  for(const mini of poses){
   const miniWidth=mini.height*512/544;
   const separate=Math.abs(p.x-mini.x)>=(p.width+miniWidth)/2||p.y<=mini.y-mini.height||p.y-p.height>=mini.y;
   assert.ok(separate,`Basin companion overlaps ${mini.place}`);
  }
 }
 const squeezed={...base,tail:{bottom:base.feet.bottom}};
 assert.equal(basinCompanionLayout(squeezed,miniPorpoiseLayout(squeezed)),null,'insufficient space never covers a mini');
});

test('ten mini porpoises remain beside their named companions across responsive layouts',()=>{
 const anchors={host:{left:767,top:266,width:340},
  walle:{left:614,right:729,bottom:657},echo:{left:689,width:247,bottom:667},
  feet:{left:882,right:972,bottom:666},baymax:{left:1061,width:100,bottom:640}};
 const placements=miniPorpoiseLayout(anchors),byPlace=Object.fromEntries(placements.map(p=>[p.place,p]));
 assert.equal(placements.length,10);assert.equal(new Set(placements.map(p=>p.place)).size,10);
 assert.ok(byPlace['walle-right'].x+anchors.host.left>anchors.walle.right);
 assert.ok(byPlace['echo-right'].x>byPlace['echo-front'].x);
 assert.ok(byPlace['echo-front'].y+anchors.host.top>anchors.echo.bottom);
 assert.ok(byPlace['mascot-left'].x+anchors.host.left<anchors.feet.left);
 assert.ok(byPlace['mascot-right'].x+anchors.host.left>anchors.feet.right);
 assert.ok(byPlace['baymax-front'].y+anchors.host.top>anchors.baymax.bottom);
 // A page scroll moves every anchor equally and must not rearrange the group.
 const shifted=Object.fromEntries(Object.entries(anchors).map(([name,rect])=>[name,Object.fromEntries(Object.entries(rect).map(([key,value])=>[key,value+(['left','right'].includes(key)?200:['top','bottom'].includes(key)?-300:0)]))]));
 for(const [i,p]of miniPorpoiseLayout(shifted).entries()){
  assert.equal(p.place,placements[i].place);assert.equal(p.height,placements[i].height);
  assert.ok(Math.abs(p.x-placements[i].x)<1e-9&&Math.abs(p.y-placements[i].y)<1e-9);
 }
 const compact=miniPorpoiseLayout(anchors,true);
 for(const p of compact){assert.ok(p.height>=21&&p.height<=31);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}
 const walleMini=compact.find(p=>p.place==='walle-right');
 assert.ok(walleMini.y-walleMini.height+anchors.host.top>anchors.feet.bottom,'the compact WALL-E companion clears the main shoes');
 for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++){
  const a=placements[i],b=placements[j];
  const horizontal=Math.abs(a.x-b.x)>=(a.height+b.height)*512/544/2;
  const vertical=a.y<=b.y-b.height||b.y<=a.y-a.height;
  assert.ok(horizontal||vertical,`${a.place} and ${b.place} keep separate silhouettes`);
 }
});

test('community copy explains both SPU and the community in every reception language',()=>{
 for(const {code}of languages){
  const copy=communityCopy(code);
  for(const value of Object.values(copy))assert.ok(value?.trim(),code);
  assert.notEqual(copy.photo,copy.concept);assert.notEqual(copy.jiangAn,copy.optics);
 }
 assert.match(communityCopy('zh-CN').spu,/独立判断.*承担责任/);
 assert.match(communityCopy('zh-CN').visit,/规划.*官方确认/);
});

test('the companion contact follows the rendered shoulder through work, breathing and welcomes',()=>{
 const poses=Array.from({length:321},(_,i)=>communityPose(i/10));
 for(const kind of ['wave','welcome']){
  const motion=greetingMotion(kind);
  for(let i=0;i<motion.frames.length;i+=6)poses.push(communityGreetingPose(communityPose(8),motion.frames[i],kind==='wave'?'waving':'welcome',i/60));
 }
 for(const [index,p]of poses.entries())for(const reduced of [false,true]){
  const time=index/10,offset=companionShoulderOffset(p,time,reduced);
  assert.ok(Number.isFinite(offset.x)&&Number.isFinite(offset.y));
  // Apply the same ordered affine transforms to a known shoulder point.
  let x=398,y=556;
  const squash=p.bodySquash||0;
  x=474+(x-474)*(1+squash*.55);y=814+(y-814)*(1-squash);
  x+=(y-814)*Math.tan((p.chest||0)*Math.PI/180);
  const angle=p.lean*Math.PI/180,rx=474+(x-474)*Math.cos(angle)-(y-814)*Math.sin(angle);
  const ry=814+(x-474)*Math.sin(angle)+(y-814)*Math.cos(angle);
  assert.ok(Math.abs(398+offset.x-(rx+p.shift))<1e-9);
  assert.ok(Math.abs(556+offset.y-(ry+p.lift+(p.knee||0)))<1e-9);
  assert.ok(Math.hypot(offset.x,offset.y)<20,'Contact follows subtle shoulder movement without a floating limb');
 }
});

test('continuous sleeves meet the actual wrists and remain finite through work and raised gestures',()=>{
 const poses=Array.from({length:385},(_,i)=>communityPose(i/12));
 for(const rightUpper of [0,45,90,160])for(const rightFore of [-90,0,64,140])poses.push({...communityPose(8),rightUpper,rightFore});
 for(const pose of poses)for(const side of ['right','left']){
  const fabric=softSleeve(pose,side),mirror=side==='right'?1:-1;
  const a=pose[side+'Upper']*Math.PI/180,b=(pose[side+'Upper']+pose[side+'Fore'])*Math.PI/180;
  const x=(side==='right'?398:542)-mirror*83*(Math.sin(a)+Math.sin(b));
  const y=556+83*(Math.cos(a)+Math.cos(b));
  assert.ok(Math.hypot(fabric.wrist.x-x,fabric.wrist.y-y)<1e-9);
  for(const key of ['outline','front','cuff','highlight','folds']){
   assert.match(fabric[key],/^M/);assert.doesNotMatch(fabric[key],/NaN|Infinity/);
  }
 }
});

test('soft follow-through is stable across display rates and settles after interruptions',()=>{
 const final=[];
 for(const hz of [30,60,120]){
  const current=communityPose(8),target={...communityPose(0),head:-4,lift:-3,bodySquash:.005},velocity={};
  for(let i=0;i<hz*3;i++){
   advanceCommunityPose(current,target,velocity,1/hz);
   for(const value of Object.values(current))assert.ok(Number.isFinite(value));
   assert.ok(Math.abs(current.head)<12);assert.ok(Math.abs(current.bodySquash)<.03);
  }
  assert.ok(Math.abs(current.head-target.head)<1e-6);final.push(current);
 }
 for(const key of Object.keys(final[0]))assert.ok(Math.abs(final[0][key]-final[2][key])<1e-6,key);
 const current=communityPose(8),target=communityPose(0),velocity={head:10};
 advanceCommunityPose(current,target,velocity,1/60,true);assert.deepEqual(current,target);assert.equal(velocity.head,0);
});

test('community greeting raises the hand beside the face, with anticipation and a soft return',()=>{
 const {frames}=greetingMotion('wave');let high=0,compressed=0,stretched=0;
 for(let i=0;i<frames.length;i++){
  const p=communityGreetingPose(communityPose(8),frames[i],'waving',i/60),arm=softSleeve(p,'right');
  if(arm.wrist.y<500){high++;assert.ok(arm.wrist.x<340,'Raised hand stays outside the face');}
  compressed=Math.max(compressed,p.bodySquash);stretched=Math.min(stretched,p.bodySquash);
  assert.equal(p.laptop,0);assert.equal(p.typing,0);
 }
 assert.ok(high>60);assert.ok(compressed>.005&&compressed<.01);assert.ok(stretched<-.002&&stretched>-.005);
 const final=communityGreetingPose(communityPose(8),frames.at(-1),'waving',frames.at(-1).offset*7.75);
 assert.ok(Math.abs(final.rightUpper-16)<.001);assert.ok(Math.abs(final.rightFore+8)<.001);
 assert.equal(final.relaxRight,1);assert.ok(Math.abs(final.bodySquash)<.001);
});

test('laptop opens and closes on the supporting hand while the free hand stays outside it',async()=>{
 const {handPose}=await import('../public/hand-posing.mjs');
 const svg=await readFile(new URL('../public/assets/jiangxiaotun-v5/community.svg',import.meta.url),'utf8');
 const names=[...svg.matchAll(/data-community="([^"]+)"/g)].map(match=>match[1]);
 const identifiers=[...svg.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
 assert.ok(identifiers.every(id=>id.startsWith('community-')),'Other hidden character rigs must not supply gradients');
 assert.doesNotMatch(svg,/data-community="(?:rightTyping|typingIndex|typingMiddle|typingRing)"/);
 assert.ok(svg.indexOf('data-community="rightForeOverlay"')<svg.indexOf('data-community="laptop"'),'Free sleeve passes behind the laptop');
 assert.ok(svg.indexOf('data-community="laptop"')<svg.indexOf('data-community="leftForeOverlay"'),'Supporting sleeve remains in front');
 let previous;
 for(let frame=0;frame<=communityCycle*120;frame++){
  const p=communityPose(frame/120),attributes={};
  const rig=Object.fromEntries(names.map(name=>[name,{setAttribute(key,value){(attributes[name]??={})[key]=value;}}]));
  renderCommunityRig(rig,p,frame/120,true);
  const joints=side=>{
   const mirror=side==='right'?1:-1,x=side==='right'?398:542;
   const a=p[side+'Upper']*Math.PI/180,b=(p[side+'Upper']+p[side+'Fore'])*Math.PI/180;
   return {elbowX:x-mirror*83*Math.sin(a),x:x-mirror*83*(Math.sin(a)+Math.sin(b)),y:556+83*(Math.cos(a)+Math.cos(b))};
  };
  const right=joints('right'),left=joints('left');
  assert.ok(Math.min(542,left.elbowX,left.x)-Math.max(398,right.elbowX,right.x)>75);
  const support=attributes.laptop.transform.match(/translate\(([^ ]+) ([^)]+)\)/).slice(1).map(Number);
  const contact=handPose(p,'left',softSleeve(p,'left')).contact;
  assert.ok(Math.abs(support[0]+574-contact.x)<.001);assert.ok(Math.abs(support[1]+723-contact.y)<.001);
  // Include the palm's full width, not only its wrist, in the clearance check.
  if(p.laptop>0){
   assert.ok(right.x+17<342+support[0],'Free palm stays clear of the keyboard edge');
   assert.ok(Math.abs(right.x-312)<1e-8);assert.ok(Math.abs(right.y-697)<1e-8);
  }
  assert.equal(attributes.rightRelaxed.opacity,'0');assert.equal(attributes.rightOpen.opacity,'0');
  assert.match(attributes.rightHandShape.d,/^M/);
  if(previous)for(const key of ['rightUpper','rightFore','leftUpper','leftFore','head'])assert.ok(Math.abs(p[key]-previous[key])<1,key);
  previous=p;
 }
 assert.equal(communityPose(8).opening,1);assert.equal(communityPose(27).laptop,1);
 assert.equal(communityPose(28.4).opening,0);assert.equal(communityPose(31.5).laptop,0);
 for(const key of Object.keys(communityPose(0)))assert.ok(Math.abs(communityPose(31.999)[key]-communityPose(0)[key])<.01,key);
});
