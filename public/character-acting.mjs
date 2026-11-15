// Authored whole-body beats. Holds are intentional; interpolation serves the
// silhouette and its weight, rather than oscillating every joint separately.
export const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
export const beat=(t,a,b,c,d)=>ease((t-a)/(b-a))*(1-ease((t-c)/(d-c)));
export const breathAt=(t,period=8)=>{
 const phase=((t%period)+period)%period/period;
 return phase<.42?ease(phase/.42):1-ease((phase-.42)/.58);
};
export function actingTrack(t,keys){
 const slope=i=>{
  if(!i||i===keys.length-1)return 0;
  const a=(keys[i][1]-keys[i-1][1])/(keys[i][0]-keys[i-1][0]);
  const b=(keys[i+1][1]-keys[i][1])/(keys[i+1][0]-keys[i][0]);
  return a*b<=0?0:2*a*b/(a+b);
 };
 if(t<=keys[0][0])return keys[0][1];
 for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){
  const [a,x]=keys[i-1],[b,y]=keys[i],u=(t-a)/(b-a),u2=u*u,u3=u2*u;
  return (2*u3-3*u2+1)*x+(u3-2*u2+u)*(b-a)*slope(i-1)+(-2*u3+3*u2)*y+(u3-u2)*(b-a)*slope(i);
 }
 return keys.at(-1)[1];
}

// One observation track drives the lens, neck and torso. The eyes lead,
// the hand arrives, then the shoulders settle; unrelated oscillators made
// the character appear to inspect three different places at once.
export const travelStudyScan=t=>actingTrack(t,[[0,0],[6.4,0],[8.4,-1],[9.4,-1],[11.5,.8],[12.7,.8],[14.9,0],[48,0]]);
export const travelHorizonScan=t=>actingTrack(t,[[0,0],[31,0],[33.2,-1],[34.1,-1],[36.6,1],[37.6,1],[39.2,0],[48,0]]);

// Every pose owns these values, so an interrupted greeting cannot leave a
// compressed torso or a waving hand behind in the next scene.
export const actingRest=Object.freeze({chest:0,headTurn:0,headPitch:0,knee:0,waveHand:0,palmCurl:0,shoulderRight:0,shoulderLeft:0,
 rightAuthored:0,leftAuthored:0,rightPalmAngle:0,leftPalmAngle:0,
 rightElbowX:375.1229,rightElbowY:635.7849,rightTargetX:363.5715,rightTargetY:717.9773,
 leftElbowX:559.2567,leftElbowY:637.1863,leftTargetX:570.8081,leftTargetY:719.3787});

export function receptionActing(p,seconds){
 const t=((seconds%42)+42)%42;
 const listen=beat(t,3.2,4.7,5.8,7.7),look=beat(t,11.15,12.65,13.8,16);
 const listenWeight=beat(t,3.05,4.25,5.6,7.4),lookWeight=beat(t,11,12.3,13.65,15.7);
 const tidy=beat(t,20,21.2,23.5,25.3),nod=beat(t,29.8,30.8,32.4,34.5);
 Object.assign(p,actingRest,{
  // Listening leans toward the visitor; looking away turns head and chest,
  // then returns to an actual quiet hold before the next thought.
  lean:-.8*listenWeight+.65*lookWeight-.45*tidy,shift:-2.1*listenWeight+1.5*lookWeight,
  lift:1.3*listen+2.1*tidy,head:-3.8*listen+3.4*look+1.5*nod,
  headX:-.5*listen+.7*look,headY:1.1*nod,
  chest:-1.05*listenWeight+.85*lookWeight,headTurn:look*.65-listen*.2,headPitch:.5*nod+.55*tidy,
  knee:1.6*tidy,shoulderRight:1.8*tidy,shoulderLeft:-.5*tidy,
  rightUpper:p.rightUpper-2.8*listen,leftUpper:p.leftUpper+2.2*listen,
  leftFore:p.leftFore-3*listen,smile:.2+.62*listen+.38*nod,
  bodySquash:p.bodySquash*.65,
  tail:1.4*beat(t,4.1,5.6,6.4,8.4)-1.05*beat(t,12.2,13.8,14.6,17),
  ahoge:-1.6*beat(t,3.85,5.1,6.15,8.1)+1.3*beat(t,11.8,13.4,14.6,16.8)
 });
 return p;
}

export function travelActing(p,seconds){
 const t=((seconds%48)+48)%48;
 const map=beat(t,3.8,6,15.6,19),scope=beat(t,28.3,30.8,38.5,41.5);
 const mapPrepare=beat(t,.35,1.25,1.8,3.1),brace=beat(t,27.3,28.5,29,30.2);
 const scan=travelStudyScan(t-.16),search=travelHorizonScan(t-.12);
 const eyes=travelStudyScan(t+.18),check=beat(t,12.9,13.5,13.8,14.65);
 const land=beat(t,40.6,41.5,41.65,42.65);
 Object.assign(p,actingRest,{
  // Upper body moves around the hips, so the map, hands and head share its
  // space. The telescope's existing exact hand/eyeline path is retained.
  chest:map*(1.15+scan*.5)+scope*(-1.1+search*.45)+.35*mapPrepare,
  lean:map*scan*.72+scope*(-.75+search*.35)+.22*brace,
  shift:map*scan*2.3+scope*(-1.9+search*1.25)+.8*mapPrepare+.7*brace,
  head:p.head+map*eyes*.8+check*.65,
  headTurn:map*eyes*.9+scope*search*.5,
  headPitch:map*(1.65+check*.4)-.2*scope,headY:p.headY+map*1.45+check*.45,
  bodySquash:p.bodySquash-.0018*breathAt(t,8)*(1-Math.max(mapPrepare,brace)),
  knee:1.5*beat(t,.2,1.2,1.6,2.8)+2*beat(t,24,25,25.6,27)+.85*land,
  shoulderRight:map*.75+scope*1.5+.5*brace,shoulderLeft:map*.8,
  tail:-scope*1.5+map*scan*.55,
  smile:.28+map*.22+scope*.3+check*.16,
  ahoge:p.ahoge+.65*beat(t,41,41.9,42.1,43.2)
 });
 return p;
}

export function communityActing(p,seconds){
 const t=((seconds%32)+32)%32,open=beat(t,3.7,5.6,24.4,27);
 const reading=actingTrack(t,[[0,0],[7,0],[8.8,.65],[10.8,.65],[12.5,-.55],[14.3,-.55],[16,0],[19.5,0],[20.5,.3],[21.5,.3],[23,0],[32,0]]);
 const present=beat(t,16.4,17.65,18.4,19.65);
 const gather=beat(t,.25,1.1,1.4,2.65),closing=beat(t,25.8,26.6,27.4,28.7);
 const anticipate=beat(t,2.4,3.15,3.45,4.8),recognize=beat(t,6.5,7.1,7.3,8.2);
 const closeLook=beat(t,25.2,26.2,27,28.6),release=beat(t,28.3,29.2,29.4,30.7);
 Object.assign(p,actingRest,{
  chest:open*(1.3+reading*.42)-present*.65+.3*closing,
  lean:p.lean+open*.32+reading*.26-present*.5,
  shift:p.shift+open*1.2+reading*.9,
  head:p.head+reading*1.4-present*2.5+anticipate*.9+recognize*.8-closeLook*.9,
  headPitch:open*.9-present*.5+.25*closing+anticipate*.4,headTurn:reading*.5,
  headY:p.headY-present*1.4+recognize*.65-closeLook*.5,
  knee:1.3*gather,bodySquash:p.bodySquash-.0015*breathAt(t,8)*(1-gather),
  // Acknowledge the visitor briefly, then return to reading. No typing or
  // free-hand sweep through the laptop is introduced.
  focus:p.focus*(1-present),smile:present*.55,
  shoulderLeft:open*.65+.3*gather+.4*anticipate-.25*release,shoulderRight:-.5*open,
  ahoge:p.ahoge+.6*beat(t,28.9,29.7,29.9,31),
  tail:1.05*beat(t,4.05,5.5,6.6,8.1)-.75*beat(t,17.1,18.1,18.65,20.1)
 });
 return p;
}
