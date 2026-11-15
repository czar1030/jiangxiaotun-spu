import {mkdir,writeFile} from 'node:fs/promises';
import {commanderVertex,commanderPerformance,commanderArtwork} from '../public/saig-commander-motion.mjs';
await mkdir('qa/saig-arena/rivals-v7',{recursive:true});
const poses=[];
for(const team of ['blue','red']){
 for(const time of [0,team==='blue'?2.92:5.65,4,9]){
  const inverse=[];
  // Inverse sampling for offline review; the live scene uses a forward mesh.
  for(let y=0;y<1536;y+=32)for(let x=0;x<commanderArtwork[team].width;x+=32){
   const quad=[];
   for(const [u,v]of [[x,y],[x,y+32],[x+32,y+32],[x+32,y]]){
    const p=commanderVertex(u,v,time,team);quad.push(2*u-p.x,2*v-p.y);
   }
   inverse.push([[x,y,x+32,y+32],quad]);
  }
  poses.push({team,time,inverse,artwork:commanderArtwork[team],blink:commanderPerformance(time,team).blink});
 }
}
await writeFile('qa/saig-arena/rivals-v7/poses.json',JSON.stringify(poses));
