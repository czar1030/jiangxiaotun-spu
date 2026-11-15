import {getLanguagePreference,setLanguage,t} from '/i18n.mjs?v=2';
import {languages} from '/language-core.mjs?v=1';
import {installInvitationGaze} from '/invitation-gaze.mjs?v=1';

installInvitationGaze(document.querySelector('.invitation-mascot'));

const select=document.querySelector('#language-select');
for(const language of [{code:'auto',label:'自动识别 · Auto'},...languages]){
  const option=document.createElement('option');option.value=language.code;option.textContent=language.label;option.dataset.noI18n='';select.append(option);
}
select.value=getLanguagePreference();
select.addEventListener('change',async()=>{
  const before=getLanguagePreference();select.disabled=true;
  try{await setLanguage(select.value);}catch(error){select.value=before;document.querySelector('#story-status').textContent=error.message;}
  finally{select.disabled=false;}
});
try{await setLanguage(getLanguagePreference());}catch{select.value=getLanguagePreference();}

const toggle=document.querySelector('.film-toggle'),film=document.querySelector('#product-film'),video=film.querySelector('video');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
// SVG illustrations are excluded from the general text translator.
const updateMascotLabel=()=>document.querySelector('.invitation-mascot')?.setAttribute('aria-label',t('江小豚欢迎你一起探索 AI'));
document.addEventListener('reception-language-change',updateMascotLabel);
updateMascotLabel();
toggle.addEventListener('click',()=>{
  const expanded=toggle.getAttribute('aria-expanded')!=='true';
  toggle.setAttribute('aria-expanded',String(expanded));film.hidden=!expanded;
  toggle.querySelector('[data-film-label]').textContent=t(expanded?'收起卡片展示':'观看卡片展示');
  if(expanded){film.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'});video.play().catch(()=>{video.focus();});}
  else video.pause();
});
document.addEventListener('reception-language-change',()=>{
  toggle.querySelector('[data-film-label]').textContent=t(film.hidden?'观看卡片展示':'收起卡片展示');
  document.title=t('从一张卡片，到一群人的未来 · 数命 SPU');
});
document.title=t('从一张卡片，到一群人的未来 · 数命 SPU');
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause();},{threshold:.05}).observe(video);
const stage=document.querySelector('.product-stage'),cards=stage.querySelector('.product-cards');
stage.addEventListener('pointermove',event=>{
  if(reduced.matches||event.pointerType!=='mouse')return;
  const box=stage.getBoundingClientRect();
  cards.style.setProperty('--tilt-x',`${((event.clientX-box.left)/box.width-.5)*8}deg`);
  cards.style.setProperty('--tilt-y',`${(.5-(event.clientY-box.top)/box.height)*5}deg`);
});
stage.addEventListener('pointerleave',()=>{cards.style.removeProperty('--tilt-x');cards.style.removeProperty('--tilt-y');});
