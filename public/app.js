import {installJourneyList} from '/journey-list.mjs?v=1';
import {installPresenter} from '/presenter.mjs?v=4';
import {CHAT_SESSIONS_KEY,loadChatWorkspace,saveChatSession,createChatSession,installSessionLibrary} from '/chat-sessions.mjs?v=1';
import {installSiteLayout} from '/site-layout.mjs?v=2';
import {installAnswerLayout, renderPlanOverview, itinerarySubjects, readMarkdownTable, revisionPlanForDraft} from '/answer-layout.mjs?v=1';
import {moduleUrl,modeFromUrl} from '/module-navigation.mjs?v=1';
import {receptionEntry} from '/reception-entry.mjs?v=1';
import {installAtlasMascot} from '/atlas-mascot.mjs?v=1';
import { cleanCitationTokens, enrichPlaces, matchesAtlasSubject, stripModelImages, resolveSubject } from '/media-utils.mjs?v=7';
import { expressions, receptionEmotion, mascotAsset } from '/mascot.mjs?v=2';
import { normalizeFollowups } from '/followups.mjs?v=1';
import {composerGuidance} from '/composer-guidance.mjs?v=1';
import {installShellChrome} from '/shell-chrome.mjs?v=4';
import { recoverReplyFormat } from '/reply-format.mjs?v=1';
import { installMascotGreeting } from '/mascot-greeting.mjs?v=7';
import {initLanguages,localize,t,getLocale,getLanguagePreference} from '/i18n.mjs?v=4';
import {localizedHeadline} from '/hero-languages.mjs?v=2';
import {installTravelScene} from '/travel-scene.mjs?v=24';
import {plannerChoices} from '/travel-plan.mjs?v=2';
import {travelPlannerCopy} from '/travel-copy.mjs?v=5';
import {installCityExperience} from '/city-experience.mjs?v=10';
import {installModuleScrolls} from '/module-scrolls.mjs?v=9';
import {installWuhanStory} from '/wuhan-story.mjs?v=8';
import {reviseJournal} from '/experience-core.mjs?v=1';
import {installCommunityScene} from '/community-scene.mjs?v=27';
import {installChuScene} from '/chu-scene.mjs?v=7';
import {installSoftScene} from '/mascot-soft-scene.mjs?v=18';
import {installSaigScene} from '/saig-scene.mjs?v=22';
import {transitPlan,routeCapsule,transitText,installTransitMotion} from '/transit-capsules.mjs?v=2';
await initLanguages();
const icons = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  city: '<path d="M3 21h18M5 21V9h6v12M11 21V4h8v17M7.5 12h.1m-.1 4h.1M14 8h2M14 12h2M14 16h2"/>',
  community: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M8 9h.1M12 9h.1M16 9h.1M8 12h.1M12 12h.1M16 12h.1"/>',
  route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4"/>',
  pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1v15"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  'arrow-up': '<path d="M12 19V5m-6 6 6-6 6 6"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  mountain: '<path d="m2 20 7-14 5 8 3-5 5 11H2ZM6 12l3 2 2-2"/>',
  museum: '<path d="m3 8 9-5 9 5H3ZM3 21h18M5 10v8m5-8v8m4-8v8m5-8v8"/>',
  tower: '<path d="M6 21h12M8 21v-5h8v5M5 16h14l-3-3H8l-3 3ZM6 11h12l-3-3H9l-3 3ZM8 6h8l-4-4-4 4Z"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => {
  if (el.classList.contains('entry-icon')) { el.innerHTML = icon(el.dataset.icon); el.removeAttribute('data-icon'); }
  else el.outerHTML = icon(el.dataset.icon);
});
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STORE = 'jiang-xiaotun-chat-v1';
const modes = {
  wuhan: { label: '城市会客厅', title: '一江两岸，<br>与武汉<span class="accent-word">相遇。</span>', description: '我是江小豚，你的城市 AI 接待员。<br>从千年荆楚到明日灵感，陪你走进武汉的每一种可能。', question: '第一次来武汉，请介绍武汉的城市特色、文化、美食和代表景点。' },
  community: { label: 'SPU 社区', title: '在这里，<br>让想法<span class="accent-word">发生。</span>', description: '认识智民里与光谷的数命 SPU 社区。<br>从学习 AI，到协作完成一个真实项目。', question: '请介绍数命SPU社区的定位、两处布局、参与人群和规划中的设施。' },
  travel: { label: '我的武汉旅行', title: '通达三镇，<br>畅游<span class="accent-word">武汉。</span>', description: '和谁同行、住在哪里、喜欢什么？<br>让小豚按你的节奏，整理一份武汉行程。' },
  saig: { label: 'SAIG 赛事指南', title: '一个人，<br>创造更多<span class="accent-word">可能。</span>', description: '从真实需求出发，与 AI 一起交付答案。<br>了解 SAIG 的参赛要求、赛程与提交材料。', question: '请介绍SPU的含义，以及SAIG比赛的参赛条件、提交要求和关键时间。' }
};
const readStored=key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
let chatWorkspace=loadChatWorkspace(readStored(CHAT_SESSIONS_KEY),readStored(STORE));
function sessionState(session){return {mode:session.mode,localOnly:session.localOnly,messages:session.messages.map(message=>{
  if(message.role!=='assistant')return structuredClone(message);
  const result=recoverReplyFormat(message.result||{answer:message.content});return {...structuredClone(message),content:result.answer,result};
})};}
let state=sessionState(chatWorkspace.sessions.find(s=>s.id===chatWorkspace.activeId));
$('#message-input').value=chatWorkspace.sessions.find(s=>s.id===chatWorkspace.activeId).draft;
let mediaSubjects = [], atlasFilter = '全部', cityOverview = false;
let busy = false, currentRequest = null, health = null, toastTimer;
let dayRevisionDraft=null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const shellChrome = installShellChrome({getLocale, reducedMotion});
const atlasMascot = installAtlasMascot({reducedMotion});
const syncTransitMotion=installTransitMotion();
const chuScene=installChuScene({onAsk:question=>sendQuestion(question),onOpenChapter:()=>setMode('wuhan',{historyAction:'initial'})});
const travelScene=installTravelScene({onAsk:question=>sendQuestion(question),reducedMotion});
const communityScene=installCommunityScene({onAsk:()=>sendQuestion(t('我不会编程，可以参与数命SPU社区吗？社区哪些设施已经开放？')),reducedMotion});
const softScene=installSoftScene({reducedMotion});
const saigScene=installSaigScene({reducedMotion,onAsk:()=>sendQuestion(t('请介绍SAIG比赛的参赛条件、提交材料和关键时间。'))});
const presenter=installPresenter({getMode:()=>state.mode,getLocale,getLanguagePreference,getPreferences:()=>cityExperience.preferences(),getJourneyList:()=>journeyList.selection(),getSubjects:()=>mediaSubjects,reducedMotion});
const cityExperience=installCityExperience({getState:()=>state,getLocale,getSubjects:()=>mediaSubjects,onAsk:(question,plan)=>sendQuestion(question,plan),onNavigate:setMode,notify:toast,onCollectionChange:ids=>journeyList.replaceWeatherCollection(ids),
  onJournalChange(index,action){
    const message=state.messages[index];if(!message?.result?.itinerary||busy)return;
    const next=action.type==='restore'?action.plan:reviseJournal(message.result.itinerary,action,state.messages.slice(0,index));
    if(!next){toast('这一步暂时无法调整。');return;}
    if(action.type==='restore')delete message.originalItinerary;
    else if(!message.originalItinerary)message.originalItinerary=structuredClone(message.result.itinerary);
    message.result={...message.result,itinerary:next,meta:{...message.result.meta,journalEdited:action.type!=='restore'}};
    save();render();
  }});
const moduleScrolls=installModuleScrolls({getLocale,onAsk:question=>sendQuestion(question)});
const wuhanStory=installWuhanStory({getLocale,getSubjects:()=>mediaSubjects});
const siteLayout=installSiteLayout({getLocale,onOpenPlanner:()=>openDialog($('#planner-dialog'))});
const answerLayout=installAnswerLayout({getState:()=>state,getLocale,onDraft:(draft,plan)=>{
  if(busy){toast('请等待当前回答完成。');return;}
  const input=$('#message-input');
  if(input.value.trim()){toast('输入框里还有未发送的内容，请先发送或清空，再修改这一天。');input.focus();return;}
  dayRevisionDraft={prefix:draft,plan:structuredClone(plan)};
  input.value=draft;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
  input.scrollIntoView({behavior:scrollBehavior(),block:'center'});
  toast('已填写修改范围，请补充要求后发送。');
}});
const sessionLibrary=installSessionLibrary({getWorkspace:()=>chatWorkspace,getLocale,onOpen:openSavedSession,onRename:name=>{
  if(!save())return false;
  return persistWorkspace({...chatWorkspace,sessions:chatWorkspace.sessions.map(s=>s.id===chatWorkspace.activeId?{...s,title:name,customTitle:true}:s)});
}});
const journeyList=installJourneyList({getSubjects:()=>mediaSubjects,getLocale,getMessages:()=>state.messages,legacyIds:cityExperience.collection(),onCollectionChange:ids=>cityExperience.setCollection(ids),onPlan:question=>{if(busy){toast('请等待当前回答完成，或先取消。');return;}if($('#message-input').value.trim()){toast('清单已保存。请先发送或清空输入框里的草稿，再按清单安排。');return;}setMode('travel');sendQuestion(question);},notify:toast});
const characterImages = new Map();
const characterTransitions = new WeakMap();
function preloadCharacter(url) {
  if (!characterImages.has(url)) characterImages.set(url, new Promise(resolve => {
    const image = new Image(); image.onload = () => resolve(true); image.onerror = () => resolve(false); image.src = url;
  }));
  return characterImages.get(url);
}
async function showCharacter(image, emotion, animate = true) {
  if (!image) return;
  const url = mascotAsset(emotion);
  image.dataset.characterEmotion = emotion;
  image.dataset.requestedSrc = url;
  image.alt = `${t('江小豚')} · ${t(expressions[emotion].label)}`;
  if (image.getAttribute('src') === url) return;
  if (!await preloadCharacter(url) || image.dataset.requestedSrc !== url) return;
  image.src = url;
  if (animate && !reducedMotion.matches) {
    characterTransitions.get(image)?.cancel();
    characterTransitions.set(image, image.animate([{ opacity: .45, transform: 'translateY(3px) scale(.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 240, easing: 'ease-out' }));
  }
}
function replyEmotion(message, index) {
  const question = state.messages.slice(0, index).findLast(item => item.role === 'user')?.content || '';
  return receptionEmotion({result: message.result || { answer: message.content }, question, mode: state.mode});
}
function syncCharacter() {
  const index = state.messages.findLastIndex(message => message.role === 'assistant');
  const message = state.messages[index];
  const question = state.messages.slice(0, index).findLast(item => item.role === 'user')?.content || '';
  const emotion = receptionEmotion({pending: busy, result: message?.result || {answer: message?.content}, question, mode: state.mode});
  const presence = $('#chat-presence');
  presence.hidden = state.messages.length === 0 || cityOverview;
  presence.dataset.emotion = emotion;
  $('#character-label').textContent = busy ? '小豚正在思考' : expressions[emotion].label;
  $('#character-line').textContent = busy ? '正在查阅资料，把回答整理好。' : expressions[emotion].line;
  showCharacter($('#chat-character'), emotion);
  showCharacter(document.querySelector('.sidebar-guide img'), emotion);
}
const scrollBehavior = () => reducedMotion.matches ? 'instant' : 'smooth';
const navigation = $('.main-nav');
const navIndicator = document.createElement('div');
navIndicator.className = 'nav-active-indicator';
navIndicator.setAttribute('aria-hidden', 'true');
navigation.prepend(navIndicator);
navigation.classList.add('motion-nav');
function syncNavIndicator() {
  const active = navigation.querySelector('.nav-item.active');
  if (!active) return;
  navIndicator.style.height = `${active.offsetHeight}px`;
  navIndicator.style.transform = `translateY(${active.offsetTop}px)`;
}
new ResizeObserver(syncNavIndicator).observe(navigation);
function openDialog(dialog) {
  if (!dialog.open && !dialog.dataset.closing) dialog.showModal();
}
async function closeDialog(dialog) {
  if (!dialog.open || dialog.dataset.closing) return;
  dialog.dataset.closing = 'true';
  if (!reducedMotion.matches) {
    try { await dialog.animate([{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(12px) scale(.98)' }], { duration: 180, easing: 'cubic-bezier(.4,0,1,1)' }).finished; }
    catch { /* Native close remains available if animation is interrupted. */ }
  }
  dialog.close(); delete dialog.dataset.closing;
}
function persistWorkspace(next){
  try{localStorage.setItem(CHAT_SESSIONS_KEY,JSON.stringify(next));chatWorkspace=next;return true;}
  catch{toast('本机存储未能保存，原对话仍保留在当前页面。请导出重要内容后释放浏览器空间。');return false;}
}
function save(){
  const latest=readStored(CHAT_SESSIONS_KEY);
  const base=latest?.version===1?loadChatWorkspace(latest):chatWorkspace;
  const next=saveChatSession(base,chatWorkspace.activeId,state,$('#message-input').value);
  const saved=persistWorkspace(next);sessionLibrary.sync();return saved;
}
function toast(message) { $('#toast').textContent = t(message); $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 3500); }
const mobileLayout = matchMedia('(max-width:760px)');
function syncMenuAccessibility() {
  const open = $('#sidebar').classList.contains('open');
  $('#sidebar').inert = mobileLayout.matches && !open;
  $('.workspace').inert = mobileLayout.matches && open;
  $('#menu-toggle').setAttribute('aria-expanded', String(mobileLayout.matches && open));
}
function closeMenu() { $('#sidebar').classList.remove('open'); $('#sidebar-overlay').hidden = true; syncMenuAccessibility(); }
mobileLayout.addEventListener('change', closeMenu);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('#sidebar').classList.contains('open')) { closeMenu(); $('#menu-toggle').focus(); } });

function safeUrl(value) {
  if (typeof value !== 'string') return '#';
  try {
    const parsed = new URL(value, location.origin);
    if (parsed.origin === location.origin && parsed.pathname.startsWith('/materials/')) return parsed.href;
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
  } catch { /* Refuse script URLs and invalid links. */ }
  return '#';
}

function inline(text, sources = []) {
  const links = [];
  let result = escape(text).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
    const slot = links.length; links.push(`<a href="${escape(safeUrl(url.replace(/&amp;/g, '&')))}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`); return `\u0000LINK${slot}\u0000`;
  });
  result = result.replace(/(?:https?:\/\/|www\.)[a-zA-Z0-9._~:/?#\[\]@!$&()*+,;=%-]+/g, value => {
    const url = value.replace(/[.,;]+$/, '');
    const suffix = value.slice(url.length);
    const slot = links.length; links.push(`<a href="${escape(safeUrl(url.startsWith('www.') ? 'https://' + url : url.replace(/&amp;/g, '&')))}" target="_blank" rel="noopener noreferrer">${escape(url.replace(/&amp;/g, '&'))} ↗</a>`); return `\u0000LINK${slot}\u0000${suffix}`;
  });
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  result = result.replace(/[\[【（(]\s*((?:(?:K|M)\d+|O1)(?:\s*[,，、;；]\s*(?:(?:K|M)\d+|O1))*)\s*[\]】）)]/gi, (_, ids) => [...new Set(ids.match(/(?:K|M)\d+|O1/gi))].map(id => {
    const index = sources.findIndex(s => s.id === id);
    if (index < 0) return '';
    const source = sources[index];
    return `<a class="inline-source" href="${escape(safeUrl(source.url))}" target="_blank" rel="noopener noreferrer" title="${escape(source.title)}${source.page ? ` · PDF ${source.page}` : ''}">${escape(t('查看来源'))} ${index + 1}</a>`;
  }).join(''));
  return cleanCitationTokens(result).replace(/\u0000LINK(\d+)\u0000/g, (_, n) => links[Number(n)] || '');
}

function markdown(text, sources) {
  const lines = stripModelImages(text).split('\n');
  let html = '', listType = '', paragraph = [];
  const endParagraph = () => { if (paragraph.length) { html += `<p>${paragraph.map(t => inline(t, sources)).join('<br>')}</p>`; paragraph = []; } };
  const endList = () => { if (listType) { html += `</${listType}>`; listType = ''; } };
  for (let position=0;position<lines.length;position++) {
    let line = lines[position].trim();
    const table=readMarkdownTable(lines,position,cell=>inline(cell,sources));
    if(table){endParagraph();endList();html+=table.html;position=table.end-1;continue;}
    if (!line) { endParagraph(); endList(); continue; }
    const heading = line.match(/^#{1,4}\s+(.+)/);
    if (heading) { endParagraph(); endList(); html += `<h3>${inline(heading[1], sources)}</h3>`; continue; }
    const item = line.match(/^([-*]|\d+[.、])\s+(.+)/);
    if (item) { endParagraph(); const type = /^\d/.test(item[1]) ? 'ol' : 'ul'; if (listType !== type) { endList(); html += `<${type}>`; listType = type; } html += `<li>${inline(item[2], sources)}</li>`; continue; }
    endList(); paragraph.push(line);
  }
  endParagraph(); endList(); return html;
}

function itineraryText(plan, history = state.messages) {
  return cleanCitationTokens([plan.title, plan.summary, ...(plan.assumptions || []), ...(plan.days || []).flatMap(day => [
    `\nDAY ${day.day} · ${day.title}`, ...day.stops.map(s => `${s.time} ${s.name}\n${s.description}\n${t('交通')}: ${s.transport || '—'}\n${t('费用')}: ${s.cost || '—'}`)
  ]), '\n'+transitText(transitPlan(plan,history)), '\n'+t('预算估算'), ...(plan.budget || []).map(b => `${b.item}: ${b.amount}`), '\n'+t('提醒'), ...(plan.notes || [])].join('\n'));
}

function itineraryHtml(plan, index, sources) {
  if (!plan?.days?.length) return '';
  const journey=transitPlan(plan,state.messages.slice(0,index)),days=journey?.days||plan.days;
  const chinese=getLocale().startsWith('zh'),word=(zh,en)=>chinese?zh:en;
  const stopPhoto=stop=>{
    if(/午餐与午休|当天整理与休息|住宿片区用餐与休整|lunch|rest at/i.test(stop.name))return '';
    const subject=resolveSubject(mediaSubjects,stop.name);
    if(!subject?.image)return '';
    return `<figure class="stop-photo"><button type="button" data-photo="${escape(subject.id)}" aria-label="${escape(word('查看图片与来源：','View photo and source: ')+subject.name)}"><img src="${escape(subject.image.src)}" alt="${escape(subject.name)}" width="${subject.image.width}" height="${subject.image.height}" loading="lazy"><span>${escape(word('看大图与来源','Photo & source'))} ↗</span></button><figcaption>${escape(subject.name)} · ${escape(subject.image.type||word('资料图','Reference image'))}</figcaption></figure>`;
  };
  return `<section class="itinerary" aria-label="${escape(cleanCitationTokens(plan.title))}"><div class="itinerary-heading"><span>YOUR WUHAN / JOURNEY NOTES</span><h3>${escape(cleanCitationTokens(plan.title))}</h3><p>${escape(cleanCitationTokens(plan.summary))}</p><div class="plan-section-links"><span>${escape(word('先看概览，再展开每天的安排','Start with the overview, then explore each day'))}</span>${plan.budget?.length?`<button type="button" data-answer-jump="plan-${index}-budget">${escape(word('查看预算','View budget'))} ↓</button>`:''}</div></div>
    ${renderPlanOverview(days,index,chinese)}
    ${plan.assumptions?.length ? `<details class="itinerary-assumptions"><summary>${escape(word('安排依据与旅行条件','Planning assumptions'))}</summary><div>${plan.assumptions.map(s => inline(s, sources)).join('<br>')}</div></details>` : ''}
    ${days.map((day,position) => `<details class="itinerary-day" id="plan-${index}-day-${position}" ${position===0?'open':''}><summary class="day-heading"><span>DAY ${String(day.day).padStart(2, '0')}</span><h4>${escape(cleanCitationTokens(day.title))}</h4><span class="day-disclosure" aria-hidden="true">＋</span></summary><div class="day-content"><div class="day-actions"><button type="button" data-refine-day="${day.day}" data-message="${index}">${escape(word('修改这一天','Revise this day'))}</button></div>${day.stops.map(stop => `<div class="timeline-stop"><span class="stop-time">${escape(cleanCitationTokens(stop.time))}</span><h5>${escape(cleanCitationTokens(stop.name))}</h5>${stopPhoto(stop)}<p>${inline(stop.description, sources)}</p>${(['metro','ferry'].includes(stop.mobility?.kind)||(stop.mobility?.kind==='local'&&stop.mobility.fromPlace!==stop.mobility.toPlace))?routeCapsule(stop.mobility,{t}):stop.transport ? `<div class="stop-logistics">${icon('route')}<span>${inline(stop.transport, sources)}</span></div>` : ''}${routeCapsule(stop.mobility?.ferry,{t})}${stop.cost ? `<div class="stop-logistics"><span>¥</span><span>${inline(stop.cost, sources)}</span></div>` : ''}</div>`).join('')}${journey?.ferry?.day===day.day?routeCapsule(journey.ferry,{t}):''}${day.returnRoute?`<p class="transit-return-label">${escape(t('返回住宿片区'))}</p>${routeCapsule(day.returnRoute,{t,label:t('返回住宿片区')})}`:''}</div></details>`).join('')}
    ${plan.budget?.length ? `<div class="budget-area" id="plan-${index}-budget" tabindex="-1"><h4>${escape(word('预算估算 · 按项目查看','Estimated budget · by category'))}</h4>${plan.budget.map(b => `<div class="budget-row"><span>${escape(cleanCitationTokens(b.item))}</span><span>${escape(cleanCitationTokens(b.amount))}</span></div>`).join('')}</div>` : ''}
    ${plan.notes?.length ? `<details class="itinerary-notes"><summary>${escape(word('预约与出行提醒','Bookings & travel notes'))}</summary><div>${plan.notes.map(n => inline(n, sources)).join('<br>')}</div></details>` : ''}<div class="itinerary-footer"><button data-copy-plan="${index}">${icon('copy')}复制行程</button><button data-export-plan="${index}">${icon('download')}保存行程文本</button></div></section>`;
}

function placeHtml(place, sources = []) {
  const subject = mediaSubjects.find(s => s.id === place.atlasId);
  const photo = subject?.image;
  const community = place.id === 'community' || /数命.*社区/.test(place.name);
  const canonicalName = cleanCitationTokens(place.name);
  const name = cleanCitationTokens(place.displayName || t(canonicalName));
  const person = subject?.kind === 'person';
  const event = subject?.kind === 'event';
  const product = subject?.kind === 'product';
  const entrepreneur = person && subject.tags?.includes('创业');
  const url = community || event ? 'https://www.dlife.love/' : person || product ? safeUrl(subject.factUrl || photo?.sourceUrl) : `https://uri.amap.com/search?keyword=${encodeURIComponent('武汉 ' + canonicalName)}`;
  const imageLabel = { '历史照片':'查看史料', '后人画作':'查看画作', '纪念雕像':'查看雕像', '规划设计图':'图片来源与大图', '赛事资料示意图':'图片来源与大图', '创业团队合影':'图片来源与大图', '官方产品图':'图片来源与大图' }[photo?.type] || '查看实景';
  return `<article class="place-card${person ? ' is-person' : ''}"><div class="place-card-image">${photo ? `<button class="photo-open" data-photo="${escape(subject.id)}" aria-label="${escape(t(imageLabel))}: ${escape(name)}"><img src="${escape(photo.src)}" alt="${escape(name)}" width="${photo.width}" height="${photo.height}" loading="lazy"><span>${escape(t(imageLabel))} ↗</span></button>` : community ? '<img src="/assets/community-concept.webp" alt="社区规划设计图" loading="lazy">' : `<div class="photo-pending">${icon('pin')}<span>图像待补充</span></div>`}</div><div class="place-card-copy"><span>${escape(t(cleanCitationTokens(place.area)))} · ${escape(t(place.category || '景点'))}${photo?.type && photo.type !== '实景照片' ? ` · ${escape(t(photo.type))}` : ''}</span><h4>${escape(name)}</h4><p>${inline(t(place.description), sources)}</p><a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${community ? '官网咨询参访' : event ? '数命与 SAIG 官方网站' : product ? '查看产品官网' : entrepreneur ? '查阅人物资料' : person ? '查阅历史资料' : '在地图中搜索'} ↗</a>${photo ? `<button class="photo-credit" data-photo="${escape(subject.id)}">图片来源与大图</button>` : ''}</div></article>`;
}

function messageHtml(message, index) {
  if (message.role === 'user') return `<article class="message user" id="message-${index}"><div class="message-main"><div class="bubble" dir="auto">${escape(message.content)}</div></div></article>`;
  const stored = message.result || { answer: message.content, sources: [], followups: [] };
  const planNames = stored.itinerary?.days?.flatMap(day => day.stops.map(s => s.name)).join(' ') || '';
  const result = { ...stored, followups: normalizeFollowups(stored.followups), places: enrichPlaces(stored.places, mediaSubjects, `${planNames} ${stored.answer}`, 8) };
  const sources = result.sources || [];
  const illustratedStops = new Set(itinerarySubjects(result.itinerary,mediaSubjects).map(subject=>subject.id));
  const relatedPlaces = result.places.filter(place=>!illustratedStops.has(place.atlasId));
  const placesLabel=getLocale().startsWith('zh')?'相关地点与图片':'Places & images';
  const ai = result.meta?.mode === 'ai';
  const emotion = replyEmotion(message, index);
  return `<article class="message assistant" id="message-${index}" data-emotion="${emotion}"><img class="message-avatar" src="${mascotAsset(emotion, true)}" alt="${escape(t('江小豚'))} · ${escape(t(expressions[emotion].label))}"><div class="message-main"><div class="message-name">江小豚 <span class="message-emotion">${expressions[emotion].label}</span><small>${ai ? escape(t('AI 接待')) + ' · ' + escape(result.meta.model) : '资料直答 · 本地资料'}</small></div>
    ${result.meta?.mode === 'local' ? `<div class="mode-alert"><strong>资料直答</strong> · ${escape(result.meta.reason || '当前使用本地资料，未调用在线AI。')}<br>以下是资料整理与参考建议；复杂问题可在 AI 恢复后重新提问。</div>` : ''}
    <div class="bubble" dir="auto">${markdown(result.answer, sources)}</div>${itineraryHtml(result.itinerary, index, sources)}${relatedPlaces.length ? `<section class="answer-places" aria-label="${escape(placesLabel)}"><h3>${escape(placesLabel)}</h3><div class="place-cards">${relatedPlaces.map(p => placeHtml(p, sources)).join('')}</div></section>` : ''}
    ${sources.length ? `<details class="source-details"><summary>${escape(t('查阅资料来源'))} (${sources.length}) · ${escape(t('原始中文资料'))}</summary><div class="source-details-body">${sources.map(s => `<div><a href="${escape(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗<span>${s.page ? `PDF · ${escape(s.page)}` : s.id === 'O1' ? '2026-10-27' : '原始中文资料'}</span></a><blockquote>${escape(s.excerpt)}</blockquote></div>`).join('')}</div></details>` : ''}
    <div class="message-actions"><button data-copy-message="${index}">${icon('copy')}复制回答</button>${result.meta?.mode === 'local' && !state.localOnly ? `<button data-retry="${index}">${icon('spark')}重试在线 AI</button>` : ''}</div>${result.followups?.length ? `<div class="followups">${result.followups.map(q => `<button data-prompt="${escape(q)}">${escape(q)} ↗</button>`).join('')}</div>` : ''}</div></article>`;
}

function syncComposerGuidance() {
  const guide = composerGuidance(state.mode, getLocale());
  const input = $('#message-input');
  input.dataset.noI18n = '';
  input.placeholder = guide.placeholder;
  $('#planner-button').hidden = !guide.planner;
  $('.composer-zone .disclaimer').hidden = !guide.planner;
  const questions = guide.questions.map(question => `<button type="button" data-prompt="${escape(question)}" dir="auto">${escape(question)}<span aria-hidden="true">${getLocale().startsWith('zh')?'问':'Ask'}</span></button>`).join('');
  $('#composer-suggestions').innerHTML = questions;

}

function render(animate = false) {
  answerLayout.remember();
  const mode = modes[state.mode];
  document.body.dataset.mode = state.mode;
  const headline=localizedHeadline(getLocale(),state.mode);
  $('#hero-title').innerHTML = headline ? `${escape(headline[0])}<br><span class="accent-word">${escape(headline[1])}</span>` : mode.title;
  $('#hero-description').innerHTML = mode.description;
  $('#hero-portrait').alt=`${t('江小豚')} · ${t(expressions.neutral.label)}`;
  $('#page-label').textContent = mode.label;
  document.querySelectorAll('.main-nav [data-mode]').forEach(el => {
    const active = el.dataset.mode === state.mode;
    el.classList.toggle('active', active);
    if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
  });
  $('#local-toggle').setAttribute('aria-pressed', String(state.localOnly));
  $('#welcome').hidden = state.messages.length > 0 && !cityOverview;
  document.body.classList.toggle('chat-active', state.messages.length > 0 && !cityOverview);
  $('#messages').hidden = cityOverview;
  document.querySelectorAll('[data-chu-resume]').forEach(button=>button.hidden = !cityOverview || !state.messages.length);
  $('#messages').innerHTML = state.messages.map(messageHtml).join('');
  syncTransitMotion($('#messages'));
  if (animate) $('#messages').lastElementChild?.classList.add('message-enter');
  $('#send-button').disabled = busy;
  syncCharacter();
  syncNavIndicator();
  $('#language-hint').textContent = t(getLanguagePreference()==='auto' ? '界面跟随浏览器，回答跟随提问语言。' : '切换语言后，新回答使用所选语言；已有对话保留原文。');
  localize();
  syncComposerGuidance();
  shellChrome.sync(state.mode);
  chuScene.sync(state.mode,mediaSubjects);
  travelScene.sync(state.mode,mediaSubjects);
  communityScene.sync(state.mode);
  softScene.sync(state.mode);
  saigScene.sync(state.mode);
  cityExperience.sync(busy);
  moduleScrolls.sync(state.mode);
  wuhanStory.sync(state.mode);
  siteLayout.sync(state.mode);
  answerLayout.sync();
  sessionLibrary.sync();
  journeyList.sync();
  presenter.sync(state.mode);
}

document.addEventListener('reception-language-change',()=>{render();if(health)updateHealth(health);if($('#atlas-dialog').open)renderAtlas();});
document.addEventListener('reception-language-error',event=>toast(event.detail));

function updateHealth(value) {
  health = value;
  const el = $('#service-status');
  const limited = ['limited', 'error', 'unconfigured'].includes(value.status);
  el.classList.toggle('limited', limited); el.classList.toggle('connected', value.status === 'connected');
  el.querySelector('span').textContent = value.status === 'connected' ? 'AI 已连接 · 资料就绪' : limited ? 'AI 暂不可用 · 可查资料' : '资料就绪 · AI 待验证';
  el.title = `${t('资料已就绪')} · ${value.documents}`;
  $('#library-list').innerHTML = (value.sources || []).map(source => `<a class="library-item" href="${escape(safeUrl(source.url))}" target="_blank" rel="noopener noreferrer">${icon('book')}<span><strong>${escape(source.title)}</strong><small>${source.pageCount ? `${source.pageCount} 页 PDF · 点击查阅` : 'Word 原始资料 · 点击下载'}</small></span><span>↗</span></a>`).join('');
}
async function refreshHealth() { try { const res = await fetch('/api/health'); if (res.ok) updateHealth(await res.json()); } catch { $('#service-status span').textContent = '本地服务连接中断'; } }

async function sendQuestion(question,preferredPlan) {
  if (busy) { toast('小豚正在回答，稍等一下或先取消。'); return; }
  preferredPlan ||= revisionPlanForDraft(dayRevisionDraft,question);
  question = question.trim(); if (!question) { $('#message-input').focus(); return; }
  dayRevisionDraft=null;
  cityOverview = false;
  busy = true;
  state.messages.push({ role: 'user', content: question.slice(0, 3000) });
  $('#message-input').value = ''; $('#message-input').style.height = 'auto';
  save(); render(true); $('#typing-indicator').hidden = false;
  currentRequest = new AbortController();
  const controller = currentRequest;
  const timeout = setTimeout(() => controller.abort('timeout'), 315000);
  requestAnimationFrame(() => $('#typing-indicator').scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' }));
  try {
    const previousPlanMessage = state.messages.findLast(m => m.result?.itinerary);
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: state.mode, locale:getLanguagePreference(),uiLocale:getLocale(), messages: state.messages.slice(-14).map(m => ({ role: m.role, content: m.content })),
        previousItinerary: preferredPlan || (previousPlanMessage?.result.meta?.mode === 'ai' ? previousPlanMessage.result.itinerary : undefined),
        preferences: cityExperience.preferences(), journeyList:state.mode==='travel'?journeyList.selection():undefined, localOnly: state.localOnly }), signal: controller.signal });
    const result = recoverReplyFormat(await res.json());
    if (!res.ok) throw new Error(t(res.status===429?'请稍等一分钟再试。':'连接暂时中断，请重试。'));
    state.messages.push({ role: 'assistant', content: result.answer, result });
  } catch (error) {
    const text = controller.signal.aborted ? controller.signal.reason === 'timeout' ? '这次回答等待超时了。你可以稍后重试，或开启“资料直答”先查阅资料。' : '已取消这次回答。你可以修改问题后继续。' : error.message || '暂时无法连接本地服务，请确认启动窗口仍在运行。';
    state.messages.push({ role: 'assistant', content: t(text), result: { answer: t(text), sources: [], followups: [question], meta: { mode: 'error' } } });
  } finally {
    clearTimeout(timeout); busy = false; currentRequest = null; $('#typing-indicator').hidden = true;
    save(); render(true); refreshHealth();
    requestAnimationFrame(() => $(`#message-${state.messages.length - 1}`)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }));
  }
}

function resetChat() {
  if(busy){toast('请先取消当前回答，再开始新对话。');return;}
  if(!save())return;
  const fresh=createChatSession(state.mode,state.localOnly);
  if(!persistWorkspace({...chatWorkspace,activeId:fresh.id,sessions:[fresh,...chatWorkspace.sessions]}))return;
  state=sessionState(fresh);dayRevisionDraft=null;$('#message-input').value='';$('#message-input').style.height='auto';
  cityOverview=false;answerLayout.reset();cityExperience.reset();render();closeMenu();window.scrollTo({top:0,behavior:scrollBehavior()});$('#message-input').focus({preventScroll:true});
}
function openSavedSession(id){
  if(busy){toast('请等待当前回答完成，或先取消。');return false;}
  if(!save())return false;
  const selected=chatWorkspace.sessions.find(s=>s.id===id);if(!selected)return false;
  if(!persistWorkspace({...chatWorkspace,activeId:id}))return false;
  state=sessionState(selected);dayRevisionDraft=null;$('#message-input').value=selected.draft;
  $('#message-input').dispatchEvent(new Event('input',{bubbles:true}));
  cityOverview=false;answerLayout.reset();cityExperience.reset();
  history.pushState({mode:state.mode,overview:false,y:0},'',moduleUrl(location.href,state.mode));
  render();closeMenu();requestAnimationFrame(()=>{const target=$('#messages').lastElementChild;target?target.scrollIntoView({block:'start'}):window.scrollTo({top:0});});return true;
}

let themeTimer,routeScrollTimer,restoringRoute=false;
history.scrollRestoration='manual';
function rememberRoute(){
  history.replaceState({...history.state,mode:state.mode,overview:cityOverview,y:window.scrollY},'',location.href);
}
function setMode(mode,{historyAction='push',restoreY=0,overview=true}={}) {
  if(!modes[mode])return;
  clearTimeout(routeScrollTimer);
  const changed=state.mode!==mode;
  if(historyAction==='push'){
    rememberRoute();
    const url=moduleUrl(location.href,mode);
    if(changed||location.hash||!cityOverview)history.pushState({mode,overview:true,y:0},'',url);
    else history.replaceState({...history.state,mode,overview:true,y:0},'',url);
  }
  cityOverview=overview&&!busy;
  state.mode=mode;save();render();closeMenu();
  if(historyAction==='restore'){
    restoringRoute=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      window.scrollTo({top:restoreY,behavior:'instant'});restoringRoute=false;
    }));
  }else if(cityOverview)window.scrollTo({top:0,behavior:'instant'});
  if(changed){
    document.body.classList.remove('theme-changing');
    requestAnimationFrame(()=>{
      document.body.classList.add('theme-changing');
      clearTimeout(themeTimer);themeTimer=setTimeout(()=>document.body.classList.remove('theme-changing'),300);
    });
  }
}
window.addEventListener('scroll',()=>{
  if(restoringRoute)return;
  clearTimeout(routeScrollTimer);routeScrollTimer=setTimeout(rememberRoute,150);
},{passive:true});
window.addEventListener('popstate',event=>{
  clearTimeout(routeScrollTimer);
  const mode=modeFromUrl(location.href)||'wuhan';
  // Native fragment navigation also emits popstate. Let the browser position
  // an anchor in the current module instead of restoring an unrelated y=0.
  if(!event.state?.mode&&mode===state.mode&&location.hash)return;
  setMode(mode,{historyAction:'restore',restoreY:event.state?.y||0,overview:event.state?.overview!==false});
  if(!event.state?.mode&&location.hash)requestAnimationFrame(()=>document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({block:'start'}));
});
window.addEventListener('pagehide',()=>{if(!restoringRoute)rememberRoute();clearTimeout(draftSaveTimer);save();});
function openLibrary() { openDialog($('#library-dialog')); refreshHealth(); }

$('#chat-form').addEventListener('submit', event => { event.preventDefault(); sendQuestion($('#message-input').value); });
$('#message-input').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); sendQuestion(event.target.value); } });
$('#message-input').addEventListener('input', event => { if(dayRevisionDraft&&!event.target.value.startsWith(dayRevisionDraft.prefix))dayRevisionDraft=null;event.target.style.height = 'auto'; event.target.style.height = Math.min(150, event.target.scrollHeight) + 'px'; });
let draftSaveTimer;
$('#message-input').addEventListener('input',()=>{clearTimeout(draftSaveTimer);draftSaveTimer=setTimeout(save,350);});
$('#message-input').dispatchEvent(new Event('input'));
$('#new-chat').addEventListener('click', resetChat);
$('#menu-toggle').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#sidebar-overlay').hidden = false; syncMenuAccessibility(); $('#new-chat').focus(); });
$('#sidebar-overlay').addEventListener('click', closeMenu);
$('#planner-button').addEventListener('click', () => openDialog($('#planner-dialog')));
$('#library-button').addEventListener('click', openLibrary);
$('#rail-library').addEventListener('click', openLibrary);
$('#help-button').addEventListener('click', openLibrary);
$('#cancel-generation').addEventListener('click', () => currentRequest?.abort('user'));
$('#local-toggle').addEventListener('click', () => { state.localOnly = !state.localOnly; save(); render(); toast(state.localOnly ? '已开启资料直答，不调用在线 AI。' : '已切换在线 AI，回答将使用相关资料。'); });
$('#clear-history').addEventListener('click',()=>{
  if(busy){toast('请先取消当前回答。');return;}
  const fresh=createChatSession(state.mode,state.localOnly);
  if(!persistWorkspace({version:1,activeId:fresh.id,sessions:[fresh]}))return;
  try{localStorage.removeItem(STORE);}catch{}
  state=sessionState(fresh);dayRevisionDraft=null;$('#message-input').value='';answerLayout.reset();cityExperience.reset();render();closeDialog($('#library-dialog'));toast('全部本机对话记录已清除。');
});
$('#planner-form').addEventListener('submit', event => {
  event.preventDefault(); if (busy) { toast('请等待当前回答完成。'); return; }
  const form = new FormData(event.target);
  const budget = form.get('budget');
  const choices=plannerChoices(Object.fromEntries(form));
  const request = choices.exactDays ? t('请按天与时段规划武汉旅行，写明交通、休息、分项预算、预约提醒及必要假设。') : travelPlannerCopy(getLocale()).rangeRequest;
  const question = `${request}\n${t('旅行天数')}: ${choices.duration}\n${t('同行人')}: ${t(form.get('people'))}\n${t('住宿区域')}: ${form.get('customArea')?.trim()?choices.area:t(choices.area)}\n${budget ? t('预算每人（人民币元，不含住宿及往返武汉交通）')+': '+budget : t('预算未确定，请提供人均分项估算。')}\n${t('旅行偏好')}: ${form.getAll('interests').map(t).join(' / ')}\n${t('其他要求')}: ${form.get('extra') || '—'}`;
  closeDialog($('#planner-dialog')); setMode('travel'); sendQuestion(question);
});

async function copy(text) { try { await navigator.clipboard.writeText(text); toast('已复制，可以粘贴分享。'); } catch { toast('浏览器未允许复制，请手动选择文本。'); } }
document.addEventListener('click', event => {
  const modeLink=event.target.closest('a[data-mode]');
  if(modeLink){
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();setMode(modeLink.dataset.mode);return;
  }
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.photo) { openPhoto(button.dataset.photo); return; }
  if (button.hasAttribute('data-chu-resume')) { cityOverview=false;render();$('#messages').scrollIntoView({behavior:scrollBehavior(),block:'start'});return; }
  if (button.hasAttribute('data-open-atlas')) { openAtlas(); return; }
  if (button.dataset.atlasFilter) { atlasFilter = button.dataset.atlasFilter; renderAtlas(); return; }
  if (button.dataset.closeDialog) { closeDialog($(`#${button.dataset.closeDialog}`)); return; }
  if (button.hasAttribute('data-open-planner')) { openDialog($('#planner-dialog')); return; }
  if (button.dataset.prompt) { sendQuestion(t(button.dataset.prompt)); return; }
  if (button.dataset.mode) { setMode(button.dataset.mode); return; }
  if (button.dataset.entry) {
    setMode(button.dataset.entry);
    if(['wuhan','community','saig'].includes(button.dataset.entry))return;
    if (button.dataset.entry === 'travel') openDialog($('#planner-dialog'));
    else sendQuestion(t(modes[button.dataset.entry].question));
    return;
  }
  if (button.dataset.copyMessage !== undefined) {
    const message = state.messages[Number(button.dataset.copyMessage)];
    copy(cleanCitationTokens(message.content) + (message.result?.itinerary ? '\n\n' + itineraryText(message.result.itinerary,state.messages.slice(0,Number(button.dataset.copyMessage))) : '')); return;
  }
  if (button.dataset.copyPlan !== undefined) { const index=Number(button.dataset.copyPlan);copy(itineraryText(state.messages[index].result.itinerary,state.messages.slice(0,index))); return; }
  if (button.dataset.exportPlan !== undefined) {
    const plan = state.messages[Number(button.dataset.exportPlan)].result.itinerary;
    const blob = new Blob(['\uFEFF' + itineraryText(plan,state.messages.slice(0,Number(button.dataset.exportPlan)))], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${plan.title.replace(/[\\/:*?"<>|]/g, '') || '武汉行程'}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
  }
  if (button.dataset.retry !== undefined) {
    const index = Number(button.dataset.retry); const question = state.messages.slice(0, index).findLast(m => m.role === 'user')?.content;
    if (question) { state.localOnly = false; sendQuestion(question); }
  }
});
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', event => { if (event.target !== dialog) return; const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
}
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const hero = $('#city-hero'); let frame = 0;
  hero.addEventListener('pointermove', event => {
    if (['wuhan','travel'].includes(state.mode) || reducedMotion.matches || frame) return;
    const { clientX, clientY } = event;
    frame = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--pointer-x', `${((clientX - rect.left) / rect.width - .5) * 12}px`);
      hero.style.setProperty('--pointer-y', `${((clientY - rect.top) / rect.height - .5) * 8}px`);
      frame = 0;
    });
  });
  hero.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); frame = 0; hero.style.setProperty('--pointer-x', '0px'); hero.style.setProperty('--pointer-y', '0px'); });
  for (const card of document.querySelectorAll('.entry-card')) card.addEventListener('pointermove', event => {
    if (reducedMotion.matches) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--card-x', `${(event.clientX - rect.left) / rect.width * 100}%`);
    card.style.setProperty('--card-y', `${(event.clientY - rect.top) / rect.height * 100}%`);
  });
}
syncMenuAccessibility(); render(); refreshHealth();

function renderAtlas() {
  const query = document.querySelector('#atlas-search').value.trim().toLowerCase();
  const filtered = mediaSubjects.filter(s => matchesAtlasSubject(s, atlasFilter, query));
  document.querySelector('#atlas-count').textContent = `${filtered.length} ${t('条目')} · ${filtered.filter(s => s.image).length} ${t('图像')}`;
  document.querySelectorAll('[data-atlas-filter]').forEach(b => { b.classList.toggle('active', b.dataset.atlasFilter === atlasFilter); b.setAttribute('aria-pressed', String(b.dataset.atlasFilter === atlasFilter)); });
  atlasMascot.sync();
  document.querySelector('#atlas-grid').innerHTML = filtered.length ? filtered.map(s => placeHtml({ ...s, description: s.introduction || s.description, atlasId: s.id })).join('') : '<p class="atlas-empty">暂未找到，试试人物名、景点别称或历史主题。</p>';
  journeyList.sync();
}
function openAtlas() { renderAtlas(); openDialog(document.querySelector('#atlas-dialog')); atlasMascot.sync({animate:false}); }
function openPhoto(id) {
  const subject = mediaSubjects.find(s => s.id === id); if (!subject?.image) return;
  const p = subject.image;
  const caption = p.caption && p.caption !== `${subject.name}实景照片` ? p.caption : '';
  const related = (subject.relatedIds || []).map(id => mediaSubjects.find(s => s.id === id)).filter(s => s?.image);
  document.querySelector('#photo-content').innerHTML = `<img class="photo-full" src="${escape(p.src)}" alt="${escape(p.alt)}" width="${p.width}" height="${p.height}"><div class="photo-caption"><span class="eyebrow">WUHAN IN FOCUS · ${escape(p.type || '实景照片')}</span><h2>${escape(subject.name)}</h2><p class="photo-introduction">${escape(subject.introduction || subject.description)}</p>${caption ? `<p class="photo-context">${escape(caption)}</p>` : ''}<p class="form-note">原图 ${p.originalWidth} × ${p.originalHeight} · ${escape(p.author)}<br>${escape(p.rights)}<br>${escape(p.reviewedAt)}核对：未见可见水印，保留原画幅。</p><a href="${escape(safeUrl(p.sourceUrl))}" target="_blank" rel="noopener noreferrer">查看图片原始来源 ↗</a>${subject.factUrl ? `<a href="${escape(safeUrl(subject.factUrl))}" target="_blank" rel="noopener noreferrer">${escape(subject.factLabel || '查阅相关历史资料')} ↗</a>` : ''}${related.length ? `<div class="photo-related"><strong>沿着历史继续看</strong><div>${related.map(s => `<button data-photo="${escape(s.id)}">${escape(s.name)} ↗</button>`).join('')}</div></div>` : ''}</div>`;
  openDialog(document.querySelector('#photo-dialog'));
  document.querySelector('#photo-dialog').scrollTop = 0;
}
document.querySelector('#atlas-search').addEventListener('input', renderAtlas);
document.addEventListener('error', event => {
  if (event.target instanceof HTMLImageElement && event.target.closest('.place-card-image')) {
    event.target.closest('.place-card-image').innerHTML = `<div class="photo-pending">${icon('pin')}<span>图片加载失败，请刷新重试</span></div>`;
  }
}, true);
fetch('/api/media').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => {
  mediaSubjects = data.subjects || []; render();
  const atlasId=new URLSearchParams(location.search).get('atlas');
  if (atlasId!==null) { openAtlas(); if(mediaSubjects.some(s=>s.id===atlasId))openPhoto(atlasId); }
}).catch(() => toast('图文资料库暂未加载，请刷新重试。'));

// One controller handles finished poses, greeting and idle blinking.
(() => {
  for (const emotion of Object.keys(expressions)) {
    preloadCharacter(mascotAsset(emotion));
    preloadCharacter(mascotAsset(emotion, true));
  }
  const portrait = $('#hero-portrait');
  const pet = $('#mascot-pet');
  const closed = '/assets/jiangxiaotun-v5/blink.webp?v=9';
  preloadCharacter(closed);
  // The hero has its own relaxed fallback and rig; chat portraits blink separately.
  function scheduleBlink() {
    setTimeout(() => {
      if (!document.hidden && !reducedMotion.matches) {
        const idle = [...document.querySelectorAll('[data-character-emotion="neutral"]')].filter(image => image.getClientRects().length && !image.closest('[data-greeting],[data-idle]'));
        preloadCharacter(closed).then(loaded => {
          if (!loaded || document.hidden) return;
          for (const image of idle) if (image.dataset.characterEmotion === 'neutral' && !image.closest('[data-greeting],[data-idle]')) image.src = closed;
          setTimeout(() => {
            for (const image of idle) if (image.dataset.characterEmotion === 'neutral' && image.getAttribute('src') === closed) image.src = mascotAsset('neutral');
          }, 145);
        });
      }
      scheduleBlink();
    }, 4800 + Math.random() * 3500);
  }
  scheduleBlink();
  const bubble = $('.mascot-bubble');
  installMascotGreeting({ pet, portrait, bubble, reducedMotion });
})();

// A story-page return preserves the conversation and only prefills a fixed question.
const entry=receptionEntry(location.search);
if(entry.mode){
  setMode(entry.mode,{historyAction:'initial'});
  if(entry.draft){
    cityOverview=false;render();
    const composer=document.querySelector('#message-input');composer.value=t(entry.draft);
    requestAnimationFrame(()=>{composer.focus({preventScroll:true});composer.scrollIntoView({behavior:scrollBehavior(),block:'center'});});
  }
}

// Give the initial page a shareable module URL without adding a history entry.
history.replaceState({...history.state,mode:state.mode,overview:cityOverview,y:window.scrollY},'',moduleUrl(location.href,state.mode,{preserveHash:true,preserveEntry:true}));
