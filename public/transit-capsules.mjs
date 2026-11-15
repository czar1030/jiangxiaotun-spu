import {buildTransitJourney,journeyRouteText,metroNetwork} from './travel-transit.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const vehicle={
 metro:'<rect x="9" y="5" width="24" height="26" rx="8"/><path d="M13 12h16v9H13zm0 15h3m10 0h3M14 32l-3 5m17-5 3 5"/>',
 ferry:'<path d="M7 25h29l-6 9H13zM13 25V15h17v10M18 15V9h7v6m-7 5h3m4 0h3M4 37q5-4 10 0t10 0t10 0t7 0"/>'
};
function animatedVehicle(kind){return `<span class="transit-vehicle" aria-hidden="true"><svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><g>${vehicle[kind]||vehicle.metro}</g></svg><i></i></span>`;}
function lineName(line,t){const label=t('号线');return ['号线','號線','号線','호선'].includes(label)?`${line}${label}`:`${label} ${line}`;}
function metroLegs(route,t){return route.legs.map((leg,i)=>`<div class="transit-leg">${i?`<p class="transit-change">${escape(leg.from)} · ${escape(t('站内换乘'))}</p>`:''}<span class="transit-line line-${escape(leg.line)}">${escape(lineName(leg.line,t))}</span><strong>${escape(leg.from)} <span aria-hidden="true">→</span> ${escape(leg.to)}</strong><p>${escape(t('乘车方向'))}：${escape(leg.direction)} · ${leg.stops} ${escape(t('站'))}</p><p class="transit-board">${escape(t('上车'))} ${escape(leg.from)} · ${escape(t('下车'))} ${escape(leg.to)}</p></div>`).join('');}

export function routeCapsule(route,{t=s=>s,label=''}={}){
 if(route?.kind==='local'&&route.fromPlace&&route.toPlace&&route.fromPlace!==route.toPlace)return `<div class="transit-local"><strong>${escape(route.fromPlace)} → ${escape(route.toPlace)}</strong><p>${escape(t('同站片区 · 步行或地面接驳'))}</p><p>${escape(t(route.access))}</p></div>`;
 if(!route||!['metro','ferry'].includes(route.kind))return '';
 const ferry=route.kind==='ferry';
 const title=ferry?route.explicit?t('武汉轮渡'):t(route.roundTrip?'顺路轮渡 · 可选往返':'轮渡备选 · 替代本段地铁'):label||t('地铁出行');
 const from=route.fromPlace||route.from,to=route.toPlace||route.to;
 const chips=ferry?'':route.legs.map(l=>`<span class="transit-line line-${escape(l.line)}">${escape(lineName(l.line,t))}</span>`).join('<span aria-hidden="true">›</span>');
 const detail=ferry?`<div class="transit-ferry-route"><strong>${escape(route.from)} <span aria-hidden="true">→</span> ${escape(route.to)}${route.roundTrip?` <span aria-hidden="true">→</span> ${escape(route.from)}`:''}</strong><p>${escape(t('出发地'))}：${escape(route.fromPlace||route.from)} · ${escape(t('目的地'))}：${escape(route.toPlace||route.to)}</p><p>${escape(t('先前往出发码头，过江后再步行或网约车接驳；少走路时优先地铁方案。'))}</p><p>${escape(t('这是可选体验，不与本段地铁重复乘坐。轮渡受天气、水位影响，出发前核实航线、班次与停航公告。'))}</p></div>`:metroLegs(route,t)+`${route.departureAccess?`<p class="transit-access">${escape(route.fromPlace||route.from)}：${escape(t(route.departureAccess))}</p>`:''}<p class="transit-access">${escape(t(route.access))}</p>`;
 return `<details class="transit-capsule transit-${ferry?'ferry':'metro'}" data-transit-motion><summary>${animatedVehicle(ferry?'ferry':'metro')}<span class="transit-summary"><small>${escape(title)}</small><strong>${escape(from)} <span aria-hidden="true">→</span> ${escape(to)}</strong><span class="transit-chips">${chips}${ferry?escape(t('码头与两端接驳')):`<em>${route.stops} ${escape(t('站'))} · ${route.transfers} ${escape(t('次换乘'))}</em>`}</span></span><span class="transit-expand" aria-hidden="true">＋</span><span class="sr-only">${escape(t('展开交通详情'))}</span></summary><div class="transit-detail">${detail}<p class="transit-reference">${escape(t('路线参考，非实时到站信息'))} · <a href="${ferry?route.source:metroNetwork.source}" target="_blank" rel="noopener noreferrer">${escape(t('核实交通信息'))} ↗</a></p></div></details>`;
}

export function transitPlan(plan,messages){return plan?.journey||buildTransitJourney(plan,messages);}
export function transitText(journey){
 if(!journey)return '';
 const rows=[];
 for(const day of journey.days){rows.push(`DAY ${day.day} 交通参考`);for(const stop of day.stops){const text=journeyRouteText(stop.mobility);if(text)rows.push(text);if(stop.mobility?.ferry)rows.push(journeyRouteText(stop.mobility.ferry));}if(day.returnRoute)rows.push('返回住宿：'+journeyRouteText(day.returnRoute));}
 if(journey.ferry)rows.push(`第${journey.ferry.day}天 `+journeyRouteText(journey.ferry));
 rows.push('地铁为官方站序参考快照；运营、班次、停航、出口与地面接驳需临行核实。');return rows.join('\n');
}

export function installTransitMotion(){
 let nodes=[];
 const update=node=>node.dataset.playing=String(node.dataset.inView==='true'&&!document.hidden&&!document.querySelector('dialog[open]'));
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){entry.target.dataset.inView=String(entry.isIntersecting);update(entry.target);}},{threshold:.05});
 const pause=()=>nodes.forEach(update);
 document.addEventListener('visibilitychange',pause);
 new MutationObserver(pause).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 return root=>{observer.disconnect();nodes=[...root.querySelectorAll('[data-transit-motion]')];for(const node of nodes)observer.observe(node);};
}
