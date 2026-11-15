// A single deforming fabric contour, rather than two rigid arm cutouts.
// The existing wrist targets still anchor hands and props exactly.
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const mul=(a,k)=>({x:a.x*k,y:a.y*k});
const unit=a=>mul(a,1/Math.max(.0001,Math.hypot(a.x,a.y)));
const point=p=>`${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
function curve(points,move=true){
 let d=move?'M'+point(points[0]):'';
 for(let i=0;i<points.length-1;i++){
  const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],e=points[Math.min(points.length-1,i+2)];
  d+=`C${point(add(b,mul(sub(c,a),1/6)))} ${point(sub(c,mul(sub(e,b),1/6)))} ${point(c)}`;
 }
 return d;
}
const sleeveCache=new WeakMap();
export function softSleeve(p,side){
 const authored=Math.max(0,Math.min(1,p[side+'Authored']||0));
 const flex=p[side+'Fabric']||0,rise=p[side==='right'?'shoulderRight':'shoulderLeft']||0,key=[p[side+'Upper'],p[side+'Fore'],flex,rise,authored,p[side+'ElbowX'],p[side+'ElbowY'],p[side+'TargetX'],p[side+'TargetY']].join(',');
 const cached=sleeveCache.get(p)||{};if(cached[side]?.key===key)return cached[side].value;
 const mirror=side==='right'?1:-1,a=p[side+'Upper']*Math.PI/180,b=(p[side+'Upper']+p[side+'Fore'])*Math.PI/180;
 const shoulder={x:side==='right'?398:542,y:556};
 const originalElbow=add(shoulder,{x:-mirror*83*Math.sin(a),y:83*Math.cos(a)});
 const originalWrist=add(originalElbow,{x:-mirror*83*Math.sin(b),y:83*Math.cos(b)});
 const targetElbow={x:p[side+'ElbowX']??originalElbow.x,y:p[side+'ElbowY']??originalElbow.y};
 const targetWrist={x:p[side+'TargetX']??originalWrist.x,y:p[side+'TargetY']??originalWrist.y};
 const blend=(a,b)=>add(mul(a,1-authored),mul(b,authored));
 const elbow=blend(originalElbow,targetElbow),wrist=blend(originalWrist,targetWrist);
 // Round the shoulder into a lifted sleeve instead of keeping a square cap.
 const bend=Math.abs(p[side+'Fore'])/180;
 const c1=add(add(shoulder,mul(sub(originalElbow,shoulder),.94)),{x:-mirror*rise*.65,y:-rise});
 const c2=add(originalWrist,mul(sub(originalElbow,originalWrist),.88+bend*.12));
 const cubic=(a,b,c,d,t)=>{const u=1-t;return add(add(mul(a,u*u*u),mul(b,3*u*u*t)),add(mul(c,3*u*t*t),mul(d,t*t*t)));};
 const derivative=(a,b,c,d,t)=>{const u=1-t;return add(add(mul(sub(b,a),3*u*u),mul(sub(c,b),6*u*t)),mul(sub(d,c),3*t*t));};
 const samples=[];
 for(let i=0;i<=24;i++){
  const t=i/24,u=1-t;
  let center=cubic(shoulder,c1,c2,originalWrist,t),direction=derivative(shoulder,c1,c2,originalWrist,t);
  if(authored){
   const mid=mul(sub(targetWrist,shoulder),.17),first=t<=.5,v=first?t*2:(t-.5)*2;
   const nodes=first?[shoulder,add(shoulder,mul(sub(targetElbow,shoulder),.44)),sub(targetElbow,mid),targetElbow]:
    [targetElbow,add(targetElbow,mid),sub(targetWrist,mul(sub(targetWrist,targetElbow),.45)),targetWrist];
   center=blend(center,cubic(...nodes,v));direction=blend(direction,mul(derivative(...nodes,v),2));
  }
  const tangent=unit(direction);
  const normal={x:-tangent.y,y:tangent.x};
  // A little fabric drag travels through the sleeve, with both anchors fixed.
  // Unlike rotating a cutout, this changes the silhouette between the joints.
  center=add(center,mul(normal,flex*Math.sin(Math.PI*t)**2));
  const width=25*(1-t)+15.8*t+6.5*Math.sin(Math.PI*t);
  samples.push({center,tangent,normal,left:add(center,mul(normal,width)),right:sub(center,mul(normal,width))});
 }
 const ribbon=(start,end,rounded=false)=>{
  const section=samples.slice(start,end+1),left=section.map(s=>s.left),right=section.map(s=>s.right).reverse();
  const tip=rounded?'Q'+point(add(samples[end].center,mul(samples[end].tangent,4)))+' '+point(right[0]):'L'+point(right[0]);
  return curve(left)+tip+curve(right,false)+'Z';
 };
 // The shoulder belongs to the garment, not to a flat-ended arm ribbon.
 // Bury both roots inside the bodice, beneath the collar, and round the
 // fabric over the shoulder. These roots stay covered even with raised arms.
 const joinedRibbon=end=>{
  const section=samples.slice(0,end+1);
  const outer=section.map(s=>mirror===1?s.left:s.right);
  const inner=section.map(s=>mirror===1?s.right:s.left).reverse();
  const top={x:shoulder.x+mirror*30,y:534},bottom={x:shoulder.x+mirror*30,y:600};
  const outerTangent=unit(sub(outer[1],outer[0]));
  const innerStart=inner.at(-1),innerTangent=unit(sub(inner.at(-2),innerStart));
  return `M${point(top)}C${point(add(top,{x:-mirror*24,y:-1}))} ${point(sub(outer[0],mul(outerTangent,14)))} ${point(outer[0])}`+
   curve(outer,false)+'L'+point(inner[0])+curve(inner,false)+
   `C${point(sub(innerStart,mul(innerTangent,10)))} ${point(add(bottom,{x:-mirror*12,y:-4}))} ${point(bottom)}Z`;
 };
 const front=samples.slice(13),tangent=samples[24].tangent;
 const cuffAngle=Math.atan2(-tangent.x,tangent.y)*180/Math.PI;
 const band=(start,end,inner,outer)=>{
  const section=samples.slice(start,end+1),edge=k=>section.map(s=>add(s.center,mul(s.normal,k*Math.hypot(s.left.x-s.center.x,s.left.y-s.center.y))));
  return curve(edge(inner))+'L'+point(edge(outer).at(-1))+curve(edge(outer).reverse(),false)+'Z';
 };
 const across=(index,inset=0)=>{const s=samples[index];return 'M'+point(add(s.left,mul(s.normal,-inset)))+'Q'+point(add(s.center,mul(tangent,1.3)))+' '+point(add(s.right,mul(s.normal,inset)));};
 // A small embroidered crane follows the actual sleeve surface. Coordinates
 // are length along the cloth and distance across it, so raised sleeves retain
 // the same weave direction and hands/prop anchors do not move.
 const stitchPoint=(length,across)=>{
  const index=length*24,lo=Math.floor(index),hi=Math.min(24,lo+1),u=index-lo;
  const a=samples[lo],b=samples[hi];
  const center=add(mul(a.center,1-u),mul(b.center,u));
  const normal=unit(add(mul(a.normal,1-u),mul(b.normal,u)));
  const width=Math.hypot(a.left.x-a.center.x,a.left.y-a.center.y);
  return point(add(center,mul(normal,across*width)));
 };
 const sp=stitchPoint;
 const embroidery=`M${sp(.68,0)}Q${sp(.63,-.5)} ${sp(.57,-.61)}Q${sp(.61,-.12)} ${sp(.69,.08)}`+
  `M${sp(.68,.08)}Q${sp(.60,.61)} ${sp(.56,.53)}Q${sp(.62,.13)} ${sp(.69,.02)}`+
  `M${sp(.70,.01)}Q${sp(.63,-.13)} ${sp(.62,.12)}Q${sp(.60,.36)} ${sp(.65,.31)}L${sp(.65,.48)}`+
  `M${sp(.70,-.04)}Q${sp(.74,-.16)} ${sp(.76,.09)}L${sp(.82,-.15)}M${sp(.75,.08)}L${sp(.80,.40)}`+
  `M${sp(.60,-.39)}L${sp(.67,-.08)}M${sp(.60,.40)}L${sp(.67,.14)}`;
 const value={shoulder,elbow,wrist,outline:joinedRibbon(24),cap:joinedRibbon(7),front:ribbon(13,24),cuff:ribbon(21,24,true),
  shade:band(7,24,-1,-.46),light:band(7,23,.35,.73),frontShade:band(13,24,-1,-.46),frontLight:band(13,23,.35,.73),
  cuffTrim:across(21,1)+across(24,1),cuffStitch:across(22,2),
  embroidery,cuffShade:band(21,24,-1,-.48),cuffFold:across(23,1),
  frontEdge:curve(front.map(s=>s.left))+curve(front.map(s=>s.right)),
  highlight:curve(samples.slice(3,19).map(s=>add(s.center,mul(s.normal,9)))),
  cuffTransform:`translate(${point(wrist)}) rotate(${cuffAngle.toFixed(3)})`,
  // Folds follow the curve; no dark ring or seam at the elbow.
  folds:[10,16].map(i=>{const s=samples[i];return `M${point(add(s.center,mul(s.normal,-14)))}Q${point(add(s.center,mul(s.normal,-4)))} ${point(add(samples[i+2].center,mul(samples[i+2].normal,-7)))}`;}).join('')};
 cached[side]={key,value};sleeveCache.set(p,cached);return value;
}
