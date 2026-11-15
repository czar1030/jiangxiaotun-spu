import {setRigAttribute as attr} from './rig-attributes.mjs?v=1';

const expressions=['smile','happy','blink','bored','sleepy','focus'];
const baseFaces=new WeakMap();

// Complete face drawings must replace one another. Blending them exposes the
// old mouth through the new one even when the body motion itself is smooth.
export function renderMascotFace(rig,pose){
 const selected=[['happy',.5],['sleepy',.5],['blink',.38],['bored',.5],['smile',.5],['focus',.5]]
  .find(([name,threshold])=>rig[name]&&(pose[name]||0)>threshold)?.[0]||'neutral';
 if(!baseFaces.has(rig.head))baseFaces.set(rig.head,rig.head.querySelector?.(':scope > image')||null);
 const base=baseFaces.get(rig.head);
 if(base)attr(base,'opacity',selected==='neutral'?'1':'0');
 for(const name of expressions)if(rig[name])attr(rig[name],'opacity',name===selected?'1':'0');
 for(const part of ['leftEar','rightEar','ahoge'])if(rig[part])attr(rig[part],'opacity',selected==='happy'?'0':'1');
 return selected;
}
