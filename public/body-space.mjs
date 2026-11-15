// One transform for head, collar, sleeves and held props. Lower-leg contours
// meet the moving hem while the supporting shoes remain on the floor.
export function bodySpace(p,time=0,reduced=false){
 // Each action owns its breath. A second unrelated oscillator here made the
 // head/coat appear to float when a deliberate gesture was trying to settle.
 const squash=p.bodySquash||0;
 const sx=1+squash*.55,sy=1-squash,a=(p.lean||0)*Math.PI/180;
 const shear=Math.tan((p.chest||0)*Math.PI/180),knee=p.knee||0;
 const shift=p.shift||0,lift=(p.lift||0)+knee;
 return {
  transform:`translate(${shift} ${lift}) rotate(${p.lean||0} 474 814) translate(474 814) skewX(${p.chest||0}) scale(${sx} ${sy}) translate(-474 -814)`,
  point(x,y){const u=(x-474)*sx+(y-814)*sy*shear,v=(y-814)*sy;return {x:474+shift+u*Math.cos(a)-v*Math.sin(a),y:814+lift+u*Math.sin(a)+v*Math.cos(a)};}
 };
}
