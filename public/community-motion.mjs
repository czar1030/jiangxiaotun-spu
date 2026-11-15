import {communityActing} from './character-acting.mjs?v=2';
import {solveArm} from './travel-motion.mjs?v=8';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
// Velocity-continuous arcs flow through a gesture instead of easing to a stop
// at every intermediate key. Reversals and intentional holds still settle.
const track=(t,points)=>{
 const slope=i=>{
  if(i===0||i===points.length-1)return 0;
  const a=(points[i][1]-points[i-1][1])/(points[i][0]-points[i-1][0]);
  const b=(points[i+1][1]-points[i][1])/(points[i+1][0]-points[i][0]);
  return a*b<=0?0:2*a*b/(a+b);
 };
 for(let i=1;i<points.length;i++)if(t<=points[i][0]){
  const [a,x]=points[i-1],[b,y]=points[i],u=Math.max(0,(t-a)/(b-a)),u2=u*u,u3=u2*u;
  if(x===y)return x;
  return (2*u3-3*u2+1)*x+(u3-2*u2+u)*(b-a)*slope(i-1)+(-2*u3+3*u2)*y+(u3-u2)*(b-a)*slope(i);
 }
 return points.at(-1)[1];
};
const pulse=(t,a,b)=>t<=a||t>=b?0:Math.sin(Math.PI*(t-a)/(b-a))**2;
export const communityCycle=32;
export function communityPose(seconds){
 const t=((seconds%communityCycle)+communityCycle)%communityCycle;
 const viewing=ramp(t,4.8,6.5)*(1-ramp(t,24.5,26.5));
 // Left hand supports the laptop. The free right hand stays outside its edge.
 const laptop=ramp(t,.5,2.8)*(1-ramp(t,28.4,31.5));
 const leftX=track(t,[[0,571],[.5,571],[3,574],[28,574],[31.5,571],[32,571]]);
 const leftY=track(t,[[0,719],[.5,719],[3,704],[28,704],[31.5,719],[32,719]]);
 const freeHand=ramp(t,0,.5)*(1-ramp(t,31.5,32));
 const rightX=365-53*freeHand,rightY=718-21*freeHand;
 const right=solveArm(rightX-398,rightY-556,-1),left=solveArm(542-leftX,leftY-556,-1);
 const reach=pulse(t,.6,3.7),putAway=pulse(t,27,31.5);
 const press=pulse(t,.25,1.3)+.8*pulse(t,27.1,28.2);
 const recover=pulse(t,3.35,4.7)+.7*pulse(t,30,31.4);
 return communityActing({rightUpper:right.upper,rightFore:right.fore,leftUpper:left.upper,leftFore:left.fore,
  hand:-8,leftHand:-2*laptop,relaxRight:1,relaxLeft:1-laptop,
  rightX,rightY,leftX,leftY,laptop,opening:ramp(t,3.05,5.05)*(1-ramp(t,26.4,28.35)),
  head:viewing*2.6-1.4*reach+.8*recover,
  headX:0,headY:viewing*2+press*.7-recover*.5,
  blink:Math.max(...[1.6,6.2,11.8,17.1,22.3,28.6].map(a=>pulse(t,a,a+.25))),
  focus:viewing,smile:0,happy:0,bored:0,sleepy:0,chin:0,rub:0,rubAngle:-6,
  lift:2.3*press-2.7*reach+.8*recover,
  lean:-.65*reach+.55*putAway,shift:-1.5*reach+1.05*putAway,
  bodySquash:.0075*press-.0045*reach+.0025*recover,
  headSquash:.0025*press-.002*reach,
  leftHeel:0,rightHeel:0,tail:1.5*pulse(t,.9,4.3)-.9*pulse(t,27.7,31.8),scarf:0,bag:0,
  earLeft:viewing*.6+1.5*reach-.8*recover,earRight:-viewing*.5-reach+.7*recover,
  ahoge:-2.6*pulse(t,.9,3.8)+1.5*pulse(t,3.8,5.5),
  wrist:0,map:0,mapFold:0,mapAngle:0,glass:0,glassAngle:0,scope:0,scopeAngle:0,scopeExtend:0},seconds);
}

export {softGreetingPose as communityGreetingPose,advanceSoftPose as advanceCommunityPose} from './mascot-soft-motion.mjs?v=8';
