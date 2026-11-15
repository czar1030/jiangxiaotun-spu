import {transitPreferences} from '../public/travel-transit.mjs';

const site=(id,name,indoor,description)=>({id,name,indoor,description});
// Curated geographic combinations of places in the reviewed image/fact catalog.
// Times below are planning slots, never opening hours or booking confirmations.
export const referenceRoutePacks=[
  {key:'hankou-river',bank:'hankou',title:'汉口 · 江汉路与江汉关',food:'江汉路或水塔街',sites:[site('jianghan','江汉路步行街',false,'只选一段街区看近代建筑与城市生活。'),site('jianghan-customs','江汉关博物馆',true,'把汉口的开埠记忆与江边建筑放在一起读。')]},
  {key:'province-museum',bank:'wuchang',title:'武昌 · 荆楚文博与湖岸',food:'省博周边',sites:[site('hubei-museum','湖北省博物馆',true,'按兴趣选择楚文化和青铜礼乐展陈，不追求一次看完整座馆。'),site('east-lake-tingtao','东湖听涛景区',false,'选择靠近入口的一小段湖岸，避免完整环湖。')]},
  {key:'yellow-crane',bank:'wuchang',title:'武昌 · 黄鹤楼与汉味街巷',food:'司门口或户部巷',sites:[site('yellow-crane','黄鹤楼',false,'登楼与周边观景按体力二选一；不便登高时保留地面观景。'),site('hubu-alley','户部巷',false,'小份尝味，按口味选择豆皮、热干面等，不必每家都排队。')]},
  {key:'old-hankou',bank:'hankou',title:'汉口 · 老街建筑与江风',food:'黎黄陂路周边',sites:[site('lihuangpi','黎黄陂路',false,'挑一段老建筑街区慢慢看，雨天缩短户外停留。'),site('hankou-river','汉口江滩',false,'傍晚只选邻近入口的江边短线，留足返回时间。')]},
  {key:'qintai',bank:'hanyang',title:'汉阳 · 琴台知音与艺术',food:'琴台或钟家村片区',sites:[site('guqin-terrace','古琴台',false,'从高山流水的知音文化理解汉阳，区分传说与可考史实。'),site('qintai-art-museum','武汉美术馆（琴台馆）',true,'围绕当期展览选感兴趣的部分；不预设具体展览或入场规则。')]},
  {key:'hankou-art',bank:'hankou',title:'汉口 · 美术馆与城市旧忆',food:'江汉路或吉庆街',sites:[site('wuhan-art-museum','武汉美术馆',true,'参观汉口馆的当期展陈，与琴台馆分开安排。'),site('soong-house','宋庆龄汉口旧居纪念馆',true,'以纪念馆资料了解近代武汉的一段历史，先核实当日开放。')]},
  {key:'hanyang-industry',bank:'hanyang',title:'汉阳 · 读懂近代工业',food:'汉阳城区就近用餐',sites:[site('zhang-museum','张之洞与武汉博物馆',true,'了解张之洞、汉阳造与武汉近代工业发展的关系。')]},
  {key:'shouyi',bank:'wuchang',title:'武昌 · 首义历史的一天',food:'首义片区',sites:[site('xinhai-north','辛亥革命博物院（北区·红楼）',true,'从红楼与相关展陈理解武昌首义，不虚构历史人物的具体行动。'),site('xinhai-south','辛亥革命博物院（南区）',true,'与北区对读辛亥历史；体力不足时只保留一个馆区。')]},
  {key:'hankou-science',bank:'hankou',title:'汉口 · 科学与城市想象',food:'江岸沿江片区',sites:[site('science-museum','武汉科学技术馆',true,'按年龄与兴趣挑选展区，给互动体验与中途休息留足时间。'),site('wuhan-planning','武汉规划展示馆',true,'了解城市空间与发展；两馆若预约冲突，只保留成功预约的一处。')]},
  {key:'hubei-art',bank:'wuchang',title:'武昌 · 美术与楚河生活',food:'水果湖或楚河汉街',sites:[site('hubei-art-museum','湖北美术馆',true,'围绕当期展览慢慢看，开放和展讯出行前核实。'),site('chuhe-hanjie','楚河汉街',false,'把下午留给街区、用餐与坐下休息，不再增加远处景点。')]},
  {key:'qingchuan',bank:'hanyang',title:'汉阳 · 晴川与治水记忆',food:'晴川阁周边',sites:[site('qingchuan','晴川阁',false,'隔江看黄鹤楼与江景，理解楼阁和诗文意象。'),site('yuji-palace','禹稷行宫',false,'与晴川阁安排在同一片区，了解江河文化；传说不等于建筑史。')]},
  {key:'hankou-museum',bank:'hankou',title:'汉口 · 武汉城市记忆',food:'汉口站或常青片区',sites:[site('wuhan-museum','武汉博物馆',true,'与湖北省博物馆区分开，从武汉城市历史与馆藏切入。')]},
  {key:'revolution-wuchang',bank:'wuchang',title:'武昌 · 都府堤历史街区',food:'粮道街片区',sites:[site('nongjiangsuo','武昌农民运动讲习所旧址',true,'以旧址和馆内资料理解近代革命历史。'),site('fifth-congress','中共五大会址纪念馆',true,'同片区参观，开放与预约需分别核对。')]},
  {key:'revolution-hankou',bank:'hankou',title:'汉口 · 旧址里的历史',food:'江岸城区',sites:[site('august-seven','八七会议会址纪念馆',true,'参观历史旧址，以馆方资料为依据。'),site('central-office','武汉中共中央机关旧址纪念馆',true,'同一城区顺路对读，门口步行与场馆预约需核实。')]},
  {key:'east-lake-garden',bank:'wuchang',title:'东湖 · 草木与自然观察',food:'植物园附近',sites:[site('botanical-garden','武汉植物园',false,'以植物观察为主，选择短路线，午后留足休息。')]},
  {key:'guanggu-science',bank:'wuchang',title:'光谷 · 科普探索',food:'场馆周边就近用餐',sites:[site('hubei-science-museum','湖北省科学技术馆',true,'与汉口的武汉科学技术馆区分，按兴趣选展区；不假设临时展已开放。')]},
  {key:'hankou-architecture',bank:'hankou',title:'汉口 · 街巷与城市建筑',food:'青岛路周边',sites:[site('pinghe','平和打包厂',false,'以建筑与街区观察为主，不假设所有内部空间都可参观。'),site('qingdao-road','青岛路',false,'短途步行看街区，累了就近休息。')]},
  {key:'hankou-memorial',bank:'hankou',title:'汉口 · 纪念馆里的近代武汉',food:'江岸片区',sites:[site('national-government','武汉国民政府旧址纪念馆',true,'从馆内资料了解武汉近代历史，先核对开放安排。'),site('zhan-house','詹天佑故居博物馆',true,'用一段安静参观理解铁路与城市记忆。')]},
  {key:'tanhualin',bank:'wuchang',title:'武昌 · 昙华林与粮道街',food:'粮道街',sites:[site('tanhualin','昙华林',false,'按体力挑一小段街巷，坡路较多处可省略。'),site('liangdao-street','粮道街',false,'把街巷观察与本地小吃组合，不为用餐跨江。')]},
  {key:'hankou-parks',bank:'hankou',title:'汉口 · 公园与街坊生活',food:'公园周边',sites:[site('jiefang-park','解放公园',false,'围绕近入口的绿荫短线散步，不安排赶场。'),site('wuhan-tiandi','武汉天地',false,'留给用餐和休息，消费按个人选择。')]},
  {key:'panlong',bank:'huangpi',title:'黄陂 · 盘龙城考古',food:'博物院附近',optional:true,sites:[site('panlongcheng','盘龙城遗址博物院',true,'以馆内展陈为主，遗址户外部分按天气与体力选择；单独留出一天，避免再跨城赶场。')]},
  {key:'erqi',bank:'hankou',title:'汉口 · 二七历史与劳动记忆',food:'二七片区',sites:[site('erqi-memorial','武汉二七纪念馆',true,'以纪念馆展陈理解工人运动与城市发展。')]},
  {key:'garden-expo',bank:'hankou',title:'汉口 · 园博园与汉口里',food:'汉口里',sites:[site('garden-expo','武汉园博园',false,'园区较大，先选一个区域，避免完整走遍。'),site('hankouli','汉口里',false,'与园博园组合用餐，按体力保留少量街区观察。')]},
  {key:'hanxiu',bank:'hanyang',title:'汉阳 · 非遗与汉绣',food:'江欣苑周边',optional:true,sites:[site('hanxiu-museum','武汉汉绣博物馆',true,'了解汉绣工艺与文化，先向场馆确认是否开放接待。'),site('gaolong-museum','高龙博物馆',true,'关注非遗展陈；开放或参访无法确认时不作为已落实预约。')]},
  {key:'hanyang-guiyuan',bank:'hanyang',title:'汉阳 · 归元文化慢游',food:'钟家村附近',sites:[site('guiyuan','归元禅寺',false,'注意礼仪与安静参观，具体入场安排以寺方公布为准。')]},
  {key:'east-lake-greenway',bank:'wuchang',title:'东湖 · 只走喜欢的一段',food:'梨园片区',sites:[site('east-lake-greenway','东湖绿道',false,'选一段平缓湖岸，不把完整绿道当作当天目标；雨雪改用室内方案。')]},
  {key:'hankou-west',bank:'hankou',title:'汉口 · 中山公园与过早',food:'万松园或武广片区',sites:[site('zhongshan-park','武汉中山公园',false,'选近入口的短线，把剩余时间留给街坊生活与休息。')]},
  {key:'polar',bank:'hankou',title:'东西湖 · 海洋科普备选',food:'场馆周边',optional:true,sites:[site('haichang','武汉海昌极地海洋公园',true,'收费场馆作为兴趣备选；票价、适龄、表演与开放区域必须提前核实。')]},
  {key:'mulan',bank:'huangpi',title:'黄陂 · 木兰山水备选',food:'景区就近用餐',optional:true,sites:[site('mulan-tianchi','木兰天池',false,'远郊单独安排一天；有长辈或少走路时，不默认安排登山，先确认体力与接驳。')]},
  {key:'qingshan',bank:'wuchang',title:'青山 · 江岸生活备选',food:'青山城区',optional:true,sites:[site('qing-shan-river','青山江滩',false,'只选近入口的一段江岸，不将远距离步行安排成必选。')]}
];

export function routeSelections(messages, subjects=[]) {
  const include=new Set(), exclude=new Set();
  for(const {content=''} of messages.filter(m=>m.role==='user')){
    const actions=[...content.matchAll(/(希望安排|优先安排|想去|想看|加入|本次不安排|已经去过|不去|不要去|不想去|排除|取消)[:：]?([^\n；。]+)/g)];
    for(const action of actions){
      const negative=/^(本次不安排|已经去过|不去|不要去|不想去|排除|取消)$/.test(action[1]);
      const hits=[];
      for(const subject of subjects.filter(s=>!['person','event','product'].includes(s.kind)&&s.category!=='美食'))for(const name of [subject.name,...(subject.aliases||[])]){
        for(let at=action[2].indexOf(name);at>=0;at=action[2].indexOf(name,at+Math.max(1,name.length)))hits.push({subject,start:at,end:at+name.length});
      }
      // Prefer the full place name: 张之洞与武汉博物馆 is not 武汉博物馆 or the person 张之洞.
      const spans=[];for(const hit of hits.sort((a,b)=>(b.end-b.start)-(a.end-a.start)))if(!spans.some(s=>hit.start<s.end&&hit.end>s.start))spans.push(hit);
      const matched=spans.map(s=>s.subject);
      // Generic East Lake preferences apply to its named areas, too.
      if(matched.some(s=>s.id==='east-lake')&&!/东湖(?:听涛|绿道|磨山|落雁)/.test(action[2]))matched.push(...subjects.filter(s=>s.id.startsWith('east-lake-')));
      for(const subject of matched){(negative?exclude:include).add(subject.id);(negative?include:exclude).delete(subject.id);}
    }
  }
  return {include,exclude};
}

export function buildReferenceDays(total,{messages=[],subjects=[],relaxed=false,rain=false,rainSecondOnly=false,exclusions=[]}={}) {
  const all=messages.filter(m=>m.role==='user').map(m=>m.content).join('；');
  const prefs=transitPreferences(messages),selection=routeSelections(messages,subjects.length?subjects:referenceRoutePacks.flatMap(p=>p.sites));
  const allowed=s=>!selection.exclude.has(s.id)&&!(exclusions.some(name=>s.name.includes(name))&&!selection.include.has(s.id));
  let pool=referenceRoutePacks.map(p=>{
    const sites=p.sites.filter(s=>allowed(s)&&(!rain||rainSecondOnly||s.indoor));
    return {...p,sites,title:sites.length<p.sites.length&&sites.length?p.title.split(' · ')[0]+' · '+sites.map(s=>s.name).join('与'):p.title};
  }).filter(p=>p.sites.length&&!(p.key==='yellow-crane'&&p.sites.length===1&&p.sites[0].id==='hubu-alley'&&!selection.include.has('hubu-alley')));
  // Explicit choices come first; the rest remain curated, with remote visits optional.
  pool.sort((a,b)=>Number(b.sites.some(s=>selection.include.has(s.id)))-Number(a.sites.some(s=>selection.include.has(s.id))));
  const selected=[],seen=new Set();
  for(const pack of pool){
    const sites=pack.sites.filter(s=>!seen.has(s.id));if(!sites.length)continue;
    selected.push({...pack,sites});sites.forEach(s=>seen.add(s.id));if(selected.length===total)break;
  }
  // Cluster whole days by bank, preserving priority inside each bank.
  const firstBank=prefs.lodging?.bank||(/住(?:在)?武昌|住(?:在)?光谷/.test(all)?'wuchang':'hankou');
  const banks=firstBank==='wuchang'?['wuchang','hankou','hanyang','huangpi']:firstBank==='hanyang'?['hanyang','hankou','wuchang','huangpi']:['hankou','wuchang','hanyang','huangpi'];
  selected.sort((a,b)=>banks.indexOf(a.bank)-banks.indexOf(b.bank));
  if(rainSecondOnly&&total>1){
    const indoor=pool.find(p=>p.key==='province-museum'&&p.sites.some(s=>s.indoor))||pool.find(p=>p.sites.some(s=>s.indoor));
    if(indoor){const other=selected.findIndex(p=>p.key===indoor.key);if(other>=0)[selected[other],selected[1]]=[selected[1],selected[other]];else selected[1]=indoor;selected[1]={...indoor,title:indoor.title.split(' · ')[0]+' · '+indoor.sites.filter(s=>s.indoor).map(s=>s.name).join('与')+'（雨天室内）',sites:indoor.sites.filter(s=>s.indoor)};}
  }
  const days=selected.map((pack,i)=>{
    const visits=relaxed?pack.sites.slice(0,2):pack.sites;
    const nearestBackup={'yellow-crane':'shouyi','old-hankou':'hankou-art','tanhualin':'revolution-wuchang','east-lake-greenway':'province-museum','east-lake-garden':'hubei-art','hankou-architecture':'hankou-art','hankou-parks':'hankou-science','hankou-west':'hankou-art','garden-expo':'hankou-museum'}[pack.key];
    const indoorBackup=referenceRoutePacks.filter(p=>p.bank===pack.bank&&!p.optional).sort((a,b)=>Number(b.key===nearestBackup)-Number(a.key===nearestBackup)).flatMap(p=>p.sites).find(s=>s.indoor&&allowed(s)&&!visits.some(v=>v.id===s.id));
    const backup=!rain&&visits.some(s=>!s.indoor)&&indoorBackup?` 雨天或预约失败时，可将户外段替换为同岸的${indoorBackup.name}，这是替换而非追加；如已在其他天安排，保留一次即可，接驳、开放与预约需另核实。`:'';
    const food=pack.bank==='hankou'?'过早可选热干面、面窝或糊米酒，正餐选家常菜':pack.bank==='hanyang'?'午餐可选莲藕排骨汤与时蔬，过早尝豆皮或热干面':'过早可尝三鲜豆皮或糊汤粉，正餐按口味选鱼类与时蔬';
    const stops=[{time:'09:30—11:30',name:visits[0].name,description:visits[0].description+backup+(pack.optional?' 这是待细化备选，先确认接待与交通，再决定是否保留。':''),transport:'从住宿点前往本片区，跨区优先地铁；具体出入口与地面接驳按地址核实。',cost:'门票、展览或预约费用以官方公布为准'},
      {time:'12:00—14:00',name:pack.food+' · 午餐与午休',description:`就近用餐，${food}；小吃不代替全天正餐，配料与过敏原向店家核实。用餐后留足休息，不为吃饭跨江。`,transport:'同片区短途步行或网约车接驳；累了可返回住宿休息。',cost:'餐饮约40—70元/人，按实际选择调整'}];
    if(visits[1])stops.push({time:'14:30—16:00',name:visits[1].name,description:visits[1].description+(relaxed?' 若已疲劳，省略此处并回住宿休息。':''),transport:'保持在当天片区内，按实际步行距离选择短途接驳。',cost:'以场馆或景点公布为准'});
    else stops.push({time:'14:30—16:00',name:pack.food+' · 当天整理与休息',description:`上午围绕${visits[0].name}参观，下午不再加远处景点。整理观展或旅行记录，按体力在附近坐坐或回住宿休息。`,transport:'就近休息；远郊日提前安排回城接驳。',cost:'自选消费，交通另计'});
    return {day:i+1,title:(pack.optional?'待细化备选 · ':'资料路线 · ')+pack.title,stops};
  });
  // Once independent route material is exhausted, disclose thematic revisits explicitly.
  while(days.length<total){
    const prior=selected[(days.length-selected.length)%Math.max(1,selected.length)];
    const name=prior?.sites[0]?.name||'住宿所在片区';
    days.push({day:days.length+1,title:`待细化备选 · ${name}深读与休息`,stops:[{time:'上午（选填）',name,description:'这是明确标出的重访备选，不是新的已落实路线。可围绕上次未看的展区深入了解；先确认兴趣、开放与预约，不想重访就改为休整。',transport:'沿用该片区往返方式，具体交通出行前核实。',cost:'门票与交通需重新核实'},{time:'12:00以后',name:'住宿片区用餐与休整',description:'为长住保留洗衣、补给、午休和调整安排的时间。此日需要按你的实际兴趣再细化。',transport:'就近安排，避免额外跨江。',cost:'按实际选择'}]});
  }
  return days;
}
