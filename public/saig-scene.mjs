import {beginMotionFrame,endMotionFrame} from './motion-diagnostics.mjs?v=1';
import {getLocale,t} from './i18n.mjs?v=2';
import {saigCopy,registrationUrl} from './saig-copy.mjs?v=1';
import {createCommanderRenderer} from './saig-commander-motion.mjs?v=13';
import {createEchoRenderer,echoPerformance} from './saig-echo-motion.mjs?v=5';
import {arenaEntrance,arenaIdleTime} from './saig-entry-motion.mjs?v=6';

export function installSaigScene({onAsk,reducedMotion}){
 const stage=document.querySelector('.saig-arena');
 const teams=[],echoes=[],loading=[];let active=false,visible=false,last=0,time=0,ready=false;
 stage.dataset.entrance='loading';
 document.querySelector('[data-saig-ask]').addEventListener('click',onAsk);
 for(const team of ['blue','red']){
  const group=stage.querySelector(`.arena-team-${team}`);
  const echo=group.querySelector('.arena-echo');
  const summon=document.createElement('div');summon.className='arena-summon';summon.setAttribute('aria-hidden','true');summon.innerHTML='<i></i><b></b>';group.prepend(summon);
  loading.push(createEchoRenderer(echo,team).then(renderer=>{echoes.push({team,renderer,group,echo,summon});}).catch(()=>{echoes.push({team,renderer:null,group,echo,summon});}));
  const host=document.querySelector(`[data-arena-team="${team}"]`);
  loading.push(createCommanderRenderer(host,team).then(renderer=>{teams.push({team,renderer,host});}).catch(()=>{host.dataset.rendered='false';teams.push({team,renderer:null,host});}));
 }
 const updatePause=()=>stage.classList.toggle('arena-paused',!active||!visible||document.hidden||reducedMotion.matches||!!document.querySelector('dialog[open]'));
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updatePause();},{threshold:0}).observe(stage);
 document.addEventListener('visibilitychange',updatePause);
 reducedMotion.addEventListener('change',updatePause);
 new MutationObserver(updatePause).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 function paint(){
  const reduced=reducedMotion.matches,entry=arenaEntrance(time,reduced),idle=arenaIdleTime(time);
  stage.dataset.entrance=entry.phase;
  stage.style.setProperty('--entry-charge',String(entry.charge));
  for(const {renderer,host}of teams){
   const scale=host.clientHeight/1536;
   host.style.transform=`translate(${entry.travelX*scale}px,${entry.travelY*scale}px) scale(${entry.travelScale})`;
   host.style.opacity=String(entry.commanderOpacity);
   host.style.setProperty('--walk-shadow',String(1-entry.walk*.2));
   renderer?.render(reduced?4:idle,reduced,entry);
  }
  for(const {team,renderer,group,echo,summon}of echoes){
   renderer?.render(reduced?4:idle,entry.summon);
   const performance=echoPerformance(reduced?4:idle,team);
   group.querySelector('.arena-energy').style.opacity=String(performance.energy*entry.summon+entry.charge*.16);
   group.querySelector('.arena-floor').style.opacity=String(entry.pose);
   echo.style.opacity=String(entry.summon);
   echo.style.transform=`translateY(${entry.echoLift*echo.clientHeight/1536}px) scale(${entry.echoScale})`;
   echo.style.setProperty('--summon-light',String(1+entry.charge*.18));
   summon.style.opacity=String(entry.ring);summon.style.setProperty('--summon-progress',String(entry.summon));
  }
 }
 Promise.allSettled(loading).then(()=>{ready=true;time=0;paint();});
 function tick(now){
  requestAnimationFrame(tick);const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
  if(!ready||!active||!visible||document.hidden||document.querySelector('dialog[open]'))return;
  const renderStarted=beginMotionFrame();
  if(!reducedMotion.matches)time+=dt;
  paint();
  endMotionFrame('saig',now,renderStarted);
 }
 requestAnimationFrame(tick);
 return {sync(mode){
  if(mode==='saig'&&!active){time=0;if(ready)paint();}
  active=mode==='saig';updatePause();
  const locale=getLocale(),copy=saigCopy(locale);
  document.querySelectorAll('[data-saig-copy]').forEach(node=>node.textContent=copy[node.dataset.saigCopy]);
  const resume=document.querySelector('[data-saig-resume]');if(resume)resume.textContent=t('继续之前的对话');
  document.querySelector('.arena-join').href=registrationUrl;
  document.querySelector('[data-arena-description]').setAttribute('aria-label',`${copy.blue}: ${copy.duo}. VS. ${copy.red}: ${copy.duo}.`);
  document.querySelector('.saig-brief').dir=locale==='ar'?'rtl':'ltr';
 }};
}
