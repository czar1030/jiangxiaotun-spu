import {metroNetwork} from './wuhan-transit-data.mjs';
import {describedWeather} from './weather-intent.mjs';

export {metroNetwork};
const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[\s／/()（）·]/g,'');
const locations=[
 ['rail-wuhan','武汉站','武汉火车站','wuchang',['武汉火车站','武汉站','Wuhan Railway Station'],'武汉火车站地铁站可乘4号线；按站内标识进站。'],
 ['rail-hankou','汉口站','汉口火车站','hankou',['汉口火车站','汉口站','Hankou Railway Station'],'汉口火车站地铁站可乘2号线。'],
 ['rail-wuchang','武昌站','武昌火车站','wuchang',['武昌火车站','武昌站','Wuchang Railway Station'],'武昌火车站地铁站可乘4号线、7号线。'],
 ['rail-east','武汉东站','武汉东站','wuchang',['武汉东站','Wuhan East Station'],'武汉东站地铁站按站内标识进站，住宿地点至地铁站另需确认。'],
 ['museum','湖北省博物馆','省博湖北日报','wuchang',['湖北省博物馆','Hubei Provincial Museum','Hubei Museum'],'出站后步行至场馆，具体入口按预约与场馆指引。'],
 ['crane','黄鹤楼','司门口黄鹤楼','wuchang',['黄鹤楼','Yellow Crane Tower','黄鶴楼'],'地铁站至景区入口仍需步行；少走路时可选地面接驳。'],
 ['hubu','户部巷','司门口黄鹤楼','wuchang',['户部巷','Hubu Alley'],'出站后步行至街区；与中华路码头并非同一地点。'],
 ['pier-zhonghua','中华路码头','司门口黄鹤楼','wuchang',['中华路码头'],'先前往出发码头，过江后再步行或网约车接驳；少走路时优先地铁方案。'],
 ['tanhualin','昙华林','昙华林武胜门','wuchang',['昙华林','Tanhualin'],'出站后步行进入街区，坡巷路段按体力选择。'],
 ['jianghan','江汉路','江汉路','hankou',['江汉路','Jianghan Road'],'出站后步行进入街区，出口按具体目的地选择。'],
 ['customs','江汉关','江汉路','hankou',['江汉关','武汉关码头','Jianghan Customs'],'地铁站至江汉关或武汉关码头仍需步行或地面接驳。'],
 ['river','汉口江滩','江汉路','hankou',['汉口江滩','Hankou Riverfront','Hankou Riverside'],'以江汉关附近江滩为参考；江滩很长，其他入口需重新确认。'],
 ['lihuangpi','黎黄陂路','大智路','hankou',['黎黄陂路','Lihuangpi'],'出站后步行或网约车前往老街。'],
 ['gude','古德寺','头道街','hankou',['古德寺','Gude Temple'],'地铁站与寺院仍有距离，按体力安排地面接驳。'],
 ['tiandi','武汉天地','黄浦路','hankou',['武汉天地','Wuhan Tiandi','黄浦路'],'出站后前往街区，按目的地确认出口。'],
 ['zhongshan','中山公园','中山公园','hankou',['中山公园','武广','Zhongshan Park'],'出站后步行至公园或商圈。'],
 ['qingchuan','晴川阁','琴台','hanyang',['晴川阁','Qingchuan'],'琴台站并非景区门口，建议另接网约车，避免长距离步行。'],
 ['qintai','古琴台','琴台','hanyang',['古琴台','琴台大剧院','Guqin Terrace','Qintai'],'出站后按具体场馆确认地面接驳，不将地铁站当作景区入口。'],
 ['zhongjia','钟家村','钟家村','hanyang',['钟家村','归元','Guiyuan'],'出站后前往汉阳街区；归元寺入口另按场馆指引。'],
 ['wangjiawan','王家湾','王家湾','hanyang',['王家湾','Wangjiawan'],'按住宿地址或具体目的地确认出口。'],
 ['guobo','国博','国博中心北','hanyang',['国博','国际博览','四新'],'以国博中心北站作区域参考，具体酒店需再确认。'],
 ['shouyi','首义广场','首义路','wuchang',['首义广场','红楼','辛亥革命','Shouyi'],'出站后按南北院区确认步行路线；两个展馆不在同一建筑。'],
 ['hanjie','楚河汉街','楚河汉街','wuchang',['楚河汉街','水果湖','Chuhe Hanjie'],'以楚河汉街站为片区参考，具体酒店或目的地另行确认。'],
 ['jiedaokou','街道口','街道口','wuchang',['街道口','武汉大学','Wuhan University','Jiedaokou'],'武汉大学校门与地铁站有距离，需步行或地面接驳，并核实入校规则。'],
 ['pangxie','螃蟹岬','螃蟹岬','wuchang',['螃蟹岬','Pangxiejia'],'按住宿地址或街区目的地确认出口。'],
 ['xudong','徐东','徐东','wuchang',['徐东','Xudong'],'按具体酒店或目的地确认出口。'],
 ['donghu','东湖梨园','梨园','wuchang',['东湖','梨园','East Lake','Donghu'],'仅以梨园、听涛一带作参考；磨山、樱花园等远端区域另需公交或网约车接驳。'],
 ['guanggu','光谷广场','光谷广场','wuchang',['光谷广场','光谷步行街','Optics Valley Square'],'以光谷广场为参考，不代表光谷东等远端片区。'],
 ['airport','天河机场','天河机场','hankou',['天河机场','Tianhe Airport'],'按航站楼与地铁指引换乘，航班信息另行核实。']
].map(([id,name,station,bank,aliases,access])=>({id,name,station,bank,aliases,access}));
const stationNames=[...new Set(metroNetwork.lines.flatMap(l=>l.stations))].sort((a,b)=>b.length-a.length);

export function resolveTransitLocation(text){
 const value=normalize(text);if(!value)return null;
 const matches=locations.flatMap(p=>p.aliases.filter(a=>value.includes(normalize(a))).map(a=>({p,length:normalize(a).length})));
 for(const station of stationNames.filter(name=>name.length>=3&&value.includes(normalize(name))))matches.push({p:{id:station,name:station,station,bank:null,access:'以所填地铁站为区域参考；酒店门口至车站的路线需单独确认。'},length:normalize(station).length});
 matches.sort((a,b)=>b.length-a.length);
 if(matches.length)return matches[0].p;
 // An explicit station can anchor a custom hotel area. An unknown address cannot.
 const station=stationNames.find(name=>name.length>=3&&value.includes(normalize(name)));
 return station?{id:station,name:station,station,bank:null,access:'以所填地铁站为区域参考；酒店门口至车站的路线需单独确认。'}:null;
}

const routeCache=new Map();
export function metroRoute(from,to){
 if(!stationNames.includes(from)||!stationNames.includes(to))return null;
 if(from===to)return {kind:'local',from,to,legs:[],stops:0,transfers:0};
 const key=from+'|'+to;if(routeCache.has(key))return routeCache.get(key);
 const queue=metroNetwork.lines.filter(l=>l.stations.includes(from)).map(l=>({station:from,line:l.id,cost:0,changes:0,path:[]}));
 const visited=new Set();let found=null;
 while(queue.length){
  queue.sort((a,b)=>a.cost-b.cost||a.changes-b.changes);const node=queue.shift(),id=node.station+'|'+node.line;
  if(visited.has(id))continue;visited.add(id);
  if(node.station===to){found=node;break;}
  const line=metroNetwork.lines.find(l=>l.id===node.line),index=line.stations.indexOf(node.station);
  for(const next of [index-1,index+1])if(next>=0&&next<line.stations.length){
   queue.push({station:line.stations[next],line:line.id,cost:node.cost+1,changes:node.changes,path:[...node.path,{line:line.id,from:node.station,to:line.stations[next]}]});
  }
  for(const other of metroNetwork.lines)if(other.id!==line.id&&other.stations.includes(node.station)){
   queue.push({...node,line:other.id,cost:node.cost+5,changes:node.changes+1});
  }
 }
 if(!found)return null;
 const legs=[];
 for(const step of found.path){
  const previous=legs.at(-1);
  if(previous?.line===step.line){previous.to=step.to;previous.stops++;previous.stations.push(step.to);}
  else legs.push({line:step.line,from:step.from,to:step.to,stops:1,stations:[step.from,step.to]});
 }
 for(const leg of legs){
  const line=metroNetwork.lines.find(l=>l.id===leg.line);
  leg.direction=line.stations.indexOf(leg.to)>line.stations.indexOf(leg.from)?line.stations.at(-1):line.stations[0];
 }
 const result={kind:'metro',from,to,legs,stops:found.path.length,transfers:legs.length-1};
 routeCache.set(key,result);return result;
}

export function transitPreferences(messages=[],plan={}){
 const users=messages.filter(m=>m.role==='user').map(m=>m.content||'');
 const lodgingMatches=users.flatMap(text=>[...text.matchAll(/(?:منطقة الإقامة|Unterkunftsgegend|Accommodation area|Zona de alojamiento|Quartier où loger|ठहरने का इलाका|Area menginap|Zona di alloggio|宿泊エリア|숙박 지역|Região da hospedagem|Район размещения|ย่านที่พัก|Khu vực lưu trú|住宿區域|住宿区域|住宿|住在|住|accommodation|staying\s+(?:in|at))\s*[:：]?\s*([^\n；;，。]+)/giu)].filter(m=>!/(?:不含|不包括|不计入|excluding)\s*$/i.test(text.slice(Math.max(0,m.index-12),m.index))).map(m=>m[1]));
 const assumption=(plan.assumptions||[]).find(s=>/住宿|accommodation|hotel|stay/i.test(s))||'';
 const lodgingText=lodgingMatches.at(-1)||assumption;
 const all=users.join('\n');
 return {lodging:resolveTransitLocation(lodgingText),lodgingText:lodgingText.slice(0,150),
  noFerry:/(?:不(?:要|想)?(?:坐|乘|安排|体验)?|取消|去掉).{0,3}(?:轮渡|船)|怕水|no ferr(?:y|ies)/i.test(all),
  rain:['rain','snow'].includes(describedWeather(messages)),snow:describedWeather(messages)==='snow'};
}

function connection(from,to){
 if(!from||!to)return {kind:'unknown',from:from?.name||'',to:to?.name||'',legs:[],stops:0,transfers:0};
 const route=metroRoute(from.station,to.station);
 return {kind:'unknown',...(route||{}),fromPlace:from.name,toPlace:to.name,departureAccess:from.access,access:to.access};
}

export const ferryReference={from:'武汉关码头',to:'中华路码头',source:'/materials/2026%E6%AD%A6%E6%B1%89%E6%97%85%E6%B8%B8%E4%BA%A7%E5%93%81%E6%89%8B%E5%86%8C.pdf#page=158',page:158};
function ferryAlternative(from,to){
 const forward=from?.bank==='hankou'&&['crane','hubu','tanhualin','shouyi'].includes(to?.id);
 const reverse=to?.bank==='hankou'&&['crane','hubu','tanhualin','shouyi'].includes(from?.id);
 if(!forward&&!reverse)return null;
 return {kind:'ferry',from:forward?ferryReference.from:ferryReference.to,to:forward?ferryReference.to:ferryReference.from,
  fromPlace:from.name,toPlace:to.name,source:ferryReference.source,optional:true,roundTrip:false};
}

function explicitFerry(name){
 const a=String(name).indexOf(ferryReference.from),b=String(name).indexOf(ferryReference.to);
 if(a<0||b<0)return null;
 return {kind:'ferry',from:a<b?ferryReference.from:ferryReference.to,to:a<b?ferryReference.to:ferryReference.from,source:ferryReference.source,optional:true,explicit:true};
}

export function buildTransitJourney(plan,messages=[]){
 if(!plan?.days?.length)return null;
 const prefs=transitPreferences(messages,plan),hasExplicitFerry=plan.days.some(d=>d.stops.some(s=>explicitFerry(s.name)));let ferryUsed=false;
 const days=plan.days.map(day=>{
  let current=prefs.lodging;
  const stops=day.stops.map(stop=>{
   const explicit=!prefs.noFerry&&!prefs.rain?explicitFerry(stop.name):null;
   let destination=resolveTransitLocation(explicit?.to||stop.name);
   const local=!destination&&/附近|周边|午餐|早餐|过早|午休|休息|附近|返程|lunch|breakfast|rest/i.test(stop.name);
   if(local)destination=current;
   const route=explicit?{...explicit,fromPlace:current?.name||explicit.from,toPlace:destination?.name||explicit.to}:connection(current,destination);
   if(explicit)ferryUsed=true;
   if(!hasExplicitFerry&&!prefs.noFerry&&!prefs.rain&&!ferryUsed){route.ferry=ferryAlternative(current,destination);if(route.ferry)ferryUsed=true;}
   // Do not connect the next stop from an outdated location after an unknown destination.
   current=destination;
   return {...stop,mobility:route};
  });
  return {...day,stops,returnRoute:current&&prefs.lodging&&current.station!==prefs.lodging.station?connection(current,prefs.lodging):null};
 });
 const nearRiver=days.find(day=>day.stops.some(stop=>/江汉关|汉口江滩|江汉路|户部巷|黄鹤楼/.test(stop.name)));
 const reverse=nearRiver?.stops.some(s=>['crane','hubu'].includes(resolveTransitLocation(s.name)?.id));
 const ferry=!ferryUsed&&!prefs.noFerry&&!prefs.rain&&nearRiver?{kind:'ferry',from:reverse?ferryReference.to:ferryReference.from,to:reverse?ferryReference.from:ferryReference.to,
  optional:true,roundTrip:true,day:nearRiver.day,source:ferryReference.source}:null;
 return {version:1,days,ferry,lodging:prefs.lodging?.name||'',reviewedAt:metroNetwork.reviewedAt};
}

export function attachTransitJourney(result,messages){
 if(!result.itinerary?.days?.length)return result;
 return {...result,itinerary:{...result.itinerary,journey:buildTransitJourney(result.itinerary,messages)}};
}

export function transportReference(messages){
 const prefs=transitPreferences(messages),start=prefs.lodging;
 const links=start?['黄鹤楼','湖北省博物馆','汉口江滩','东湖','江汉路'].map(name=>{
  const p=resolveTransitLocation(name),r=metroRoute(start.station,p.station);
  return r?.legs.length?`${start.name}→${name}：${r.legs.map(l=>`${l.line}号线 ${l.from}→${l.to}（${l.direction}方向，${l.stops}站）`).join('；换乘 ')}。${p.access}`:`${start.name}→${name}：同站片区，地面接驳另核实。`;
 }).join('\n'):'';
 return `武汉地铁官网站序参考快照（${metroNetwork.reviewedAt}，非实时）：\n${links}\n主要目的地参考站：${locations.map(p=>`${p.name}→${p.station}`).join('；')}。\n普通轮渡参考：武汉关码头↔中华路码头，资料为比赛旅游手册PDF第158页；这不是观光游轮。码头前后接驳、运营、停航、班次、票价需临行核实。武汉市内游玩优先地铁、轮渡、公交、步行或网约车，不安排城际铁路，不追问高铁车次。`;
}

export function journeyRouteText(route){
 if(!route)return '';
 if(route.kind==='metro')return `${route.fromPlace||route.from} → ${route.toPlace||route.to}：${route.legs.map(l=>`${l.line}号线 ${l.from}上车 → ${l.to}下车（${l.direction}方向，${l.stops}站）`).join('；换乘 ')}。${route.departureAccess||''}${route.access||''}`;
 if(route.kind==='ferry')return `${route.roundTrip?'可选往返轮渡':route.explicit?'普通轮渡备选':'替代本段地铁的轮渡备选'}：${route.from} → ${route.to}${route.roundTrip?` → ${route.from}`:''}；两端码头均需地面接驳，班次与停航情况临行核实。`;
 return route.kind==='local'?`同站片区，步行或地面接驳至${route.toPlace||route.to}；${route.access||''}`:'';
}
