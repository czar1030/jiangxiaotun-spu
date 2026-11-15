import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {travelPose,travelArms} from '../public/travel-motion.mjs';
import {renderSoftRig} from '../public/mascot-soft-rig.mjs';
const source=await readFile(new URL('../public/assets/jiangxiaotun-v5/travel.svg',import.meta.url),'utf8');
const names=[...source.matchAll(/data-travel="([^"]+)"/g)].map(match=>match[1]);
const poses=[];
for(const seconds of [0,3,9,18,26,28,30,34,40,43]){
 const attrs={};
 const rig=Object.fromEntries(names.map(name=>[name,{setAttribute(key,value){(attrs[name]??={})[key]=value;}}]));
 const p=travelPose(seconds);
 Object.assign(p,travelArms(p));
 renderSoftRig(rig,p,seconds,true);
 attrs.rightHand={opacity:'0'};attrs.leftHand={opacity:'0'};
 poses.push({seconds,attrs});
}
await mkdir(new URL('../qa/travel/',import.meta.url),{recursive:true});
await writeFile(new URL('../qa/travel/poses.json',import.meta.url),JSON.stringify(poses));
