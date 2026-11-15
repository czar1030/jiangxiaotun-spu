import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {restingSoftPose,softGreetingPose,softIdlePose} from '../public/mascot-soft-motion.mjs';
import {renderSoftRig} from '../public/mascot-soft-rig.mjs';
import {renderCommunityRig} from '../public/community-rig.mjs';
import {communityPose} from '../public/community-motion.mjs';
import {travelPose,travelArms} from '../public/travel-motion.mjs';
import {greetingMotion} from '../public/mascot-motion.mjs';

const cases=[];
for(const [scene,attribute,render,rest]of [
 ['reception','soft',renderSoftRig,restingSoftPose(5)],
 ['travel','travel',renderSoftRig,{...travelPose(9),...travelArms(travelPose(9))}],
 ['community','community',renderCommunityRig,communityPose(8)]
]){
 const svg=await readFile(new URL(`../public/assets/jiangxiaotun-v5/${scene}.svg`,import.meta.url),'utf8');
 const names=[...svg.matchAll(new RegExp(`data-${attribute}="([^"]+)"`,'g'))].map(m=>m[1]);
 const gestures=[['normal',rest],['wave',softGreetingPose({...rest},greetingMotion('wave').frames[120],'waving',2)],
  ['welcome',softGreetingPose({...rest},greetingMotion('welcome').frames[180],'welcome',3)],
  ['bored',softIdlePose({...rest},'bored',3)],['sleepy',softIdlePose({...rest},'sleepy',4)]];
 for(const [name,pose]of gestures){
  const attrs={},rig=Object.fromEntries(names.map(n=>[n,{setAttribute(k,v){(attrs[n]??={})[k]=v;}}]));
  render(rig,pose,8,true);cases.push({scene,attribute,name,attrs});
 }
}
await mkdir(new URL('../qa/mascot-couture/',import.meta.url),{recursive:true});
await writeFile(new URL('../qa/mascot-couture/poses.json',import.meta.url),JSON.stringify(cases));
