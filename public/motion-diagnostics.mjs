// Opt-in local playback meter. It measures completed scene renders, not curve samples.
const enabled=typeof location!=='undefined'&&new URLSearchParams(location.search).get('motionDebug')==='1';
let panel,scene='',last=0,painted=0;
const intervals=[],costs=[];
export function beginMotionFrame(){return enabled?performance.now():0;}
export function endMotionFrame(name,now,started){
 if(!enabled)return;
 if(scene!==name||now-last>250){scene=name;intervals.length=0;costs.length=0;last=0;}
 if(last)intervals.push(now-last);
 last=now;costs.push(performance.now()-started);
 if(intervals.length>180)intervals.shift();if(costs.length>180)costs.shift();
 if(now-painted<500)return;painted=now;
 if(!panel){
  panel=document.createElement('output');panel.id='motion-diagnostics';panel.setAttribute('aria-label','动画播放性能');
  panel.style.cssText='position:fixed;bottom:12px;right:12px;z-index:10000;padding:10px 14px;background:#102923ee;color:#d7f9e7;border:1px solid #7ca792;border-radius:12px;font:12px/1.6 monospace;white-space:pre;pointer-events:none';
  document.body.append(panel);
 }
 const fps=intervals.length?1000*intervals.length/intervals.reduce((a,b)=>a+b,0):0;
 const sorted=[...intervals].sort((a,b)=>a-b),p95=sorted[Math.floor((sorted.length-1)*.95)]||0;
 panel.textContent=`${name} · ${fps.toFixed(1)} FPS\nP95 frame ${p95.toFixed(1)} ms · render ${(costs.reduce((a,b)=>a+b,0)/costs.length).toFixed(2)} ms\n${intervals.length} completed frame intervals`;
 panel.dataset.fps=fps.toFixed(2);panel.dataset.p95=p95.toFixed(2);panel.dataset.renderMs=(costs.reduce((a,b)=>a+b,0)/costs.length).toFixed(3);
}
