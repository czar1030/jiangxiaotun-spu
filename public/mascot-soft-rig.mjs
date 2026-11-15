import {setRigAttribute as attr} from './rig-attributes.mjs?v=1';
import {renderTravelRig} from './travel-rig.mjs?v=5';
import {softSleeve} from './soft-sleeve.mjs?v=8';
import {bodySpace} from './body-space.mjs?v=1';
import {handPose,renderHand} from './hand-posing.mjs?v=1';
import {footSpace,calfPath} from './foot-space.mjs?v=1';

export function renderSoftRig(rig,p,time=0,reducedMotion=false){
 renderTravelRig(rig,p,time,reducedMotion,{soft:true});
 const space=bodySpace(p,time,reducedMotion),headSquash=p.headSquash||0;
 attr(rig.body,'transform',space.transform);
 attr(rig.head,'transform',`translate(${p.headX} ${p.headY}) rotate(${p.head} 474 528) translate(474 528) scale(${1+headSquash*.5-Math.abs(p.headTurn||0)*.014} ${1-headSquash-(p.headPitch||0)*.008}) translate(-474 -528)`);
 for(const [side,x1,x2]of [['left',397,456],['right',491,551]])if(rig[side+'Leg']){
  attr(rig[side+'Leg'],'d',calfPath(space,footSpace(p,side),x1,x2));
 }
 // Waist stays sewn to the bodice. Only the cloth below it follows through;
 // the hands, face and held objects never inherit this extra deformation.
 const drag=reducedMotion?0:p.skirtDrag||0,ribbon=reducedMotion?0:p.ribbonDrag||0;
 if(rig.skirt)attr(rig.skirt,'transform',`translate(474 617) skewX(${drag}) translate(-474 -617)`);
 if(rig.ribbons)attr(rig.ribbons,'transform',`rotate(${ribbon} 482 636)`);
 for(const side of ['right','left']){
  const sleeve=softSleeve(p,side);
  attr(rig[side+'Upper'],'opacity','0');
  attr(rig[side+'Hand'],'opacity','0');
  attr(rig[side+'ForeOverlay'],'transform','translate(0 0)');
  for(const [name,key]of [['Sleeve','outline'],['Outline','outline'],['Cap','cap'],['Highlight','highlight'],['Folds','folds'],['SoftFront','front'],['SoftFrontEdge','frontEdge'],['Cuff','cuff']])attr(rig[side+name],'d',sleeve[key]);
  for(const [name,key]of [['SleeveShade','shade'],['SleeveLight','light'],['SoftFrontShade','frontShade'],['SoftFrontLight','frontLight'],['CuffTrim','cuffTrim'],['CuffStitch','cuffStitch']])rig[side+name]&&attr(rig[side+name],'d',sleeve[key]);
  for(const [name,key]of [['Embroidery','embroidery'],['FrontEmbroidery','embroidery'],['CuffShade','cuffShade'],['CuffFold','cuffFold']])rig[side+name]&&attr(rig[side+name],'d',sleeve[key]);
  attr(rig[side+'Device'],'transform',sleeve.cuffTransform);
 }
 for(const side of ['right','left']){
  const grip=side==='right'?Math.max(p.glass,p.scope,p.chin||0):Math.max(p.map,p.laptop||0);
  const rub=side==='right'?Math.min(1-grip,p.rub||0):0;
  const wave=side==='right'&&(p.waveHand||0)>.5&&grip<.01&&rub<.01;
  const relaxed=wave?0:Math.max(0,Math.min(1-grip-rub,p[side==='right'?'relaxRight':'relaxLeft']||0))*(1-p.happy);
  if(rig[side+'Rub'])attr(rig[side+'Rub'],'opacity',String(rub));
  if(rig[side+'Relaxed'])attr(rig[side+'Relaxed'],'opacity',String(relaxed));
  if(rig[side+'Wave']){
   attr(rig[side+'Wave'],'opacity',wave?'1':'0');
   const curl=Math.max(0,Math.min(1,p.palmCurl||0));
   // One rounded hand silhouette bends its fingertips; never dissolve two
   // overlapping hands or rotate a long, rigid finger fan.
   attr(rig[side+'WaveShape'],'d',`M-9-7Q-13 0-11 10L-17 6Q-23 4-21 10L-12 21L-8 32Q-6 37-3 33L-3 ${23-curl*3}L0 ${38-curl*6}Q3 ${42-curl*6} 5 ${37-curl*6}L5 23L10 ${34-curl*5}Q14 ${38-curl*5} 15 ${33-curl*5}L11 19L17 ${26-curl*4}Q22 ${29-curl*4} 21 ${23-curl*4}L15 6Q12-5 6-8Z`);
  }
  attr(rig[side+'Open'],'opacity',String(wave?0:1-grip-rub-relaxed));
  attr(rig[side+'Grip'],'opacity',String(grip));
  if(rub>.5){const {wrist}=softSleeve(p,side);attr(rig[side+'Palm'],'transform',`translate(${wrist.x} ${wrist.y}) rotate(${p.rubAngle||0})`);}
  renderHand(rig,side,handPose(p,side,softSleeve(p,side)));
 }
}
