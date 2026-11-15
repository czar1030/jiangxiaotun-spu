import {setRigAttribute as attr} from './rig-attributes.mjs?v=1';
import {renderMascotFace} from './mascot-face.mjs?v=1';
import {softSleeve} from './soft-sleeve.mjs?v=8';
import {handPose} from './hand-posing.mjs?v=1';
import {footSpace} from './foot-space.mjs?v=1';
export function renderTravelRig(rig,p,time=0,reducedMotion=false,{soft=false}={}){
 const set=(name,transform)=>attr(rig[name],'transform',transform);
 const breathe=reducedMotion?0:Math.sin(time*1.12)*.7;
  if(!soft)set('body',`translate(${p.shift} ${p.lift+breathe}) rotate(${p.lean} 474 814)`);
  set('feet','translate(0 0)');
  set('leftFoot',footSpace(p,'left').transform);set('rightFoot',footSpace(p,'right').transform);
  set('tail',`rotate(${p.tail} 603 795)`);
  if(!soft)set('head',`translate(${p.headX} ${p.headY}) rotate(${p.head} 474 528)`);
  set('scarf',`rotate(${p.scarf} 482 592)`);set('bag',`rotate(${p.bag} 429 704)`);
  set('leftEar',`rotate(${p.earLeft} 316 432)`);set('rightEar',`rotate(${p.earRight} 632 432)`);
  set('ahoge',`rotate(${p.ahoge} 460 214)`);
  const hands={};
  for(const side of ['right','left']){
   const upper=p[side+'Upper'],fore=p[side+'Fore'],mirror=side==='right'?1:-1;
   const wrist=side==='right'?p.hand:p.leftHand,a=upper*Math.PI/180,b=(upper+fore)*Math.PI/180;
   if(!soft){set(side+'Upper',`rotate(${upper})`);set(side+'Fore',`rotate(${fore})`);}
   const elbowX=(side==='right'?398:542)-mirror*83*Math.sin(a),elbowY=556+83*Math.cos(a);
   const point=soft?softSleeve(p,side).wrist:{x:elbowX-mirror*83*Math.sin(b),y:elbowY+83*Math.cos(b)};
   const {x,y}=point;
   const grip=side==='right'?Math.max(p.glass,p.scope):p.map;
   // Forearms pass in front of the cheek and clothing when lifted, with wrists at their exact tips.
   if(!soft)set(side+'ForeOverlay',`translate(${elbowX} ${elbowY}) scale(${mirror} 1) rotate(${upper+fore})`);
   const authored=p[side+'Authored']||0;
   const handAngle=mirror*(upper+fore+wrist)*(1-authored)+(p[side+'PalmAngle']||0)*authored;
   set(side+'Palm',`translate(${x} ${y}) rotate(${handAngle}) scale(${mirror} 1)`);
   if(!soft){attr(rig[side+'Open'],'opacity',String(1-grip));attr(rig[side+'Grip'],'opacity',String(grip));}
   set(side+'Thumb',`rotate(${grip*(4+p.wrist*.12)} -10 3)`);
   set(side+'Fingers',`rotate(${grip*(-2+p.wrist*.08)} 0 10)`);
   set(side+'Index',`rotate(${grip*(-4+p.wrist*.25)} -6 6)`);
   set(side+'Middle',`rotate(${grip*(-2+p.wrist*.15)} -6 13)`);
   set(side+'Ring',`rotate(${grip*(2+p.wrist*.1)} -4 19)`);
   const posed=handPose(p,side,soft?softSleeve(p,side):{wrist:point,elbow:{x:elbowX,y:elbowY}});
   hands[side]={x,y,contact:posed.contact};
  }
  const folded=.3+.7*p.mapFold;
  set('map',`translate(${hands.left.contact.x} ${hands.left.contact.y}) rotate(${p.mapAngle}) scale(${folded} 1) translate(-89 0)`);
  const glassAngle=p.glassAngle*Math.PI/180;
  set('glass',`translate(${hands.right.contact.x+24*Math.sin(glassAngle)} ${hands.right.contact.y-24*Math.cos(glassAngle)}) rotate(${p.glassAngle})`);
  // The same hand-local grip point is used while taking out, raising, viewing and lowering the scope.
  set('scope',`translate(${hands.right.contact.x} ${hands.right.contact.y}) rotate(${p.scopeAngle}) translate(-37 -3)`);
  set('scopeBarrel',`translate(70 0) scale(${.55+.45*p.scopeExtend} 1) translate(-70 0)`);
  for(const name of ['map','scope'])attr(rig[name],'opacity',String(p[name]));
  renderMascotFace(rig,p);
  attr(rig.glass,'opacity',String(p.glass));
}
