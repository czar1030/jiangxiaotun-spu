import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMascotFace} from '../public/mascot-face.mjs';

function fixture(){
 const node=()=>({attributes:{},setAttribute(name,value){this.attributes[name]=value;}});
 const base=node(),rig=Object.fromEntries(['smile','happy','blink','bored','sleepy','focus','leftEar','rightEar','ahoge'].map(name=>[name,node()]));
 rig.head={querySelector:()=>base};
 return {rig,base};
}

test('blended action weights display one opaque face, including neutral and focused expressions',()=>{
 const {rig,base}=fixture();
 const weights=[0,.1,.38,.49,.5,.51,.8,1];
 for(const smile of weights)for(const happy of weights)for(const blink of weights){
  renderMascotFace(rig,{smile,happy,blink,bored:.7,sleepy:.3,focus:.9});
  const faces=[base,...['smile','happy','blink','bored','sleepy','focus'].map(key=>rig[key])];
  assert.equal(faces.filter(n=>n.attributes.opacity==='1').length,1);
  assert.ok(faces.every(n=>['0','1'].includes(n.attributes.opacity)),'No translucent mouth or ghost eyes');
 }
 assert.equal(renderMascotFace(rig,{}),'neutral');
 assert.equal(base.attributes.opacity,'1');
 assert.equal(renderMascotFace(rig,{focus:1}),'focus');
 assert.equal(renderMascotFace(rig,{focus:1,smile:1}),'smile');
 assert.equal(renderMascotFace(rig,{focus:1,blink:1}),'blink');
 assert.equal(renderMascotFace(rig,{happy:1,smile:1}),'happy');
 assert.equal(rig.leftEar.attributes.opacity,'0');
 renderMascotFace(rig,{});
 assert.equal(rig.leftEar.attributes.opacity,'1');
});
