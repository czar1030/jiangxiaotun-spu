import {restingSoftPose,softGreetingPose,softIdlePose,advanceSoftPose} from './mascot-soft-motion.mjs?v=8';
import {travelPose,travelArms} from './travel-motion.mjs?v=8';
import {communityPose} from './community-motion.mjs?v=13';
import {greetingMotion,sampleGreeting} from './mascot-motion.mjs?v=3';
import {renderSoftRig} from './mascot-soft-rig.mjs?v=11';
import {renderCommunityRig} from './community-rig.mjs?v=15';
import {createCommanderRenderer} from './saig-commander-motion.mjs?v=13';
import {arenaEntrance,arenaIdleTime} from './saig-entry-motion.mjs?v=6';
const rigs=[],teams=[],clips={wave:greetingMotion('wave'),welcome:greetingMotion('welcome')};
const action=document.querySelector('#action'),slider=document.querySelector('#time'),play=document.querySelector('#play'),speed=document.querySelector('#speed');
let seconds=0,last=0,playing=true;
const makePose=(name,time)=>{if(name==='reception')return restingSoftPose(time);if(name==='community')return communityPose(time);const p=travelPose(time);return {...p,...travelArms(p)};};
await Promise.all(['reception','travel','community'].map(async name=>{
 const type=name==='reception'?'soft':name,text=await (await fetch(`/assets/jiangxiaotun-v5/${name}.svg?v=acting1`)).text();
 const svg=new DOMParser().parseFromString(text,'image/svg+xml').documentElement;
 const imported=document.importNode(svg,true);document.querySelector('#'+name).append(imported);
 rigs.push({name,rig:Object.fromEntries([...imported.querySelectorAll(`[data-${type}]`)].map(n=>[n.getAttribute('data-'+type),n])),pose:makePose(name,0),velocity:{}});
}));
await Promise.all(['blue','red'].map(async name=>teams.push(await createCommanderRenderer(document.querySelector('#'+name),name))));
function draw(dt=1/60,exact=false){
 const time=seconds,kind=action.value;
 for(const item of rigs){
  let p=makePose(item.name,time);
  if(clips[kind]){
   const t=Math.min(time,clips[kind].duration/1000);softGreetingPose(p,sampleGreeting(clips[kind],t),kind==='wave'?'waving':'welcome',t);
  }else if(kind!=='normal')softIdlePose(p,kind,time);
  if(exact){item.pose={...p};item.velocity={};}else advanceSoftPose(item.pose,p,item.velocity,dt);
  (item.name==='community'?renderCommunityRig:renderSoftRig)(item.rig,item.pose,time);
 }
 for(const renderer of teams)renderer?.render(arenaIdleTime(time),false,arenaEntrance(time));
 slider.value=String(time);document.querySelector('#readout').textContent=`${time.toFixed(2)} s`;
}
play.addEventListener('click',()=>{playing=!playing;play.textContent=playing?'暂停':'播放';});
document.querySelector('#restart').addEventListener('click',()=>{seconds=0;draw(0,true);});
action.addEventListener('change',()=>{seconds=0;draw(0,true);});
slider.addEventListener('input',()=>{seconds=Number(slider.value);playing=false;play.textContent='播放';draw(0,true);});
document.querySelector('#seek').addEventListener('input',event=>{seconds=Math.max(0,Math.min(48,Number(event.target.value)||0));playing=false;play.textContent='播放';draw(0,true);});
function tick(now){const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;if(playing&&!document.hidden){seconds=(seconds+dt*Number(speed.value))%48;draw(dt);}requestAnimationFrame(tick);}
draw(0,true);requestAnimationFrame(tick);
