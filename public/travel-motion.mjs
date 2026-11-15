import {travelActing,travelStudyScan,travelHorizonScan} from './character-acting.mjs?v=2';
// 5,761 sampled poses per 48-second performance; interpolation follows display refresh.
export const travelMotionRate=120,travelCycle=48;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const ramp=(t,a,b)=>smooth((t-a)/(b-a));
const envelope=(t,a,b,c,d)=>ramp(t,a,b)*(1-ramp(t,c,d));
const pulse=(t,a,b)=>t<=a||t>=b?0:Math.sin(Math.PI*(t-a)/(b-a))**2;
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
export function solveArm(x,y,side=1){
 const length=83,distance=Math.min(165.8,Math.max(12,Math.hypot(x,y)));
 const elbow=side*2*Math.acos(distance/(2*length));
 // Avoid a full rotation when a rising hand crosses shoulder height.
 const bearing=Math.atan2(y,x),continuous=bearing<0?bearing+2*Math.PI:bearing;
 const shoulder=continuous-Math.atan2(length*Math.sin(elbow),length+length*Math.cos(elbow));
 return {upper:shoulder*180/Math.PI-90,fore:elbow*180/Math.PI};
}
export function travelArms(p){
 // Keep the elbows outside the torso while holding the map. The raised
 // telescope needs the opposite bend; change it only after putting props away.
 const outward=solveArm(p.rightX-398,p.rightY-556,-1);
 const raised=solveArm(p.rightX-398,p.rightY-556,1);
 const blend=p.raisedBend;
 const left=solveArm(542-p.leftX,p.leftY-556,-1);
 return {rightUpper:outward.upper+(raised.upper-outward.upper)*blend,
  rightFore:outward.fore+(raised.fore-outward.fore)*blend,
  leftUpper:left.upper,leftFore:left.fore,hand:p.wrist,leftHand:-p.wrist*.35};
}
export function travelPose(seconds,action='auto'){
 let t=((seconds%travelCycle)+travelCycle)%travelCycle;
 if(action==='map')t=9;if(action==='scope')t=34;
 // Reach first, unfold the paper, then lift the lens. Reverse to put it away.
 const map=envelope(t,1.9,3.25,19.4,21.5),glass=envelope(t,4.25,6.05,16.0,18.8);
 const scope=envelope(t,24.8,26.3,42.3,44.1),tiptoe=envelope(t,28.6,30.8,38.5,41.3);
 const studying=envelope(t,6.05,7.45,14.8,16.0),looking=envelope(t,30.5,32,37.7,39.2);
 const reach=pulse(t,.65,3.35),collect=pulse(t,19.3,21.8),brace=pulse(t,27.55,30.1);
 const scan=travelStudyScan(t),search=travelHorizonScan(t);
 // Two slow inspections follow short arcs over the paper, then actually
 // pause. The lens remains attached to the same hand throughout.
 const inspect=pulse(t,8.3,10.4)-.8*pulse(t,11.5,14.3);
 const rx=track(t,[[0,365],[1,365],[3.5,359],[4.2,366],[6.2,400],[15.8,400],[18.7,345],[21.5,365],[23.9,365],[25.8,359],[27.8,350],[29.4,341],[39,341],[41,354],[43.8,365],[48,365]]);
 const ry=track(t,[[0,718],[1,718],[3.5,711],[4.2,708],[6.2,701],[15.8,701],[18.7,710],[21.5,718],[23.9,718],[25.8,680],[27.8,546],[29.4,465],[39,465],[41,550],[43.8,718],[48,718]]);
 return travelActing({
  map,glass,scope,tiptoe,chin:0,rub:0,rubAngle:-6,relaxRight:1-Math.max(map,glass,scope),relaxLeft:1-map,
  bodySquash:.008*pulse(t,.2,1.5)-.004*pulse(t,2,4.2)+.005*pulse(t,24,26)+.002*brace,
  headSquash:.002*pulse(t,.5,1.8)-.002*pulse(t,27,29),
  raisedBend:envelope(t,22,24,44.3,46.3),
  rightX:rx+studying*scan*13+looking*search*2-3*reach-2*collect,
  rightY:ry+studying*(scan*4+inspect*2.6)+looking*pulse(t,34.3,36.6)*1.4,
  leftX:track(t,[[0,571],[.9,571],[2.6,500],[4.8,565],[17,565],[19.4,502],[21.8,571],[25,571],[29.8,590],[39.6,590],[43.7,571],[48,571]])+2*reach,
  leftY:track(t,[[0,719],[.9,719],[2.6,703],[4.8,684],[17,684],[19.4,703],[21.8,719],[29.8,686],[39.6,686],[43.7,719],[48,719]]),
  head:track(t,[[0,0],[1,-1.2],[3.3,2.4],[6.5,4],[16.3,3.2],[20.8,0],[24.2,-.8],[27.4,-2.6],[30.8,-4],[39,-3.4],[42.8,.5],[45,0],[48,0]])+studying*scan*1.5+looking*search*.7,
  headX:studying*scan*.8-looking*search*1.1,
  headY:studying*pulse(t,10.7,12.4)*.8-looking*.65-.45*envelope(t,27.4,29.5,39,41),
  lift:-tiptoe*9+1.3*pulse(t,25,27.2)+1.1*brace,
  lean:looking*(-.65+search*.3)+studying*scan*.22,
  shift:looking*(-1.4+search*.6),
  mapAngle:track(t,[[0,-10],[2,-10],[5,-4],[17,-4],[20,-10],[48,-10]])+studying*scan*.6,
  mapFold:envelope(t,2.8,4.9,17,19.4),
  glassAngle:12+studying*scan*4.2+1.6*pulse(t,6.4,7.8),
  scopeAngle:track(t,[[0,72],[25,72],[27.4,27],[29.5,0],[39,0],[41.5,40],[44,72],[48,72]])+looking*search*1.3,
  scopeExtend:envelope(t,27.8,29.8,39,40.7),
  wrist:studying*scan*2.6+looking*search*.7,
  leftHeel:tiptoe*9,rightHeel:tiptoe*8.2,
  scarf:1.3*pulse(t,26.1,29.6)-1.1*pulse(t,40,43.5)+studying*scan*.35,
  bag:-.6*pulse(t,1,4.1)+.7*pulse(t,18,21.5)+looking*search*.3,
  blink:Math.max(...[3.3,8.2,13.7,19.2,26.3,31.1,36.7,42.9,46.3].map(at=>pulse(t,at,at+.24))),
  smile:.35+.3*studying+.2*looking,happy:0,bored:0,sleepy:0,
  earLeft:studying*scan*.8+looking*(1.2+search*.5),earRight:-studying*scan*.6-looking*.8,
  ahoge:-.8*pulse(t,1,4.2)+1.1*pulse(t,27,30.8)-.7*pulse(t,40,43.4),
  tail:1.1*pulse(t,2,5.3)-.8*pulse(t,20,23.3)-looking*1.4+studying*scan*.28
 },seconds);
}
export const travelFrames=Object.freeze(Array.from({length:travelCycle*travelMotionRate+1},(_,i)=>Object.freeze(travelPose(i/travelMotionRate))));
export function sampledTravelPose(seconds){
 const frame=(((seconds%travelCycle)+travelCycle)%travelCycle)*travelMotionRate;
 const index=Math.floor(frame),weight=frame-index,a=travelFrames[index],b=travelFrames[index+1];
 return Object.fromEntries(Object.keys(a).map(key=>[key,a[key]+(b[key]-a[key])*weight]));
}
