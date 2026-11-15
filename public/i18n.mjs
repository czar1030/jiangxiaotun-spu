import {languages,normalizeLocale} from '/language-core.mjs?v=1';
const STORE='jiang-xiaotun-language-v1';
const native=normalizeLocale(navigator.language);
let preference='auto';
try { const saved=localStorage.getItem(STORE); if(saved==='auto'||languages.some(l=>l.code===saved))preference=saved; } catch {}
let locale=preference==='auto'?native:preference, dictionary={}, revision=0;
const packs=new Map(), texts=new WeakMap(), attributes=new WeakMap();
export const getLocale=()=>locale;
export const getLanguagePreference=()=>preference;
export function t(key){
  if(locale==='zh-CN'||typeof key!=='string')return key;
  if(dictionary[key])return dictionary[key];
  const decorated=key.match(/^(.+?)(\s*[↗→↖←])$/u);
  return decorated&&dictionary[decorated[1].trim()]?dictionary[decorated[1].trim()]+decorated[2]:key;
}
export function translateFor(pack,key) {return pack?.[key]||key;}
async function load(code){
  if(code==='zh-CN')return {};
  if(packs.has(code))return packs.get(code);
  const response=await fetch(`/locales/${encodeURIComponent(code)}.json?v=6`);
  if(!response.ok)throw new Error('Language pack unavailable');
  const pack=await response.json();packs.set(code,pack);return pack;
}
const excluded=el=>!el||!!el.closest('script,style,svg,[data-no-i18n],.message.user,.message.assistant .bubble,.source-details blockquote,.source-details-body a,.photo-context');
function textNode(node){
  if(excluded(node.parentElement))return;
  const current=node.nodeValue;
  const record=texts.get(node);
  const original=record&&current===record.last?record.original:current;
  const trimmed=original.trim();
  const translated=trimmed?original.replace(trimmed,t(trimmed)):original;
  texts.set(node,{original,last:translated});
  if(current!==translated)node.nodeValue=translated;
}
function element(el){
  if(excluded(el))return;
  const records=attributes.get(el)||{};
  for(const key of ['placeholder','aria-label','title','alt']){
    if(!el.hasAttribute(key))continue;
    const current=el.getAttribute(key),record=records[key];
    const original=record&&record.last===current?record.original:current;
    const value=t(original);records[key]={original,last:value};
    if(current!==value)el.setAttribute(key,value);
  }
  attributes.set(el,records);
}
export function localize(root=document){
  if(root.nodeType===Node.TEXT_NODE){textNode(root);return;}
  if(root.nodeType===Node.ELEMENT_NODE)element(root);
  for(const el of root.querySelectorAll('*'))element(el);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode())textNode(walker.currentNode);
}
export async function setLanguage(value){
  const selected=value==='auto'?'auto':normalizeLocale(value);
  const code=selected==='auto'?native:selected, ticket=++revision;
  let next;
  try{next=await load(code);}catch{throw new Error(t('语言包加载失败，请稍后重试。'));}
  if(ticket!==revision)return;
  preference=selected;locale=code;dictionary=next;
  try{localStorage.setItem(STORE,preference);}catch{}
  document.documentElement.lang=locale;
  document.documentElement.dir=locale==='ar'?'rtl':'ltr';
  document.documentElement.dataset.language=locale;
  const select=document.querySelector('#language-select');if(select)select.value=selected;
  localize();
  document.dispatchEvent(new CustomEvent('reception-language-change'));
}
export async function initLanguages(){
  // Keep semantic form values stable while translating the option labels.
  document.querySelectorAll('option:not([value])').forEach(option=>option.value=option.textContent);
  const host=document.querySelector('.topbar-right');
  const control=document.createElement('label');control.className='language-control';
  control.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg><span class="sr-only">选择接待语言</span><select id="language-select" aria-label="选择接待语言" dir="ltr"></select>';
  const select=control.querySelector('select');
  const automatic=document.createElement('option');automatic.value='auto';automatic.textContent='自动识别 · Auto';automatic.dataset.noI18n='';select.append(automatic);
  for(const language of languages){const option=document.createElement('option');option.value=language.code;option.textContent=language.label;option.lang=language.code;option.dataset.noI18n='';select.append(option);}
  host.prepend(control);select.value=preference;
  const hint=document.createElement('span');hint.id='language-hint';hint.className='language-hint';hint.textContent='界面跟随浏览器，回答跟随提问语言。';
  document.querySelector('.composer-zone').append(hint);
  select.setAttribute('aria-describedby','language-hint');
  select.addEventListener('change',async()=>{
    const before=preference;select.disabled=true;
    try{await setLanguage(select.value);}catch(error){select.value=before;document.dispatchEvent(new CustomEvent('reception-language-error',{detail:error.message}));}
    finally{select.disabled=false;}
  });
  try{await setLanguage(preference);}catch{preference='zh-CN';locale='zh-CN';dictionary={};select.value=preference;}
  const observer=new MutationObserver(mutations=>{
    const roots=new Set();
    for(const mutation of mutations){
      if(mutation.type==='characterData')textNode(mutation.target);
      else if(mutation.type==='attributes')element(mutation.target);
      else for(const node of mutation.addedNodes)if(node.nodeType===Node.TEXT_NODE)textNode(node);else if(node.nodeType===Node.ELEMENT_NODE)roots.add(node);
    }
    roots.forEach(localize);
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title','alt']});
}
