// One acting controller owns greetings, idle poses and their interruptions.
import {t,getLocale} from '/i18n.mjs?v=2';
import {IdleTimeline} from '/mascot-idle-policy.mjs?v=2';
import {idleLine} from '/mascot-idle-lines.mjs?v=1';
import {greetingMotion,restingPose,opacityParts} from '/mascot-motion.mjs?v=3';

const rest={shoulder:0,elbow:0,wrist:0,head:0,body:0,tail:0,bored:0,blink:0};
const chinRest={...rest,shoulder:10,elbow:170,wrist:-10,head:-7,body:-.35,tail:-2,bored:1};

export function installMascotGreeting({pet,portrait,bubble,reducedMotion}){
 if(!pet||!portrait||!bubble)return;
 const visual=pet.querySelector('.mascot-visual');
 const timeline=new IdleTimeline(performance.now());
 let greeting,idle,inside=false,focused=false,visible=false,playing=false;
 let request=0,greetingCycle=0,idleCycle=0,idleReturn=null,lastIdle='curious';
 let releaseTimer,hoverTimer,lastPointerActivity=0;

 async function loadRig(asset,cssClass){
  const response=await fetch(asset);
  if(!response.ok)throw new Error('Character animation unavailable');
  const doc=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
  if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw new Error('Invalid character animation');
  const svg=document.importNode(doc.documentElement,true);svg.classList.add(cssClass);
  await Promise.all([...svg.querySelectorAll('image')].map(node=>new Promise(resolve=>{
   const image=new Image();image.onload=resolve;image.onerror=resolve;image.src=node.getAttribute('href');
  })));
  const rig={svg,parts:Object.fromEntries([...svg.querySelectorAll('[data-rig]')].map(node=>[node.dataset.rig,node])),animations:[]};
  visual.append(svg);return rig;
 }
 const greetingReady=loadRig('/assets/jiangxiaotun-v5/greeting.svg?v=2','mascot-greeting')
  .then(rig=>{greeting=rig;pet.dataset.greetingReady='true';return true;})
  .catch(()=>{pet.dataset.greetingReady='false';return false;});
 const idleReady=loadRig('/assets/jiangxiaotun-v5/idle.svg?v=1','mascot-idle')
  .then(rig=>{idle=rig;pet.dataset.idleReady='true';return true;})
  .catch(()=>{pet.dataset.idleReady='false';return false;});

 function cancel(rig){if(rig){rig.animations.forEach(animation=>animation.cancel());rig.animations=[];}}
 function clear(rig){
  if(!rig)return;
  for(const [name,node]of Object.entries(rig.parts)){
   node.style.removeProperty('transform');
   if(name==='bored'||opacityParts.includes(name))node.style.opacity=String(restingPose[name]??0);
  }
 }
 function bubbleContent(){
  const idlePose=pet.dataset.idle,isGreeting=!!pet.dataset.greeting;
  const line=idlePose?idleLine(getLocale(),idlePose==='returning'?lastIdle:idlePose):!isGreeting&&pet.dataset.storyLine?pet.dataset.storyLine:t(pet.dataset.greeting?.startsWith('welcome')?'你好呀，欢迎来武汉！':'你好，武汉。');
  bubble.replaceChildren();bubble.append(document.createElement('i'),document.createTextNode(' '+line));
  const caption=document.createElement('span');caption.textContent=idlePose?'TAKE YOUR TIME':isGreeting?'SO NICE TO SEE YOU':pet.dataset.storyLine?'AT YOUR PACE':'NICE TO MEET YOU';bubble.append(caption);
  if(idlePose)pet.setAttribute('aria-label',line);
 }
 document.addEventListener('reception-language-change',bubbleContent);
 document.addEventListener('wuhan-story-presence',bubbleContent);
 bubbleContent();

 // Read the visible joint positions before cancelling an interrupted motion.
 function moveTo(rig,target,ms){
  const current=Object.fromEntries(Object.entries(target).map(([name])=>{
   const node=rig.parts[name],property=['bored','blink','smile'].includes(name)?'opacity':'transform';
   return [name,{node,property,value:getComputedStyle(node)[property]}];
  }));
  cancel(rig);
  for(const [name,value]of Object.entries(target)){
   const {node,property,value:from}=current[name],to=property==='opacity'?String(value):`rotate(${value}deg)`;
   node.style[property]=to;
   if(ms&&!reducedMotion.matches){
    // Chin support is a sequence: arm lifts, wrist settles, then cheek meets palm.
    const stagger=target.bored===1&&ms>1500?({shoulder:[.02,.75],elbow:[.07,.86],wrist:[.12,.89],head:[.32,1],bored:[.50,1],body:[0,.95],tail:[.10,1],blink:[0,1]}[name]):[0,1];
    rig.animations.push(node.animate([{[property]:from,offset:0},{[property]:from,offset:stagger[0]},{[property]:to,offset:stagger[1]},{[property]:to,offset:1}],{duration:ms,easing:'cubic-bezier(.45,0,.25,1)'}));
   }
  }
  return Promise.allSettled(rig.animations.map(animation=>animation.finished));
 }
 function stopIdle(immediate=false){
  if(!pet.dataset.idle)return Promise.resolve();
  if(idleReturn&&!immediate)return idleReturn;
  const cycle=++idleCycle;
  if(immediate){cancel(idle);clear(idle);delete pet.dataset.idle;idleReturn=null;bubbleContent();return Promise.resolve();}
  pet.dataset.idle='returning';
  const returning=moveTo(idle,rest,650).then(()=>{
   if(cycle!==idleCycle)return;
   delete pet.dataset.idle;cancel(idle);clear(idle);bubbleContent();pet.setAttribute('aria-label',t('和江小豚打个招呼'));
  }).finally(()=>{if(idleReturn===returning)idleReturn=null;});
  idleReturn=returning;return returning;
 }
 function resetActivity(event){
  const now=performance.now();if(event?.type==='pointermove'&&now-lastPointerActivity<180)return;
  lastPointerActivity=now;timeline.reset(now);if(pet.dataset.idle)stopIdle();
 }
 for(const type of ['pointermove','pointerdown','keydown','input','wheel','touchstart','scroll'])document.addEventListener(type,resetActivity,{passive:true,capture:true});
 function eligible(){
  return visible&&!document.hidden&&!reducedMotion.matches&&!playing&&!pet.dataset.greeting
   &&!pet.closest('[hidden],[inert]')&&!document.querySelector('dialog[open]');
 }
 function ambient(pose){
  const sleepy=pose==='sleepy',base=sleepy?2:-7;
  const add=(name,frames,options)=>idle.animations.push(idle.parts[name].animate(frames,options));
  add('head',[{transform:`rotate(${base}deg)`},{transform:`rotate(${base-(sleepy?1.4:.45)}deg)`},{transform:`rotate(${base}deg)`}],{duration:sleepy?6200:7200,iterations:Infinity,easing:'ease-in-out'});
  add('body',[{transform:'rotate(-.35deg)'},{transform:'rotate(-.05deg)'},{transform:'rotate(-.35deg)'}],{duration:7200,iterations:Infinity,easing:'ease-in-out'});
  add('tail',[{transform:'rotate(-2deg)'},{transform:'rotate(.4deg)'},{transform:'rotate(-2deg)'}],{duration:8100,iterations:Infinity,easing:'ease-in-out'});
  add('blink',[{opacity:0,offset:0},{opacity:0,offset:.36},{opacity:1,offset:.39},{opacity:1,offset:sleepy?.58:.405},{opacity:0,offset:sleepy?.63:.43},{opacity:0,offset:1}],{duration:sleepy?6700:8500,iterations:Infinity});
 }
 async function enterIdle(pose){
  if(!eligible()||pet.dataset.idle===pose||pet.dataset.idle==='returning')return;
  if(!await idleReady||!eligible())return;
  const cycle=++idleCycle;lastIdle=pose;pet.dataset.idle=pose;bubbleContent();
  if(pose==='curious'){
   clear(idle);cancel(idle);
   for(const [name,angles]of Object.entries({head:[0,2.4,-2.7,0],body:[0,.3,-.2,0],tail:[0,-3,1,0]}))
    idle.animations.push(idle.parts[name].animate(angles.map((angle,index)=>({transform:`rotate(${angle}deg)`,offset:index/3})),{duration:5200,easing:'ease-in-out'}));
   await Promise.allSettled(idle.animations.map(animation=>animation.finished));if(cycle===idleCycle)await stopIdle();
  }else{
   await moveTo(idle,pose==='sleepy'?{...rest,head:2,blink:1}:chinRest,pose==='sleepy'?2200:2700);
   if(cycle===idleCycle&&eligible())ambient(pose);
  }
 }
 function restoreGreeting(immediate=false){
  clearTimeout(releaseTimer);clearTimeout(hoverTimer);request++;greetingCycle++;playing=false;if(immediate)cancel(greeting);
  delete pet.dataset.greeting;bubbleContent();pet.setAttribute('aria-label',t('和江小豚打个招呼'));
  if(immediate)clear(greeting);else releaseTimer=setTimeout(()=>{cancel(greeting);clear(greeting);},180);
 }
 function visibleGreetingPose(){
  if(!pet.dataset.greeting)return {...restingPose};
  const pose={...restingPose};
  for(const [name,node]of Object.entries(greeting.parts)){
   const style=getComputedStyle(node);
   if(opacityParts.includes(name))pose[name]=Number(style.opacity);
   else{
    const matrix=new DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform);
    pose[name]=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
    if(name==='body')pose.lift=matrix.f;
   }
  }
  return pose;
 }
 async function greet(kind='wave'){
  if(kind==='wave'&&(playing||pet.dataset.greeting))return;
  if(kind==='welcome'&&playing&&pet.dataset.greeting==='welcome')return;
  timeline.reset(performance.now());clearTimeout(releaseTimer);const pending=++request;
  await stopIdle();
  if(!await greetingReady||pending!==request||document.hidden||(kind==='wave'&&!inside&&!focused))return;
  const initial=visibleGreetingPose();
  cancel(greeting);clear(greeting);const cycle=++greetingCycle;playing=true;pet.dataset.greeting=kind==='welcome'?'welcome':'waving';bubbleContent();
  pet.setAttribute('aria-label',t('江小豚正在微笑，挥右手向你打招呼'));
  if(reducedMotion.matches){
   if(kind==='welcome'){
    greeting.parts.welcome.style.opacity='1';greeting.parts.wave.style.opacity='0';greeting.parts.waveLegs.style.opacity='0';
   }
   greeting.parts.smile.style.opacity='1';
   for(const [part,angle]of Object.entries({shoulder:38,elbow:72,wrist:48}))greeting.parts[part].style.transform=`rotate(${angle}deg)`;
   playing=false;releaseTimer=setTimeout(()=>restoreGreeting(true),1800);return;
  }
  const {duration,frames}=greetingMotion(kind,initial),timing={duration,fill:'forwards',easing:'linear'};
  for(const [part,node]of Object.entries(greeting.parts)){
   const expression=opacityParts.includes(part);
   const keyframes=frames.map(frame=>expression?{opacity:frame[part],offset:frame.offset}:{transform:part==='body'?`translateY(${frame.lift}px) rotate(${frame.body}deg)`:`rotate(${frame[part]}deg)`,offset:frame.offset});
   greeting.animations.push(node.animate(keyframes,timing));
  }
  await Promise.allSettled(greeting.animations.map(animation=>animation.finished));if(cycle!==greetingCycle)return;
  playing=false;pet.dataset.greeting=kind==='welcome'?'welcome-smiling':'smiling';bubbleContent();pet.setAttribute('aria-label',t('江小豚正在微笑，再点一下可以打招呼'));
  // A stationary cursor must not prevent the one-minute idle performance.
  releaseTimer=setTimeout(()=>restoreGreeting(),inside||focused?1400:500);
 }
 visual.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){inside=true;resetActivity();clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>greet('wave'),160);}});
 visual.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch'){inside=false;clearTimeout(hoverTimer);timeline.reset(performance.now());if(!playing&&!focused)restoreGreeting(reducedMotion.matches);}});
 pet.addEventListener('focus',()=>{focused=pet.matches(':focus-visible');if(focused)greet('wave');});
 pet.addEventListener('blur',()=>{focused=false;timeline.reset(performance.now());if(!inside&&!playing)restoreGreeting(reducedMotion.matches);});
 pet.addEventListener('click',()=>{clearTimeout(hoverTimer);greet('welcome');});
 new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.15;if(!visible){timeline.reset(performance.now());stopIdle(true);}
 },{threshold:[0,.15]}).observe(pet);
 setInterval(()=>{
  if(!eligible()){
   if(!visible||document.hidden||reducedMotion.matches||pet.closest('[hidden],[inert]')||document.querySelector('dialog[open]')){timeline.reset(performance.now());if(pet.dataset.idle&&pet.dataset.idle!=='returning')stopIdle(true);}
   return;
  }
  const pose=timeline.next(performance.now());if(pose)enterIdle(pose);
 },1000);
 reducedMotion.addEventListener('change',()=>{stopIdle(true);restoreGreeting(true);if(inside||focused)greet('wave');});
 document.addEventListener('visibilitychange',()=>{timeline.reset(performance.now());if(document.hidden){inside=false;focused=false;stopIdle(true);restoreGreeting(true);}});
 window.addEventListener('pagehide',()=>{stopIdle(true);restoreGreeting(true);});
}
