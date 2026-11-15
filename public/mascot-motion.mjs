// Continuous joint curves sampled at 60 Hz; the browser interpolates at display refresh rate.
// Delayed envelopes give the elbow, wrist, head and tail their own follow-through.
export const motionRate=60;
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const x=clamp(value);return x*x*x*(x*(x*6-15)+10);};
const ramp=(time,start,end)=>smooth((time-start)/(end-start));
const envelope=(time,start,up,down,end)=>ramp(time,start,up)*(1-ramp(time,down,end));
const pulse=(time,start,end)=>time<=start||time>=end?0:Math.sin(Math.PI*(time-start)/(end-start))**2;
export const opacityParts=Object.freeze(['smile','blink','wave','waveLegs','welcome']);
export const restingPose=Object.freeze({shoulder:0,elbow:0,wrist:0,head:0,body:0,tail:0,lift:0,smile:0,blink:0,wave:1,waveLegs:1,welcome:0,happyHead:0,happyRight:0,happyLeft:0});

function poseAt(kind,time){
 const welcome=kind==='welcome';
 if(!welcome)time*=5.2/7.75;
 const start=welcome?.74:.25,down=welcome?4.55:3.55,end=welcome?6.2:5.2;
 const arm=envelope(time,start,start+1.05,down,end-.12);
 const forearm=envelope(time,start+.10,start+1.48,down+.10,end-.06);
 const hand=envelope(time,start+.22,start+1.65,down+.18,end);
 const waving=envelope(time,start+1.30,start+1.90,down-.30,down+.15);
 const phase=(time-start-1.10)*2*Math.PI/1.48;
 const body=envelope(time,.05,start+1.25,down+.28,end);
 const nod=welcome?pulse(time,.08,1.42):0;
 const joy=welcome?envelope(time,.20,1.15,4.65,end):0;
 const embrace=welcome?envelope(time,.36,1.65,4.50,end):0;
 const reveal=welcome?ramp(time,.02,.56):0;
 return {
  shoulder:42*arm+7*waving*Math.sin(phase-.40),
  elbow:64*forearm+9*waving*Math.sin(phase-.12),
  wrist:50*hand+15*waving*Math.sin(phase+.28),
  head:-3.8*body+1.1*waving*Math.sin(phase-.78)+2.4*nod,
  body:.65*body+.22*waving*Math.sin(phase-1.10)+.45*nod,
  tail:-2.2*envelope(time,.25,start+1.70,down+.42,end)+.65*waving*Math.sin(phase-1.3),
  lift:-1.2*body+1.1*nod-2.8*joy,
  smile:ramp(time,.04,.44),
  blink:Math.max(pulse(time,welcome?.44:.65,welcome?.63:.83),pulse(time,down+.30,down+.49)),
  welcome:reveal,wave:1-reveal,waveLegs:1-reveal,
  happyHead:-3.0*joy+.55*embrace*Math.sin((time-1.4)*2*Math.PI/2.4),
  happyRight:7*embrace+2*embrace*Math.sin((time-1.2)*2*Math.PI/2.0),
  happyLeft:-6*embrace-1.6*embrace*Math.sin((time-1.42)*2*Math.PI/2.0)
 };
}

export function greetingMotion(kind='wave',initial=restingPose){
 if(!['wave','welcome'].includes(kind))throw new TypeError('Unknown greeting motion');
 const duration=kind==='welcome'?6200:7750;
 const count=Math.round(duration/1000*motionRate);
 const frames=Array.from({length:count+1},(_,index)=>{
  const offset=index/count,time=duration/1000*offset,pose=poseAt(kind,time);
  // An interrupted wave starts at the exact currently visible pose, then joins the new curve.
  const join=1-ramp(time,0,.78);
  for(const name of Object.keys(pose))pose[name]+=((initial[name]??restingPose[name])-restingPose[name])*join;
  for(const name of opacityParts)pose[name]=clamp(pose[name]);
  return {offset,...pose};
 });
 return {duration,frames};
}

// Sample at the exact presentation time. Floor-based selection discarded the
// inbetween on 90/120 Hz screens and unevenly repeated poses after a late frame.
export function sampleGreeting(clip,seconds){
 const position=Math.max(0,Math.min(clip.frames.length-1,seconds*1000/clip.duration*(clip.frames.length-1)));
 const index=Math.floor(position),weight=position-index,a=clip.frames[index],b=clip.frames[Math.min(index+1,clip.frames.length-1)];
 return Object.fromEntries(Object.keys(a).map(key=>[key,a[key]+(b[key]-a[key])*weight]));
}
