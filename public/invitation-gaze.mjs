// Both eyes share one bounded direction. The lids and face never move.
export function gazeTarget(pointer, box, reduced=false) {
  const cx=box.left+box.width*297/645;
  const cy=box.top+box.height*345/850;
  const range=reduced ? .55 : 1;
  const x=Math.tanh((pointer.x-cx)/Math.max(180,box.width*1.4));
  const y=Math.tanh((pointer.y-cy)/Math.max(160,box.height*.8));
  const length=Math.max(1,Math.hypot(x,y));
  return {x:x/length*6.4*range,y:y/length*3*range};
}

export function advanceGaze(current,target,seconds,returning=false) {
  const alpha=1-Math.exp(-Math.max(0,Math.min(.064,seconds))/(returning ? .32 : .12));
  const next={x:current.x+(target.x-current.x)*alpha,y:current.y+(target.y-current.y)*alpha};
  if(Math.hypot(next.x-target.x,next.y-target.y)<.008)return {...target};
  return next;
}

export function installInvitationGaze(svg) {
  if(!svg)return;
  const pupils=[...svg.querySelectorAll('[data-invitation-pupil]')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let pointer=null,current={x:0,y:0},target={x:0,y:0};
  let visible=false,frame=0,previous=0;
  const paint=()=>{
    const value=`translate(${current.x.toFixed(3)} ${current.y.toFixed(3)})`;
    for(const pupil of pupils)pupil.setAttribute('transform',value);
  };
  const tick=now=>{
    frame=0;
    current=advanceGaze(current,target,previous?(now-previous)/1000:1/60,!pointer);
    previous=now;paint();
    if(current.x!==target.x||current.y!==target.y)frame=requestAnimationFrame(tick);
    else previous=0;
  };
  const schedule=()=>{
    if(visible&&!document.hidden&&!frame){previous=0;frame=requestAnimationFrame(tick);}
  };
  const update=()=>{
    target=pointer?gazeTarget(pointer,svg.getBoundingClientRect(),reduced.matches):{x:0,y:0};
    schedule();
  };
  const center=()=>{pointer=null;update();};
  document.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse')return;
    pointer={x:event.clientX,y:event.clientY};
    if(visible)update();
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',center);
  document.addEventListener('pointercancel',center);
  window.addEventListener('blur',center);
  window.addEventListener('scroll',()=>{if(visible)update();},{passive:true});
  window.addEventListener('resize',update,{passive:true});
  reduced.addEventListener('change',update);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      pointer=null;cancelAnimationFrame(frame);frame=0;previous=0;
      current={x:0,y:0};target={x:0,y:0};paint();
    }
  });
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible)update();
    else {cancelAnimationFrame(frame);frame=0;previous=0;}
  }).observe(svg);
}
