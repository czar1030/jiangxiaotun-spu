import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {restingSoftPose,sleepySoftPose} from '../public/mascot-soft-motion.mjs';
import {renderSoftRig} from '../public/mascot-soft-rig.mjs';
import {communityPose} from '../public/community-motion.mjs';
import {renderCommunityRig} from '../public/community-rig.mjs';
import {travelPose,travelArms} from '../public/travel-motion.mjs';
const rows=[];
for(const [file,selector,base,renderer]of [
 ['reception','soft',restingSoftPose(),renderSoftRig],
 ['travel','travel',{...travelPose(10),...travelArms(travelPose(10))},renderSoftRig],
 ['community','community',communityPose(8),renderCommunityRig]
]){
 const source=await readFile(new URL(`../public/assets/jiangxiaotun-v5/${file}.svg`,import.meta.url),'utf8');
 const names=[...source.matchAll(new RegExp(`data-${selector}="([^"]+)"`,'g'))].map(m=>m[1]);
 for(const seconds of [0,.7,1.8,3.2,4.2,5.7,6.8,8.5,11.5,17.99]){
  const attrs={},rig=Object.fromEntries(names.map(name=>[name,{setAttribute(key,value){(attrs[name]??={})[key]=value;}}]));
  renderer(rig,sleepySoftPose({...base},seconds),seconds,true);
  rows.push({file,selector,seconds,attrs});
 }
}
await mkdir(new URL('../qa/sleepy/',import.meta.url),{recursive:true});
await writeFile(new URL('../qa/sleepy/poses.json',import.meta.url),JSON.stringify(rows));
