import {cleanPreferences,suggestPreferences,weatherIntent,cityAnchors,sceneLocations,journalChecks} from './experience-core.mjs';
import {weatherEditions,weatherSelection,weatherPlanPrompt,weatherPlaceIds,legacyWeatherPlaces} from './weather-curation.mjs?v=1';

const STORE='jiangxiaotun-companion-v1';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const head='/assets/jiangxiaotun-v5/planner-peeker-v1.webp';
const stages=['wuhan','travel','community','saig'];
export function installCityExperience({getState,getLocale,getSubjects=()=>[],onAsk,onNavigate,onJournalChange,onCollectionChange,notify}) {
  let profile={},weather='clear',weatherSource='preview',lastQuestion='',selected='',drag=null;
  let visited=new Set(),originals=new Map(),busy=false,focusTimer,motif='',idea='';
  let collection=new Set(),sceneKey='east-lake-greenway',photoSlot=0,photoRequest=0,photoSource='',listEdition='';
  try {const saved=JSON.parse(localStorage.getItem(STORE));profile=cleanPreferences(saved?.preferences);visited=new Set((saved?.visited||[]).filter(m=>stages.includes(m)));motif=typeof saved?.motif==='string'?saved.motif.slice(0,80):'';idea=typeof saved?.idea==='string'?saved.idea.slice(0,200):'';}catch{}
  try {collection=new Set((JSON.parse(localStorage.getItem(STORE))?.collection||[]).map(key=>legacyWeatherPlaces[key]||key).filter(key=>weatherPlaceIds.has(key)));}catch{}
  const text=(zh,en)=>getLocale().startsWith('zh')?zh:en;
  const write=()=>{try{localStorage.setItem(STORE,JSON.stringify({preferences:profile,visited:[...visited],motif,idea,collection:[...collection]}));}catch{notify('偏好未能保存，请检查浏览器存储设置。');}};
  const card=document.createElement('section');card.className='city-experience';card.dataset.noI18n='';card.setAttribute('aria-label','与江小豚一起走进武汉');
  card.innerHTML=`<header class="experience-header"><div class="experience-heading"><span class="experience-eyebrow"><b aria-hidden="true">游</b> WUHAN / WEATHER & WANDER</span><h2 data-exp-title></h2><p data-exp-line></p></div><div class="experience-header-actions"><span class="experience-ai-mark"><i></i> WITH JIANGXIAOTUN</span><button class="experience-memory" data-memory-open><span aria-hidden="true">✧</span><span data-memory-label></span></button><button class="experience-expand" data-experience-expand aria-expanded="false"></button></div></header>
    <div class="experience-body"><div class="experience-weather-switch" role="group" aria-label="按天气选择武汉玩法">${Object.entries(weatherEditions).map(([key,e])=>`<button data-scene-weather="${key}" aria-pressed="false"><span class="weather-choice-no">${e.number}</span><span class="weather-choice-glyph" aria-hidden="true">${e.glyph}</span><span class="weather-choice-copy"><strong></strong><small></small></span><span class="weather-choice-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>
    <div class="experience-edition"><div><span class="experience-eyebrow" data-edition-kicker></span><h3 data-edition-title></h3><p data-edition-intro></p></div><span class="experience-edition-mark" data-edition-mark aria-hidden="true"></span></div>
    <div class="experience-gallery"><div class="experience-world" data-weather="clear">
      <img class="experience-photo is-visible" data-experience-photo src="/assets/wuhan-media/east-lake-greenway.webp" alt="东湖绿道实景" width="1600" height="1000"><img class="experience-photo" data-experience-photo src="/assets/wuhan-media/east-lake-greenway.webp" alt="" width="1600" height="1000">
      <div class="experience-photo-veil" aria-hidden="true"></div><img class="experience-inlay" src="/assets/chu-heritage.svg" alt="" aria-hidden="true">
      <div class="experience-weather-layer" aria-hidden="true">${Array.from({length:28},()=>'<i class="weather-particle"></i>').join('')}</div>
      <div class="experience-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span class="experience-photo-index" data-photo-index>01 / WUHAN</span>
      <div class="experience-photo-copy"><span class="experience-eyebrow" data-photo-area>江岸 · 一程江风</span><h3 data-photo-title>江湖之间，自有风华。</h3><p data-photo-description></p><div class="experience-photo-actions"><button data-scene-ask></button><button data-scene-collect aria-pressed="false"></button></div></div>
      <span class="experience-weather-note" data-weather-note></span></div>
      <aside class="experience-curation"><div class="experience-curation-heading"><span class="experience-eyebrow">FOUR PLACES / ONE MOOD</span><h3 data-curation-title></h3><span data-collection-count></span></div><div class="experience-locations"></div><p class="experience-route-status" data-route-status></p></aside></div>
    <section class="experience-outing" aria-label="所选地点的游玩组合"><div class="experience-outing-heading"><span class="experience-eyebrow" data-outing-kicker></span><h4 data-outing-title></h4></div><ol class="experience-outing-stops" data-outing-stops></ol><div class="experience-outing-notes"><p><span data-access-label></span><span data-outing-access></span></p><p><span data-note-label></span><span data-outing-note></span></p></div></section>
    <footer class="experience-controls"><div class="experience-guide"><div class="experience-guide-crop"><img src="${head}" alt="江小豚" width="384" height="384"></div><span data-guide-caption></span></div><button class="experience-weather-plan" data-weather-plan></button><span class="experience-selection" data-selection></span></footer>
    <nav class="experience-story" aria-label="在武汉发现与创造">${stages.map((m,i)=>`<button data-story-mode="${m}"><small>0${i+1}</small><span></span><i aria-hidden="true">↗</i></button>`).join('')}</nav>
    <div class="experience-bridge"><div><span class="experience-eyebrow">CURIOSITY BECOMES POSSIBILITY</span><h3 data-bridge-title></h3><p data-bridge-copy></p><label class="experience-idea" hidden><span data-idea-label></span><input maxlength="200" aria-label="我的城市接待员创意"></label></div><button data-bridge-next></button></div></div>`;
  document.querySelector('#city-hero').after(card);
  card.querySelectorAll('.weather-particle').forEach((particle,i)=>{
    const values={'--weather-x':`${1+(i*37+11)%98}%`,'--weather-delay':`-${((i*1.73)%19).toFixed(2)}s`,'--rain-duration':`${(1.35+(i%6)*.17).toFixed(2)}s`,'--snow-duration':`${8+i%8}s`,'--snow-size':`${2+i%3}px`};
    for(const [key,value]of Object.entries(values))particle.style.setProperty(key,value);
  });
  const memory=document.createElement('dialog');memory.className='companion-memory-dialog';memory.dataset.noI18n='';memory.innerHTML=`<form method="dialog"><button class="memory-close" aria-label="关闭偏好设置" value="close">×</button></form><span class="experience-eyebrow">LITTLE THINGS, REMEMBERED</span><h2></h2><p data-memory-description></p><form data-memory-form><label><span data-memory-field="pace"></span><input name="pace" maxlength="120"></label><label><span data-memory-field="interests"></span><input name="interests" maxlength="120"></label><label><span data-memory-field="lodging"></span><input name="lodging" maxlength="120"></label><label><span data-memory-field="companions"></span><input name="companions" maxlength="120"></label><div class="memory-actions"><button type="button" data-memory-suggest></button><button type="submit" class="memory-save"></button></div></form><button class="memory-forget" data-memory-forget></button><p class="memory-status" role="status"></p>`;document.body.append(memory);
  function openMemory(){
    memory.querySelector('h2').textContent=text('让小豚记住你的喜欢。','Let me remember your preferences.');
    memory.querySelector('[data-memory-description]').textContent=text('你确认保存后才会记住。偏好存于此浏览器，提问时作为参考发给 AI；随时可修改或清除。','Saved only after you confirm, in this browser. Preferences accompany AI requests and can be edited or removed.');
    const labels={pace:text('喜欢的节奏','Your pace'),interests:text('感兴趣的事','Interests'),lodging:text('常用住宿区域','Usual accommodation area'),companions:text('常见同行人','Usual companions')};
    for(const [key,label]of Object.entries(labels)){memory.querySelector(`[data-memory-field="${key}"]`).textContent=label;memory.querySelector(`[name="${key}"]`).value=profile[key]||'';}
    memory.querySelector('[data-memory-suggest]').textContent=text('从我的对话填入，供我确认','Suggest from my messages');
    memory.querySelector('.memory-save').textContent=text('确认，记住这些','Save my preferences');
    memory.querySelector('[data-memory-forget]').textContent=text('清除已记住的偏好','Forget saved preferences');
    memory.querySelector('.memory-status').textContent='';memory.showModal();
  }
  memory.querySelector('[data-memory-suggest]').onclick=()=>{const suggested=suggestPreferences(getState().messages);for(const key of Object.keys(suggested))memory.querySelector(`[name="${key}"]`).value=suggested[key];memory.querySelector('.memory-status').textContent=text('已填入建议，检查后点击保存才会记住。','Suggestions filled. Review and save to remember.');};
  memory.querySelector('[data-memory-form]').onsubmit=event=>{event.preventDefault();profile=cleanPreferences(Object.fromEntries(new FormData(event.target)));write();memory.close();sync();notify(text('记住了，下次按你的节奏来。','Saved. Next time, at your pace.'));};
  memory.querySelector('[data-memory-forget]').onclick=()=>{profile={};write();memory.close();sync();notify(text('已清除保存的偏好。','Saved preferences removed.'));};
  const isChinese=()=>getLocale().startsWith('zh');
  const currentSelection=()=>weatherSelection(weather,sceneKey);
  const placeName=id=>{
    const p=Object.values(weatherEditions).flatMap(e=>e.places).find(p=>p.id===id);
    return p?(isChinese()?p.name:p.en):getSubjects().find(s=>s.id===id)?.name||id;
  };
  function paintRecommendations(){
    const {edition}=currentSelection(),key=weather+':'+getLocale();
    if(listEdition===key)return;
    listEdition=key;
    card.querySelector('.experience-locations').innerHTML=edition.places.map((p,i)=>`<button class="experience-location" data-city-place="${p.id}" aria-pressed="false"><span class="experience-location-photo"><img src="/assets/wuhan-media/${p.id}.webp" alt="${escape(isChinese()?p.name:p.en)}" width="240" height="180" loading="lazy"></span><span class="experience-location-copy"><small>0${i+1}</small><strong>${escape(isChinese()?p.name:p.en)}</strong><span class="experience-location-kind">${escape(isChinese()?p.mood:p.area+' / '+edition.enLabel)}</span><span class="experience-location-reason">${escape(isChinese()?p.reason:p.enReason)}</span></span><span class="experience-location-arrow" aria-hidden="true">↗</span><span class="experience-collected-mark" aria-hidden="true">✧</span></button>`).join('');
  }
  function paintPreview() {
    const {edition,place:p}=currentSelection();sceneKey=p.id;
    paintRecommendations();
    const subject=getSubjects().find(s=>s.id===p.id),index=edition.places.indexOf(p);
    const source=subject?.image?.src||'/assets/wuhan-media/'+p.id+'.webp';
    card.querySelector('[data-photo-title]').textContent=isChinese()?p.name:p.en;
    card.querySelector('[data-photo-area]').textContent=isChinese()?`${p.area} / ${p.mood}`:edition.enLabel;
    card.querySelector('[data-photo-description]').textContent=isChinese()?p.reason:p.enReason;
    card.querySelector('[data-photo-index]').textContent=`${edition.number} — 0${index+1} / ${edition.kicker}`;
    card.querySelector('[data-scene-ask]').textContent=text('问小豚 · 这里的故事','Ask Xiaotun · Its story');
    card.querySelector('[data-scene-collect]').textContent=collection.has(p.id)?text('已收进漫游 ✓','Collected ✓'):text('收进我的漫游 ＋','Add to my journey ＋');
    card.querySelector('[data-scene-collect]').setAttribute('aria-pressed',String(collection.has(p.id)));
    card.querySelector('[data-curation-title]').textContent=text('这份天气，适合去这里。','Places for this kind of day.');
    card.querySelector('[data-collection-count]').textContent=text(`已收集 ${collection.size} 处心动`,`Collected ${collection.size} places`);
    card.querySelectorAll('[data-city-place]').forEach(b=>{const active=b.dataset.cityPlace===p.id;b.classList.toggle('is-selected',active);b.classList.toggle('is-collected',collection.has(b.dataset.cityPlace));b.setAttribute('aria-pressed',String(active));});
    card.querySelector('[data-outing-kicker]').textContent=text('一段顺路的小时光','A LITTLE TIME, WELL SPENT');
    card.querySelector('[data-outing-title]').textContent=text(`就从${p.name}出发。`,`Start with ${p.en}.`);
    card.querySelector('[data-outing-stops]').innerHTML=(isChinese()?p.route:p.enRoute).map((stop,i)=>`<li><span>0${i+1}</span><strong>${escape(stop)}</strong></li>`).join('');
    card.querySelector('[data-access-label]').textContent=text('怎么去','GETTING THERE');
    card.querySelector('[data-note-label]').textContent=text('小豚叮嘱','A LITTLE NOTE');
    card.querySelector('[data-outing-access]').textContent=isChinese()?p.access:p.enAccess;
    card.querySelector('[data-outing-note]').textContent=isChinese()?p.note:p.enNote;
    card.querySelector('[data-route-status]').textContent=text('点一处换个视角；喜欢的，就留给下一程。','Choose a view. Keep a favourite for your next journey.');
    if(source!==photoSource){
      photoSource=source;const ticket=++photoRequest;
      const layers=[...card.querySelectorAll('[data-experience-photo]')],next=1-photoSlot;
      layers[next].src=source;layers[next].alt=(isChinese()?p.name:p.en)+text('实景资料照片',' reference photograph');
      layers[next].decode().then(()=>{if(ticket!==photoRequest)return;layers[next].classList.add('is-visible');layers[next].setAttribute('aria-hidden','false');layers[photoSlot].classList.remove('is-visible');layers[photoSlot].setAttribute('aria-hidden','true');photoSlot=next;}).catch(()=>{if(ticket===photoRequest)photoSource='';});
    }
  }
  function setWeather(value,source='preview') {
    if(!weatherEditions[value])return;
    const pet=document.querySelector('#mascot-pet');
    if(value!==weather){sceneKey=weatherEditions[value].places[0].id;if(pet)pet.dataset.weatherReaction=String(performance.now());}
    weather=value;weatherSource=source;card.dataset.weather=value;card.querySelector('.experience-world').dataset.weather=value;document.body.dataset.cityWeather=value;
    const edition=weatherEditions[value];
    card.querySelectorAll('[data-scene-weather]').forEach(b=>{
      const e=weatherEditions[b.dataset.sceneWeather];
      b.setAttribute('aria-pressed',String(b.dataset.sceneWeather===value));
      b.querySelector('strong').textContent=isChinese()?e.label:e.enLabel;
      b.querySelector('.weather-choice-copy small').textContent=text({clear:'江湖开阔 · 向光而行',rain:'旧巷听雨 · 文脉深处',snow:'近岸赏雪 · 暖馆歇脚'}[b.dataset.sceneWeather],{clear:'LAKES & OPEN VIEWS',rain:'OLD STREETS & CULTURE',snow:'WINTER VIEWS & WARM STOPS'}[b.dataset.sceneWeather]);
    });
    card.querySelector('[data-edition-kicker]').textContent=edition.kicker;
    card.querySelector('[data-edition-title]').textContent=isChinese()?edition.title:edition.enTitle;
    card.querySelector('[data-edition-intro]').textContent=isChinese()?edition.intro:edition.enIntro;
    card.querySelector('[data-edition-mark]').textContent=edition.glyph;
    card.querySelector('[data-weather-note]').textContent=text('景点实景资料图 · 并非即时天气画面','Reference photography · not a live weather view');
    card.querySelector('[data-guide-caption]').textContent=isChinese()?edition.guide:edition.enGuide;
    card.querySelector('[data-weather-plan]').textContent=text(`问小豚 · 安排${{clear:'晴天',rain:'雨天',snow:'雪天'}[value]}旅行`,`Ask Xiaotun · Plan my ${value==='clear'?'sunny-day':value==='rain'?'rainy-day':'snow-day'} trip`);
    paintPreview();
  }
  function focus(name,element) {
    const {edition}=currentSelection(),choice=edition.places.find(p=>p.name===name||p.en===name||p.id===name),anchor=cityAnchors.find(a=>a.match.test(name));
    selected=choice?(isChinese()?choice.name:choice.en):name;
    if(choice){sceneKey=choice.id;paintPreview();}
    card.querySelector('[data-selection]').textContent=text('小豚正在看：','Looking at: ')+selected;
    const pet=document.querySelector('#mascot-pet'),rect=element?.getBoundingClientRect();
    if(pet)pet.dataset.attention=rect?(rect.left+rect.width/2<innerWidth*.6?'-1':'1'):(anchor&&anchor.x<600?'-1':'1');
    card.querySelector('.experience-guide').dataset.look=anchor&&anchor.x<600?'left':'right';
    clearTimeout(focusTimer);focusTimer=setTimeout(()=>{if(pet)delete pet.dataset.attention;delete card.querySelector('.experience-guide').dataset.look;},4500);
  }
  function decorateJournals(){
    document.querySelectorAll('#messages .journal-tools,#messages .journal-rest,#messages .journal-stop-tools,#messages .journal-check').forEach(node=>node.remove());
    document.querySelectorAll('#messages .itinerary').forEach(section=>{
      const article=section.closest('[id^="message-"]'),index=Number(article?.id.replace('message-','')),message=getState().messages[index];
      if(!message?.result?.itinerary)return;
      const plan=message.result.itinerary;
      if(message.originalItinerary&&!originals.has(index))originals.set(index,structuredClone(message.originalItinerary));
      const footer=document.createElement('div');footer.className='journal-tools';
      footer.innerHTML=`<span>${text('你的江城手账 · 拖动或点箭头调整当天顺序','Your Wuhan journal · drag or use arrows to reorder')}</span><button data-journal-review="${index}">${text('问小豚 · 复核安排','Ask Xiaotun · Review changes')}</button><button data-journal-share="${index}">${text('保存旅行卡','Save travel card')} ↓</button><button data-journal-undo="${index}" ${originals.has(index)?'':'disabled'}>${text('恢复原方案','Restore original')}</button>`;
      section.querySelector('.itinerary-heading').after(footer);
      section.querySelectorAll('.itinerary-day').forEach((dayNode,di)=>{
        const day=plan.days[di];
        const rest=document.createElement('button');rest.className='journal-rest';rest.textContent=text('今天有点累，少安排一处','A little tired — one less stop');rest.dataset.journalRest=index;rest.dataset.day=day.day;dayNode.querySelector('.day-actions').append(rest);
        dayNode.querySelectorAll('.timeline-stop').forEach((stop,si)=>{
          stop.classList.add('journal-stop');stop.draggable=true;stop.dataset.journalIndex=index;stop.dataset.day=day.day;stop.dataset.stop=si;
          const tools=document.createElement('div');tools.className='journal-stop-tools';
          tools.innerHTML=`<span aria-hidden="true">⠿</span><button data-journal-move="${index}" data-day="${day.day}" data-from="${si}" data-to="${si-1}" aria-label="${text('上移','Move up')} ${escape(day.stops[si].name)}" ${si===0?'disabled':''}>↑</button><button data-journal-move="${index}" data-day="${day.day}" data-from="${si}" data-to="${si+1}" aria-label="${text('下移','Move down')} ${escape(day.stops[si].name)}" ${si===day.stops.length-1?'disabled':''}>↓</button>`;stop.prepend(tools);
        });
        if(originals.has(index)){const checks=journalChecks(plan,day.day);if(checks.length){const note=document.createElement('p');note.className='journal-check';note.textContent=text('小豚批注：','Note: ')+checks.join(' ');dayNode.querySelector('.day-content').append(note);}}
      });
    });
  }
  function updateJournal(index,action) {
    if(busy){notify(text('请先等当前回答完成。','Please wait for the current answer.'));return;}
    const plan=getState().messages[index]?.result?.itinerary;if(!plan)return;
    if(!originals.has(index))originals.set(index,structuredClone(plan));
    onJournalChange(index,action);
  }
  card.onclick=event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-memory-open'))openMemory();
    if(button.hasAttribute('data-experience-expand')){const open=card.dataset.expanded!=='true';card.dataset.expanded=String(open);button.setAttribute('aria-expanded',String(open));button.textContent=text(open?'收起画卷':'展开画卷',open?'Close collection':'Open collection');}
    if(button.hasAttribute('data-scene-collect')){
      const {place:p}=currentSelection();
      const adding=!collection.has(p.id);if(adding)collection.add(p.id);else collection.delete(p.id);
      motif=[...collection].map(placeName).join('、');write();paintPreview();onCollectionChange?.([...collection]);
      card.querySelector('[data-guide-caption]').textContent=adding?text(`收好啦，把${p.name}留给下一程。`,`${p.en} is in your journey.`):text('没关系，慢慢挑喜欢的。','Take your time finding a favourite.');
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches)button.animate([{transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:300,easing:'ease-out'});
    }
    if(button.hasAttribute('data-scene-ask'))onAsk(weatherPlanPrompt(weather,sceneKey,getLocale(),true));
    if(button.hasAttribute('data-bridge-next')){
      const mode=getState().mode;
      if(mode==='wuhan'){if(!collection.size&&selected)motif=selected;write();onNavigate('travel');onAsk(text(`我对${motif||'武汉的历史文化与街巷生活'}很感兴趣，请结合我已有的旅行条件，推荐如何融入武汉旅行；已有时间范围就先按范围推荐。`,`Help me fit ${motif||'Wuhan culture and local life'} into my Wuhan trip, using my existing preferences and duration range.`));}
      else if(mode==='travel'){if(selected)motif=selected;write();onNavigate('community');}
      else if(mode==='community'){idea=card.querySelector('.experience-idea input').value.trim().slice(0,200);write();onNavigate('saig');}
      else onAsk(text(`我想参加SAIG，创意是：${idea||'以武汉文化为特色的城市AI接待员'}。请以赛事官方要求为依据，保留介绍武汉、介绍SPU社区、旅行规划、介绍SPU与SAIG四项必备功能，帮我整理简短可执行的作品起点与演示顺序，不要编造成就或报名状态。`,`Help me outline an SAIG city AI concierge entry inspired by ${idea||motif||'Wuhan culture'}, retaining all four required functions and using the official rules.`));
    }
    if(button.dataset.sceneWeather)setWeather(button.dataset.sceneWeather,'selection');
    if(button.dataset.storyMode)onNavigate(button.dataset.storyMode);
    if(button.dataset.cityPlace)focus(button.dataset.cityPlace,button);
    if(button.hasAttribute('data-weather-plan'))onAsk(weatherPlanPrompt(weather,sceneKey,getLocale()));
  };
  card.querySelector('.experience-idea input').addEventListener('input',event=>{idea=event.target.value;});
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.journalMove!==undefined)updateJournal(Number(b.dataset.journalMove),{type:'move',day:b.dataset.day,from:b.dataset.from,to:b.dataset.to});
    if(b.dataset.journalRest!==undefined)updateJournal(Number(b.dataset.journalRest),{type:'rest',day:b.dataset.day});
    if(b.dataset.journalUndo!==undefined&&!busy){const i=Number(b.dataset.journalUndo),original=originals.get(i);if(original){originals.delete(i);onJournalChange(i,{type:'restore',plan:original});}}
    if(b.dataset.journalShare!==undefined)shareCard(getState().messages[Number(b.dataset.journalShare)]?.result?.itinerary);
    if(b.dataset.journalReview!==undefined){const plan=getState().messages[Number(b.dataset.journalReview)]?.result?.itinerary;if(plan)onAsk(text(`请复核我刚调整的${plan.days.length}天武汉手账，检查时间、跨江、步行、开放预约与预算取舍，保留当前景点顺序及住宿同行条件；必要调整请说明原因并返回完整行程。`,`Review my edited ${plan.days.length}-day Wuhan journal for timing, transit, walking, booking requirements and budget. Preserve my chosen order where possible and return the complete plan.`),plan);}
  });
  document.addEventListener('dragstart',event=>{const stop=event.target.closest('.journal-stop');if(!stop||busy)return;drag={index:Number(stop.dataset.journalIndex),day:Number(stop.dataset.day),from:Number(stop.dataset.stop)};event.dataTransfer.setData('text/plain',String(drag.from));event.dataTransfer.effectAllowed='move';stop.classList.add('is-dragging');});
  document.addEventListener('dragover',event=>{const stop=event.target.closest('.journal-stop');if(drag&&stop&&Number(stop.dataset.journalIndex)===drag.index&&Number(stop.dataset.day)===drag.day){event.preventDefault();event.dataTransfer.dropEffect='move';}});
  document.addEventListener('drop',event=>{const stop=event.target.closest('.journal-stop');if(drag&&stop&&Number(stop.dataset.journalIndex)===drag.index&&Number(stop.dataset.day)===drag.day){event.preventDefault();updateJournal(drag.index,{type:'move',day:drag.day,from:drag.from,to:Number(stop.dataset.stop)});}drag=null;});
  document.addEventListener('dragend',()=>{drag=null;document.querySelectorAll('.is-dragging').forEach(s=>s.classList.remove('is-dragging'));});
  document.addEventListener('pointerover',event=>{const target=event.target.closest('.place-card,.timeline-stop');if(!target||target.contains(event.relatedTarget))return;const name=target.querySelector('h4,h5')?.textContent;if(name)focus(name,target);});
  document.addEventListener('focusin',event=>{const target=event.target.closest('.place-card,.timeline-stop');const name=target?.querySelector('h4,h5')?.textContent;if(name)focus(name,target);});
  async function shareCard(plan) {
    if(!plan)return;const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=Math.min(2700,650+plan.days.length*65);const c=canvas.getContext('2d');
    c.fillStyle='#f1edde';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='#174d47';c.fillRect(0,0,1080,220);c.fillStyle='#e9d5a4';c.font='22px sans-serif';c.fillText('JIANG XIAOTUN / YOUR WUHAN JOURNAL',65,78);c.font='bold 42px sans-serif';c.fillText(String(plan.title||'武汉旅行手账').slice(0,22),65,150);c.fillStyle='#28594e';c.font='24px sans-serif';
    plan.days.slice(0,30).forEach((d,i)=>c.fillText(`DAY ${String(d.day).padStart(2,'0')}  ${d.title}`.slice(0,37),65,290+i*65));
    c.font='20px sans-serif';c.fillText(text('江小豚 · 把喜欢的风景，慢慢收集。','Jiang Xiaotun · Collect the moments you love.'),65,canvas.height-130);c.fillText(text('参考手账 · 预约、费用与交通以出行前核实为准','Reference journal · verify bookings, costs and transport.'),65,canvas.height-80);
    c.strokeStyle='#baa16a';c.lineWidth=1.5;c.beginPath();c.moveTo(65,canvas.height-195);c.bezierCurveTo(300,canvas.height-240,600,canvas.height-150,1015,canvas.height-195);c.stroke();
    const image=new Image();image.src=head;try{await image.decode();c.drawImage(image,875,75,150,150);}catch{/* The journal remains exportable when the decorative portrait is unavailable. */}
    canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='江城旅行卡.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  }
  function sync(pending=false) {
    busy=pending;const state=getState();if(!visited.has(state.mode)){visited.add(state.mode);write();}
    card.hidden=state.mode!=='travel';
    const conversation=document.querySelector('#welcome').hidden;
    card.classList.toggle('is-conversation',conversation);
    if(conversation){const content=document.querySelector('.content-layout');if(card.nextElementSibling!==content)content.before(card);}
    else{const hero=document.querySelector('#city-hero');if(card.previousElementSibling!==hero)hero.after(card);}
    const question=state.messages.findLast(m=>m.role==='user')?.content||'';
    if(question!==lastQuestion){const described=weatherIntent(question);if(described)setWeather(described,'dialogue');lastQuestion=question;}
    card.dataset.mode=state.mode;card.dataset.pending=String(pending);
    const hasMemory=Object.keys(profile).length>0;
    card.querySelector('[data-exp-title]').textContent=text('让天气，带你读武汉。','Let the weather lead you into Wuhan.');
    card.querySelector('[data-experience-expand]').textContent=text(card.dataset.expanded==='true'?'收起画卷':'展开画卷',card.dataset.expanded==='true'?'Close collection':'Open collection');
    const lines={wuhan:text('从一段文脉，到一口烟火，找到你喜欢的武汉。','Find your Wuhan, through stories and everyday life.'),travel:text('把愿望放进地图，把从容留在旅途中。','Put your wishes on the map. Leave room to slow down.'),community:text('从喜欢这座城市，到遇见一起创造的人。','From discovering a city to meeting its creators.'),saig:text('把一路的好奇，变成你自己的 AI 作品。','Turn your curiosity into your own AI creation.')};
    card.querySelector('[data-exp-line]').textContent=pending?text('小豚正在整理你的想法，稍后一起看看。','Gathering your ideas. We will explore them together.'):text('同一座江城，三种出发的心情。选个天气，看看这次去哪儿。','One city, three moods for a day out. Choose the weather and find your next stop.');
    const subject=motif||text('武汉的文化与生活','Wuhan culture and local life');
    const bridges={
      wuhan:[text('把这段好奇，带进旅行。','Bring your curiosity along.'),text('遇见喜欢的景点后，小豚会把这份好奇带进你的旅行安排。','Choose a place that speaks to you, then weave it into your trip.'),text('围绕喜欢的风景安排旅行','Plan around what I love')],
      travel:[text('让喜欢，长成一个想法。','Let discovery grow into an idea.'),text(`从${subject}出发，去认识 SPU 社区里用 AI 做真实项目的人。`,`Inspired by ${subject}, meet people creating real projects with AI in SPU.`),text('带着好奇，去认识社区','Meet the community')],
      community:[text('给你的想法，一个起点。','Give your idea a beginning.'),text('把城市里的发现变成接待员的一项特色：讲故事、做文化卡片，或帮助游客慢慢探索。','Turn a city discovery into a concierge feature: storytelling, cultural cards or thoughtful exploration.'),text('带着想法，了解 SAIG','Take my idea to SAIG')],
      saig:[text('从一个喜欢，走到真实作品。','From curiosity to a real creation.'),text(idea?`你的起点：${idea}。以城市 AI 接待员为核心，保留四项必备功能，再加入自己的特色。`:'以城市 AI 接待员为核心，保留四项比赛必备功能，把一路的好奇做成自己的特色。',idea?`Your starting point: ${idea}. Keep all four required concierge functions and add your own distinctive feature.`:'Build on all four required city concierge functions, adding a feature inspired by your discoveries.'),text('整理我的参赛起点','Outline my entry')]
    };
    const bridge=bridges[state.mode];card.querySelector('[data-bridge-title]').textContent=bridge[0];card.querySelector('[data-bridge-copy]').textContent=bridge[1];card.querySelector('[data-bridge-next]').textContent=bridge[2]+' ↗';
    card.querySelector('.experience-idea').hidden=state.mode!=='community';card.querySelector('[data-idea-label]').textContent=text('我的城市接待员创意','My city concierge idea');
    const ideaInput=card.querySelector('.experience-idea input');if(document.activeElement!==ideaInput)ideaInput.value=idea;ideaInput.placeholder=text(`例如：让接待员讲述${subject}的故事`,`For example: tell the stories of ${subject}`);
    card.querySelector('[data-memory-label]').textContent=text(hasMemory?'小豚记得':'记住我的喜欢',hasMemory?'My preferences':'Remember my preferences');
    const names=[text('发现江城','Discover'),text('走进风景','Explore'),text('遇见同路人','Meet creators'),text('创造新可能','Create')];
    card.querySelectorAll('[data-story-mode]').forEach((b,i)=>{b.querySelector('span').textContent=names[i];b.classList.toggle('is-current',b.dataset.storyMode===state.mode);b.classList.toggle('is-visited',visited.has(b.dataset.storyMode));b.setAttribute('aria-current',b.dataset.storyMode===state.mode?'step':'false');});
    setWeather(weather,weatherSource);
    const result=state.messages.findLast(m=>m.role==='assistant')?.result;
    const anchors=sceneLocations(result);card.querySelectorAll('[data-city-place]').forEach(b=>b.classList.toggle('is-in-route',anchors.some(a=>a.match.test(placeName(b.dataset.cityPlace)))));
    if(!selected)card.querySelector('[data-selection]').textContent=text('点一处风景，继续探索。','Choose a place to explore.');
    decorateJournals();
  }
  return {sync,focus,collection:()=>[...collection],setCollection(ids){collection=new Set(ids);write();paintPreview();},preferences:()=>({...profile}),reset(){originals.clear();selected='';lastQuestion='';setWeather('clear');},openMemory};
}
