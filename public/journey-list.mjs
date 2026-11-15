export const JOURNEY_LIST_KEY='jiangxiaotun-journey-list-v1';
const isPlace=s=>s&&s.kind!=='person'&&s.kind!=='event'&&s.kind!=='product'&&s.category!=='美食';
export function cleanJourneyList(raw,subjects){
  const allowed=new Set(subjects.filter(isPlace).map(s=>s.id)),seen=new Set();
  const entries=(Array.isArray(raw?.entries)?raw.entries:[]).filter(e=>allowed.has(e?.id)&&!seen.has(e.id)&&(seen.add(e.id),true)).map(e=>({id:e.id,status:e.status==='visited'?'visited':'want',selected:e.status==='visited'?false:e.selected!==false}));
  return {version:1,excludeVisited:raw?.excludeVisited!==false,entries};
}
export function journeySelection(list){
  return {include:list.entries.filter(e=>e.status==='want'&&e.selected).map(e=>e.id),exclude:list.excludeVisited?list.entries.filter(e=>e.status==='visited').map(e=>e.id):[]};
}
export function journeySelectionMessages(selection,subjects){
  const allowed=subjects.filter(isPlace),ids=(value)=>new Set(Array.isArray(value)?value.filter(id=>typeof id==='string').slice(0,100):[]);
  const excluded=ids(selection?.exclude),included=ids(selection?.include);
  const want=allowed.filter(s=>included.has(s.id)&&!excluded.has(s.id)).map(s=>s.name),visited=allowed.filter(s=>excluded.has(s.id)).map(s=>s.name);
  return want.length||visited.length?[{role:'user',content:'以下是我主动选择的旅行清单；本次问题中的新要求优先。时间不足时请说明取舍，不强行塞进一天。\n'+(want.length?'希望安排：'+want.join('、')+'。\n':'')+(visited.length?'已经去过，本次不安排：'+visited.join('、')+'。':'')}]:[];
}
export function journeyArea(subject){
  const area=subject?.area||'';
  if(/汉阳/.test(area))return '汉阳';
  if(/光谷|东湖高新/.test(area))return '光谷';
  if(/武昌|东湖/.test(area))return '武昌与东湖';
  if(/黄陂/.test(area))return '黄陂';
  if(/江夏|经开|东西湖|青山/.test(area))return area;
  return /汉口|江岸|江汉|硚口/.test(area)?'汉口':area||'其他片区';
}

export function journeyPlanQuestion(messages=[],locale='zh-CN'){
  const known=messages.some(m=>m.role==='user'&&/(?:\d+\s*(?:[-–至到]\s*\d+)?|[一二两三四五六七八九十半]+)\s*(?:天|days?|jours?|Tage)/i.test(m.content));
  return locale.startsWith('zh')?'请围绕我选中的旅行清单安排武汉旅行，排除我标记为已去过的地方。保留本次对话已有的天数、住宿、同行和预算条件；'+(known?'按已有天数或时间范围安排，并说明清单地点的取舍。':'没有确定天数时，先按1–5天给出可选组合，并说明取舍。'):
    'Plan my Wuhan trip around my selected travel list, excluding visited places. Keep the duration, accommodation, companions and budget from this conversation. '+(known?'Use the existing duration or range and explain which places fit.':'If days are undecided, suggest options for 1–5 days first.');
}

export function installJourneyList({getSubjects,getLocale,getMessages=()=>[],legacyIds=[],onCollectionChange,onPlan,notify}){
  const text=(zh,en)=>getLocale().startsWith('zh')?zh:en;
  let stored;try{stored=JSON.parse(localStorage.getItem(JOURNEY_LIST_KEY));}catch{}
  let list=stored?.version===1&&Array.isArray(stored.entries)?stored:{version:1,excludeVisited:true,entries:legacyIds.map(id=>({id,status:'want',selected:true}))},initialized=false;
  const launch=document.createElement('button');launch.type='button';launch.className='journey-launch';launch.dataset.noI18n='';document.querySelector('.sidebar-bottom [data-open-atlas]').after(launch);
  const dialog=document.createElement('dialog');dialog.className='journey-library';dialog.dataset.noI18n='';dialog.setAttribute('aria-labelledby','journey-library-title');
  dialog.innerHTML='<header class="saved-dialog-heading"><div><span>YOUR PLACES / YOUR WUHAN</span><h2 id="journey-library-title"></h2></div><button type="button" data-journey-close aria-label="关闭旅行清单">×</button></header><p data-journey-intro></p><label class="saved-search"><span></span><input type="search" maxlength="80"></label><div class="journey-search-results"></div><label class="journey-exclude"><input type="checkbox" checked><span></span></label><div class="journey-groups"></div><p class="saved-empty" hidden></p><footer class="journey-library-footer"><span></span><button type="button" data-plan-collection></button></footer>';
  document.body.append(dialog);
  function ensure(){if(!getSubjects().length)return false;if(!initialized){list=cleanJourneyList(list,getSubjects());initialized=true;onCollectionChange(list.entries.filter(e=>e.status==='want').map(e=>e.id));}return true;}
  function write(next){try{localStorage.setItem(JOURNEY_LIST_KEY,JSON.stringify(next));list=next;onCollectionChange(list.entries.filter(e=>e.status==='want').map(e=>e.id));return true;}catch{notify(text('旅行清单未能保存，请检查浏览器存储空间。','Could not save the list. Please check browser storage.'));return false;}}
  function savePlace(id){
    if(!ensure()||!getSubjects().some(s=>s.id===id&&isPlace(s)))return;
    if(list.entries.some(e=>e.id===id)){notify(text('已经在旅行清单里了，可查看或调整状态。','Already in your list. Open it to change its status.'));open();return;}
    if(write({...list,entries:[...list.entries,{id,status:'want',selected:true}]})){notify(text('已收进旅行清单。','Saved to your travel list.'));sync();if(dialog.open)paint();}
  }
  function paintSearch(){
    const results=dialog.querySelector('.journey-search-results'),query=dialog.querySelector('input[type=search]').value.trim();results.replaceChildren();
    if(!query)return;
    const matches=getSubjects().filter(isPlace).filter(s=>[s.name,...(s.aliases||[])].some(n=>n.includes(query))).slice(0,8);
    for(const s of matches){const b=document.createElement('button');b.type='button';b.dataset.addJourney=s.id;b.textContent=s.name+' · '+journeyArea(s)+(list.entries.some(e=>e.id===s.id)?text(' · 已在清单',' · Saved'):' ＋');results.append(b);}
    if(!matches.length){const p=document.createElement('p');p.textContent=text('没有找到这个地点，换个景点或街区名称试试。','No matching place. Try another name.');results.append(p);}
  }
  function paint(){
    ensure();const subjects=getSubjects();
    dialog.querySelector('h2').textContent=text('把喜欢的武汉，留给下一程。','Keep your favourite Wuhan for the next journey.');
    dialog.querySelector('[data-journey-intro]').textContent=text('按片区整理想去的地方。勾选要带进行程的地点；标为“已去过”后，可以在下次规划时排除。','Organise places by area. Select the ones to plan around, and exclude visited places from your next trip.');
    dialog.querySelector('[data-journey-close]').ariaLabel=text('关闭旅行清单','Close travel list');
    dialog.querySelector('.saved-search span').textContent=text('添加景点或街区','Add a place or neighbourhood');
    dialog.querySelector('.journey-exclude span').textContent=text('规划时排除已去过的地方','Exclude visited places when planning');
    dialog.querySelector('.journey-exclude input').checked=list.excludeVisited;
    const groups=dialog.querySelector('.journey-groups');groups.replaceChildren();const grouped=new Map();
    for(const entry of list.entries){const subject=subjects.find(s=>s.id===entry.id);if(!subject)continue;const area=journeyArea(subject);if(!grouped.has(area))grouped.set(area,[]);grouped.get(area).push({entry,subject});}
    for(const [area,items]of grouped){const section=document.createElement('section'),h=document.createElement('h3');h.textContent=area;section.append(h);
      for(const {entry,subject:s}of items){const row=document.createElement('article');row.className='journey-place';row.dataset.journeyId=s.id;
        if(s.image){const image=document.createElement('img');image.src=s.image.src;image.alt=s.name;image.loading='lazy';image.width=120;image.height=80;row.append(image);}
        const copy=document.createElement('div'),title=document.createElement('h4');title.textContent=s.name;copy.append(title);
        const status=document.createElement('select');status.ariaLabel=text('地点状态：','Place status: ')+s.name;status.dataset.journeyStatus=s.id;
        for(const [value,label]of [['want',text('想去','Want to go')],['visited',text('已去过','Visited')]]){const option=document.createElement('option');option.value=value;option.textContent=label;status.append(option);}status.value=entry.status;copy.append(status);
        if(entry.status==='want'){const label=document.createElement('label');label.className='journey-include';const check=document.createElement('input');check.type='checkbox';check.ariaLabel=text('带进行程：','Use in plan: ')+s.name;check.checked=entry.selected;check.dataset.journeySelected=s.id;label.append(check,document.createTextNode(text('带进行程','Use in my plan')));copy.append(label);}
        const remove=document.createElement('button');remove.type='button';remove.dataset.removeJourney=s.id;remove.textContent=text('移出清单','Remove');remove.ariaLabel=text('移出清单：','Remove from list: ')+s.name;copy.append(remove);row.append(copy);section.append(row);
      }groups.append(section);
    }
    const selected=journeySelection(list),empty=dialog.querySelector('.saved-empty');empty.hidden=list.entries.length>0;empty.textContent=text('先搜索一个想去的地方，或从天气推荐、地点卡片里收藏。','Search for a place, or save one from a recommendation.');
    dialog.querySelector('.journey-library-footer>span').textContent=text(`选中 ${selected.include.length} 处 · 排除 ${selected.exclude.length} 处`,`Selected ${selected.include.length} · Excluded ${selected.exclude.length}`);
    dialog.querySelector('[data-plan-collection]').textContent=text('按这份清单安排 →','Plan around this list →');dialog.querySelector('[data-plan-collection]').disabled=!selected.include.length;
    paintSearch();
  }
  function open(){paint();if(!dialog.open)dialog.showModal();}
  launch.onclick=open;dialog.querySelector('[data-journey-close]').onclick=()=>dialog.close();dialog.querySelector('input[type=search]').oninput=paintSearch;
  dialog.addEventListener('change',event=>{
    const node=event.target;let next=structuredClone(list);
    if(node.matches('.journey-exclude input'))next.excludeVisited=node.checked;
    if(node.dataset.journeyStatus)next.entries=next.entries.map(e=>e.id===node.dataset.journeyStatus?{...e,status:node.value,selected:node.value==='want'}:e);
    if(node.dataset.journeySelected)next.entries=next.entries.map(e=>e.id===node.dataset.journeySelected?{...e,selected:node.checked}:e);
    if(write(next)){paint();sync();}
  });
  document.addEventListener('click',event=>{
    const save=event.target.closest('[data-save-place],[data-add-journey]');if(save){savePlace(save.dataset.savePlace||save.dataset.addJourney);return;}
    if(event.target.closest('[data-open-journey-list]'))open();
  });
  dialog.addEventListener('click',event=>{
    const remove=event.target.closest('[data-remove-journey]');if(remove&&write({...list,entries:list.entries.filter(e=>e.id!==remove.dataset.removeJourney)})){paint();sync();}
    if(event.target.closest('[data-plan-collection]')){
      const selection=journeySelection(list);if(!selection.include.length)return;
      dialog.close();onPlan(journeyPlanQuestion(getMessages(),getLocale()));
    }
  });
  function sync(){
    ensure();launch.textContent=text('我的旅行清单','My travel list')+` · ${list.entries.length}`;
    document.querySelectorAll('#messages .place-card,#messages .stop-photo,#atlas-grid .place-card').forEach(card=>{
      const id=card.querySelector('[data-photo]')?.dataset.photo,subject=getSubjects().find(s=>s.id===id);if(!isPlace(subject))return;
      let button=card.querySelector('[data-save-place]');if(!button){button=document.createElement('button');button.type='button';button.className='save-place-action';button.dataset.savePlace=id;(card.querySelector('.place-card-copy,figcaption')||card).append(button);}
      const saved=list.entries.some(e=>e.id===id);button.textContent=saved?text('已在清单 · 查看 →','Saved · View list →'):text('收进旅行清单 ＋','Save to travel list ＋');button.setAttribute('aria-label',button.textContent+' · '+subject.name);
    });
    const counter=document.querySelector('[data-collection-count]');if(counter){counter.dataset.openJourneyList='';counter.tabIndex=0;counter.setAttribute('role','button');counter.setAttribute('aria-label',text('查看我的旅行清单','Open my travel list'));}
  }
  document.addEventListener('keydown',event=>{if(event.target.matches('[data-open-journey-list]')&&['Enter',' '].includes(event.key)){event.preventDefault();open();}});
  return {sync,selection(){ensure();return journeySelection(list);},replaceWeatherCollection(ids){
    if(!ensure())return;const wanted=new Set(ids);const retained=list.entries.filter(e=>e.status==='visited'||wanted.has(e.id));
    const known=new Set(retained.map(e=>e.id));for(const id of wanted)if(!known.has(id))retained.push({id,status:'want',selected:true});
    write(cleanJourneyList({...list,entries:retained},getSubjects()));sync();
  }};
}
