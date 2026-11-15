import {renderSoftRig} from './mascot-soft-rig.mjs?v=11';
import {restingSoftPose,softGreetingPose,softIdlePose,advanceSoftPose} from './mascot-soft-motion.mjs?v=8';
import {greetingMotion,sampleGreeting} from './mascot-motion.mjs?v=3';

// The approved character itself, never the rejected procedural 3D approximation.
export function createPresenterAvatar(container,{reducedMotion,audioLevel=()=>null,onReady=()=>{},onError=()=>{}}={}){
  let rig,svg,mouth,current,state='greeting',emotion='happy',stateStart=performance.now(),greetingStart=-Infinity,cueStart=-Infinity,last=0,frame,disposed=false,opening=0;
  const faces={};
  const velocity={},wave=greetingMotion('wave'),abort=new AbortController();
  const fallback=container.querySelector('.presenter-fallback');if(fallback)fallback.hidden=false;
  fetch('/assets/jiangxiaotun-v5/reception.svg?v=12',{signal:abort.signal}).then(response=>{if(!response.ok)throw Error('Character unavailable');return response.text();}).then(async text=>{
    const doc=new DOMParser().parseFromString(text,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Character unavailable');
    svg=document.importNode(doc.documentElement,true);svg.classList.add('presenter-original-character');svg.setAttribute('role','img');svg.setAttribute('aria-label','定稿江小豚 · 荆楚风讲解形象');
    const ids=new Map([...svg.querySelectorAll('[id]')].map(node=>[node.id,'presenter-'+node.id]));
    for(const node of svg.querySelectorAll('*'))for(const attribute of [...node.attributes]){
      if(attribute.name==='id')node.id=ids.get(attribute.value);
      else if(!attribute.value.startsWith('data:')){let value=attribute.value.replace(/url\(#([^)]+)\)/g,(match,id)=>ids.has(id)?`url(#${ids.get(id)})`:match);if(value.startsWith('#')&&ids.has(value.slice(1)))value='#'+ids.get(value.slice(1));if(value!==attribute.value)node.setAttribute(attribute.name,value);}
    }
    await Promise.all([...svg.querySelectorAll('image')].map(node=>new Promise(resolve=>{const img=new Image();img.onload=resolve;img.onerror=resolve;img.src=node.getAttribute('href');})));
    if(disposed)return;
    rig=Object.fromEntries([...svg.querySelectorAll('[data-soft]')].map(node=>[node.dataset.soft,node]));
    for(const name of ['serious','concerned']){
      const face=document.createElementNS('http://www.w3.org/2000/svg','image');
      for(const [key,value]of Object.entries({x:175,y:110,width:645,height:425,opacity:0,href:`/assets/presenter/face-${name}.webp`}))face.setAttribute(key,String(value));
      rig.head.append(face);faces[name]=face;
    }
    mouth=document.createElementNS('http://www.w3.org/2000/svg','image');
    for(const [key,value]of Object.entries({x:453,y:492,width:32,height:28,opacity:0,'data-presenter-mouth':''}))mouth.setAttribute(key,String(value));
    rig.head.append(mouth);
    for(const name of ['small','open','round']){const img=new Image();img.src=`/assets/presenter/mouth-${name}.webp`;}
    current=restingSoftPose(0);renderSoftRig(rig,current,0,true);container.append(svg);if(fallback)fallback.hidden=true;onReady();
  }).catch(error=>{if(error.name!=='AbortError')onError();});
  function tick(now){
    if(disposed)return;frame=requestAnimationFrame(tick);
    const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
    if(!rig||document.hidden||!container.closest('dialog')?.open)return;
    const reduce=reducedMotion?.matches,t=reduce?0:now/1000,elapsed=(now-stateStart)/1000;
    const p=restingSoftPose(t);p.happy=0;p.smile=0;p.bored=0;p.sleepy=0;
    const greetingElapsed=(now-greetingStart)/1000;
    if(!reduce&&greetingElapsed<7.7&&['greeting','speaking','listening'].includes(state)){softGreetingPose(p,sampleGreeting(wave,greetingElapsed),'waving',greetingElapsed);p.happy=0;}
    else if(state==='thinking'){softIdlePose(p,'bored',Math.min(elapsed,3));p.bored=0;p.smile=0;p.head=-4;}
    else if(state==='speaking'){
      p.head=reduce?0:Math.sin(t*1.9)*1.2;p.headY=reduce?0:Math.sin(t*1.9)*.45;
      if(!reduce){const cueElapsed=(now-cueStart)/1000,phase=cueElapsed<3.6?cueElapsed:elapsed%10;
        const emphasis=phase>.7&&phase<3.6?Math.sin(Math.PI*(phase-.7)/2.9)**2:0;
        p.leftUpper+=emphasis*18;p.leftFore+=emphasis*12;p.leftHand+=emphasis*8;p.relaxLeft=1-emphasis*.8;p.chest=(p.chest||0)+emphasis*.25;}
      p.smile=0;
    }else if(state==='listening'){p.head=reduce?0:-2.2;p.headX=reduce?0:-.6;}
    if(state!=='thinking'){
      p.smile=emotion==='happy'?.7:0;
      if(emotion==='serious'){p.head*=.35;p.chest=.5;p.headPitch=.5;}
      if(emotion==='worried'){p.head-=2;p.headPitch=.7;p.chest=-.45;p.earLeft-=1.2;}
    }
    advanceSoftPose(current,p,velocity,dt,reduce);renderSoftRig(rig,current,t,reduce);
    const expression=state==='thinking'||emotion==='serious'?'serious':emotion==='worried'?'concerned':'neutral';
    svg.dataset.expression=expression;
    for(const [name,face]of Object.entries(faces))face.setAttribute('opacity',expression===name&&current.blink<=.38?'1':'0');
    const level=audioLevel(),target=state==='speaking'&&!reduce?(level??Math.abs(Math.sin(t*10.5)*Math.cos(t*4.1))):0;
    opening+=(target-opening)*Math.min(1,dt*24);
    mouth.setAttribute('opacity',opening>.2?'1':'0');
    if(opening>.2)mouth.setAttribute('href',`/assets/presenter/mouth-${opening>.75?'round':opening>.45?'open':'small'}.webp`);
  }
  frame=requestAnimationFrame(tick);
  return {cue(){cueStart=performance.now();},greet(){greetingStart=performance.now();},setState(next){if(next!==state){state=next;stateStart=performance.now();}if(next==='thinking'||next==='idle')greetingStart=-Infinity;},setEmotion(next){emotion=next;},setTopic(){greetingStart=cueStart=-Infinity;},dispose(){disposed=true;abort.abort();cancelAnimationFrame(frame);svg?.remove();}};
}
