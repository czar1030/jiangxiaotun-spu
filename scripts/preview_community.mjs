import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {communityPose} from '../public/community-motion.mjs';
import {renderCommunityRig} from '../public/community-rig.mjs';
const source=await readFile(new URL('../public/assets/jiangxiaotun-v5/community.svg',import.meta.url),'utf8');
const names=[...source.matchAll(/data-community="([^"]+)"/g)].map(match=>match[1]);
const poses=[];
for(const seconds of [0,2,4,8,12,16,20,24,28,31]){
 const attrs={};
 const rig=Object.fromEntries(names.map(name=>[name,{setAttribute(key,value){(attrs[name]??={})[key]=value;}}]));
 renderCommunityRig(rig,communityPose(seconds),seconds,true);
 attrs.rightHand={opacity:'0'};attrs.leftHand={opacity:'0'};
 poses.push({seconds,attrs});
}
await mkdir(new URL('../qa/community/',import.meta.url),{recursive:true});
await writeFile(new URL('../qa/community/poses.json',import.meta.url),JSON.stringify(poses));
