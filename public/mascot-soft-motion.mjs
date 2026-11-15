import {greetingActing} from './greeting-acting.mjs?v=1';
import {receptionActing,actingRest,beat} from './character-acting.mjs?v=2';
import {solveArm} from './travel-motion.mjs?v=8';
import {softSleeve} from './soft-sleeve.mjs?v=8';
const pulse=(t,a,b)=>t<=a||t>=b?0:Math.sin(Math.PI*(t-a)/(b-a))**2;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};

export const receptionCycle=42;
// Quiet intervals separate small, intentional gestures. The feet never float.
export function restingSoftPose(time=0){
 const cycle=((time%receptionCycle)+receptionCycle)%receptionCycle;
 const breathe=Math.sin(cycle*2*Math.PI/7);
 const listen=pulse(cycle,3.2,7.7),look=pulse(cycle,11,16),settle=pulse(cycle,20,25.3),nod=pulse(cycle,29.8,34.5);
 const earReply=pulse(cycle,4,8.5),lookFollow=pulse(cycle,11.7,16.7),settleFollow=pulse(cycle,20.6,25.9);
 const tidy=solveArm(36,77,-1);
 return receptionActing({rightUpper:16-breathe*.65-listen*1.2+settle*(tidy.upper-16),rightFore:-8+breathe*.4-listen*8+settle*(tidy.fore+8),
  leftUpper:12+breathe*.55-settle*2,leftFore:-4-breathe*.35+settle*1.2,
  hand:-6+listen*2.2+settle*65-settleFollow*3,leftHand:-5-lookFollow*1.5+settle*2.2,wrist:0,
  relaxRight:1,relaxLeft:1,
  head:-2.6*listen+2.8*look-.9*settle+1.8*nod,headX:look*1.3-listen*.35,headY:-breathe*.4+nod*.85,
  headSquash:breathe*.0011,bodySquash:breathe*.005,
  lift:0,lean:settle*.12,shift:0,tail:earReply*1.7-lookFollow*1.2+settleFollow*.8,
  earLeft:earReply*1.3-look*.7+nod*.5,earRight:-earReply*.65+lookFollow*1.1,
  ahoge:-earReply*1.7+lookFollow*1.3-settleFollow*.9+nod*.6,
  leftHeel:0,rightHeel:0,scarf:0,bag:0,
  map:0,mapFold:0,mapAngle:0,glass:0,glassAngle:0,scope:0,scopeAngle:0,scopeExtend:0,tiptoe:0,laptop:0,opening:0,focus:0,
  happy:0,smile:.18+.6*listen+.3*nod,bored:0,sleepy:0,chin:0,rub:0,rubAngle:-6,
  blink:Math.max(...[2.4,7.4,11.2,15.9,21.6,26.5,30.1,34.3,38.2].map(at=>pulse(cycle,at,at+.24)))},time);
}

export const sleepyCycle=18;
export function sleepySoftPose(p,elapsed){
 const t=Math.max(0,elapsed)%sleepyCycle,rest=restingSoftPose(0);
 const rise=smooth((t-.9)/2),lower=smooth((t-5.6)/2.2),raised=rise*(1-lower);
 const rubbing=smooth((t-3)/.35)*(1-smooth((t-5.05)/.4));
 const rubHand=smooth((t-.35)/.4)*(1-smooth((t-7.6)/.6));
 const nod=pulse(t,10,13)+.7*pulse(t,15,17.7);
 // Close the eyes before contact; the head follows a little after the arm.
 const head=2.3*smooth((t-1.3)/1.7)*(1-lower)+1.8*nod;
 const headY=1.5*raised+1.6*nod,headX=-.65*raised;
 const a=head*Math.PI/180,eye={x:392,y:473};
 const contact={x:474+(eye.x-474)*Math.cos(a)-(eye.y-528)*Math.sin(a)+headX,
  y:528+(eye.x-474)*Math.sin(a)+(eye.y-528)*Math.cos(a)+headY};
 // A wide, soft reach avoids sweeping the sleeve through the cheek or mouth.
 const outward=Math.sin(Math.PI*raised),stroke=rubbing*Math.sin((t-3)*2*Math.PI*.95);
 const x=365+(contact.x-365)*raised-79*outward+stroke*1.5;
 const y=718+(contact.y+21-718)*raised+rubbing*(1-Math.cos((t-3)*2*Math.PI*.95))*.32;
 const arm=solveArm(x-398,y-556,1),startArm=solveArm(-33,162,1);
 const branch=smooth(t/.65)*(1-smooth((t-8.2)/.8));
 const closed=Math.max(smooth((t-1.1)/.7)*(1-smooth((t-7.6)/.8)),nod);
 Object.assign(p,actingRest,{laptop:0,opening:0,focus:0,map:0,glass:0,scope:0,tiptoe:0,leftHeel:0,rightHeel:0,
  rightUpper:arm.upper+(rest.rightUpper-startArm.upper)*(1-branch),
  rightFore:arm.fore+(rest.rightFore-startArm.fore)*(1-branch),
  leftUpper:rest.leftUpper,leftFore:rest.leftFore,hand:-6,leftHand:-5,
  relaxRight:1-rubHand,relaxLeft:1,rub:rubHand,rubAngle:-6,chin:0,
  head,headX,headY,blink:0,smile:0,happy:0,bored:1-closed,sleepy:closed,
  lift:0,shift:-.8*raised,lean:-.18*raised+nod*.1,chest:.4*raised+.3*nod,headPitch:.15*raised,bodySquash:.0015*nod,headSquash:.0008*nod,
  earLeft:-.7*raised-.5*nod,earRight:.35*raised,ahoge:-1.2*raised-.5*nod,tail:-.65*raised});
 return p;
}

// Let the arm settle below the face before a held prop can return.
export function softRecoveryPose(p,from,elapsed=1.1){
 const {scarf=0,bag=0}=p;
 Object.assign(p,restingSoftPose(0),{scarf,bag,laptop:0,opening:0,focus:0});
 const destination={...p};
 if(from){
  const blend=smooth(elapsed/1.1);
  for(const key of Object.keys(p))if(Number.isFinite(from[key]))p[key]=from[key]+(p[key]-from[key])*blend;
  if(from.rub>.05||from.chin>.5)lowerHandAlongArc(p,from,destination,blend);
 }
 return Object.assign(p,actingRest,{laptop:0,opening:0,focus:0,map:0,glass:0,scope:0});
}

export function easeIdleEntry(target,from,elapsed,duration=1.25,propDuration=.45){
 if(!from||elapsed>=duration)return target;
 const destination={...target};
 for(const key of Object.keys(target)){
  if(!Number.isFinite(from[key]))continue;
  const prop=['laptop','opening','focus','map','glass','scope'].includes(key);
  const blend=smooth(elapsed/(prop?propDuration:duration));
  target[key]=from[key]+(target[key]-from[key])*blend;
 }
 if(from.chin>.5&&destination.chin<.1||from.rub>.5&&destination.rub<.1)lowerHandAlongArc(target,from,destination,smooth(elapsed/duration));
 return target;
}

// Interpolate the hand's path, not a rotating elbow that could sweep over the face.
function lowerHandAlongArc(p,from,to,blend){
 const a=softSleeve(from,'right').wrist,b=softSleeve(to,'right').wrist;
 const arm=solveArm(a.x+(b.x-a.x)*blend-68*Math.sin(Math.PI*blend)-398,a.y+(b.y-a.y)*blend-556,1);
 const landing=smooth((blend-.82)/.18);
 p.rightUpper=arm.upper+(to.rightUpper-arm.upper)*landing;
 p.rightFore=arm.fore+(to.rightFore-arm.fore)*landing;
}

export function softIdlePose(p,kind,elapsed){
 if(kind==='curious'){
  const look=beat(elapsed,.2,1.05,1.65,3),weight=beat(elapsed,.05,.8,1.5,2.8),follow=beat(elapsed,.4,1.3,1.9,3.2);
  p.head+=look*-3.2;p.headX-=look*.8;p.chest=(p.chest||0)-weight*.3;
  p.earLeft+=follow*1.1;p.ahoge-=follow*1.3;
  return p;
 }
 if(!['bored','sleepy'].includes(kind))return p;
 if(kind==='sleepy')return sleepySoftPose(p,elapsed);
 const lift=smooth(elapsed/2.7),attention=smooth((elapsed-.9)/2.1);
 const start={...p},startWrist=softSleeve(p,'right').wrist;
 Object.assign(p,actingRest,{laptop:0,opening:0,focus:0,rub:0,map:0,glass:0,scope:0,tiptoe:0,leftHeel:0,rightHeel:0,smile:0,happy:0});
 const x=startWrist.x+(424-startWrist.x)*lift-80*Math.sin(Math.PI*lift),y=startWrist.y+(515-startWrist.y)*lift;
 const right=solveArm(x-398,y-556,1),origin=solveArm(startWrist.x-398,startWrist.y-556,1),branch=1-smooth(lift/.24);
 p.rightUpper=lift===0?start.rightUpper:right.upper+(start.rightUpper-origin.upper)*branch;
 p.rightFore=lift===0?start.rightFore:right.fore+(start.rightFore-origin.fore)*branch;
 p.hand+=(0-p.hand)*lift;p.head+=(-7-p.head)*attention;p.headY=attention*1.6;
 p.chin=lift;p.relaxRight=(p.relaxRight||0)*(1-lift);p.bored=attention;p.sleepy=0;
 p.lean=-attention*.35;p.chest=-.75*attention;p.bodySquash=.003*attention;
 return p;
}
export function softGreetingPose(p,frame,kind,elapsed){
 const welcome=kind.startsWith('welcome'),t=Math.max(0,elapsed);
 Object.assign(p,actingRest,{laptop:0,opening:0,typing:0,focus:0,chin:0,rub:0,rubAngle:-6,bored:0,sleepy:0,
  map:0,glass:0,scope:0,tiptoe:0,leftHeel:0,rightHeel:0,
  leftUpper:12,leftFore:-4,leftHand:-5,relaxLeft:1,relaxRight:1,happy:0,wrist:0,
  head:0,headX:0,headY:0,bodySquash:0,headSquash:0,lift:0,lean:0,shift:0,hand:-6});
 return greetingActing(p,frame,kind,t);
}

// Small damped follow-through for soft tissue and cloth, never for prop anchors.
// Semi-implicit substeps keep the result stable on 30/60/120 Hz displays.
const softParts=new Set(['head','headX','headY','headSquash','bodySquash','lift','lean','shift','tail','earLeft','earRight','ahoge','hand','chest','headTurn','headPitch','knee','shoulderRight','shoulderLeft']);
const alphaParts=new Set(['laptop','opening','typing','focus','smile','happy','blink','bored','sleepy','chin','rub','map','glass','scope','mapFold','scopeExtend','tiptoe','relaxRight','relaxLeft','rightAuthored','leftAuthored']);
export function advanceSoftPose(current,target,velocity,dt,reducedMotion=false){
 if(reducedMotion){Object.assign(current,target);for(const key of ['rightFabric','leftFabric','skirtDrag','ribbonDrag'])delete current[key];for(const key of Object.keys(velocity))velocity[key]=0;return current;}
 const before={right:current.rightUpper+current.rightFore*.6,left:current.leftUpper+current.leftFore*.6,lean:current.lean,lift:current.lift};
 const steps=Math.max(1,Math.ceil(dt*120)),h=Math.min(dt,.1)/steps;
 for(let i=0;i<steps;i++)for(const key of Object.keys(target)){
  if(!Number.isFinite(current[key]))current[key]=target[key];
  if(softParts.has(key)){
   // Different settling times create overlap: trunk -> head -> ears -> hair.
   // Arms/props still use their original shared anchor paths.
   const omega=key.startsWith('head')?15:key==='ahoge'?10:key.startsWith('ear')?12:key==='tail'?9:22;
   const damping=key==='ahoge'?.76:key.startsWith('ear')?.82:.9;
   velocity[key]=(velocity[key]||0)+(omega*omega*(target[key]-current[key])-2*damping*omega*(velocity[key]||0))*h;
   current[key]+=velocity[key]*h;
  }else current[key]+=(target[key]-current[key])*(1-Math.exp(-h*20));
  if(alphaParts.has(key))current[key]=Math.max(0,Math.min(1,current[key]));
 }
 const limit=(x,n)=>Math.max(-n,Math.min(n,x)),elapsed=Math.max(dt,1/240);
 const follow={rightFabric:limit(-(current.rightUpper+current.rightFore*.6-before.right)/elapsed*.035,3.5),
  leftFabric:limit(-(current.leftUpper+current.leftFore*.6-before.left)/elapsed*.035,3.5),
  skirtDrag:limit(-(current.lean-before.lean)/elapsed*.35,1.8),
  ribbonDrag:limit(-(current.lean-before.lean)/elapsed*.9+(current.lift-before.lift)/elapsed*.16,4)};
 for(let i=0;i<steps;i++)for(const [key,destination]of Object.entries(follow)){
  const omega=key==='ribbonDrag'?10:13;
  velocity[key]=(velocity[key]||0)+(omega*omega*(destination-(current[key]||0))-1.8*omega*(velocity[key]||0))*h;
  current[key]=(current[key]||0)+velocity[key]*h;
 }
 return current;
}
