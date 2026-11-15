import {getLocale,t} from '/i18n.mjs?v=4';
import {chuCopy,chuChapters} from '/chu-scene-copy.mjs?v=1';

export function installChuScene({onAsk,onOpenChapter}){
 const exhibition=document.querySelector('#chu-exhibition');
 const index=document.querySelector('#chu-chapter-index');
 const chapters=document.querySelector('#chu-chapters');
 let subjects=[],mode='wuhan',lastKey='';
 let initialAnchor=location.hash;
 function markChapter(target){
  index.querySelectorAll('a').forEach(link=>{
   if(link.hash===`#${target.id}`)link.setAttribute('aria-current','location');
   else link.removeAttribute('aria-current');
  });
 }
 // A chapter URL also opens the reading view when a conversation is showing.
 window.addEventListener('hashchange',()=>{
  const target=Array.from(chapters.children).find(article=>`#${article.id}`===location.hash);
  if(!target)return;
  target.closest('details')?.setAttribute('open','');
  onOpenChapter?.();markChapter(target);
  requestAnimationFrame(()=>{target.scrollIntoView({block:'start'});target.focus({preventScroll:true});});
 });
 // Three complete reading destinations, separate from the four city stories above.
 for(const [i,chapter]of chuChapters.entries()){
  const link=document.createElement('a');link.href=`#chu-chapter-${chapter.id}`;
  link.dataset.chuChapterLink=chapter.id;
  link.innerHTML=`<span class="chu-index-number" aria-hidden="true">0${i+1}</span><span><strong></strong><small></small></span><span class="chu-index-arrow" aria-hidden="true">↓</span>`;
  index.append(link);
  const article=document.createElement('article');article.className='chu-panel';
  article.id=`chu-chapter-${chapter.id}`;article.tabIndex=-1;
  article.setAttribute('aria-labelledby',`chu-heading-${chapter.id}`);
  article.innerHTML=`<div class="chu-chapter-intro"><span class="chu-chapter-glyph" aria-hidden="true">${chapter.glyph}</span><div><span class="chu-chapter-label"></span><h3 id="chu-heading-${chapter.id}"></h3><p class="chu-chapter-description"></p></div></div><div class="chu-gallery"></div><div class="chu-chapter-footer"><button data-chu-ask="${chapter.id}"><span></span><span aria-hidden="true">↗</span></button><a class="chu-back-to-index" href="#chu-exhibition"><span aria-hidden="true">↑</span></a><span class="chu-catalogue-mark" aria-hidden="true">0${i+1} / WUHAN · CULTURE · LIFE</span></div>`;
  chapters.append(article);
 }
 function render(){
  const locale=getLocale(),copy=chuCopy(locale);
  const key=[locale,subjects.length,mode].join('|');if(key===lastKey)return;lastKey=key;
  document.querySelectorAll('[data-chu-copy]').forEach(node=>node.textContent=copy[node.dataset.chuCopy]);
  index.setAttribute('aria-label',copy.title);
  const caption=document.querySelector('.mascot-caption');caption.dataset.noI18n='';
  caption.replaceChildren(document.createElement('i'),document.createTextNode(' '+(mode==='wuhan'?copy.guide:t('江小豚 · 随时为你接待'))));
  for(const [i,chapter]of chuChapters.entries()){
   const article=document.getElementById(`chu-chapter-${chapter.id}`);
   const link=index.querySelector(`[data-chu-chapter-link="${chapter.id}"]`);
   link.querySelector('strong').textContent=copy[chapter.id];
   link.querySelector('small').textContent=chapter.subjects.map(id=>t(subjects.find(s=>s.id===id)?.name||'')).filter(Boolean).join(' · ');
   article.querySelector('.chu-chapter-label').textContent=copy[chapter.id];
   article.querySelector('h3').textContent=copy[`heading${i}`];
   article.querySelector('.chu-chapter-description').textContent=copy[`description${i}`];
   const ask=article.querySelector('[data-chu-ask]');
   ask.querySelector('span').textContent=copy.ask;
   ask.setAttribute('aria-label',`${copy.ask} · ${copy[chapter.id]}`);
   article.querySelector('.chu-back-to-index').setAttribute('aria-label',copy.title);
   const gallery=article.querySelector('.chu-gallery');gallery.replaceChildren();
  for(const [position,id]of chapter.subjects.entries()){
   const subject=subjects.find(item=>item.id===id);if(!subject?.image)continue;
   const button=document.createElement('button');button.className='chu-place';button.dataset.photo=id;
   button.setAttribute('aria-label',`${t('查看实景')}: ${t(subject.name)}`);
   const imageWrap=document.createElement('span');imageWrap.className='chu-place-image';
   const image=document.createElement('img');image.src=subject.image.src;image.alt=t(subject.name);image.loading='lazy';image.width=subject.image.width;image.height=subject.image.height;
   const number=document.createElement('span');number.className='chu-place-number';number.textContent=`0${position+1}`;
   const arrow=document.createElement('span');arrow.className='chu-place-arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
   imageWrap.append(image,number,arrow);
   const detail=document.createElement('span');detail.className='chu-place-detail';
   const category=document.createElement('small');category.textContent=`${t(subject.area)} / ${t(subject.category)}`;
   const name=document.createElement('strong');name.textContent=t(subject.name);
   const introduction=document.createElement('span');introduction.className='chu-place-summary';
   introduction.textContent=t(subject.introduction||subject.description);
   detail.append(category,name,introduction);button.append(imageWrap,detail);gallery.append(button);
  }
  }
 }
 document.querySelector('[data-chu-explore]').addEventListener('click',()=>{
  const destination=document.querySelector('#wuhan-story')||document.querySelector('#chu-exhibition');
  destination.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  destination.setAttribute('tabindex','-1');destination.focus({preventScroll:true});
 });
 exhibition.addEventListener('click',event=>{
  const link=event.target.closest('[data-chu-chapter-link],.chu-back-to-index');
  if(link){
   if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const target=document.querySelector(link.getAttribute('href'));if(!target)return;
   event.preventDefault();history.replaceState(null,'',link.getAttribute('href'));
   target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
   target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
   markChapter(target);
   return;
  }
  const button=event.target.closest('[data-chu-ask]');if(!button)return;
  const chapter=chuChapters.find(c=>c.id===button.dataset.chuAsk);if(!chapter)return;
  const locale=getLocale(),copy=chuCopy(locale),i=chuChapters.indexOf(chapter);
  const prompt=locale.startsWith('zh')?chapter.prompt:`${copy.ask}: ${copy[`heading${i}`]}\n${chapter.subjects.map(id=>t(subjects.find(item=>item.id===id)?.name||id)).join(', ')}`;
  onAsk(prompt);
 });
 return {sync(nextMode,nextSubjects){
  mode=nextMode;subjects=nextSubjects;render();
  // Restore direct chapter links after the asynchronous catalog has filled the cards.
  if(initialAnchor&&subjects.length&&mode==='wuhan'&&!document.querySelector('#welcome').hidden){
   const target=Array.from(chapters.children).find(article=>`#${article.id}`===initialAnchor);
   initialAnchor='';
   if(target){target.closest('details')?.setAttribute('open','');markChapter(target);requestAnimationFrame(()=>{target.scrollIntoView({block:'start'});target.focus({preventScroll:true});});}
  }
 }};
}
