import {restingSoftPose} from './mascot-soft-motion.mjs?v=8';
import {solveArm} from './travel-motion.mjs?v=8';
import {softSleeve} from './soft-sleeve.mjs?v=1';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
const envelope=(t,a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
export const arenaCycle=18;
export const arenaArmOffset=(side,p={})=>side==='right'?{x:26,y:0}:{x:4+(p.shoulderLead||0),y:-6-(p.shoulderRise||0)};
export function arenaSleeve(p,side){
 const sleeve=softSleeve(p,side),offset=arenaArmOffset(side,p);
 return {...sleeve,offset,...Object.fromEntries(['shoulder','elbow','wrist'].map(key=>[key,{x:sleeve[key].x+offset.x,y:sleeve[key].y+offset.y}]))};
}

export function arenaPose(time=0,team='blue'){
 const t=((time%arenaCycle)+arenaCycle)%arenaCycle;
 const point=envelope(t,.9,2.85,5.3,8.3),follow=envelope(t,.65,2.55,5.6,8.8);
 const prepare=envelope(t,.2,.75,.85,1.65),wrist=envelope(t,1.15,3.15,5.55,8.35);
 const hold=envelope(t,3,3.6,4.9,5.6),settle=Math.sin((t-3.2)*2.2)*hold;
 const p=restingSoftPose(time);
 // The challenge hand travels entirely outside the torso, never across the face.
 const x=583+point*94-prepare*6+settle*1.3;
 const y=709-point*131-23*Math.sin(point*Math.PI)+settle*.8;
 // The elbow bends below the shoulder throughout the rise. The old opposite
 // IK branch produced an over-high elbow and a sharply drooping forearm.
 const arm=solveArm(542-x,y-556,1);
 Object.assign(p,{leftUpper:arm.upper,leftFore:arm.fore,leftHand:0,
  rightUpper:14-follow*2,rightFore:-6-follow*3,relaxRight:1,relaxLeft:0,
  head:-.5+follow*.8+settle*.15,headX:follow*.9,headY:prepare*.7-follow*.3,
  lean:follow*1.05-prepare*.4,shift:0,lift:0,smile:0,happy:0,
  bodySquash:prepare*.005-follow*.0015,headSquash:0,
  shoulderLead:follow*1.5,shoulderRise:follow*1.5,
  tail:Math.sin((time-.35)*.85)*.7+follow*.9,
  earLeft:follow*.8,earRight:-follow*.7,ahoge:-follow*1.5,
  challenge:point,beckon:0,guard:0,pointHand:envelope(t,.95,1.85,6.15,8.3),
  handAngle:73*(1-wrist)-3+settle*1.1});
 if(team==='red'){
  const near=solveArm(124,84,-1),far=solveArm(110,108,-1);
  Object.assign(p,{rightUpper:near.upper,rightFore:near.fore,leftUpper:far.upper,leftFore:far.fore,
   guard:1,challenge:0,beckon:0,pointHand:0,relaxRight:0,relaxLeft:0,shoulderLead:0,shoulderRise:0,
   head:-.5+Math.sin(time*.65)*.2,headX:0,headY:-.5,lean:0,bodySquash:Math.sin(time*1.12)*.0015,
   earLeft:.3*Math.sin(time*.8),earRight:0,ahoge:.4*Math.sin(time*.8-.3),tail:.45*Math.sin(time*.7-.5)});
 }
 return p;
}

export function armbandTransform(p){
 const s=arenaSleeve(p,p.guard?'right':'left'),t=.23,u=1-t;
 const c1={x:s.shoulder.x+(s.elbow.x-s.shoulder.x)*1.05,y:s.shoulder.y+(s.elbow.y-s.shoulder.y)*1.05};
 const c2={x:s.wrist.x+(s.elbow.x-s.wrist.x)*.92,y:s.wrist.y+(s.elbow.y-s.wrist.y)*.92};
 const x=u*u*u*s.shoulder.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*s.wrist.x;
 const y=u*u*u*s.shoulder.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*s.wrist.y;
 const dx=u*u*(c1.x-s.shoulder.x)+2*u*t*(c2.x-c1.x)+t*t*(s.wrist.x-c2.x);
 const dy=u*u*(c1.y-s.shoulder.y)+2*u*t*(c2.y-c1.y)+t*t*(s.wrist.y-c2.y);
 const angle=Math.atan2(dy,dx)*180/Math.PI-90;
 return `translate(${x} ${y}) rotate(${angle})`;
}

export function challengeHandPath(team,p){
 if(team==='blue')return 'M-6-12Q4-16 13-13L39-15Q46-15 46-11Q46-7 39-7L19-5Q28-4 28 1Q28 6 23 7Q27 12 21 16Q23 21 17 23L4 23Q-5 22-9 13L-11 3Z';
 const curl=(p.beckon||0)*5;
 return `M-8-9Q-1-14 9-12L29 ${-21+curl}Q35 ${-23+curl} 36 ${-18+curl}Q37 ${-14+curl} 30 ${-11+curl}L19-4L37 ${-8+curl}Q43 ${-8+curl} 43 ${-3+curl}Q42 ${1+curl} 36 ${2+curl}L20 7L33 7Q39 8 38 12Q37 16 31 16L18 18L25 20Q29 24 25 27Q20 29 14 26L2 22Q-7 19-10 10Z`;
}
