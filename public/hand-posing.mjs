// All hands are authored from the wrist outward. A prop has its own contact
// point; rotating a palm must never rotate or detach the prop with it.
import {setRigAttribute as attr} from './rig-attributes.mjs?v=1';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v||0));
const mix=(a,b,t)=>a+(b-a)*t;
const wrap=a=>((a+180)%360+360)%360-180;
const rotate=(x,y,a)=>{a*=Math.PI/180;return {x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)};};

// Same perimeter order for every silhouette: wrist -> little finger -> index
// -> opposing thumb -> wrist. Morph one contour instead of stacking hands.
const shapes={
 relaxed:[[-7,-5],[-10,3],[-10,13],[-8,21],[-6,26],[-3,26],[-2,19],[0,28],[3,28],[4,19],[7,25],[10,24],[9,16],[12,20],[15,18],[12,9],[16,8],[15,4],[8,5],[7,-5]],
 open:[[-7,-5],[-11,3],[-13,13],[-13,25],[-11,31],[-8,31],[-6,18],[-4,36],[-1,37],[1,18],[4,33],[8,33],[8,17],[12,28],[16,26],[13,10],[23,7],[24,3],[13,2],[7,-5]],
 grip:[[-7,-5],[-11,0],[-13,7],[-12,15],[-9,21],[-5,23],[-1,24],[3,24],[7,22],[10,19],[12,16],[13,12],[12,8],[11,4],[9,2],[8,0],[13,0],[15,-4],[9,-8],[7,-5]],
 pinch:[[-7,-5],[-10,1],[-10,8],[-8,15],[-5,19],[-2,20],[0,17],[2,21],[5,21],[6,16],[9,19],[12,18],[11,11],[15,12],[18,9],[14,4],[19,3],[18,-1],[10,0],[7,-5]],
 support:[[-7,-5],[-10,1],[-10,9],[-7,16],[-3,20],[1,21],[4,18],[7,20],[11,19],[12,15],[16,16],[19,13],[17,9],[22,9],[24,6],[18,2],[14,1],[12,-2],[9,-3],[7,-5]],
 fist:[[-7,-5],[-11,0],[-12,6],[-11,12],[-9,17],[-5,20],[-1,21],[3,21],[7,19],[10,16],[12,12],[12,8],[11,4],[10,1],[8,-1],[7,-2],[12,-2],[12,-6],[9,-8],[7,-5]],
};
const blend=(a,b,t)=>a.map((p,i)=>p.map((v,j)=>mix(v,b[i][j],t)));
const path=points=>{
 const p=i=>points[(i+points.length)%points.length],f=n=>n.toFixed(3);
 let d=`M${p(0).map(f).join(' ')}`;
 for(let i=0;i<points.length;i++){
  const a=p(i-1),b=p(i),c=p(i+1),e=p(i+2);
  // Tight curves keep fingers plump without overshooting their tips.
  d+=`C${b.map((v,j)=>f(v+(c[j]-a[j])*.12)).join(' ')} ${c.map((v,j)=>f(v-(e[j]-b[j])*.12)).join(' ')} ${c.map(f).join(' ')}`;
 }
 return d+'Z';
};

export function handPose(p,side,sleeve){
 const right=side==='right',mirror=right?1:-1;
 const {wrist,elbow}=sleeve;
 const axis=Math.atan2(-(wrist.x-elbow.x),wrist.y-elbow.y)*180/Math.PI;
 const lens=right?clamp(p.glass):0,scope=right?clamp(p.scope):0;
 const map=right?0:clamp(p.map),laptop=right?0:clamp(p.laptop);
 const chin=right?clamp(p.chin):0,rub=right?clamp(p.rub):0;
 const wave=right?clamp(p.waveHand):0;
 const authored=clamp(p[side+'Authored']);
 let desired=p[side+'PalmAngle']||0;
 // Earlier welcome palms faced back into the forearm, nearly 180° from it.
 if(Math.abs(wrap(desired-axis))>90)desired+=180;
 const authoredBend=clamp(wrap(desired-axis),-24,24);
 const freeBend=clamp((right?p.hand:-p.leftHand)||0,-16,16);
 const occupied=Math.max(lens,scope,map,laptop,chin,rub);
 const bend=mix(freeBend,authoredBend,authored)*(1-occupied)+
  lens*clamp(wrap((p.glassAngle||0)-axis)*.18,-14,14)+map*8+laptop*14+chin*4+rub*3;
 const angle=axis+clamp(bend,-26,26);
 let outline=blend(shapes.relaxed,shapes.open,Math.max(wave,clamp(p.happy)*.8)*(1-occupied));
 outline=blend(outline,shapes.grip,Math.max(lens,scope));
 outline=blend(outline,shapes.pinch,map);
 outline=blend(outline,shapes.support,laptop);
 outline=blend(outline,shapes.fist,Math.max(chin,rub));
 const curl=clamp(p.palmCurl)*wave*(1-occupied);
 outline=outline.map(([x,y],i)=>[x,y-(i>3&&i<15?curl*4:0)]);
 const local={x:0,y:12},offset=rotate(local.x*mirror,local.y,angle);
 const contact={x:wrist.x+offset.x,y:wrist.y+offset.y};
 let detail='M-5 13L-4 20M1 14L2 21M7 12L8 17M10 6L12 7';
 let nails='';
 if(Math.max(lens,scope,chin,rub)>.5){
  // The knuckles face the viewer; the thumb opposes the curled fingers.
  detail='M-8 9Q-2 7 3 10M-8 14Q-2 12 4 15M-5 19Q0 17 5 19M9 2Q3-1-1 3Q-3 7 2 8L8 8';
  nails='M2 3Q5 1 8 3M-7 11L-4 10M-7 16L-4 15';
 }else if(map>.5){
  detail='M-7 8L-1 10M-5 13L2 15M2 17L7 18M10 2Q13 0 16 2';
  nails='M12 6L15 7M-3 8L0 9';
 }else if(laptop>.5){
  detail='M-4 12Q4 17 13 12M4 17L9 16M13 11L17 9M11 3L16 4';
  nails='M15 6L18 6';
 }else if(wave>.5||p.happy>.6){
  detail='M-7 10Q0 5 8 10M-5 16Q0 12 6 15M13 5Q9 8 9 13';
 }
 return {axis,angle,bend:wrap(angle-axis),mirror,wrist,contact,outline:path(outline),detail,nails,
  mode:rub>.5?'rub':chin>.5?'chin':laptop>.5?'support':map>.5?'pinch':Math.max(lens,scope)>.5?'grip':wave>.5?'wave':'relaxed'};
}

export function renderHand(rig,side,hand){
 if(!rig[side+'HandModel'])return;
 for(const kind of ['Open','Grip','Relaxed','Rub','Wave'])attr(rig[side+kind],'opacity','0');
 attr(rig[side+'Palm'],'transform',`translate(${hand.wrist.x} ${hand.wrist.y}) rotate(${hand.angle}) scale(${hand.mirror} 1)`);
 attr(rig[side+'HandShape'],'d',hand.outline);
 attr(rig[side+'HandCreases'],'d',hand.detail);
 attr(rig[side+'HandNails'],'d',hand.nails);
}
