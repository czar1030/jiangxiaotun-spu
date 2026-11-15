import {readFileSync,existsSync} from 'node:fs';
import {languages,answerLocale,normalizeLocale} from '../public/language-core.mjs';
import {publicSource} from './knowledge.mjs';
import {composerGuidance} from '../public/composer-guidance.mjs';
export {answerLocale,normalizeLocale};
export const languagePacks=new Map(languages.map(l=>{
  const path=new URL(`../public/locales/${l.code}.json`,import.meta.url);
  return [l.code,existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{}];
}));
export function translated(locale,key){return languagePacks.get(locale)?.[key]||key;}
export function multilingualSubjects(subjects){
  return subjects.map(subject=>({...subject,aliases:[...new Set([...(subject.aliases||[]),
    ...[...languagePacks.values()].map(pack=>pack[subject.name]).filter(Boolean)])]}));
}
const terms=[
  ['历史文化','history','historical','histoire','geschichte','historia','storia','история','تاريخ','इतिहास','sejarah','ประวัติศาสตร์','lịch sử','歴史','역사'],
  ['本地美食','food','breakfast','cuisine','essen','comida','cibo','culinária','еда','طعام','भोजन','makanan','อาหาร','ẩm thực','グルメ','음식'],
  ['旅游行程','trip','itinerary','travel','voyage','reise','viaje','viagem','viaggio','поездка','رحلة','यात्रा','wisata','ท่องเที่ยว','du lịch','旅行','여행'],
  ['父母少走路','parents','elderly','senior','eltern','padres','pais','genitori','родители','والدي','माता-पिता','orang tua','พ่อแม่','bố mẹ','両親','부모'],
  ['亲子孩子','children','kids','enfants','kinder','niños','crianças','bambini','дети','أطفال','बच्चे','anak','เด็ก','trẻ em','子供','아이'],
  ['下雨室内','rain','raining','pluie','regen','lluvia','chuva','pioggia','дождь','مطر','बारिश','hujan','ฝน','mưa','雨','비'],
  ['社区智民里光谷','community','communauté','gemeinschaft','comunidad','comunidade','comunità','сообщество','مجتمع','समुदाय','komunitas','ชุมชน','cộng đồng','コミュニティ','커뮤니티'],
  ['比赛报名截止提交','competition','registration','deadline','concours','wettbewerb','concurso','concorso','конкурс','مسابقة','प्रतियोगिता','kompetisi','การแข่งขัน','cuộc thi','大会','대회'],
  ['江汉路','jianghan road','jianghan lu'],['黄鹤楼','yellow crane tower','tour de la grue jaune','gelber kranich','黄鶴楼'],
  ['湖北省博物馆','hubei provincial museum','hubei museum','湖北省博物館'],['东湖','east lake','donghu','東湖'],
  ['汉口江滩','hankou riverfront','hankou riverside'],['热干面','hot dry noodles','reganmian']
];
let mediaAliases=[];
export function registerSearchSubjects(subjects){
  mediaAliases=subjects.flatMap(s=>(s.aliases||[]).filter(alias=>alias!==s.name).map(alias=>[s.name,alias.toLocaleLowerCase()]));
}
function contains(text,alias){
  if(!alias)return false;
  if(/^[a-z\s'-]+$/.test(alias))return new RegExp(`(?:^|[^a-z])${alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?:$|[^a-z])`,'i').test(text);
  return text.includes(alias);
}
export function expandMultilingualQuery(text){
  const lowered=text.normalize('NFKC').toLocaleLowerCase();
  const expansions=terms.filter(([, ...aliases])=>aliases.some(a=>contains(lowered,a))).map(([zh])=>zh);
  for(const [zh,alias]of mediaAliases)if(contains(lowered,alias))expansions.push(zh);
  return `${text} ${[...new Set(expansions)].join(' ')}`;
}
export const offlineNotice='资料直答模式：以下是已核对的主题概览，未对你的具体问题或后续条件进行分析。定制行程与复杂问答请切回在线 AI。';
export const offlineTopics={
  wuhan:'武汉位于中国湖北，长江与汉江在此交汇，武昌、汉口、汉阳合称武汉三镇。可以从黄鹤楼、东湖、湖北省博物馆和汉口江滩认识这座城市；热干面是当地代表性早餐。开放时间、门票和预约请向景区核实。',
  community:'数命 SPU 社区在武汉江岸智民里与光谷创新天地布局，面向希望学习、使用 AI 并共同完成项目的人群。资料中的工坊和体验区包含规划内容，不能据此认定设施已开放。不会编程也可以了解参与方式；参访和加入条件请在官方网站咨询。',
  travel:'武汉旅行可先按汉口、武昌、汉阳分区安排，减少跨江往返。请告诉我旅行天数、同行人、住宿区域和预算，以及是否需要少走路或雨天室内安排。在线 AI 可结合这些条件生成并修改逐日行程。营业、天气、票务与预约需另外核实。',
  saig:'SPU 指 Super Person Unit（超级个体单元），公式 U=P^S。SAIG 本届要求独立个人参赛，作品涵盖武汉介绍、社区介绍、旅游规划、SPU 与 SAIG 介绍，每项 25 分。报名须交项目简介和完整演示视频链接，视频添加 #SAIG 或 SAIG 标签。截止为北京时间 2026-11-20 23:59；线下赛为 2026-12-18 12:00 至 2026-12-20 12:00。最终成绩现场占 40%，市场检验占 60%。以官方最新公告为准。'
};
export function localizedReference(messages,mode,context,locale){
  const query=expandMultilingualQuery(messages.at(-1)?.content||'');
  const topic=/SAIG|比赛|SPU(?!.*社区)/i.test(query)?'saig':/社区/.test(query)?'community':/旅游行程|行程/.test(query)?'travel':mode;
  const relevant=context.filter(c=>topic==='saig'?c.id==='O1':c.topic===topic).slice(0,3);
  const refs=relevant.map(c=>`[${c.id}]`).join(' ');
  return {answer:`${translated(locale,offlineNotice)}\n\n${translated(locale,offlineTopics[topic]||offlineTopics.wuhan)} ${refs}`,sources:relevant.map(publicSource),places:[],itinerary:null,followups:composerGuidance(topic,locale).questions,emotion:topic==='saig'?'serious':'neutral'};
}
