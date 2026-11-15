import {registrationUrl} from './saig-copy.mjs?v=1';

const asset='/assets/';
const chapters=[
  {key:'culture',label:['让文化开口','Culture, in conversation'],title:['一张卡片，\n让千年有了回声。','A small card.\nA thousand years of stories.'],copy:['从荆州博物馆的楚文化文物，到能听、能讲的 AI 明信片。Mark 印把古老的故事，变成今天可以参与的对话。','From Chu artefacts to AI postcards that listen and tell stories, Markyin brings cultural heritage into everyday conversation.'],tag:['楚文化 × AI · Mark 印官方产品素材','CHU CULTURE × AI / OFFICIAL PRODUCT IMAGES'],note:['56 件','56'],detail:['楚文化文物，开启新的对话方式','Chu artefacts, reimagined as conversations'],cta:['走进 Mark 印的故事','Discover the Markyin story'],href:'/community-story.html#markyin'},
  {key:'people',label:['遇见同路人','Meet the people'],title:['和正在创造的人，\n坐到一起。','Meet the people\nbehind the work.'],copy:['2017 年，罗弼文回到武汉创业。从技术尝试到真实产品，这群人把 AI 放进具体的生活，也让更多敢想、愿做的年轻人看见可能。','Luo Biwen returned to Wuhan to start a business in 2017. His team’s journey from experiments to real products invites a new generation to create with AI.'],tag:['罗弼文与团队 · 图片来源：长江日报','LUO BIWEN & TEAM / CHANGJIANG DAILY'],note:['人 × AI','PEOPLE × AI'],detail:['不止认识技术，也认识一起创造的人','Meet the people behind the possibilities'],cta:['认识这群创造者','Meet the creators'],href:'/community-story.html'},
  {key:'place',label:['让想法落地','A place to begin'],title:['想法落地，\n从这里开始。','A place to meet.\nA place to begin.'],copy:['从江岸智民里到光谷创新天地，数命 SPU 社区连接学习者与创造者。带着真实问题来，在交流、协作和项目中，找到自己的下一步。','From Zhiminli in Jiang’an to Optics Valley, SPU connects learners and creators through real questions, collaboration and projects.'],tag:['江岸 · 智民里实景 / 开放与参访请向官方确认','ZHIMINLI / CONFIRM ACCESS WITH THE ORGANISER'],note:['武汉 · 两处布局','TWO WUHAN HUBS'],detail:['江岸智民里 × 光谷创新天地','Zhiminli × Optics Valley'],cta:['找到我的参与方式','Find my way in'],href:'/community-story.html#invitation-title'}
];
const missionNotes=[
  [['讲清三镇、历史与城市气质。','用景点与美食举出具体例子。','让资料来源可以被查阅。'],['Explain the three towns and the city’s history.','Use real places and food as examples.','Make the sources easy to inspect.']],
  [['介绍智民里与光谷两处布局。','分清现有内容与未来规划。','说明感兴趣的人如何继续了解。'],['Introduce Zhiminli and Optics Valley.','Distinguish existing facilities from plans.','Show where interested visitors can learn more.']],
  [['接受时间范围、住宿与同行条件。','安排交通、休息与预算取舍。','遇到雨雪或新要求，可以继续调整。'],['Accept a time range, accommodation and companions.','Balance transport, rest and budget.','Adapt to weather and changing preferences.']],
  [['说明 SPU 理念与个人独立参赛要求。','讲清简介、完整演示视频与 SAIG 标签。','提供官方入口，核对规则与截止时间。'],['Explain SPU and individual, independent participation.','Cover the summary, full demo video and SAIG tag.','Link to official rules and the current deadline.']]
];
const missions=[
  {short:['认识武汉','Wuhan'],title:['让一座城，\n有自己的讲述者。','Give the city\na voice of its own.'],copy:['用城市文化、历史、美食与景点，把武汉讲得准确，也讲得动人。让初来乍到的人，找到认识这座城的第一扇门。','Introduce Wuhan through its culture, history, food and landmarks. Help a first-time visitor find a meaningful way into the city.'],demo:['演示一个场景：第一次来武汉，先认识什么？','DEMO / What should a first-time visitor discover?']},
  {short:['SPU 社区','SPU community'],title:['把一群人的热爱，\n讲给下一个同行者。','Introduce the people.\nInvite the next creator.'],copy:['介绍数命 SPU 社区的定位、人群与参与方式。依据官方材料，分清已开放与规划中的内容，让有兴趣的人知道下一步。','Explain the community, who it serves and how to participate. Distinguish existing facilities from future plans using official materials.'],demo:['演示一个场景：不会编程，也能来这里吗？','DEMO / Can I participate without knowing how to code?']},
  {short:['旅行规划','Travel planning'],title:['让每一种期待，\n都有一条抵达的路。','Every expectation\ndeserves a thoughtful route.'],copy:['结合天数范围、住宿、预算和同行人，给出武汉旅行建议。把地铁、轮渡与休息安排清楚，也能根据雨雪和新需求继续调整。','Plan around duration, accommodation, budget and companions. Include local transit and rest, and adapt to weather or changing needs.'],demo:['演示一个场景：带父母游武汉，少走路怎么安排？','DEMO / How can I explore Wuhan with my parents at a gentle pace?']},
  {short:['SPU 与 SAIG','SPU & SAIG'],title:['读懂这场挑战，\n交出自己的答案。','Understand the challenge.\nCreate your own answer.'],copy:['说明数命 SPU 的理念与 SAIG 参赛要求。个人报名、独立参赛，准备项目简介和完整演示视频，并按要求添加 SAIG 标签。','Explain SPU and SAIG using official materials. Enter individually and independently, prepare a project summary and full demo video, and use the SAIG tag.'],demo:['演示一个场景：报名之前，我需要准备什么？','DEMO / What should I prepare before entering?']}
];

export function installModuleScrolls({getLocale,onAsk}){
  const host=document.createElement('div');host.className='module-scrolls';host.dataset.noI18n='';
  host.innerHTML=`<section class="theme-scroll community-scroll" hidden aria-labelledby="community-scroll-title">
    <header class="scroll-heading"><div><span class="scroll-kicker"><b aria-hidden="true">创</b> SPU / THE NEXT CHAPTER</span><h2 id="community-scroll-title"></h2></div><span class="scroll-edition">PEOPLE.<br>CULTURE.<br>POSSIBILITY.</span></header>
    <section class="community-youth" aria-labelledby="youth-invitation-title">
      <div class="youth-memory">
        <div class="youth-quote-copy"><span class="scroll-kicker" data-youth-kicker></span><blockquote><p data-youth-quote></p><footer><cite data-youth-attribution></cite><span data-youth-source></span></footer></blockquote></div>
      </div>
      <div class="youth-invitation"><div class="youth-letter"><span class="scroll-kicker" data-youth-label></span><h3 id="youth-invitation-title" data-youth-title></h3><p class="youth-promise" data-youth-promise></p><p class="youth-purpose" data-youth-purpose></p></div><figure class="youth-resolve"><img src="${asset}youth-run-forward.svg?v=1" alt="江小豚擦干眼泪，咬紧牙关，坚定地向前奔跑。" width="360" height="380" loading="lazy"></figure><div class="youth-next"><span class="youth-next-mark" aria-hidden="true">01 → ∞</span><p data-youth-next></p><button class="scroll-primary" data-scroll-participate><span data-youth-action></span><i aria-hidden="true">↗</i></button></div></div>
    </section>
    <div class="community-projects">${chapters.map((c,i)=>`<a class="community-project project-${c.key}" href="${c.href}" data-project="${i}"><figure>${i===0?`<span class="project-card-pair"><img class="project-card-jade" src="${asset}community-story/markyin-jade.webp" width="600" height="794" alt="" loading="lazy"><img class="project-card-sword" src="${asset}community-story/markyin-sword.webp" width="600" height="800" alt="" loading="lazy"></span>`:`<img src="${asset+['','community-story/founder-team.webp','community-photo.webp'][i]}" width="${[600,690,1600][i]}" height="${[794,290,900][i]}" alt="" loading="lazy">`}<figcaption></figcaption></figure><div class="community-project-copy"><span class="project-index">0${i+1}</span><h3></h3><p></p><span class="project-link"></span></div></a>`).join('')}</div>

  </section>
  <section class="theme-scroll saig-scroll" hidden aria-labelledby="saig-scroll-title"><header class="scroll-heading"><div><span class="scroll-kicker"><b aria-hidden="true">竞</b> SAIG / MISSION DOSSIER</span><h2 id="saig-scroll-title"></h2></div><div class="scroll-score-mark"><strong>100</strong><span>POINTS / 4 MISSIONS</span></div></header>
    <div class="scroll-mission-tabs" role="tablist" aria-label="SAIG 四项赛题">${missions.map((m,i)=>`<button id="saig-scroll-tab-${i}" role="tab" aria-controls="saig-scroll-detail" data-scroll-mission="${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}"><small>0${i+1}</small><span></span><b>25<small> PT</small></b></button>`).join('')}</div>
    <div class="mission-panel" id="saig-scroll-detail" role="tabpanel" tabindex="0"><div class="mission-canvas"><div class="mission-copy"><span class="scroll-kicker"><span data-mission-label></span> <b data-mission-counter>01</b> / 04</span><h3 data-mission-title></h3><p data-mission-copy></p><div class="mission-notes"><h4 data-mission-note-label></h4><ul data-mission-notes></ul></div></div></div>
    <div class="mission-demo"><span aria-hidden="true">↳</span><p data-mission-demo></p><button class="scroll-text-action" data-scroll-brief></button></div></div>
    <footer class="scroll-entry-footer"><div><span class="scroll-kicker">YOUR NEXT MOVE</span><h3 data-scroll-entry-title></h3><p data-scroll-entry-note></p></div><a class="scroll-primary" href="${registrationUrl}" target="_blank" rel="noopener noreferrer"><span data-scroll-register></span><i aria-hidden="true">↗</i></a></footer>
  </section>`;
  document.querySelector('#city-hero').after(host);
  host.querySelector('.scroll-entry-footer').before(document.querySelector('.saig-brief'));
  const youth=host.querySelector('.community-youth');
  youth.dataset.noI18n='';
  document.querySelector('#community-introduction .community-section-head').after(youth);
  let mission=0;
  const tr=pair=>pair[getLocale().startsWith('zh')?0:1];
  const put=(selector,value)=>(host.querySelector(selector)||youth.querySelector(selector)).textContent=value;
  function paintChapter(){
    host.querySelectorAll('[data-project]').forEach((card,i)=>{
      const c=chapters[i];
      card.querySelector('h3').textContent=tr(c.title).replaceAll('\n','');
      card.querySelector('p').textContent=tr(c.copy);
      card.querySelector('figcaption').textContent=tr(c.tag);
      card.querySelector('.project-link').textContent=tr(c.cta)+' →';
      card.querySelectorAll('img').forEach((image,j)=>{image.alt=i===0?tr(j===0?['Mark 印 · 楚文化玉面具明信片','Markyin · Chu jade mask postcard']:['Mark 印 · 楚文化宝剑明信片','Markyin · Chu sword postcard']):tr(c.label);});
    });
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let missionAnimation;
  function paintMission(animate=false){
    const m=missions[mission];put('[data-mission-title]',tr(m.title));put('[data-mission-copy]',tr(m.copy));put('[data-mission-counter]',`0${mission+1}`);put('[data-mission-demo]',tr(m.demo));
    const panel=host.querySelector('#saig-scroll-detail');
    panel.setAttribute('aria-labelledby',`saig-scroll-tab-${mission}`);
    put('[data-mission-label]',tr(['任务','MISSION']));
    put('[data-mission-note-label]',tr(['演示时，讲清这三件事','THREE THINGS TO SHOW']));
    const notes=host.querySelector('[data-mission-notes]');notes.replaceChildren(...tr(missionNotes[mission]).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    if(animate&&!reduced.matches){missionAnimation?.cancel();missionAnimation=panel.animate([{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'});}
    host.querySelectorAll('[data-scroll-mission]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===mission));b.tabIndex=i===mission?0:-1;b.querySelector('span').textContent=tr(missions[i].short);});
  }
  const handleClick=event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.scrollMission!==undefined&&mission!==Number(b.dataset.scrollMission)){mission=Number(b.dataset.scrollMission);paintMission(true);}
    if(b.hasAttribute('data-scroll-participate'))onAsk(tr(['我想了解数命SPU社区，请结合我的兴趣介绍适合我的参与方式，并区分已开放内容与规划。','Help me find a way to participate in the SPU community based on my interests. Distinguish existing facilities from plans.']));
    if(b.hasAttribute('data-scroll-brief'))onAsk(tr([`我想参加SAIG，请依据赛事资料解释“${missions[mission].short[0]}”这项25分功能的要求，并给我一个简短的演示思路，保留其余三项必备功能。`,`Explain the SAIG requirement “${missions[mission].short[1]}” and suggest a short demo, retaining all four required functions.`]));
  };
  host.addEventListener('click',handleClick);
  youth.addEventListener('click',handleClick);
  host.addEventListener('keydown',event=>{
    const tab=event.target.closest('[role=tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const tabs=[...tab.parentElement.querySelectorAll('[role=tab]')],i=tabs.indexOf(tab),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    tabs[next].click();tabs[next].focus();
  });
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('scroll-in-view',entry.isIntersecting)),{threshold:.05});
  host.querySelectorAll('.theme-scroll').forEach(s=>observer.observe(s));
  return {sync(mode){
    const overview=!document.querySelector('#welcome').hidden;
    host.hidden=!overview||!['community','saig'].includes(mode);
    youth.hidden=!overview||mode!=='community';
    host.querySelector('.community-scroll').hidden=mode!=='community';host.querySelector('.saig-scroll').hidden=mode!=='saig';
    put('#community-scroll-title',tr(['从想法，到作品。','See ideas become real work.']));
    put('#saig-scroll-title',tr(['四项任务，\n一份你的作品。','Four missions. One work of your own.']));

    put('[data-youth-kicker]',tr(['青春寄语 / 1957','WORDS TO THE YOUNG / 1957']));
    youth.querySelector('.youth-resolve img').alt=tr(['江小豚擦干眼泪，咬紧牙关，坚定地向前奔跑。','Jiang Xiaotun wipes away her tears, grits her teeth and runs forward with determination.']);
    put('[data-youth-quote]',tr(['“你们青年人朝气蓬勃，正在兴旺时期，好像早晨八九点钟的太阳。希望寄托在你们身上。”','“You young people, full of vigour and vitality, are in the bloom of life, like the sun at eight or nine in the morning. Our hope is placed on you.”']));
    put('[data-youth-attribution]',tr(['—— 毛泽东 · 1957 年 11 月 17 日','— Mao Zedong · 17 November 1957']));
    put('[data-youth-source]',tr(['《在莫斯科大学的讲话》节选 ·《毛泽东文集》第七卷','Excerpt: Speech at Moscow University · Collected Works, Vol. 7 · English translation']));
    put('[data-youth-label]',tr(['数命 SPU · 写给每一个想出发的你','SPU / AN INVITATION TO BEGIN']));
    put('[data-youth-title]',tr(['不是“优等生”，\n也没关系。','You don’t have to be\na “top student”.']));
    put('[data-youth-promise]',tr(['在 AI 时代，心怀梦想，心系社会，照样能够活出自我。','In the AI era, dreams and care for others can help you find your own path.']));
    put('[data-youth-purpose]',tr(['未来，也在我们手里。从学会一个工具，到做出一件作品；让自己的热爱，成为帮助他人的力量。','The future is ours to help shape. Learn a tool, build something real, and turn what you love into something that helps others.']));
    put('[data-youth-next]',tr(['带着好奇来，和同路人一起，把想法变成有益于社会的作品。','Bring your curiosity. Meet fellow creators. Build something that gives back.']));
    put('[data-youth-action]',tr(['问小豚 · 找到参与起点','Ask Xiaotun · Find my starting point']));
    put('[data-scroll-brief]',tr(['问小豚 · 拆解这一题','Ask Xiaotun · Explore this requirement']));
    put('[data-scroll-entry-title]',tr(['下一位上场的，是你。','Your turn to create.']));
    put('[data-scroll-register]',tr(['前往官网 · 参加竞技','Official website · Enter SAIG']));
    paintChapter();paintMission();
  }};
}
