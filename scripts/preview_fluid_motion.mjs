// Export the production renderer at 30 fps, while solving motion at 60 Hz.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {restingSoftPose,softGreetingPose,advanceSoftPose,easeIdleEntry} from '../public/mascot-soft-motion.mjs';
import {greetingMotion,sampleGreeting} from '../public/mascot-motion.mjs';
import {renderSoftRig} from '../public/mascot-soft-rig.mjs';
const svg=await readFile(new URL('../public/assets/jiangxiaotun-v5/reception.svg',import.meta.url),'utf8');
const names=[...svg.matchAll(/data-soft="([^"]+)"/g)].map(m=>m[1]),attrs={};
const rig=Object.fromEntries(names.map(name=>[name,{setAttribute(key,value){(attrs[name]??={})[key]=String(value);}}]));
const clip=greetingMotion('wave'),current=restingSoftPose(),initial={...current},velocity={},frames=[];
let landing;
for(let frame=0;frame<6.6*60;frame++){
 const time=frame/60;
 let target=restingSoftPose(time);
 if(time<5.2){softGreetingPose(target,sampleGreeting(clip,time),'waving',time);easeIdleEntry(target,initial,time,.65,.2);}
 else{landing??={...current};easeIdleEntry(target,landing,time-5.2,.9,.2);}
 advanceSoftPose(current,target,velocity,1/60);renderSoftRig(rig,current,time);
 if(frame%2===0)frames.push(structuredClone(attrs));
}
await mkdir(new URL('../qa/motion-fluidity/',import.meta.url),{recursive:true});
await writeFile(new URL('../qa/motion-fluidity/wave-30fps.json',import.meta.url),JSON.stringify(frames));
console.log(`Exported ${frames.length} production frames at 30 fps`);
