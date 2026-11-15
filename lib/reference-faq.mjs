import {publicSource} from './knowledge.mjs';
import {subjectsMentioned} from '../public/media-utils.mjs';
import {readFileSync} from 'node:fs';
const illustratedFaq=JSON.parse(readFileSync(new URL('../data/media-faq-coverage.json',import.meta.url),'utf8'));

// Focused offline answers for the visible starter questions. These are static
// references, not a replacement for live reasoning or real-time navigation.
export function referenceFaq(question,mode,context,subjects=[]){
  let answer='';
  if(/创办|创始|罗弼文|Mark\s*印/i.test(question)&&/社区|SPU|罗弼文|Mark/i.test(question)){
    const report=context.find(c=>c.docId==='community-story-report');
    answer=report ? `**从一个让文物开口说话的想法开始。** 数命科技（武汉）有限公司创始人**罗弼文**于2017年回武汉创业。2025年，团队与荆州博物馆合作，把56件楚文化文物做成能对话的 **Mark 印 AI 明信片**，后来走向美国市场。长江日报报道其2025年公司营收为2亿元，这是公司营收，不是个人收入。[${report.id}]\n\n由这家公司建设运营的**数命SPU社区**，在江岸智民里、光谷创新天地布局，把AI学习、真实项目协作与交付连接起来。可以先从自己的兴趣和能解决的问题出发；参与要求、参访与设施开放情况需向官方确认。\n\n[看完整创业故事与产品展示](/community-story.html)` : '';
  }else if(mode==='wuhan'&&/辛亥|武昌首义|武昌起义/.test(question)){
    answer='**辛亥革命在武汉的重要起点是武昌起义。** 1911年10月10日，武昌起义爆发，推动各省响应，成为辛亥革命的重要转折。\n\n今天可从**辛亥革命博物院（北区·红楼）**了解湖北军政府与首义历史，再到**辛亥革命博物院（南区）**看相关展陈。**首义广场**连接这一带纪念空间，**楚望台遗址公园**则提供认识武昌旧城与起义历史的另一条线索。北区与南区是不同建筑，参观前分别核实开放与预约。';
  }else if(mode==='wuhan'&&/历史从|历史.*开始|历史.*讲起/.test(question)){
    answer='**武汉的故事，可以从三段历史读起。**\n\n- **盘龙城遗址博物院**：认识长江流域早期城市与商代文明的联系。\n- **黄鹤楼**与**湖北省博物馆**：从诗词、青铜礼乐与楚文化，理解江城的人文积淀。\n- **辛亥革命博物院（北区·红楼）**、**张之洞与武汉博物馆**：分别走近武昌首义和近代工业发展。\n\n这些线索发生在不同年代，武汉今天的三镇格局也是长期演变形成的；不必一次看完，可先挑最感兴趣的一章。';
  }else if(mode==='wuhan'&&/(?:AI|人工智能).*发展|发展.*(?:AI|人工智能)/i.test(question)){
    answer='**武汉的AI，可以从创新、制造和真实项目三个角度认识。** 光谷集聚科教与创新资源；**光谷空轨**、**路特斯全球智能工厂**提供理解智能交通和智能制造的城市切口，但不等同于可随时自由进入的AI展馆。\n\n在应用与人才实践上，**数命SPU社区**在**江岸智民里**、**光谷创新天地**布局，通过真实需求连接AI学习、协作和交付；部分工坊与体验设施仍在规划。**SAIG**则以真实需求检验人与AI合作完成作品的能力。\n\n这些是现有资料中的观察线索，不代表最新产业排名或实时开放清单。想参访需先向运营方确认。';
  }else if(mode==='travel'&&/住哪里|住宿.*(?:地铁|轮渡)|住.*出行更方便/.test(question)){
    answer='**先选方便的片区，再比较酒店到地铁口的实际距离。**\n\n- **江汉路步行街**附近：可利用地铁2号线、6号线；江汉路、江汉关与**武汉关码头**可按体力分段游览，去码头仍需步行或短途接驳。\n- **楚河汉街**附近：以地铁4号线为出行骨架，适合结合武昌文博与湖景；具体到馆换乘和站外距离需再核实。\n- 汉阳钟家村片区：可利用地铁4号线、6号线，结合**晴川阁**、琴台片区安排。\n\n天气和运营合适时，可选**武汉关码头→中华路码头**普通轮渡跨江，不能把观光游船当作日常轮渡。酒店出口、无障碍设施、末班车与船班须出发前确认。若愿意补充住宿区域，小豚可以进一步缩小选择。';
  }else if(mode==='travel'&&/父母|长辈|少走路/.test(question)&&!/\d+天|[一二三四五六七八九十两]天|行程.*修改/.test(question)){
    answer='**带父母游武汉，先按相邻片区挑选，不必急着确定几天。**\n\n- 汉口：**江汉路步行街**、**江汉关博物馆**择近组合，只散步一小段**汉口江滩**，累了就坐下休息。\n- 武昌：**湖北省博物馆**只选感兴趣的展区，**东湖听涛景区**只走近入口的湖岸；两处之间按体力选择网约车接驳。\n- 汉阳：**晴川阁**作为短时文化体验，登高、坡道和台阶按身体情况取舍。\n\n跨片区优先地铁，站内换乘、出入口距离也算步行；疲劳时用短程网约车。轮渡仅在运营、天气和上下船条件适合时选用**武汉关码头→中华路码头**，保留休息与午餐时间。\n\n如果方便，可再告诉我住宿区域或时间范围，我再把这些备选连起来。';
  }
  if(!answer&&!/行程|安排|规划|预算|不去|不要|避开|取消/.test(question)){
    const curated=mode==='wuhan'&&illustratedFaq.find(faq=>question.trim().startsWith(faq.question));
    if(curated)answer=curated.answer+'\n\n'+curated.expected.map(id=>subjects.find(s=>s.id===id)).filter(Boolean).map(s=>`**${s.name}**\n${s.introduction||s.description}`).join('\n\n');
    const matched=subjectsMentioned(subjects,question,6);
    if(!answer&&matched.length&&mode==='wuhan')answer=matched.map(s=>`**${s.name}**\n${s.introduction||s.description}`).join('\n\n');
    if(answer)answer+='\n\n以上为图文资料简介；开放、预约及活动信息请向场馆或运营方核实。';
  }
  if(!answer)return null;
  const sources=context.filter(c=>c.docId==='community-story-report'||c.topic===mode||c.topic==='wuhan').slice(0,6).map(publicSource);
  return {answer,places:[],itinerary:null,followups:[],sources};
}
