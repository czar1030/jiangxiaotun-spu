// Reading and exploring these chapters never starts an AI conversation.
const tabs=[...document.querySelectorAll('[data-poem-tab]')];
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let readingAnimation;
function revealSelection(element){
  if(!element||reducedMotion.matches)return;
  readingAnimation?.cancel();
  readingAnimation=element.animate([{opacity:.5,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:190,easing:'ease-out'});
}
function selectPoem(tab,focus=false){
  const changed=tab.getAttribute('aria-selected')!=='true';
  for(const item of tabs){const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!selected;}
  if(changed)revealSelection(document.getElementById(tab.getAttribute('aria-controls')));
  if(focus)tab.focus();
}
for(const [index,tab] of tabs.entries()){
  tab.addEventListener('click',()=>selectPoem(tab));
  tab.addEventListener('keydown',event=>{
    let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();selectPoem(tabs[next],true);}
  });
}
if(tabs.length)selectPoem(tabs[0]);
const filters=[...document.querySelectorAll('[data-food-filter]')];
for(const button of filters)button.addEventListener('click',()=>{
  const category=button.dataset.foodFilter;
  for(const item of filters)item.setAttribute('aria-pressed',String(item===button));
  let count=0;
  for(const card of document.querySelectorAll('[data-food-category]')){card.hidden=category!=='all'&&card.dataset.foodCategory!==category;if(!card.hidden)count++;}
  document.querySelector('[data-food-count]').textContent=`${button.textContent.trim()} · ${count} 道江城风味`;
  revealSelection(document.querySelector('.food-grid'));
});
// Capture the chapter being left so the welcome page can return to the same scroll.
for(const link of document.querySelectorAll('a[href*="#wuhan-story-"]'))link.setAttribute('aria-label',link.textContent.trim());

// A quiet reading indicator follows actual page progress, with no idle loop.
const readingProgress=document.createElement('progress');
readingProgress.className='chapter-reading-progress';
readingProgress.max=100;
readingProgress.value=0;
readingProgress.setAttribute('aria-label','页面阅读进度');
document.querySelector('.chapter-topbar').append(readingProgress);
let progressFrame=0;
function updateProgress(){
  progressFrame=0;
  const range=document.documentElement.scrollHeight-innerHeight;
  readingProgress.value=range>0?Math.min(100,Math.max(0,scrollY/range*100)):100;
}
function queueProgress(){if(!progressFrame)progressFrame=requestAnimationFrame(updateProgress);}
addEventListener('scroll',queueProgress,{passive:true});
addEventListener('resize',queueProgress,{passive:true});
addEventListener('load',queueProgress,{once:true});
document.fonts.ready.then(queueProgress);
updateProgress();
