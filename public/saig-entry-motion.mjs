const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const integral=x=>{x=clamp(x);return x**6-3*x**5+2.5*x**4;};
export const arenaEntryTiming=Object.freeze({walkStart:.14,walkEnd:1.94,poseStart:2.02,poseEnd:2.78,summonStart:3.02,summonEnd:3.92});
export const arenaWalkTiming=Object.freeze({duration:1.8,ramp:.22,ending:.42,strides:1});

function distanceAt(time){
 const {duration,ramp,ending}=arenaWalkTiming;
 if(time>=duration)return 1;
 const t=Math.max(0,time),brake=duration-ending;
 const distance=t<ramp?ramp*integral(t/ramp):t<brake?t-ramp/2:
  brake-ramp/2+(t-brake)-ending*integral((t-brake)/ending);
 return clamp(distance/(duration-(ramp+ending)/2));
}

// The entrance clock selects complete drawn frames. It never deforms a knee,
// ankle, shoe or sleeve from the fighting stance into a walking shape.
export function arenaEntrance(time=0,reduced=false){
 const end=arenaEntryTiming;
 if(reduced)return {phase:'ready',time,travelX:0,travelY:0,travelScale:1,distance:1,walk:0,walkTime:0,pose:1,arrival:1,summon:1,charge:0,ring:0,echoLift:0,echoScale:1,commanderOpacity:1,settle:0,intent:0};
 const t=Math.max(0,time),walkTime=Math.max(0,t-end.walkStart),distance=distanceAt(walkTime);
 const {duration,ramp,ending,strides}=arenaWalkTiming;
 const walk=smooth(walkTime/ramp)*(1-smooth((walkTime-duration+ending)/ending));
 const pose=smooth((t-end.poseStart)/(end.poseEnd-end.poseStart));
 const arrival=smooth((t-end.walkEnd)/(end.poseEnd-end.walkEnd));
 const summon=smooth((t-end.summonStart)/(end.summonEnd-end.summonStart));
 const charge=smooth((t-end.poseEnd-.06)/.3)*(1-smooth((t-end.summonEnd+.37)/.8));
 const intent=smooth((t-end.poseEnd+.34)/.3)*(1-smooth((t-end.summonStart-.48)/.6));
 const phase=t<end.walkEnd?'walking':t<end.poseEnd?'posing':t<end.summonStart?'commanding':t<end.summonEnd?'summoning':'ready';
 return {phase,time:t,travelX:distance===1?0:-360*(1-distance),travelY:0,travelScale:1,distance,walk,walkTime,stride:distance*strides,pose,arrival,summon,charge,
  ring:smooth((t-end.poseEnd-.08)/.5)*(1-smooth((t-end.summonEnd+.12)/.85)),echoLift:(1-summon)*105,echoScale:.965+.035*summon,
  commanderOpacity:smooth(t/.18),settle:0,intent};
}

export function arenaIdleTime(time){
 const after=Math.max(0,time-arenaEntryTiming.poseEnd);
 return 4+(after<2.2?0:after<3.2?integral(after-2.2):after-2.7);
}
