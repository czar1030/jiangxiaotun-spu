import {beginMotionFrame,endMotionFrame} from './motion-diagnostics.mjs?v=1';
import {applyAttentionPose} from './mascot-attention.mjs';
import {renderSoftRig} from '/mascot-soft-rig.mjs?v=11';
import {softGreetingPose,softIdlePose,easeIdleEntry,softRecoveryPose,advanceSoftPose} from '/mascot-soft-motion.mjs?v=8';
import {getLocale,t} from '/i18n.mjs?v=4';
import {travelCopy,travelPlannerCopy,dayRanges,accommodationGroups} from '/travel-copy.mjs?v=5';
import {travelPose,sampledTravelPose,travelArms} from '/travel-motion.mjs?v=8';
import {greetingMotion,sampleGreeting} from '/mascot-motion.mjs?v=3';
import {chuCopy} from '/chu-scene-copy.mjs?v=1';

const areaEnglish=['Jianghan Road','Wuhan Tiandi / Huangpu Road','Hankou Station / Changqing Road','Wuguang / Zhongshan Park','Gutian / Garden Expo',
 'Yellow Crane Tower / Simenkou','Tanhualin / Pangxiejia','Chuhe Hanjie / Shuiguohu','East Lake / Liyuan','Jiedaokou / Wuhan University','Wuchang Station / Shouyi Square','Wuhan Station / Yangchunhu','Optics Valley Square','East Optics Valley / Future City',
 'Zhongjiacun / Guqin Terrace','Wangjiawan','Wuhan International Expo / Sixin','Zhuankou / Sports Center','Tianhe Airport','Undecided'];
const areaTraditional=['江漢路附近','武漢天地／黃浦路','漢口站／常青路','武廣商圈／中山公園','古田／園博園','黃鶴樓／司門口','曇華林／螃蟹岬','楚河漢街／水果湖','東湖／梨園','街道口／武漢大學','武昌站／首義廣場','武漢站／楊春湖','光谷廣場','光谷東／未來科技城','鐘家村／古琴臺','王家灣','國博／四新','沌口／體育中心','天河機場附近','尚未確定'];
const ideas=[{key:'food',subject:'hubu-alley',prompt:'我想体验武汉街巷美食和过早文化，请推荐适合慢逛的小吃街与美食，说明所在区域和出行建议，附资料来源。'},
 {key:'river',subject:'wuhan-ferry',prompt:'我想在武汉体验轮渡和两岸江景，请推荐轻松的半日游思路，提醒我核实最新航线、码头和运营时间，附官方查询入口。'},
 {key:'slow',subject:'east-lake',prompt:'我想在武汉放慢节奏，看看东湖、安排休息。请推荐轻松的游玩思路，并询问我的天数、住宿区域和同行人。'}];

export function installTravelScene({onAsk,reducedMotion}){
 const pet=document.querySelector('#mascot-pet'),visual=pet.querySelector('.mascot-visual');
 let mode='',subjects=[],locale='',lastGallery='',rig,visible=false,active=false;
 let time=0,actingTime=0,last=0,current=null,greetState='',greetStart=0,greetFrames=null,idleState='',entryPose,idleStart=0,recoverUntil=0,recoverFrom,recoverStart=0;
 let transitionFrom,transitionStart=0,transitionDuration=.65;
 const velocity={};
 function configurePlanner(){
  const copy=travelCopy(getLocale()),form=document.querySelector('#planner-form');
  const title=t('把武汉，排进你的喜欢里。'),lead=title.match(/^[^\s，,。.!！？]{1,12}/u)?.[0]||title;
  form.querySelector('[data-planner-title-start]').textContent=lead;
  form.querySelector('[data-planner-title-rest]').textContent=title.slice(lead.length);
  const days=form.elements.days,area=form.elements.area;
  const selectedDay=days.value||'1-5',selectedArea=area.value||'江汉路附近';
  days.dataset.noI18n='';area.dataset.noI18n='';days.replaceChildren();area.replaceChildren();
  const number=new Intl.NumberFormat(getLocale());
  for(const [start,end]of dayRanges){
   const option=document.createElement('option');option.value=`${start}-${end}`;
   option.textContent=`${number.format(start)}–${number.format(end)} ${copy.dayUnit}`;days.append(option);
  }
  let areaIndex=0;
  for(const [key,values]of accommodationGroups){
   const group=document.createElement('optgroup');group.label=copy[key];
   for(const value of values){
    const option=document.createElement('option');option.value=value;
    option.textContent=getLocale()==='zh-CN'?value:getLocale()==='zh-TW'?areaTraditional[areaIndex]:t(value)!==value?t(value):areaEnglish[areaIndex];
    group.append(option);areaIndex++;
   }
   area.append(group);
  }
  days.value=dayRanges.some(([a,b])=>`${a}-${b}`===selectedDay)?selectedDay:'1-5';area.value=selectedArea;
  const labels=travelPlannerCopy(getLocale());
  form.querySelectorAll('[data-travel-form-copy]').forEach(node=>node.textContent=labels[node.dataset.travelFormCopy]);
  form.elements.exactDays.placeholder=labels.exactPlaceholder;form.elements.customArea.placeholder=labels.areaPlaceholder;
 }
 function render(){
  const nextLocale=getLocale(),copy=travelCopy(nextLocale);
  if(locale!==nextLocale){locale=nextLocale;configurePlanner();}
  document.querySelectorAll('[data-travel-copy]').forEach(node=>node.textContent=copy[node.dataset.travelCopy]);
  const resume=document.querySelector('[data-travel-resume]');if(resume)resume.textContent=chuCopy(nextLocale).resume+' ↗';
  if(mode==='travel'){
   document.querySelector('#hero-description').textContent=copy.description;
   const overline=document.querySelector('.hero-overline');overline.replaceChildren(document.createElement('span'),document.createTextNode(' '+copy.badge));
  }else{
   const overline=document.querySelector('.hero-overline');overline.replaceChildren(document.createElement('span'),document.createTextNode(' '+t('江湖有知音 · 此城有新意')));
  }
  const gallery=document.querySelector('#travel-ideas'),key=`${locale}|${subjects.length}`;
  if(key===lastGallery)return;lastGallery=key;gallery.replaceChildren();
  for(const [index,idea]of ideas.entries()){
   // The source atlas supplies canonical images and provenance.
   const subject=subjects.find(s=>s.id===idea.subject)||subjects.find(s=>s.id===(idea.key==='river'?'yangtze-bridge':'east-lake'));
   if(!subject?.image)continue;
   const button=document.createElement('button');button.className='travel-idea';button.type='button';
   const wrap=document.createElement('span');wrap.className='travel-idea-photo';
   const image=document.createElement('img');image.src=subject.image.src;image.alt=t(subject.name);image.loading='lazy';image.width=subject.image.width;image.height=subject.image.height;
   const number=document.createElement('span');number.className='travel-idea-no';number.textContent=`0${index+1}`;
   const label=document.createElement('span');label.className='travel-idea-label';
   const name=document.createElement('span');name.textContent=(locale.startsWith('zh')?'问小豚 · ':'Ask Xiaotun · ')+copy[idea.key];const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
   wrap.append(image,number);label.append(name,arrow);button.append(wrap,label);
   button.addEventListener('click',()=>onAsk(['zh-CN','zh-TW'].includes(locale)?idea.prompt:`${copy[idea.key]} — ${t(subject.name)}. ${t('请按天与时段规划武汉旅行，写明交通、休息、分项预算、预约提醒及必要假设。')}`));
   gallery.append(button);
  }
 }
 fetch('/assets/jiangxiaotun-v5/travel.svg?v=18').then(response=>{if(!response.ok)throw Error('Travel illustration unavailable');return response.text();}).then(async text=>{
  const doc=new DOMParser().parseFromString(text,'image/svg+xml');
  if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Invalid travel illustration');
  const svg=document.importNode(doc.documentElement,true);svg.classList.add('mascot-travel');
  await Promise.all([...svg.querySelectorAll('image')].map(node=>new Promise(resolve=>{const image=new Image();image.onload=resolve;image.onerror=resolve;image.src=node.getAttribute('href');})));
  rig=Object.fromEntries([...svg.querySelectorAll('[data-travel]')].map(node=>[node.dataset.travel,node]));
  rig.rightHand.setAttribute('opacity','0');rig.leftHand.setAttribute('opacity','0');
  const initial=travelPose(0);Object.assign(initial,travelArms(initial));renderSoftRig(rig,initial,0,true);
  visual.append(svg);pet.dataset.travelReady='true';
 }).catch(()=>{pet.dataset.travelReady='false';});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:0}).observe(pet);
 function tick(now){
  requestAnimationFrame(tick);
  const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
  if(!rig||!active||!visible||document.hidden||document.querySelector('dialog[open]'))return;
  const renderStarted=beginMotionFrame();
  if(!reducedMotion.matches)time+=dt;
  const greeting=pet.dataset.greeting||'',idle=pet.dataset.idle||'';
  if(idle!==idleState){entryPose=current?{...current}:null;
   if(['bored','sleepy'].includes(idleState)&&!['bored','sleepy'].includes(idle)){recoverUntil=time+1.1;recoverStart=time;recoverFrom=current?{...current}:null;}
   idleStart=time;idleState=idle;
  }
  const recovering=time<recoverUntil,resting=['bored','sleepy','returning'].includes(idle)||recovering;
  if(greeting!==greetState){
   if(['waving','welcome'].includes(greeting)||!greeting){transitionFrom=current?{...current}:null;transitionStart=time;transitionDuration=greeting?.65:.9;}
   if(greeting==='waving'||greeting==='welcome'){greetStart=time;greetFrames=greetingMotion(greeting==='welcome'?'welcome':'wave');}
   greetState=greeting;
  }
  if(!reducedMotion.matches&&!greeting&&!resting)actingTime+=dt;
  const target=reducedMotion.matches?travelPose(9):sampledTravelPose(actingTime);
  Object.assign(target,travelArms(target));
  if(greeting||idle&&!['curious','returning'].includes(idle)){
   for(const key of ['headX','headY','lean','shift','scarf','bag','wrist','leftHand','earLeft','earRight','ahoge'])target[key]=0;
   target.hand=0;target.lift=0;
  }
  if(greeting&&greetFrames){
   const elapsed=Math.min(time-greetStart,greetFrames.duration/1000),frame=sampleGreeting(greetFrames,elapsed);
   target.map=0;target.glass=0;target.scope=0;target.tiptoe=0;target.leftHeel=0;target.rightHeel=0;
   softGreetingPose(target,frame,greeting,elapsed);
  }else if(idle==='returning'||recovering)softRecoveryPose(target,recoverFrom,time-recoverStart);
  else if(idle)softIdlePose(target,idle,time-idleStart);
  if(!greeting&&['bored','sleepy'].includes(idle))easeIdleEntry(target,entryPose,time-idleStart);
  if(transitionFrom)easeIdleEntry(target,transitionFrom,time-transitionStart,transitionDuration,.2);
  applyAttentionPose(target,pet,now,reducedMotion.matches);
  if(!current)current={...target};
  advanceSoftPose(current,target,velocity,dt,reducedMotion.matches);
  renderSoftRig(rig,current,time,reducedMotion.matches);
  endMotionFrame('travel',now,renderStarted);
 }
 requestAnimationFrame(tick);
 return {sync(nextMode,nextSubjects){mode=nextMode;subjects=nextSubjects;active=mode==='travel';render();}};
}

