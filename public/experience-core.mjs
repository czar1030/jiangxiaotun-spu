import {buildTransitJourney, resolveTransitLocation, transitPreferences} from './travel-transit.mjs';
export {weatherIntent} from './weather-intent.mjs';

export const preferenceFields = ['pace', 'interests', 'lodging', 'companions'];
export function cleanPreferences(input) {
  return Object.fromEntries(preferenceFields.filter(key => typeof input?.[key] === 'string' && input[key].trim())
    .map(key => [key, input[key].replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120)]));
}
export function preferenceMessages(preferences) {
  const p = cleanPreferences(preferences), labels = {pace:'旅行节奏偏好',interests:'旅行兴趣偏好',lodging:'住宿区域',companions:'同行人偏好'};
  return Object.keys(p).length ? [{role:'user',content:'以下为我主动保存在本机的旅行偏好，仅作默认参考；本次对话中的新条件优先：\n'+Object.entries(p).map(([key,value])=>labels[key]+': '+value).join('\n')}] : [];
}
export function suggestPreferences(messages) {
  const p = {};
  for (const {content=''} of messages.filter(m=>m.role==='user')) {
    if (/少走|轻松|慢游|不赶|休息/.test(content)) p.pace='少走路、留足休息';
    if (/紧凑|多打卡/.test(content)) p.pace='紧凑探索，尽量多体验';
    const interests=['本地美食','历史文化','亲子科普','江湖风景'].filter((name,i)=>[/(?:美食|小吃)/,/(?:历史|文化|老建筑)/,/(?:亲子|科普)/,/(?:江湖风景|江景|湖景)/][i].test(content));
    if(interests.length) p.interests=interests.join('、');
    const lodging=transitPreferences([{role:'user',content}]).lodgingText;
    if(lodging)p.lodging=lodging;
    if(/和父母/.test(content))p.companions='和父母';
    else if(/带孩子/.test(content))p.companions='带孩子';
    else if(/一个人/.test(content))p.companions='一个人';
  }
  return cleanPreferences(p);
}

export const cityAnchors = [
  {key:'hankou',name:'江汉路',x:365,y:158,match:/江汉路|江汉关|吉庆街|黎黄陂路|汉口江滩|武汉关/},
  {key:'hanyang',name:'晴川阁',x:415,y:258,match:/晴川阁|古琴台|龟山|汉阳|钟家村/},
  {key:'crane',name:'黄鹤楼',x:600,y:245,match:/黄鹤楼|户部巷|首义|中华路|昙华林/},
  {key:'museum',name:'湖北省博物馆',x:812,y:152,match:/湖北省博物馆|省博|楚河汉街|水果湖/},
  {key:'lake',name:'东湖',x:968,y:188,match:/东湖|梨园|武汉大学|听涛/},
  {key:'valley',name:'光谷',x:1000,y:286,match:/光谷|科技|未来科技/}
];
export function sceneLocations(result) {
  const names = result?.itinerary?.days?.flatMap(d=>d.stops.map(s=>s.name)) || result?.places?.map(p=>p.name) || [];
  return cityAnchors.filter(anchor=>names.some(name=>anchor.match.test(name)));
}

export function reviseJournal(plan, action, messages=[]) {
  if (!plan?.days?.length) return null;
  const next=structuredClone(plan), day=next.days.find(d=>d.day===Number(action.day));
  if(!day)return null;
  delete next.journey;
  const note='手账已在本机调整；时段为原安排的参考槽位，交通按新顺序重算。开放预约、步行距离与预算需重新核实。';
  if(action.type==='move') {
    const from=Number(action.from),to=Number(action.to);
    if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=day.stops.length||to>=day.stops.length||from===to)return null;
    const times=day.stops.map(s=>s.time),[stop]=day.stops.splice(from,1);day.stops.splice(to,0,stop);
    day.stops.forEach((s,i)=>s.time=times[i]);
  } else if(action.type==='rest') {
    const choices=day.stops.map((s,i)=>({s,i})).filter(({s})=>!/(午餐|早餐|午休|休息|晚餐|返程|lunch|rest|breakfast|dinner)/i.test(s.name));
    const index=choices.at(-1)?.i;if(index===undefined)return null;
    const lodging=transitPreferences(messages,plan).lodgingText;
    day.stops[index]={time:day.stops[index].time,name:lodging?'返回'+lodging+'休息':'回住宿片区休息',description:'把这段游览留给下一次，今天留足休息。取消项目的实际退订与退款请另行核实。',transport:'按住宿实际地址返回；交通参考见下方。',cost:'不新增景点门票；餐饮与返程交通按实际发生计。'};
  } else return null;
  day.stops=day.stops.map(stop=>{
    const {mobility,...clean}=stop;
    return {...clean,transport:'按调整后的顺序出行；静态地铁参考见下方，站外接驳、时长及未知地点需重新核实。'};
  });
  next.notes=[...(next.notes||[]).filter(n=>n!==note),note];
  next.journey=buildTransitJourney(next,messages);
  return next;
}

export function journalChecks(plan,dayNumber) {
  const day=plan?.days?.find(d=>d.day===Number(dayNumber));if(!day)return [];
  const notes=[], locations=day.stops.map(s=>resolveTransitLocation(s.name)).filter(Boolean);
  const banks=locations.map(l=>l.bank).filter(Boolean);
  let crossings=0;for(let i=1;i<banks.length;i++)if(banks[i]!==banks[i-1])crossings++;
  if(crossings>1)notes.push('这一天多次跨江，建议减少片区切换。');
  if(day.stops.filter(s=>!/(餐|休息|午休|早餐|返程)/.test(s.name)).length>3)notes.push('游览点较多，带长辈或少走路时可以删减。');
  if(locations.length<day.stops.filter(s=>!/(餐|休息|午休|返程)/.test(s.name)).length)notes.push('部分地点尚无静态站序，请核实接驳。');
  return notes;
}
