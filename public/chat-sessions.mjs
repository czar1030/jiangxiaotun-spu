const modes=new Set(['wuhan','travel','community','saig']);
const clone=value=>structuredClone(value);
export const CHAT_SESSIONS_KEY='jiangxiaotun-sessions-v1';
export function createChatSession(mode='wuhan',localOnly=false,now=Date.now()){
  return {id:crypto.randomUUID(),title:'新对话',customTitle:false,mode:modes.has(mode)?mode:'wuhan',localOnly:localOnly===true,messages:[],draft:'',createdAt:now,updatedAt:now};
}
export function sessionTitle(messages,mode){
  const first=messages.find(m=>m.role==='user')?.content?.replace(/\s+/g,' ').trim();
  if(!first)return '新对话';
  if(mode==='travel'){
    const days=first.match(/([\d一二两三四五六七八九十]+(?:\s*[-–至到]\s*[\d一二两三四五六七八九十]+)?)\s*天/)?.[1];
    return `${/父母|长辈|老人/.test(first)?'带父母游武汉':/孩子|亲子/.test(first)?'武汉亲子旅行':/雨天|下雨/.test(first)?'雨天游武汉':'我的武汉旅行'}${days?' · '+days+'天':''}`;
  }
  return first.replace(/^[#*\s]+/,'').slice(0,32);
}
export function loadChatWorkspace(raw,legacy=null){
  const candidate=raw?.version===1&&Array.isArray(raw.sessions)?raw.sessions:[];
  const seen=new Set();
  const sessions=candidate.filter(s=>typeof s?.id==='string'&&!seen.has(s.id)&&(seen.add(s.id),true)).map(s=>({
    ...s,mode:modes.has(s.mode)?s.mode:'wuhan',title:String(s.title||'新对话').slice(0,100),customTitle:s.customTitle===true,
    messages:(Array.isArray(s.messages)?s.messages:[]).filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string'),
    draft:typeof s.draft==='string'?s.draft.slice(0,2500):'',localOnly:s.localOnly===true,
    createdAt:Number.isFinite(s.createdAt)?s.createdAt:Date.now(),updatedAt:Number.isFinite(s.updatedAt)?s.updatedAt:Date.now()
  }));
  if(!sessions.length){
    const session=createChatSession(legacy?.mode,legacy?.localOnly);
    if(Array.isArray(legacy?.messages))session.messages=legacy.messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string');
    session.title=sessionTitle(session.messages,session.mode);sessions.push(session);
  }
  return {version:1,activeId:sessions.some(s=>s.id===raw?.activeId)?raw.activeId:sessions[0].id,sessions};
}
export function saveChatSession(workspace,id,state,draft='',now=Date.now()){
  const previous=workspace.sessions.find(s=>s.id===id)||{...createChatSession(state.mode,state.localOnly,now),id};
  const session={...previous,mode:state.mode,localOnly:state.localOnly===true,messages:clone(state.messages),draft:String(draft).slice(0,2500),updatedAt:now};
  if(!session.customTitle&&(!previous.messages.length||previous.title==='新对话'))session.title=sessionTitle(session.messages,session.mode);
  return {...workspace,activeId:id,sessions:[session,...workspace.sessions.filter(s=>s.id!==id)]};
}

export function installSessionLibrary({getWorkspace,getLocale,onOpen,onRename}){
  const text=(zh,en)=>getLocale().startsWith('zh')?zh:en;
  const launch=document.createElement('button');launch.className='session-launch';launch.type='button';launch.dataset.noI18n='';
  document.querySelector('#new-chat').after(launch);
  const dialog=document.createElement('dialog');dialog.className='session-library';dialog.dataset.noI18n='';dialog.setAttribute('aria-labelledby','session-library-title');
  dialog.innerHTML='<header class="saved-dialog-heading"><div><span>YOUR CONVERSATIONS</span><h2 id="session-library-title"></h2></div><button type="button" data-session-close aria-label="关闭我的对话">×</button></header><p data-session-note></p><form data-session-rename><label><span></span><input maxlength="100" required></label><button type="submit"></button></form><label class="saved-search"><span></span><input type="search" maxlength="100"></label><div class="session-list"></div><p class="saved-empty" hidden></p>';
  document.body.append(dialog);
  const list=dialog.querySelector('.session-list'),search=dialog.querySelector('input[type=search]');
  function paint(){
    const workspace=getWorkspace(),active=workspace.sessions.find(s=>s.id===workspace.activeId);
    launch.textContent=text('我的对话','My conversations');
    dialog.querySelector('h2').textContent=text('每段对话，都能接着聊。','Every conversation, ready to continue.');
    dialog.querySelector('[data-session-note]').textContent=text('对话与草稿保存在当前浏览器。开启新对话会保留原记录；不同会话分别保存旅行条件与方案。','Conversations and drafts stay in this browser. A new conversation keeps your earlier ones, with their own preferences and plans.');
    dialog.querySelector('[data-session-close]').ariaLabel=text('关闭我的对话','Close conversations');
    dialog.querySelector('[data-session-rename] span').textContent=text('当前对话名称','Current conversation name');
    const nameInput=dialog.querySelector('[data-session-rename] input');if(document.activeElement!==nameInput)nameInput.value=active?.title||'';
    dialog.querySelector('[data-session-rename] button').textContent=text('保存名称','Save name');
    dialog.querySelector('.saved-search span').textContent=text('查找对话','Find a conversation');
    const needle=search.value.trim().toLowerCase();list.replaceChildren();
    workspace.sessions.filter(s=>s.messages.length||s.draft||s.customTitle).filter(s=>!needle||(s.title+' '+s.messages.filter(m=>m.role==='user').map(m=>m.content).join(' ')).toLowerCase().includes(needle)).sort((a,b)=>b.updatedAt-a.updatedAt).forEach(s=>{
      const button=document.createElement('button');button.type='button';button.dataset.sessionOpen=s.id;button.className='saved-session';
      if(s.id===workspace.activeId)button.setAttribute('aria-current','true');
      const title=document.createElement('strong');title.textContent=s.title;
      const preview=document.createElement('span');preview.textContent=s.draft?text('未发送草稿：','Unsent draft: ')+s.draft:s.messages.findLast(m=>m.role==='user')?.content||'';
      const meta=document.createElement('small');meta.textContent=[text({wuhan:'认识武汉',travel:'旅行规划',community:'SPU社区',saig:'SAIG赛事'}[s.mode],{wuhan:'Wuhan',travel:'Travel',community:'SPU',saig:'SAIG'}[s.mode]),new Date(s.updatedAt).toLocaleDateString(getLocale()),s.id===workspace.activeId?text('当前对话','Current'):''].filter(Boolean).join(' · ');
      button.append(meta,title,preview);list.append(button);
    });
    const empty=dialog.querySelector('.saved-empty');empty.hidden=list.children.length>0;empty.textContent=text(needle?'没有找到对应对话。':'开始聊聊，第一段对话会自动保存在这里。',needle?'No matching conversations.':'Your first conversation will be saved here automatically.');
  }
  launch.onclick=()=>{paint();dialog.showModal();};
  dialog.querySelector('[data-session-close]').onclick=()=>dialog.close();
  dialog.querySelector('[data-session-rename]').onsubmit=event=>{event.preventDefault();const name=dialog.querySelector('[data-session-rename] input').value.trim();if(name&&onRename(name))paint();};
  search.oninput=paint;
  list.onclick=event=>{const target=event.target.closest('[data-session-open]');if(target&&onOpen(target.dataset.sessionOpen))dialog.close();};
  return {sync(){if(dialog.open)paint();else launch.textContent=text('我的对话','My conversations');}};
}
