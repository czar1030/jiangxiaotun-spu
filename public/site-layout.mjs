// Layout and action semantics shared by the four reception rooms.
// Existing character rigs and their coordinate systems are left in place.
export function installSiteLayout({getLocale, onOpenPlanner}) {
  const hero = document.querySelector('#city-hero');
  const planner = document.querySelector('#planner-form');
  const tr = (zh, en) => getLocale().startsWith('zh') ? zh : en;
  const quick = document.createElement('section');
  quick.className = 'trip-start travel-only';
  quick.setAttribute('aria-labelledby', 'trip-start-title');
  quick.dataset.noI18n = '';
  quick.innerHTML = `<header><span class="layout-eyebrow">YOUR WUHAN / YOUR WAY</span><h2 id="trip-start-title"></h2><p data-trip-intro></p></header>
    <form id="quick-trip-form"><label><span data-trip-label="days"></span><select name="days" aria-describedby="quick-trip-range-note"></select></label>
    <label><span data-trip-label="area"></span><select name="area"></select></label>
    <label><span data-trip-label="people"></span><select name="people"></select></label>
    <p id="quick-trip-range-note"></p><div class="trip-start-actions"><button class="trip-generate" type="submit"></button><button class="trip-refine" type="button" data-trip-refine></button></div>
    <p class="trip-output-note" data-trip-output></p></form>`;
  hero.after(quick);
  const quickForm = quick.querySelector('form');
  quickForm.addEventListener('change', event => {
    if (event.target.name === 'days') planner.elements.exactDays.value = '';
    if (event.target.name === 'area') planner.elements.customArea.value = '';
  });
  planner.addEventListener('change', event => {
    const target = quickForm.elements.namedItem(event.target.name);
    if (target) target.value = event.target.value;
  });
  function transfer() {
    for (const key of ['days', 'area', 'people']) planner.elements.namedItem(key).value = quickForm.elements.namedItem(key).value;
  }
  quickForm.addEventListener('submit', event => {
    event.preventDefault();
    transfer();
    // Continue through the existing validated planner and its request handling.
    // All extra conditions already entered in the detailed form are preserved.
    if (!planner.checkValidity()) {onOpenPlanner(); planner.reportValidity(); return;}
    planner.requestSubmit();
  });
  quick.querySelector('[data-trip-refine]').addEventListener('click', () => {transfer(); onOpenPlanner();});
  const archive = document.createElement('details');
  archive.className = 'culture-archive wuhan-only';
  archive.dataset.noI18n = '';
  archive.innerHTML = '<summary><span class="archive-number" aria-hidden="true">藏</span><span><strong data-archive-title></strong><small data-archive-note></small></span><span class="archive-toggle" aria-hidden="true">＋</span></summary>';
  const exhibition = document.querySelector('#chu-exhibition');
  exhibition.before(archive); archive.append(exhibition);
  const resume = document.querySelector('.chu-resume-footer');
  resume.className = 'conversation-return';
  resume.dataset.noI18n = '';
  document.querySelectorAll('[data-chu-resume]').forEach(button=>{if(!resume.contains(button))button.remove();});
  resume.insertAdjacentHTML('afterbegin','<div><span data-return-label></span><p data-return-preview></p></div>');
  document.querySelector('#messages').before(resume);
  // Keep one return entry in the same place in every room.
  document.querySelector('.community-projects').id = 'community-projects';
  document.querySelector('.saig-scroll').id = 'saig-missions';
  // One set of scores, one set of submission requirements, one registration link.
  document.querySelector('.saig-brief-header>span')?.remove();
  document.querySelector('.scroll-entry-footer [data-scroll-entry-note]')?.remove();
  document.querySelector('.mission-art')?.setAttribute('aria-hidden', 'true');
  const submitFacts = document.createElement('p');
  submitFacts.className = 'submission-facts';
  submitFacts.dataset.noI18n = '';
  document.querySelector('.saig-brief-bottom').before(submitFacts);
  // Give each type of action a predictable visual treatment throughout the app.
  function markActions() {
    document.querySelectorAll('.main-nav .nav-arrow i').forEach(arrow => {arrow.textContent = '→';});
    document.querySelectorAll('button[data-prompt],button[data-chu-ask],button[data-community-ask],button[data-saig-ask],button[data-scroll-brief],button[data-scroll-participate],button[data-scene-ask],button[data-weather-plan]').forEach(button => {
      button.dataset.actionKind = 'ask';
      button.title = tr('向江小豚提问，进入对话', 'Ask Xiaotun and open the conversation');
    });
    document.querySelectorAll('a[target="_blank"]').forEach(link => {link.dataset.actionKind = 'external';});
  }
  let locale = '';
  return {sync(mode) {
    const returnButton=resume.querySelector('[data-chu-resume]');
    resume.hidden=returnButton.hidden;
    resume.querySelector('[data-return-label]').textContent=tr('刚才聊到这里','PICK UP WHERE YOU LEFT OFF');
    resume.querySelector('[data-return-preview]').textContent=[...document.querySelectorAll('#messages .message.user .bubble')].at(-1)?.textContent||'';
    returnButton.textContent=tr('继续之前的对话 →','Continue conversation →');
    quick.hidden = mode !== 'travel' || document.querySelector('#welcome').hidden;
    if (locale !== getLocale()) {
      locale = getLocale();
      quick.querySelector('h2').innerHTML = tr('你的武汉，<br>从这里开始。', 'Make Wuhan your own.');
      quick.querySelector('[data-trip-intro]').textContent = tr('先选三件事，小豚帮你串成一程。', 'Three small choices. A journey that fits you.');
      const labels = {days:tr('想玩多久？', 'How long?'), area:tr('从哪里出发？', 'Where are you staying?'), people:tr('和谁一起？', 'Who is coming?')};
      for (const key of Object.keys(labels)) quick.querySelector(`[data-trip-label="${key}"]`).textContent = labels[key];
      quick.querySelector('#quick-trip-range-note').textContent = tr('天数给个范围就好，暂时没定也能先安排。', 'A range is enough. Exact days can come later.');
      quick.querySelector('.trip-generate').textContent = tr('让小豚安排这一程 →', 'Plan with Xiaotun →');
      quick.querySelector('.trip-refine').textContent = tr('补充预算与偏好 ＋', 'Budget & preferences ＋');
      quick.querySelector('[data-trip-output]').textContent = tr('按范围推荐玩法、住宿周边交通与休息安排。费用与预约以出行前核实为准。', 'Ideas for your time range, local transport and rest. Verify costs and bookings before travelling.');
      archive.querySelector('[data-archive-title]').textContent = tr('武汉图鉴 · 再往深处读', 'Wuhan atlas · Read a little further');
      archive.querySelector('[data-archive-note]').textContent = tr('器物、诗文与街巷，按兴趣展开。', 'Artefacts, poetry and everyday life. Open when curious.');
      submitFacts.textContent = tr('个人独立参赛 · 截止 2026.11.20 23:59 · 请在官网核对最新规则', 'Independent individual entry · Deadline: 20 Nov 2026, 23:59 · Verify current rules on the official website');
    }
    // Mirror the detailed form after its own language and option updates.
    for (const key of ['days', 'area', 'people']) {
      const source = planner.elements.namedItem(key), target = quickForm.elements.namedItem(key);
      const previous = target.value;
      target.replaceChildren(...[...source.children].map(option => option.cloneNode(true)));
      target.value = [...source.options].some(option => option.value === previous) ? previous : source.value;
    }
    const join = document.querySelector('.arena-join');
    join.href = '#saig-missions'; join.removeAttribute('target'); join.removeAttribute('rel');
    join.querySelector('[data-saig-copy="cta"]').textContent = tr('阅读四项赛题', 'Read the four missions');
    join.querySelector('b').textContent = '↓';
    document.querySelector('[data-saig-copy="official"]').textContent = tr('规则与提交材料，就在下方', 'Requirements and submission details below');
    document.querySelector('[data-saig-copy="heading"]').textContent = tr('提交之前，确认这几件事。', 'Before you submit.');
    const communityLink = document.querySelector('[data-community-explore]');
    communityLink.href = '#community-projects';
    communityLink.querySelector('[data-community-copy="cta"]').textContent = tr('看看社区的作品', 'Explore the community’s work');
    communityLink.lastElementChild.textContent = '↓';
    document.querySelector('[data-community-copy="ask"]').textContent = tr('问小豚 · 我的参与方式', 'Ask Xiaotun · How to participate');
    document.querySelectorAll('[data-chu-ask]>span:first-child').forEach(span => {span.textContent = tr('问小豚 · 讲述这一章', 'Ask Xiaotun · Tell me this story');});
    const primary = document.querySelector('.hero-actions .hero-primary');
    primary.hidden = mode === 'travel';
    const secondary = document.querySelector('.hero-secondary');
    secondary.dataset.prompt = mode === 'community' ? '我不会编程，可以参与数命SPU社区吗？社区哪些设施已经开放？' : mode === 'saig' ? '请介绍SAIG比赛的参赛条件、提交材料和关键时间。' : secondary.dataset.prompt;
    const title = document.querySelector('[data-chu-copy="title"]');
    title.textContent = tr('从一件器物，到一口烟火。', 'Objects, stories, everyday life.');
    if (mode === 'travel') document.querySelector('#hero-title').innerHTML = tr('把喜欢的武汉，<br>连成一程。', 'Your kind of Wuhan.<br>Your own journey.');
    if (mode === 'community') document.querySelector('#hero-title').innerHTML = tr('带着问题来，<br>带着作品出发。', 'Bring a question.<br>Build something real.');
    markActions();
  }};
}
