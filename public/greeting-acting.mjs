import {actingTrack as track,beat,ease} from './character-acting.mjs?v=2';

const rest={rightElbowX:375.1229,rightElbowY:635.7849,rightTargetX:363.5715,rightTargetY:717.9773,
 leftElbowX:559.2567,leftElbowY:637.1863,leftTargetX:570.8081,leftTargetY:719.3787};
const value=(t,keys)=>track(t,keys);
const blink=(t,at,width=.15)=>{const u=Math.abs(t-at)/width;return u>=1?0:(1-u*u)**2;};

// The approved greeting study, authored as connected shoulder/elbow/wrist
// contours. The shoulders remain part of the bodice, not independent cutouts.
export function greetingActing(p,frame,kind,seconds){
 const t=Math.max(0,seconds),welcome=kind.startsWith('welcome');
 Object.assign(p,rest);
 if(welcome){
  const open=beat(t,.23,1.5,4.45,6.2),left=beat(t,.37,1.74,4.36,6.2);
  p.rightAuthored=beat(t,.08,.42,5.9,6.2);p.leftAuthored=beat(t,.18,.5,5.9,6.2);
  p.rightElbowX=rest.rightElbowX+(325-rest.rightElbowX)*open;
  p.rightElbowY=rest.rightElbowY+(602-rest.rightElbowY)*open;
  p.rightTargetX=rest.rightTargetX+(266-rest.rightTargetX)*open;
  p.rightTargetY=rest.rightTargetY+(606-rest.rightTargetY)*open;
  p.leftElbowX=rest.leftElbowX+(614-rest.leftElbowX)*left;
  p.leftElbowY=rest.leftElbowY+(606-rest.leftElbowY)*left;
  p.leftTargetX=rest.leftTargetX+(673-rest.leftTargetX)*left;
  p.leftTargetY=rest.leftTargetY+(612-rest.leftTargetY)*left;
  p.rightPalmAngle=-79*open;p.leftPalmAngle=75*left;
  p.relaxRight=1-open;p.relaxLeft=1-left;
  p.rightUpper=16+44*open;p.rightFore=-8+56*open;
  p.leftUpper=12+43*left;p.leftFore=-4+46*left;
  p.chest=value(t,[[0,0],[.27,-.7],[.9,.65],[1.7,-.45],[4.5,-.3],[6.2,0]]);
  p.shift=value(t,[[0,0],[.3,1.5],[1.25,-3.4],[1.9,-2.1],[4.5,-1.5],[6.2,0]]);
  p.lean=value(t,[[0,0],[.3,.45],[1.2,-.8],[1.9,-.5],[4.6,-.3],[6.2,0]]);
  p.lift=value(t,[[0,0],[.3,3],[.95,-2.4],[1.65,-.8],[4.5,-.5],[6.2,0]]);
  p.head=value(t,[[0,0],[.32,1.1],[1.2,-3.8],[1.9,-2.5],[3.5,-3],[4.7,-1.5],[6.2,0]]);
  p.headPitch=.22*open;p.headY=.5*open;
  p.shoulderRight=1.5*open;p.shoulderLeft=1.1*left;
  p.knee=1.2*beat(t,.06,.28,.34,.85);
  p.bodySquash=value(t,[[0,0],[.3,.009],[.95,-.004],[1.65,0],[6.2,0]]);
  p.happy=frame.welcome;p.smile=1;p.blink=0;
  p.tail=-1.8*beat(t,.5,1.6,4.7,6.2);
  p.earLeft=.9*open;p.earRight=-.7*left;
  p.ahoge=-1.6*beat(t,.45,1.1,1.45,2.1)+.6*beat(t,4.7,5.3,5.5,6.2);
  return p;
 }
 let wave=0;
 for(const [a,b,amplitude]of [[2.23,3.22,14],[3.25,4.20,12],[4.20,4.90,7]]){
  const u=(t-a)/(b-a);if(u>0&&u<1)wave+=amplitude*Math.sin(2*Math.PI*u)*Math.sin(Math.PI*u)**.6;
 }
 const up=beat(t,1.15,2.15,4.8,6.4);
 p.rightAuthored=beat(t,.65,1.05,6.4,6.8);
 p.rightElbowX=value(t,[[0,rest.rightElbowX],[.9,rest.rightElbowX],[1.3,365],[1.8,329],[2.15,315],[4.8,315],[5.6,329],[6.4,rest.rightElbowX],[7.75,rest.rightElbowX]]);
 p.rightElbowY=value(t,[[0,rest.rightElbowY],[.9,rest.rightElbowY],[1.3,643],[1.8,598],[2.15,540],[4.8,540],[5.6,605],[6.4,rest.rightElbowY],[7.75,rest.rightElbowY]]);
 p.rightTargetX=value(t,[[0,rest.rightTargetX],[.9,rest.rightTargetX],[1.25,351],[1.75,285],[2.15,267],[4.8,267],[5.5,270],[5.95,312],[6.4,rest.rightTargetX],[7.75,rest.rightTargetX]])+wave*.45;
 p.rightTargetY=value(t,[[0,rest.rightTargetY],[.9,rest.rightTargetY],[1.25,718],[1.75,590],[2.15,441],[4.8,441],[5.5,566],[5.95,675],[6.4,rest.rightTargetY],[7.75,rest.rightTargetY]]);
 p.rightPalmAngle=value(t,[[0,0],[1.1,0],[1.7,75],[2.15,173],[4.9,173],[5.65,84],[6.4,0],[7.75,0]])+wave;
 p.waveHand=up;p.relaxRight=1-up;
 p.palmCurl=.4*beat(t,2.2,2.5,2.7,3.1)+.25*beat(t,3.3,3.6,3.8,4.1);
 p.rightUpper=16+40*up;p.rightFore=-8+77*up;
 p.leftUpper=12+2.2*up;p.leftFore=-4-2.5*up;
 p.shift=value(t,[[0,0],[.6,0],[1.17,3.5],[2.15,8],[3.1,6.5],[4.3,7.5],[5.3,4],[6.55,0],[7.75,0]]);
 p.lift=value(t,[[0,0],[.65,0],[1.15,4],[2.1,-3],[3,-1.8],[4.5,-2.5],[5.4,1],[6.65,0],[7.75,0]]);
 p.lean=value(t,[[0,0],[1.1,.35],[2.1,-.6],[4.6,-.4],[5.6,.15],[6.7,0],[7.75,0]]);
 p.chest=value(t,[[0,0],[1.1,.35],[2.15,-.45],[4.7,-.3],[6.5,0],[7.75,0]]);
 p.head=value(t,[[0,0],[.7,0],[1.22,1.1],[2.1,-2.8],[2.9,-4.1],[3.8,-2.6],[4.55,-5.6],[5.2,-3.2],[6.5,0],[7.75,0]]);
 p.headY=.4*up;p.headTurn=-.15*up;
 p.bodySquash=value(t,[[0,0],[1.15,.007],[2.1,-.003],[2.7,0],[7.75,0]]);
 p.shoulderRight=2.2*up;p.shoulderLeft=-.5*up;
 p.tail=-1.3*beat(t,1.2,2.5,4.9,6.7);
 p.earLeft=1.2*beat(t,1.5,2.3,4.9,6.6);p.earRight=-.5*up;
 p.ahoge=-1.6*beat(t,1.1,2.2,2.8,3.7)+.7*beat(t,5.1,5.7,6,6.9);
 p.smile=ease((t-.6)/.75);p.blink=Math.max(blink(t,.48),blink(t,4.57,.20),blink(t,6.66));
 return p;
}
