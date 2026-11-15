import {beginMotionFrame,endMotionFrame} from './motion-diagnostics.mjs?v=1';
import {restingSoftPose,softGreetingPose,softIdlePose,softRecoveryPose,easeIdleEntry,advanceSoftPose} from './mascot-soft-motion.mjs?v=8';
import {renderSoftRig} from './mascot-soft-rig.mjs?v=11';
import {greetingMotion,sampleGreeting} from './mascot-motion.mjs?v=3';
import {applyAttentionPose} from './mascot-attention.mjs';

// Input and inactivity timers remain owned by mascot-greeting, across all scenes.
export function installSoftScene({reducedMotion}){
 const pet=document.querySelector('#mascot-pet'),visual=pet.querySelector('.mascot-visual');
 let rig,active=false,visible=false,time=0,last=0,current,greetState='',greetStart=0,greetFrames,idleState='',entryPose,idleStart=0,recoverUntil=0,recoverStart=0,recoverFrom;
 let transitionFrom,transitionStart=0,transitionDuration=.65;
 const velocity={};
 fetch('/assets/jiangxiaotun-v5/reception.svg?v=12').then(response=>{
  if(!response.ok)throw Error('Reception illustration unavailable');return response.text();
 }).then(async text=>{
  const doc=new DOMParser().parseFromString(text,'image/svg+xml');
  if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Invalid reception illustration');
  const svg=document.importNode(doc.documentElement,true);svg.classList.add('mascot-soft');
  await Promise.all([...svg.querySelectorAll('image')].map(node=>new Promise(resolve=>{
   const image=new Image();image.onload=resolve;image.onerror=resolve;image.src=node.getAttribute('href');
  })));
  rig=Object.fromEntries([...svg.querySelectorAll('[data-soft]')].map(node=>[node.dataset.soft,node]));
  renderSoftRig(rig,restingSoftPose(),0,true);visual.append(svg);pet.dataset.softReady='true';
 }).catch(()=>pet.dataset.softReady='false');
 new IntersectionObserver(entries=>visible=entries[0].isIntersecting,{threshold:0}).observe(pet);
 function tick(now){
  requestAnimationFrame(tick);
  const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
  if(!rig||!active||!visible||document.hidden||document.querySelector('dialog[open]'))return;
  const renderStarted=beginMotionFrame();
  if(!reducedMotion.matches)time+=dt;
  const greeting=pet.dataset.greeting||'',idle=pet.dataset.idle||'';
  if(greeting!==greetState){
   if(['waving','welcome'].includes(greeting)||!greeting){transitionFrom=current?{...current}:null;transitionStart=time;transitionDuration=greeting?.65:.9;}
   if(['waving','welcome'].includes(greeting)){greetStart=time;greetFrames=greetingMotion(greeting==='welcome'?'welcome':'wave');}
   greetState=greeting;
  }
  if(idle!==idleState){
   if(['bored','sleepy'].includes(idleState)&&!['bored','sleepy'].includes(idle)){recoverUntil=time+1.1;recoverStart=time;recoverFrom=current?{...current}:null;}
   entryPose=current?{...current}:null;idleStart=time;idleState=idle;}
  const p=restingSoftPose(reducedMotion.matches?0:time);
  if(greeting&&greetFrames){
   const elapsed=Math.max(0,time-greetStart),frame=sampleGreeting(greetFrames,elapsed);
   softGreetingPose(p,frame,greeting,elapsed);
  }else if(idle==='returning'||time<recoverUntil)softRecoveryPose(p,recoverFrom,time-recoverStart);
  else if(idle)softIdlePose(p,idle,time-idleStart);
  if(!greeting&&['bored','sleepy'].includes(idle))easeIdleEntry(p,entryPose,time-idleStart);
  if(transitionFrom)easeIdleEntry(p,transitionFrom,time-transitionStart,transitionDuration,.2);
  applyAttentionPose(p,pet,now,reducedMotion.matches);
  if(!current)current={...p};
  advanceSoftPose(current,p,velocity,dt,reducedMotion.matches);
  renderSoftRig(rig,current,time,reducedMotion.matches);
  endMotionFrame('wuhan',now,renderStarted);
 }
 requestAnimationFrame(tick);
 return {sync(mode){active=mode==='wuhan';}};
}
