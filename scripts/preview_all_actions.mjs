// Export the same pose solver, follow-through and renderer used by the site.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {restingSoftPose,softGreetingPose,softIdlePose,sleepySoftPose,advanceSoftPose} from '../public/mascot-soft-motion.mjs';
import {greetingMotion,sampleGreeting} from '../public/mascot-motion.mjs';
import {travelPose,travelArms} from '../public/travel-motion.mjs';
import {communityPose} from '../public/community-motion.mjs';
import {renderSoftRig} from '../public/mascot-soft-rig.mjs';
import {renderCommunityRig} from '../public/community-rig.mjs';
const root=new URL('../qa/all-actions/',import.meta.url);
await mkdir(root,{recursive:true});
const wave=greetingMotion('wave'),welcome=greetingMotion('welcome');
const clips=[
 {name:'greeting',asset:'reception',selector:'soft',duration:8.5,marks:[0,1.2,2.2,3.5,5.5,7.7],pose:t=>softGreetingPose(restingSoftPose(),sampleGreeting(wave,t),'waving',t)},
 {name:'welcome',asset:'reception',selector:'soft',duration:7,marks:[0,.3,1,1.8,4.5,6.5],pose:t=>softGreetingPose(restingSoftPose(),sampleGreeting(welcome,t),'welcome',t)},
 {name:'listening',asset:'reception',selector:'soft',duration:42,marks:[0,5,13,22,31,41],pose:restingSoftPose},
 {name:'map',asset:'travel',selector:'travel',duration:22.5,marks:[0,2.6,6.2,9,17.5,21.8],pose:t=>{const p=travelPose(t);return Object.assign(p,travelArms(p));}},
 {name:'telescope',asset:'travel',selector:'travel',duration:24,marks:[0,3,7,11,17,23],pose:t=>{const p=travelPose(t+23);return Object.assign(p,travelArms(p));}},
 {name:'laptop',asset:'community',selector:'community',duration:32,marks:[0,2.8,5.6,17.8,27.3,31.8],pose:communityPose},
 {name:'sleepy',asset:'reception',selector:'soft',duration:18,marks:[0,1.8,3.5,6.2,8.5,12],pose:t=>sleepySoftPose(restingSoftPose(),t)},
 {name:'chin-rest',asset:'reception',selector:'soft',duration:6,marks:[0,.7,1.5,2.2,3.2,5.5],pose:t=>softIdlePose(restingSoftPose(),'bored',t)},
];
for(const clip of clips){
 const source=await readFile(new URL(`../public/assets/jiangxiaotun-v5/${clip.asset}.svg`,import.meta.url),'utf8');
 const names=[...source.matchAll(new RegExp(`data-${clip.selector}="([^"]+)"`,'g'))].map(m=>m[1]);
 const attrs={},rig=Object.fromEntries(names.map(name=>[name,{setAttribute(key,value){(attrs[name]??={})[key]=String(value);}}]));
 const render=clip.asset==='community'?renderCommunityRig:renderSoftRig;
 const current=clip.pose(0),velocity={},frames=[];
 for(let i=0;i<Math.ceil(clip.duration*60);i++){
  const t=i/60;
  advanceSoftPose(current,clip.pose(t),velocity,1/60);
  render(rig,current,t);
  if(i%3===0)frames.push(structuredClone(attrs));
 }
 await writeFile(new URL(clip.name+'.json',root),JSON.stringify({name:clip.name,asset:clip.asset,selector:clip.selector,rate:20,duration:clip.duration,marks:clip.marks,frames}));
 console.log(`${clip.name}: ${frames.length} frames`);
}
