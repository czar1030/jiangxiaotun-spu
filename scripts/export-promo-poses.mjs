import {writeFile} from 'node:fs/promises';
import {restingSoftPose,softGreetingPose,advanceSoftPose} from '../public/mascot-soft-motion.mjs';
import {greetingMotion,sampleGreeting} from '../public/mascot-motion.mjs';
import {renderSoftRig} from '../public/mascot-soft-rig.mjs';

const frames=[],wave=greetingMotion('wave'),current=restingSoftPose(0),velocity={};
for(let i=0;i<180;i++){
  const t=i/30,p=restingSoftPose(t);
  softGreetingPose(p,sampleGreeting(wave,t+.8),'waving',t+.8);p.happy=0;
  advanceSoftPose(current,p,velocity,1/30,false);
  const attrs={},nodes=new Map(),rig=new Proxy({}, {get(_,name){if(!nodes.has(name))nodes.set(name,{setAttribute(key,value){(attrs[name]??={})[key]=String(value);}});return nodes.get(name);}});
  renderSoftRig(rig,current,t,false);frames.push(attrs);
}
await writeFile(process.argv[2],JSON.stringify(frames));
console.log('Exported 180 frames of the actual project character rig.');
