import {presenterTopics,presenterAudition,replySpeech} from './presenter-content.mjs';
import {PresenterSpeaker} from './presenter-speaker.mjs';
import {PresenterSession,answerBlocks} from './presenter-session.mjs';
import {resolveSubject} from './media-utils.mjs?v=7';

const speakerIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4ZM17 8q4 4 0 8M20 5q7 7 0 14"/></svg>';
const safeSource=value=>{try{const url=new URL(value,location.origin);return url.origin===location.origin||url.protocol==='https:'?url.href:'';}catch{return '';}};

export function installPresenter({getMode,getLocale,getLanguagePreference,getPreferences,getJourneyList,getSubjects=()=>[],reducedMotion}){
  const entry=document.createElement('button');entry.type='button';entry.className='presenter-entry';entry.dataset.noI18n='';
  entry.innerHTML=`<span class="presenter-entry-orb" aria-hidden="true">${speakerIcon}</span><span><strong>让小豚讲解</strong><small>会说、会动，也能回答你的问题</small></span><span aria-hidden="true">↗</span>`;
  document.querySelector('.hero-copy').append(entry);
  const quick=document.createElement('button');quick.type='button';quick.className='presenter-quick';quick.dataset.noI18n='';quick.innerHTML=speakerIcon+'<span>小豚讲解</span>';document.querySelector('.topbar-right').prepend(quick);
  const dialog=document.createElement('dialog');dialog.className='presenter-dialog';dialog.dataset.noI18n='';dialog.setAttribute('aria-labelledby','presenter-title');
  dialog.innerHTML=`<div class="presenter-shell">
    <header class="presenter-header"><div><span class="presenter-eyebrow">江小豚 · 面对面</span><h2 id="presenter-title">跟小豚，认识武汉</h2></div><button type="button" class="presenter-close" aria-label="退出小豚讲解">×</button></header>
    <div class="presenter-layout"><section class="presenter-stage" aria-label="小豚讲解舞台">
      <div class="presenter-stage-meta"><span class="presenter-live"><i></i><span data-presenter-state>准备和你见面</span></span><span class="presenter-topic-note"></span></div>
      <div class="presenter-scenery" aria-hidden="true"><span class="presenter-stage-glyph">江</span><span class="presenter-arc arc-1"></span><span class="presenter-arc arc-2"></span><span class="presenter-horizon"></span></div>
      <div class="presenter-avatar"><img class="presenter-fallback" src="/assets/jiangxiaotun-v5/welcome.webp?v=9" alt="江小豚" hidden><span class="presenter-model-loading">小豚正在过来…</span></div>
      <span class="presenter-drag-hint">你的荆楚引路人 · 江小豚</span>
      <div class="presenter-cards" aria-label="本区讲解重点"></div>
      <div class="presenter-subtitle" aria-live="off"><span>小豚说</span><p>你好呀，想从哪里聊起？</p></div>
    </section><section class="presenter-conversation" aria-label="与小豚互动">
      <nav class="presenter-topics" aria-label="切换讲解主题"></nav>
      <div class="presenter-talk-heading"><span class="presenter-knowledge">项目知识库</span><label class="presenter-answer-mode">问答方式<select aria-label="小豚问答方式"><option value="ai">AI + 项目资料</option><option value="local">资料直答</option></select></label></div>
      <div class="presenter-transcript" role="log" aria-live="polite" aria-label="小豚讲解记录"></div>
      <div class="presenter-pending" role="status" hidden>小豚正在查阅资料，想一想…</div>
      <div class="presenter-prompts" aria-label="可以这样问小豚"></div><button type="button" class="presenter-intro">听本区开场 ↻</button>
      <form class="presenter-form"><label class="sr-only" for="presenter-question">向讲解中的小豚提问</label><textarea id="presenter-question" rows="2" maxlength="2500" placeholder="问问小豚，或者让她接着讲…"></textarea><div><span>Enter 提问 · Shift + Enter 换行</span><button type="submit">问小豚 ↗</button><button type="button" class="presenter-cancel" hidden>取消回答</button></div></form>
    </section></div>
    <footer class="presenter-controls"><div class="presenter-playback"><button type="button" data-presenter-play aria-label="重听本段">▶ <span>重听本段</span></button><button type="button" data-presenter-stop>■ <span>停止</span></button><div class="presenter-progress" role="progressbar" aria-label="本段朗读进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></div>
      <label class="presenter-auto"><input type="checkbox" checked>朗读新回答</label><details class="presenter-voice-settings"><summary>声音设置</summary><div><label>小豚的声音<select class="presenter-voice"><option value="zh-CN-XiaoyiNeural">小豚 · 少女帝王音</option></select></label><label>语速<select class="presenter-rate"><option value="-1">从容</option><option value="0" selected>利落</option><option value="1">轻快</option></select></label><p>清澈、有精神，说话利落有底气。开场可直接听，新的回答需要联网准备声音。</p><button type="button" class="presenter-audition">试听小豚的声音 ▶</button></div></details>
    </footer><p class="presenter-notice" role="status" hidden></p>
  </div>`;
  document.body.append(dialog);
  const find=selector=>dialog.querySelector(selector),transcript=find('.presenter-transcript');
  let mode=getMode(),avatar,avatarLoading,turn=0,request,requestTimer,pendingTimer,noticeTimer,openedBy,currentText='',currentEmotion='happy',currentResult,currentAudio,answerModeTouched=false,lastCue=-1;
  const session=new PresenterSession(),introDone=new Set();
  let settings={};try{settings=JSON.parse(localStorage.getItem('xiaotun-presenter-settings-v1'))||{};}catch{}
  find('.presenter-answer-mode select').value=settings.answerMode==='local'?'local':'ai';
  find('.presenter-rate').value=['-1','0','1'].includes(settings.rate)?settings.rate:'0';
  find('.presenter-auto input').checked=settings.autoRead!==false;
  const localOnly=()=>find('.presenter-answer-mode select').value==='local';
  function saveSettings(){try{localStorage.setItem('xiaotun-presenter-settings-v1',JSON.stringify({voice:find('.presenter-voice').value,rate:find('.presenter-rate').value,autoRead:find('.presenter-auto input').checked,answerMode:find('.presenter-answer-mode select').value}));}catch{}}
  const labels={idle:'在听你说',preparing:'准备声音中',speaking:'正在为你讲解',paused:'讲解已暂停',thinking:'查阅资料中'};
  const notify=message=>{find('.presenter-notice').textContent=message;find('.presenter-notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>find('.presenter-notice').hidden=true,7000);};
  const speaker=new PresenterSpeaker({onState:status=>{
    dialog.dataset.speech=status;find('[data-presenter-state]').textContent=labels[status];
    const play=find('[data-presenter-play]');play.innerHTML=status==='speaking'?'Ⅱ <span>暂停讲解</span>':status==='paused'?'▶ <span>继续讲解</span>':status==='preparing'?'Ⅱ <span>准备中 · 可暂停</span>':'▶ <span>重听本段</span>';
    play.setAttribute('aria-label',play.textContent.trim());
    const acting=request?'thinking':status==='speaking'?'speaking':status==='preparing'?'greeting':'listening';avatar?.setState(acting);
  },onProgress:(amount,time,chunk)=>{
    const bar=find('.presenter-progress');bar.setAttribute('aria-valuenow',String(Math.round(amount*100)));bar.querySelector('i').style.width=`${amount*100}%`;
    let sentence='';
    if(currentText){const text=chunk?.text||currentText,sentences=text.match(/[^。！？.!?]+[。！？.!?]*/gu)||[text];let end=0;const offset=(chunk?.part??amount)*text.length;sentence=sentences.find(part=>{end+=part.length;return offset<end;})||sentences.at(-1);find('.presenter-subtitle p').textContent=sentence;}
    const cards=[...find('.presenter-cards').children],matched=cards.findIndex(card=>card.dataset.keywords.split('|').some(word=>sentence.includes(word))),active=matched>=0?matched:Math.min(cards.length-1,Math.floor(amount*cards.length));
    cards.forEach((card,i)=>card.classList.toggle('is-current',i===active));if(active!==lastCue&&amount>0){lastCue=active;avatar?.cue();}
  },onError:notify});
  function options(){
    const value=find('.presenter-voice').value,locale=currentResult?.meta?.locale||getLocale();
    const nativeVoice=globalThis.speechSynthesis?.getVoices().find(voice=>'browser:'+voice.voiceURI===value);
    return {voice:value,rate:Number(find('.presenter-rate').value),locale,nativeVoice};
  }
  function say(text,result,extra={}){currentText=text;currentResult=result;currentAudio=extra.audioUrl;lastCue=-1;avatar?.setEmotion(currentEmotion);find('.presenter-subtitle p').textContent=text.match(/[^。！？.!?]+[。！？.!?]*/u)?.[0]||text;speaker.play(text,{...options(),...extra});}
  function record(role,text,result){session.add(mode,role,text,result);addTranscript(role,text,result);while(transcript.children.length>40)transcript.firstElementChild.remove();}
  function addTranscript(role,text,result){
    const article=document.createElement('article');article.className='presenter-line '+role;
    const name=document.createElement('span');name.className='presenter-line-name';name.textContent=role==='user'?'你':'江小豚';article.append(name);
    if(role==='user'){const content=document.createElement('p');content.textContent=text;article.append(content);}
    else for(const block of answerBlocks(text)){
      if(block.type==='table'){const wrap=document.createElement('div');wrap.className='presenter-table-scroll';const table=document.createElement('table');
        const head=table.createTHead().insertRow();for(const text of block.headers){const cell=document.createElement('th');cell.scope='col';cell.textContent=text;head.append(cell);}
        const body=table.createTBody();for(const row of block.rows){const tr=body.insertRow();for(const text of row){const cell=tr.insertCell();cell.textContent=text;}}wrap.append(table);article.append(wrap);
      }else{const content=document.createElement(block.type==='heading'?'h3':'p');content.textContent=(block.type==='item'?'• ':'')+block.text;article.append(content);}
    }
    if(result){
      const provenance=document.createElement('small');provenance.className='presenter-provenance';provenance.textContent=result.meta?.mode==='local'?'项目资料直答':result.meta?.mode==='error'?'本次回答未完成':'结合项目知识库回答';article.append(provenance);
      if(result.meta?.mode==='local'&&result.meta.reason&&result.meta.reason!=='你选择了资料直答。'){const reason=document.createElement('small');reason.className='presenter-provenance';reason.textContent=result.meta.reason;article.append(reason);}
      if(result.itinerary?.days?.length)appendPlan(article,result.itinerary);
      appendPictures(article,result.places||[]);
      if(result.meta?.mode!=='error'){const listen=document.createElement('button');listen.type='button';listen.className='presenter-read-answer';listen.textContent='听这一条 ▶';listen.addEventListener('click',()=>{if(request)return;currentEmotion=result.emotion||'neutral';stageCards(result);say(replySpeech(result),result);});article.append(listen);}
      appendSources(article,result.sources||[]);
    }
    transcript.append(article);requestAnimationFrame(()=>article.scrollIntoView({block:'nearest',behavior:reducedMotion.matches?'instant':'smooth'}));
  }
  function appendSources(article,sources){
    if(!sources.length)return;
    const details=document.createElement('details'),summary=document.createElement('summary');details.append(summary);
    for(const source of sources){const href=safeSource(source.url);if(!href)continue;const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=source.title+(source.page?` · 第${source.page}页`:'');details.append(link);}
    if(details.childElementCount===1)return;summary.textContent=`查看讲解来源 · ${details.childElementCount-1}`;
    article.append(details);
  }
  function appendPlan(article,plan){
    const details=document.createElement('details'),summary=document.createElement('summary');
    summary.textContent=`查看${plan.days.length}天行程、预算与提醒`;details.className='presenter-plan';details.append(summary);
    const paragraph=text=>{if(!text)return;const p=document.createElement('p');p.textContent=text;details.append(p);};
    paragraph(plan.title);paragraph(plan.summary);
    for(const assumption of plan.assumptions||[])paragraph('安排依据：'+assumption);
    for(const day of plan.days){paragraph(`第${day.day}天 · ${day.title}`);for(const stop of day.stops||[])paragraph([stop.time,stop.name,stop.description,stop.transport,stop.cost].filter(Boolean).join(' · '));}
    for(const budget of plan.budget||[])paragraph(`预算 · ${budget.item}：${budget.amount}`);
    for(const note of plan.notes||[])paragraph('出行提醒：'+note);
    const copy=document.createElement('button');copy.type='button';copy.textContent='复制完整行程';copy.className='presenter-read-answer';copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText([...details.querySelectorAll('p')].map(p=>p.textContent).join('\n\n'));notify('行程已复制。');}catch{notify('复制暂不可用，可以选中行程文字复制。');}});details.append(copy);article.append(details);
  }
  function appendPictures(article,places){
    const subjects=getSubjects(),seen=new Set(),gallery=document.createElement('div');gallery.className='presenter-pictures';
    for(const place of places){
      const subject=resolveSubject(subjects,place),picture=subject?.image;
      if(!picture?.src||seen.has(subject.id))continue;seen.add(subject.id);
      const src=safeSource(picture.src);if(!src||new URL(src).origin!==location.origin)continue;
      const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=src;img.alt=picture.alt||subject.name;img.loading='lazy';figure.append(img);caption.textContent=subject.name;figure.append(caption);
      const source=safeSource(picture.sourceUrl);if(source){const link=document.createElement('a');link.href=source;link.target='_blank';link.rel='noopener noreferrer';link.textContent='影像来源 ↗';figure.append(link);}
      gallery.append(figure);if(seen.size===3)break;
    }
    if(gallery.children.length)article.append(gallery);
  }
  function showPrompts(questions=presenterTopics[mode].questions){
    find('.presenter-prompts').replaceChildren();questions.slice(0,3).forEach(text=>{const button=document.createElement('button');button.type='button';button.textContent=text+' ↗';button.addEventListener('click',()=>ask(text));find('.presenter-prompts').append(button);});
  }
  function stageCards(result){
    const topic=presenterTopics[mode],places=(result?.places||[]).map(place=>resolveSubject(getSubjects(),place)).filter(Boolean).slice(0,3);
    const items=places.length?places.map(place=>({title:place.name,description:place.description,glyph:place.area||'游',image:place.image,question:`请介绍${place.name}，有什么值得了解的？`})):
      topic.cards.map(([title,description,glyph],i)=>({title,description,glyph,question:topic.questions[i]}));
    find('.presenter-cards').replaceChildren();
    items.forEach(item=>{const button=document.createElement('button');button.type='button';button.className='presenter-story-card';button.dataset.keywords=[item.title,...item.description.split(/[、·，与]/).filter(word=>word.length>=2)].join('|');button.innerHTML='<span></span><strong></strong><small></small>';button.children[0].textContent=item.glyph;button.children[1].textContent=item.title;button.children[2].textContent=item.description;
      if(item.image?.src?.startsWith('/assets/')){const img=document.createElement('img');img.src=item.image.src;img.alt='';button.children[0].replaceChildren(img);}
      button.addEventListener('click',()=>ask(item.question));find('.presenter-cards').append(button);
    });
  }
  function updateTopic(next){
    mode=presenterTopics[next]?next:'wuhan';const topic=presenterTopics[mode];dialog.dataset.topic=mode;
    find('#presenter-title').textContent=topic.title;find('.presenter-topic-note').textContent=topic.eyebrow;find('.presenter-stage-glyph').textContent=topic.cards[0][2];
    find('.presenter-topics').querySelectorAll('button').forEach(button=>{button.classList.toggle('is-active',button.dataset.topic===mode);button.setAttribute('aria-pressed',String(button.dataset.topic===mode));});
    const saved=session.latestReply(mode);stageCards(saved?.result);showPrompts(saved?.result?.followups?.length?saved.result.followups:topic.questions);
    avatar?.setTopic(mode);transcript.replaceChildren();session.entries(mode).forEach(item=>addTranscript(item.role,item.content,item.result));
    currentResult=saved?.result;currentText=saved?replySpeech(saved.result||{answer:saved.content}):'';currentAudio=saved?.content===topic.greeting&&options().voice==='zh-CN-XiaoyiNeural'&&options().rate===0?`/assets/presenter/voices/${mode}-imperial-v2.mp3`:undefined;currentEmotion=saved?.result?.emotion||'happy';avatar?.setEmotion(currentEmotion);
  }
  for(const [id,topic]of Object.entries(presenterTopics)){const button=document.createElement('button');button.type='button';button.dataset.topic=id;button.textContent=topic.short;button.addEventListener('click',()=>{if(mode===id)return;cancelRequest();speaker.stop();updateTopic(id);if(!introDone.has(mode))intro();else{find('.presenter-subtitle p').textContent='上次的讲解还在，接着问我，或者再听本区开场。';avatar?.setState('listening');}});find('.presenter-topics').append(button);}
  function intro(){
    const topic=presenterTopics[mode];currentEmotion='happy';
    stageCards();showPrompts();
    if(!introDone.has(mode)){record('assistant',topic.greeting);introDone.add(mode);}
    const selected=options();say(topic.greeting,undefined,selected.voice==='zh-CN-XiaoyiNeural'&&selected.rate===0?{audioUrl:`/assets/presenter/voices/${mode}-imperial-v2.mp3`}:{});
    avatar?.greet();
  }
  async function loadAvatar(){
    if(avatar||avatarLoading)return;avatarLoading=true;
    try{const module=await import('./presenter-avatar.mjs?v=3');if(!dialog.isConnected)return;avatar=module.createPresenterAvatar(find('.presenter-avatar'),{reducedMotion,audioLevel:()=>speaker.level(),onReady:()=>{find('.presenter-model-loading').hidden=true;},onError:()=>{find('.presenter-model-loading').hidden=true;find('.presenter-fallback').hidden=false;notify('动作暂未载入，先让原版小豚陪你讲解。');}});avatar.setTopic(mode);avatar.setEmotion(currentEmotion);avatar.setState(speaker.status==='speaking'?'speaking':'greeting');if(currentText===presenterTopics[mode].greeting)avatar.greet();}
    catch{find('.presenter-model-loading').hidden=true;find('.presenter-fallback').hidden=false;notify('角色动作尚未载入，讲解与提问仍可使用。');}
    finally{avatarLoading=false;}
  }
  function open(event){
    if(dialog.open)return;openedBy=event?.currentTarget||entry;updateTopic(getMode());dialog.showModal();document.body.classList.add('presenter-open');loadAvatar();
    if(!introDone.has(mode))intro();else{find('.presenter-subtitle p').textContent='欢迎回来，上次的讲解还在。想从哪里继续？';avatar?.setState('listening');}
    fetch('/api/health').then(r=>r.json()).then(value=>{find('.presenter-knowledge').textContent=`${value.documents}份原始资料 · 图文知识库`;if(!value.configured&&!answerModeTouched){find('.presenter-answer-mode select').value='local';notify('当前使用项目资料直答，在线 AI 尚未配置。');}}).catch(()=>{});
  }
  function cancelRequest(){turn++;request?.abort();request=null;clearTimeout(requestTimer);clearInterval(pendingTimer);find('.presenter-pending').hidden=true;find('.presenter-form button[type=submit]').disabled=false;find('.presenter-cancel').hidden=true;}
  function close(){cancelRequest();speaker.stop();dialog.close();}
  dialog.addEventListener('close',()=>{cancelRequest();speaker.stop();avatar?.setState('idle');document.body.classList.remove('presenter-open');openedBy?.focus({preventScroll:true});});
  dialog.addEventListener('cancel',()=>{cancelRequest();speaker.stop();});find('.presenter-close').addEventListener('click',close);entry.addEventListener('click',open);quick.addEventListener('click',open);
  async function ask(question){
    question=String(question||'').trim();if(!question)return;if(request){notify('小豚正在想这个问题，可以先取消再问。');return;}
    speaker.stop();record('user',question);find('#presenter-question').value='';
    request=new AbortController();const controller=request,serial=++turn;requestTimer=setTimeout(()=>controller.abort('timeout'),315000);
    find('.presenter-pending').hidden=false;find('.presenter-form button[type=submit]').disabled=true;find('.presenter-cancel').hidden=false;avatar?.setState('thinking');find('[data-presenter-state]').textContent=labels.thinking;
    const started=Date.now();find('.presenter-pending').textContent='小豚正在查阅资料，想一想…';find('.presenter-subtitle p').textContent='我先查一下项目资料，把细节想周全。';
    pendingTimer=setInterval(()=>{const seconds=Math.floor((Date.now()-started)/1000);find('.presenter-pending').textContent=seconds<15?'小豚正在查阅资料，想一想…':`${mode==='travel'?'正在整理路线、交通和预算':'正在组织回答'} · 已等待 ${seconds} 秒，可以随时取消`;},1000);
    try{
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,presentation:true,locale:getLanguagePreference(),uiLocale:getLocale(),localOnly:localOnly(),messages:session.messages(mode),previousItinerary:mode==='travel'?session.latestPlan(mode):undefined,preferences:getPreferences(),journeyList:mode==='travel'?getJourneyList():undefined}),signal:controller.signal});
      const result=await response.json();if(!response.ok)throw Error(result.error||'这次没能连接上，请重试。');if(serial!==turn||!dialog.open)return;
      record('assistant',result.answer,result);stageCards(result);showPrompts(result.followups?.length?result.followups:presenterTopics[mode].questions);currentEmotion=result.emotion||'neutral';avatar?.setEmotion(currentEmotion);currentResult=result;currentText=replySpeech(result);currentAudio=undefined;
      request=null;avatar?.setState('listening');find('[data-presenter-state]').textContent=labels.idle;
      if(find('.presenter-auto input').checked)say(currentText,result);else find('.presenter-subtitle p').textContent='回答已放在旁边，点“重听本段”也可以听我讲。';
    }catch(error){
      if(serial!==turn)return;
      const text=controller.signal.aborted?(controller.signal.reason==='timeout'?'这次回答等待较久，请重试，或切换资料直答先看项目参考。':'这次回答已取消，你可以调整问题再问我。'):error.message;
      record('assistant',text,{meta:{mode:'error'}});notify(text);request=null;avatar?.setState('listening');find('[data-presenter-state]').textContent=labels.idle;
    }finally{if(serial===turn){clearTimeout(requestTimer);clearInterval(pendingTimer);find('.presenter-pending').hidden=true;find('.presenter-form button[type=submit]').disabled=false;find('.presenter-cancel').hidden=true;}}
  }
  find('.presenter-form').addEventListener('submit',event=>{event.preventDefault();ask(find('#presenter-question').value);});
  find('#presenter-question').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();ask(event.currentTarget.value);}});
  find('#presenter-question').addEventListener('focus',()=>{if(!request&&speaker.status==='idle')avatar?.setState('listening');});
  find('.presenter-cancel').addEventListener('click',()=>{cancelRequest();avatar?.setState('listening');find('[data-presenter-state]').textContent=labels.idle;record('assistant','已取消这次回答，你可以继续问我。');});
  find('[data-presenter-play]').addEventListener('click',()=>{if(request)return;if(['speaking','preparing'].includes(speaker.status))speaker.pause();else if(speaker.status==='paused')speaker.resume();else if(currentText)say(currentText,currentResult,currentAudio?{audioUrl:currentAudio}:{});});
  find('[data-presenter-stop]').addEventListener('click',()=>{speaker.stop();find('.presenter-subtitle p').textContent='讲解已停止，想接着听就点“重听本段”。';});
  find('.presenter-intro').addEventListener('click',()=>{if(request)return;intro();});
  find('.presenter-audition').addEventListener('click',()=>{currentEmotion='serious';say(presenterAudition,undefined,options().voice==='zh-CN-XiaoyiNeural'&&options().rate===0?{audioUrl:'/assets/presenter/voices/audition-imperial-v2.mp3'}:{});});
  find('.presenter-auto input').addEventListener('change',event=>{if(!event.target.checked)speaker.stop();saveSettings();});
  find('.presenter-answer-mode select').addEventListener('change',()=>{answerModeTouched=true;saveSettings();notify(localOnly()?'已选择项目资料直答。':'已选择 AI 结合项目资料回答。');});
  for(const selector of ['.presenter-voice','.presenter-rate'])find(selector).addEventListener('change',()=>{speaker.stop();currentAudio=undefined;saveSettings();notify('已调整声音，点“重听本段”试听。');});
  fetch('/api/presenter/voices').then(r=>r.json()).then(({voices})=>{
    const select=find('.presenter-voice');select.replaceChildren();for(const voice of voices||[]){const option=document.createElement('option');option.value=voice.id;option.textContent=voice.label;select.append(option);}addBrowserVoices();
    if(!select.options.length){const option=document.createElement('option');option.value='';option.textContent='当前设备没有可用音色';select.append(option);}
    if([...select.options].some(option=>option.value===settings.voice))select.value=settings.voice;
  }).catch(()=>addBrowserVoices());
  function addBrowserVoices(){
    const select=find('.presenter-voice'),selected=select.value;
    select.querySelectorAll('option[value^="browser:"]').forEach(option=>option.remove());
    for(const voice of globalThis.speechSynthesis?.getVoices()||[]){if(/Kangkang|male\b/i.test(voice.name)&&!/female/i.test(voice.name))continue;const option=document.createElement('option');option.value='browser:'+voice.voiceURI;option.textContent=voice.name+' · '+voice.lang;select.append(option);}
    if([...select.options].some(option=>option.value===selected))select.value=selected;
  }
  globalThis.speechSynthesis?.addEventListener('voiceschanged',addBrowserVoices);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)speaker.pause();});
  window.addEventListener('pagehide',()=>{cancelRequest();speaker.stop();avatar?.dispose();});
  return {sync(next){entry.querySelector('strong').textContent='让小豚讲解 · '+presenterTopics[next].short;quick.setAttribute('aria-label','让小豚讲解'+presenterTopics[next].short);},open};
}
