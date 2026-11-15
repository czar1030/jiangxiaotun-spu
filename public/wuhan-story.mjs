// Companion voice: 外冷内热、心地善良；保留小骄傲，用陪伴与体贴表达关心，不嘲讽或催促游客。
const stories=[
 {key:'poetry',photo:'yellow-crane',place:['黄鹤楼 · 长江之畔','YELLOW CRANE TOWER'],label:['诗意江湖','POETRY'],title:['你读过的诗，\n在这里有了江风。','The poems you know.\nA river breeze you can feel.'],copy:['崔颢的乡愁、李白送别的帆影，都留在了这段江水里。登楼远望，熟悉的诗句，忽然有了可以亲眼看见的模样。','At Yellow Crane Tower, the Yangtze brings the horizon close. The poetry of Cui Hao and Li Bai becomes something you can feel, standing above the river.'],line:['这里的江景，可不是随便挑的。喜欢就多看会儿，我又没催你。','I didn’t pick this view at random. Stay if you like it. I’m not rushing you.'],invite:['我想走进诗里的武汉','Explore Wuhan through poetry'],prompt:['我想走进诗里的武汉，请结合黄鹤楼、晴川阁和古琴台推荐一段有故事、不过度赶路的文化漫游，并说明实际游览提醒。','Suggest a gentle cultural walk through Wuhan’s poetry, including Yellow Crane Tower, Qingchuan Pavilion and Guqin Terrace, with practical visiting advice.']},
 {key:'courage',photo:'yangtze-bridge',place:['武汉长江大桥 · 一桥飞架南北','WUHAN YANGTZE RIVER BRIDGE'],label:['敢为人先','COURAGE'],title:['江那么宽，\n总有人敢先行。','A river so wide.\nThe courage to cross it.'],copy:['1911 年的武昌首义，1957 年通车的武汉长江大桥，留下了不同年代向前走的印记。来这里，看见一座城如何把勇气，变成脚下的路。','The 1911 Wuchang Uprising and the opening of the Yangtze River Bridge in 1957 mark different chapters of change. Discover how a city turns courage into a way forward.'],line:['不用一下子就很勇敢。先往前走一小步——我在旁边呢。','You don’t have to be brave all at once. Just take one small step—I’m right here.'],invite:['去看看武汉的勇气','Discover Wuhan’s courage'],prompt:['我想了解武汉敢为人先的城市精神，请以武昌首义和武汉长江大桥为线索，讲一段准确、简短的城市故事，并推荐可参观的地方。','Tell a concise, accurate story of Wuhan’s pioneering spirit through the Wuchang Uprising and the Yangtze River Bridge, with places I can visit.']},
 {key:'everyday',photo:'jiqing-street',place:['吉庆街 · 江城烟火','JIQING STREET / EVERYDAY WUHAN'],label:['热气人间','EVERYDAY LIFE'],title:['这座城的热气，\n也会接住你。','A city full of warmth.\nRoom for your ordinary day.'],copy:['早晨的一碗热干面，夜晚吉庆街的灯火。武汉的热情，不只在地标里，也在老板的一声招呼、街边的一顿饭里。你不必赶场，坐下来就很好。','Hot dry noodles in the morning. The lights of Jiqing Street at night. Wuhan’s warmth lives in a greeting and a shared meal. You do not have to rush. Take a seat.'],line:['累了就歇会儿，行程又不会跑。我陪你坐着就是了。','Rest if you’re tired. The sights aren’t going anywhere. I’ll sit with you, then.'],invite:['找一顿有烟火气的武汉','Find my taste of Wuhan'],prompt:['我想感受武汉本地人的烟火生活，请推荐过早、美食街和轻松散步的组合，解释热干面、豆皮等吃法，尊重忌口，不要安排赶场。','Suggest a relaxed taste of everyday Wuhan, combining breakfast, local food streets and an easy walk. Explain hot dry noodles and doupi, respect dietary needs and avoid rushing.']},
 {key:'future',photo:'hankou-river',image:'/assets/wuhan-chapters/optics-campus.webp',imageSource:'https://www.wehdz.gov.cn/2022/ggxw_68627/ggxw_68629/202611/t20261102_2872022.shtml',place:['光谷 · 光迅科技高端光电器件产业基地','OPTICS VALLEY / OPTOELECTRONICS'],label:['向新而生','POSSIBILITY'],title:['古老的江水，\n也流向新的答案。','An ancient river.\nNew possibilities ahead.'],copy:['从光谷的光电子产业，到长江存储的芯片，再到年轻人手中的 AI 作品。武汉的下一章，正在实验室、园区与一个个具体的想法里生长。','From optoelectronics in Optics Valley to Yangtze Memory chips and young people building with AI, Wuhan’s next chapter takes shape in labs, industry and practical ideas.'],line:['想试就试，没做好再来。……我又没说不陪你。','Give it a try. If it doesn’t work, try again. …I never said you’d be doing it alone.'],invite:['看看武汉正在发生什么','Meet a city moving forward'],prompt:['我想了解武汉的年轻活力、光谷创新和AI共创社区，请把城市发展与可以亲自体验的文化、科普、社区入口联系起来，区分可参观内容与规划。','Connect Wuhan’s universities, Optics Valley and AI communities with cultural, science and community experiences I can actually explore. Distinguish accessible places from plans.']}
];

export function installWuhanStory({getLocale,getSubjects}){
 const tr=pair=>pair[getLocale().startsWith('zh')?0:1];
 const hero=document.querySelector('#city-hero');
 const arrival=document.createElement('div');arrival.className='wuhan-arrival-art';arrival.setAttribute('aria-hidden','true');
 arrival.innerHTML='<img class="wuhan-arrival-photo" src="/assets/wuhan-media/hankou-river.webp" alt="" width="1600" height="1000"><svg class="wuhan-gold-rivers" viewBox="0 0 1200 720" preserveAspectRatio="none"><defs><linearGradient id="wuhan-river-gold"><stop stop-color="#6f947f" stop-opacity="0"/><stop offset=".42" stop-color="#cab47a"/><stop offset=".62" stop-color="#ffdf9e"/><stop offset="1" stop-color="#9eac76" stop-opacity="0"/></linearGradient></defs><path d="M-100 550 C180 360 260 760 610 510 S1000 190 1320 360"/><path d="M-80 574 C220 390 270 780 630 530 S1040 220 1320 388"/><path class="gold-flow" d="M-100 550 C180 360 260 760 610 510 S1000 190 1320 360"/></svg>';
 hero.prepend(arrival);
 const section=document.createElement('section');section.id='wuhan-story';section.className='wuhan-story';section.dataset.noI18n='';section.setAttribute('aria-labelledby','wuhan-story-title');
 section.innerHTML=`<header class="wuhan-story-heading"><div><span class="wuhan-story-eyebrow">A CITY WORTH FEELING / WUHAN</span><h2 id="wuhan-story-title"></h2></div><p data-story-intro></p></header>

 <div class="wuhan-story-journey"><div class="wuhan-story-theatre"><div class="wuhan-story-photos" aria-hidden="true">${stories.map((s,i)=>`<img src="${s.image||`/assets/wuhan-media/${s.photo}.webp`}" data-story-photo="${i}" class="${i===0?'is-active':''}" alt="" width="1600" height="1000" loading="lazy">`).join('')}</div><div class="wuhan-story-shade" aria-hidden="true"></div><svg class="story-gold-thread" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path d="M-30 560 C170 430 300 650 490 500 S770 230 1060 390"/><path d="M-30 568 C170 438 300 658 490 508 S770 238 1060 398"/></svg><div class="wuhan-story-scene-meta"><span data-story-place></span><span class="story-sources"><a data-story-source target="_blank" rel="noopener noreferrer"></a><a data-story-photo-source target="_blank" rel="noopener noreferrer"></a></span></div><div class="story-companion"><div class="story-companion-head"><img src="/assets/jiangxiaotun-v5/planner-peeker-v1.webp" alt="" width="384" height="384"></div><div><span data-story-companion-name></span><p data-story-whisper aria-live="polite"></p></div></div><div class="story-current" aria-hidden="true"><span data-story-current>01</span><i></i><small>04</small></div></div>
 <div class="wuhan-story-beats">${stories.map((s,i)=>`<article class="wuhan-story-beat" id="wuhan-story-${s.key}" data-story-beat="${i}"><span class="wuhan-story-beat-kicker"><b>0${i+1}</b><span data-story-label="${i}"></span></span><h3 data-story-title="${i}"></h3><p data-story-copy="${i}"></p><a class="story-invite" data-story-open="${i}" href="/wuhan-${s.key}.html"><b class="story-invite-seal" aria-hidden="true">${['诗','志','味','新'][i]}</b><span class="story-invite-text"><small data-story-entry-note></small><span data-story-entry-label></span></span><i aria-hidden="true">→</i></a></article>`).join('')}</div></div>
 <footer class="wuhan-story-ending"><span data-story-ending></span><div><button data-story-to-plan></button></div></footer>`;
 hero.after(section);
 const heroLinks=[...hero.querySelectorAll('[data-wuhan-story-link]')];
 let active=0,mode='',locale='',frame=0,restoredChapter=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function highlight(index){
  if(index===active&&section.dataset.ready)return;active=index;section.dataset.ready='true';
  section.querySelectorAll('[data-story-photo]').forEach((img,i)=>img.classList.toggle('is-active',i===index));
  section.querySelectorAll('[data-story-beat]').forEach((beat,i)=>beat.classList.toggle('is-current',i===index));
  section.dataset.chapter=stories[index].key;
  section.querySelectorAll('[data-story-jump]').forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  heroLinks.forEach(link=>{if(link.dataset.wuhanStoryLink===stories[index].key)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  section.querySelector('[data-story-current]').textContent=`0${index+1}`;
  section.querySelector('[data-story-place]').textContent=tr(stories[index].place);
  section.querySelector('[data-story-whisper]').textContent=tr(stories[index].line);
  const subject=getSubjects().find(s=>s.id===stories[index].photo),source=section.querySelector('[data-story-source]');
  source.href=stories[index].imageSource||subject?.factUrl||'/materials/武汉概览.pdf';source.textContent=tr(['文史资料 ↗','Story sources ↗']);
  const photoSource=section.querySelector('[data-story-photo-source]');photoSource.href=stories[index].imageSource||subject?.image?.sourceUrl||source.href;photoSource.textContent=tr(['影像来源 ↗','Photo source ↗']);
 }
 function track(){
  frame=0;if(mode!=='wuhan'||section.hidden)return;
  const beats=[...section.querySelectorAll('[data-story-beat]')],target=Math.min(innerHeight*.48,390);
  const closest=beats.reduce((best,beat,i)=>{const r=beat.getBoundingClientRect(),distance=Math.abs(r.top+r.height*.5-target);return distance<best.distance?{index:i,distance}:best;},{index:0,distance:Infinity});
  highlight(closest.index);
 }
 document.addEventListener('scroll',()=>{if(!frame&&mode==='wuhan')frame=requestAnimationFrame(track);},{passive:true});
 window.addEventListener('resize',()=>{if(!frame)frame=requestAnimationFrame(track);},{passive:true});
 new IntersectionObserver(entries=>section.classList.toggle('story-in-view',entries[0].isIntersecting),{threshold:0}).observe(section);
 function jumpTo(index){
  const destination=section.querySelector(`[data-story-beat="${index}"]`);
  if(!destination)return;
  highlight(index);
  destination.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
  destination.setAttribute('tabindex','-1');destination.focus({preventScroll:true});
 }
 heroLinks.forEach(link=>link.addEventListener('click',event=>{
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  history.replaceState({...history.state,y:scrollY},'',location.href);
  history.pushState({...history.state,y:0},'',link.getAttribute('href'));
  jumpTo(stories.findIndex(story=>story.key===link.dataset.wuhanStoryLink));
 }));
 section.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.storyJump!==undefined)jumpTo(Number(b.dataset.storyJump));
  if(b.hasAttribute('data-story-to-plan'))document.querySelector('[data-open-planner]').click();
 });
 return {sync(nextMode){
  mode=nextMode;section.hidden=mode!=='wuhan'||document.querySelector('#welcome').hidden;arrival.hidden=mode!=='wuhan';
  const current=getLocale();
  const pet=document.querySelector('#mascot-pet');
  if(pet.dataset.storyLine){delete pet.dataset.storyLine;document.dispatchEvent(new Event('wuhan-story-presence'));}
  if(mode==='wuhan'){
   if(current.startsWith('zh')){
    document.querySelector('#hero-title').innerHTML='来武汉，<br>赴一场<span class="wuhan-gold-word">江湖。</span>';
    document.querySelector('#hero-description').textContent='为千年的诗意，为敢向前的勇气。也为一碗热干面、一程有人陪的江风。';
    document.querySelector('[data-chu-copy="note"]').textContent='不必一次走遍，先找到让你心动的那个瞬间。';
   }
  }
  if(locale!==current){locale=current;
   section.querySelector('#wuhan-story-title').textContent=tr(['总有一个瞬间，\n让你想来武汉。','A moment that makes you\nwant to be here.']);
   section.querySelector('[data-story-intro]').textContent=tr(['一座城的答案，不只在地标里。\n也在你与它相遇的那一刻。','A city is more than its landmarks.\nDiscover what it means to you.']);
   heroLinks.forEach(link=>{const story=stories.find(story=>story.key===link.dataset.wuhanStoryLink);link.querySelector('strong').textContent=tr(story.label);link.querySelector('small').textContent=story.label[1];});
   stories.forEach((s,i)=>{section.querySelector(`[data-story-label="${i}"]`).textContent=tr(s.label);section.querySelector(`[data-story-title="${i}"]`).textContent=tr(s.title);section.querySelector(`[data-story-copy="${i}"]`).textContent=tr(s.copy);const entry=section.querySelector(`[data-story-open="${i}"]`);entry.querySelector('[data-story-entry-label]').textContent=tr(s.invite);entry.querySelector('[data-story-entry-note]').textContent=tr(['展开'+['诗意','历史','风味','新生'][i]+'长卷 · 0'+(i+1),'OPEN CHAPTER · 0'+(i+1)]);entry.href='/wuhan-'+s.key+'.html';});
   section.querySelector('[data-story-companion-name]').textContent=tr(['江小豚 · 江城大小姐','Xiaotun · Wuhan’s spirited young lady']);
   section.querySelector('[data-story-ending]').textContent=tr(['心动的地方，就是出发的理由。','A place that moves you is a reason to go.']);
   section.querySelector('[data-story-to-plan]').textContent=tr(['把心动，写进我的旅行 ↗','Turn inspiration into my trip ↗']);
  }
  delete section.dataset.ready;highlight(active);
  const collection=document.querySelector('.city-experience');if(mode==='wuhan'&&collection?.parentElement===hero.parentElement&&collection.previousElementSibling!==section)section.after(collection);
  if(!restoredChapter&&mode==='wuhan'&&!section.hidden){restoredChapter=true;const requested=stories.findIndex(story=>location.hash==='#wuhan-story-'+story.key);if(requested>=0)requestAnimationFrame(()=>jumpTo(requested));}
  if(!frame)frame=requestAnimationFrame(track);
 }};
}
