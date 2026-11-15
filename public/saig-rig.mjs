import {renderSoftRig} from './mascot-soft-rig.mjs?v=11';
import {arenaSleeve,armbandTransform,challengeHandPath} from './saig-motion.mjs?v=3';

export function renderArenaRig(rig,p,time,team,reduced=false){
 renderSoftRig(rig,p,time,reduced);
 for(const side of ['left','right']){
  const {wrist,offset}=arenaSleeve(p,side);
  for(const layer of ['Soft','ForeOverlay'])rig[side+layer].setAttribute('transform',`translate(${offset.x} ${offset.y})`);
  const angle=p.guard?(side==='right'?-25:205):(side==='left'?0:p.rightUpper+p.rightFore+p.hand);
  rig[side+'Palm'].setAttribute('transform',`translate(${wrist.x} ${wrist.y}) rotate(${angle})`);
  if(side==='left'||p.guard)for(const kind of ['Open','Grip','Relaxed','Rub'])rig[side+kind].setAttribute('opacity','0');
 }
 if(!p.guard)rig.leftRelaxed.setAttribute('opacity',String(1-p.pointHand));
 rig.foldNearHand.setAttribute('opacity',String(p.guard));rig.foldFarHand.setAttribute('opacity',String(p.guard));
 rig.challengeHand.setAttribute('opacity',String(p.pointHand));
 rig.challengeHand.setAttribute('transform',`rotate(${p.handAngle})`);
 rig.challengeFingers.setAttribute('d',challengeHandPath(team,p));
 rig.armband.setAttribute('transform',armbandTransform(p));
 rig.head.setAttribute('transform',`translate(${p.headX} ${p.headY}) rotate(${p.head} 515 528)`);
 rig.rightEar.setAttribute('opacity','0');
 rig.ahoge.setAttribute('transform',`rotate(${p.ahoge} 514 214)`);
}
