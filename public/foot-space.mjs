// Both the shoe artwork and its adjoining calf use the same planted toe.
export function footSpace(p,side){
 const x=side==='left'?455:493,y=944;
 const degrees=side==='left'?(p.leftHeel||0):-(p.rightHeel||0);
 const angle=degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 return {transform:`rotate(${degrees} ${x} ${y})`,point(px,py){
  return {x:x+(px-x)*c-(py-y)*s,y:y+(px-x)*s+(py-y)*c};
 }};
}

export function calfPath(body,foot,x1,x2){
 const a=body.point(x1,791),b=body.point(x2,791);
 // Meet the rotated raster sock inside its opaque area. Match its tangent
 // near the cuff so the old fixed calf cannot protrude beside the sock.
 const inner=foot.point(x2+3,864),outer=foot.point(x1-3,864);
 const innerGuide=foot.point(x2,834),outerGuide=foot.point(x1,834);
 return `M${a.x} ${a.y}L${b.x} ${b.y}Q${innerGuide.x} ${innerGuide.y} ${inner.x} ${inner.y}L${outer.x} ${outer.y}Q${outerGuide.x} ${outerGuide.y} ${a.x} ${a.y}Z`;
}
