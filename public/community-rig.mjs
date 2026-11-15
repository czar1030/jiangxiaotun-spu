import {setRigAttribute as attr} from './rig-attributes.mjs?v=1';
import {renderSoftRig} from './mascot-soft-rig.mjs?v=11';
import {softSleeve} from './soft-sleeve.mjs?v=8';
import {handPose} from './hand-posing.mjs?v=1';
export function renderCommunityRig(rig,p,time=0,reducedMotion=false){
 renderSoftRig(rig,p,time,reducedMotion);
 // The shared face renderer also selects the focused expression exclusively.
 const set=(name,value)=>attr(rig[name],'transform',value);
 // Derive the support point from the actual visible arm, including interruptions.
 const {x,y}=handPose(p,'left',softSleeve(p,'left')).contact;
 set('laptop',`translate(${x-574} ${y-723})`);
 attr(rig.laptop,'opacity',String(p.laptop));
 // The display opens away from the keyboard; it never passes through a hand.
 const height=.08+.92*p.opening;
 set('display',`translate(459 690) skewX(${(1-p.opening)*1.1}) scale(${.985+.015*p.opening} ${height}) translate(-459 -690)`);
 attr(rig.screenCursor,'opacity',String(p.opening*(reducedMotion?1:.65+.35*Math.cos(time*4))));
 set('screenLines',`translate(0 ${p.opening*(Math.sin(time*.55)*1.2)})`);
}
