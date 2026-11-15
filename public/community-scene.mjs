import {beginMotionFrame,endMotionFrame} from './motion-diagnostics.mjs?v=1';
import {applyAttentionPose} from './mascot-attention.mjs';
import {getLocale,t} from '/i18n.mjs?v=2';
import {communityCopy} from '/community-copy.mjs?v=1';
import {communityPose,communityGreetingPose,advanceCommunityPose} from '/community-motion.mjs?v=13';
import {renderCommunityRig} from '/community-rig.mjs?v=15';
import {softIdlePose,easeIdleEntry,softRecoveryPose} from '/mascot-soft-motion.mjs?v=8';
import {greetingMotion,sampleGreeting} from '/mascot-motion.mjs?v=3';
import {companionShoulderOffset} from '/community-companion-motion.mjs?v=2';
import {installCommunityMinis} from '/community-minis.mjs?v=6';

export function installCommunityScene({onAsk,reducedMotion}){
 const pet=document.querySelector('#mascot-pet'),visual=pet.querySelector('.mascot-visual');
 const echoHand=document.querySelector('.community-echo-touch');
 const minis=installCommunityMinis(document.querySelector('.hero-mascot'));
 let rig,mode='',active=false,visible=false,time=0,actingTime=0,last=0,current;
 let greetState='',greetStart=0,greetFrames,idleState='',entryPose,idleStart=0,recoverUntil=0,recoverFrom,recoverStart=0;
 let transitionFrom,transitionStart=0,transitionDuration=.65;
 const velocity={};
 fetch('/assets/community-companions.svg?v=3').then(response=>{
  if(!response.ok)throw Error('Companion illustration unavailable');return response.text();
 }).then(text=>{
  const doc=new DOMParser().parseFromString(text,'image/svg+xml');
  if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')return;
  document.querySelector('.community-allies').append(document.importNode(doc.documentElement,true));
  minis.refresh();
 }).catch(()=>{});
 document.querySelector('[data-community-ask]').addEventListener('click',onAsk);
 fetch('/assets/jiangxiaotun-v5/community.svg?v=16').then(response=>{
  if(!response.ok)throw Error('Community illustration unavailable');return response.text();
 }).then(async text=>{
  const doc=new DOMParser().parseFromString(text,'image/svg+xml');
  if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Invalid community illustration');
  const svg=document.importNode(doc.documentElement,true);svg.classList.add('mascot-community');
  await Promise.all([...svg.querySelectorAll('image')].map(node=>new Promise(resolve=>{
   const image=new Image();image.onload=resolve;image.onerror=resolve;image.src=node.getAttribute('href');
  })));
  rig=Object.fromEntries([...svg.querySelectorAll('[data-community]')].map(node=>[node.dataset.community,node]));
  rig.rightHand.setAttribute('opacity','0');rig.leftHand.setAttribute('opacity','0');
  renderCommunityRig(rig,communityPose(0),0,true);
  visual.append(svg);pet.dataset.communityReady='true';
  minis.refresh();
 }).catch(()=>pet.dataset.communityReady='false');
 new IntersectionObserver(entries=>visible=entries[0].isIntersecting,{threshold:0}).observe(pet);
 function tick(now){
  requestAnimationFrame(tick);
  const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
  if(!rig||!active||!visible||document.hidden||document.querySelector('dialog[open]'))return;
  const renderStarted=beginMotionFrame();
  if(!reducedMotion.matches)time+=dt;
  const greeting=pet.dataset.greeting||'',idle=pet.dataset.idle||'';
  if(idle!==idleState){entryPose=current?{...current}:null;
   if(['bored','sleepy'].includes(idleState)&&!['bored','sleepy'].includes(idle)){recoverUntil=time+1.1;recoverStart=time;recoverFrom=current?{...current}:null;}
   idleStart=time;idleState=idle;
  }
  const recovering=time<recoverUntil,resting=['bored','sleepy','returning'].includes(idle)||recovering;
  if(!reducedMotion.matches&&!greeting&&!resting)actingTime+=dt;
  const p=communityPose(reducedMotion.matches?8:actingTime);
  if(greeting!==greetState){
   if(['waving','welcome'].includes(greeting)||!greeting){transitionFrom=current?{...current}:null;transitionStart=time;transitionDuration=greeting?.65:.9;}
   if(['waving','welcome'].includes(greeting)){greetStart=time;greetFrames=greetingMotion(greeting==='welcome'?'welcome':'wave');}
   greetState=greeting;
  }
  if(greeting&&greetFrames){
   const frame=sampleGreeting(greetFrames,time-greetStart);
   communityGreetingPose(p,frame,greeting,time-greetStart);
  }else if(resting){
   if(idle==='returning'||recovering)softRecoveryPose(p,recoverFrom,time-recoverStart);
   else{
    softIdlePose(p,idle,time-idleStart);p.focus=0;
   }
  }
  if(!greeting&&['bored','sleepy'].includes(idle))easeIdleEntry(p,entryPose,time-idleStart);
  if(transitionFrom)easeIdleEntry(p,transitionFrom,time-transitionStart,transitionDuration,.2);
  applyAttentionPose(p,pet,now,reducedMotion.matches);
  if(!current)current={...p};
  advanceCommunityPose(current,p,velocity,dt,reducedMotion.matches);
  renderCommunityRig(rig,current,time,reducedMotion.matches);
  const shoulder=companionShoulderOffset(current,time,reducedMotion.matches),scale=visual.clientHeight/850;
  echoHand.style.translate=`${shoulder.x*scale}px ${shoulder.y*scale}px`;
  endMotionFrame('community',now,renderStarted);
 }
 requestAnimationFrame(tick);
 return {sync(nextMode){
  mode=nextMode;active=mode==='community';
  minis.sync(active);
  const copy=communityCopy(getLocale());
  document.querySelectorAll('[data-community-copy]').forEach(node=>node.textContent=copy[node.dataset.communityCopy]);
  const photos=document.querySelectorAll('.community-site img');photos[0].alt=copy.photo;photos[1].alt=copy.concept;
  if(!active)return;
  document.querySelector('#hero-description').textContent=copy.description;
  const overline=document.querySelector('.hero-overline');overline.replaceChildren(document.createElement('span'),document.createTextNode(' '+copy.badge));
  const caption=document.querySelector('.mascot-caption');caption.replaceChildren(document.createElement('i'),document.createTextNode(` ${t('江小豚')} · AI × SPU`));
 }};
}
