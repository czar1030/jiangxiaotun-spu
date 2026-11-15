import {describedWeather} from '../public/weather-intent.mjs';
import { publicSource } from './knowledge.mjs';
import {requestedDays, requestedDayRange} from './travel-days.mjs';
import {rangeReference} from './travel-overview.mjs';
import {composerGuidance} from '../public/composer-guidance.mjs';
import {referenceFaq} from './reference-faq.mjs';
import {buildReferenceDays,routeSelections} from './reference-routes.mjs';

const sourceFor = (context, topic) => context.find(c => c.topic === topic);

export function localAnswer(messages, mode, context, subjects = []) {
  const question = messages.filter(m => m.role === 'user').at(-1)?.content || '';
  const hasDuration=messages.some(m=>m.role==='user'&&(requestedDays(m.content)||requestedDayRange(m.content)));
  const faq=mode==='travel'&&hasDuration?null:referenceFaq(question,mode,context,subjects);
  if(faq)return {...faq,followups:composerGuidance(mode).questions.filter(q=>q!==question)};
  const all = messages.filter(m => m.role === 'user').map(m => m.content).join('；');
  const source = topic => sourceFor(context, topic);
  const ref = topic => source(topic) ? `[${source(topic).id}]` : '';
  let answer = '', places = [], followups = [], itinerary = null, used = [];
  const travel = mode === 'travel' || /行程|旅游|游玩|天|父母|孩子|下雨|预算|住在/.test(question);
  const saig = /SAIG|比赛|报名|参赛|赛程|截止|提交|评分/i.test(question);
  const community = /社区|智民里|光谷|编程|加入|参访/.test(question);
  const spu = /SPU|超级个体|BIWEN|公式|五项|能力/i.test(question);
  if (travel && !saig && !community) {
    let selectedRange = null;
    for (const message of messages.filter(message => message.role === 'user')) {
      if (requestedDays(message.content)) selectedRange = null;
      else if (requestedDayRange(message.content)) selectedRange = requestedDayRange(message.content);
    }
    if (selectedRange) {
      const {used, ...overview} = rangeReference(messages, selectedRange, context,subjects);
      return {...overview, sources: used.map(publicSource)};
    }
    used = context.filter(c => ['travel', 'wuhan'].includes(c.topic)).slice(0, 4);
    if (!requestedDays(question.includes('具体天数尚未确定')?question:all)) {
      answer = '我可以先帮你安排一条轻松的武汉路线。请告诉我：\n\n1. 准备玩几天？\n2. 和谁同行，住在哪个区域？\n3. 有没有预算、少走路或特别想去的地方？\n\n目前是资料直答模式，我会根据你明确提供的条件组合参考路线；它不包含实时天气、票务或预约查询。';
      if(question.includes('具体天数尚未确定'))answer='收到你选择的游玩时间段和其他旅行偏好。这个范围内，你想具体玩几天？确认后我再按天安排，保留你填写的住宿地点与同行条件。';
      followups = ['我和父母玩两天，住江汉路，不想走太多路，直接安排', '带孩子玩一天，喜欢室内场馆，预算每人300元', '一个人玩三天，喜欢美食和历史，住武昌'];
    } else {
      const total = requestedDays(all);
      const relaxed = /父母|老人|长辈|少走|不想走|轻松/.test(all);
      const child = /孩子|小孩|亲子/.test(all);
      const rain = ['rain','snow'].includes(describedWeather(messages)) || /室内/.test(question);
      const snow = describedWeather(messages) === 'snow';
      const rainSecondOnly = /第二天.*[雨雪]/.test(question);
      const exclusions = ['黄鹤楼', '东湖', '江汉路', '汉口江滩', '湖北省博物馆'].filter(name =>
        new RegExp(`(?:不去|取消|不要去|不想去)${name}|${name}(?:取消|不去)`).test(all));
      const lodging=[...all.matchAll(/住宿区域\s*[:：]\s*([^\n；]+)/gu)].at(-1)?.[1]?.trim();
      const wuchang = lodging?/武昌|光谷|楚河|水果湖|东湖|梨园|黄鹤楼|司门口|昙华林|螃蟹岬|街道口|武汉大学|首义|武汉站|杨春湖/.test(lodging):/住(?:在)?武昌|住(?:在)?光谷/.test(all);
      const days=buildReferenceDays(total,{messages,subjects,relaxed,child,rain,snow,rainSecondOnly,exclusions});
      const selected=routeSelections(messages,subjects);
      const missing=subjects.filter(s=>selected.include.has(s.id)&&!days.some(d=>d.stops.some(stop=>stop.name===s.name||(s.id==='east-lake'&&stop.name.startsWith('东湖')))));
      const optionalDays=days.filter(day=>day.title.startsWith('待细化备选')).map(day=>day.day);
      const budget = all.match(/(?:预算|每人|人均)[^\d]{0,4}(\d+)\s*元?/);
      answer = `先按你提供的条件整理了${total}天参考路线${relaxed ? '，节奏以少走路、留足休息为主' : ''}。${snow ? '已按雪天参考减少户外，留足保暖与休息时间；没有查询实时降雪或路况。' : rain ? '已考虑雨天，减少户外安排。' : ''}\n\n这是**资料直答参考方案**，尚未经过在线模型综合推理；没有实时查询天气、营业、余票或交通。每天按片区组合景点、用餐与休息，尽量将同一岸的日子排在一起。标注“资料路线”的日子已有具体地点；标注“待细化备选”的日子需要先确认兴趣、接待或远郊交通。${optionalDays.length ? `第${optionalDays.join('、')}天为待细化备选。` : '这次各天均已安排具体的资料路线。'}${missing.length ? ` 你选中的${missing.map(s=>s.name).join('、')}这次未排入；可能受天数、天气或片区取舍影响，可替换对应一天，不建议额外挤入。` : ''}${used[0] ? ` 景点资料参考[${used[0].id}]。` : ''}`;
      itinerary = { title: `武汉${total}天${relaxed ? '轻松' : '慢游'}计划`, summary: '按区域安排，给吃饭、休息和返程留出空间。',
        assumptions: [`同行条件：${child ? '有儿童' : relaxed ? '按有长辈、少走路考虑' : '按普通休闲出行考虑'}`, `住宿：${lodging&&lodging!=='尚未确定'?lodging+'；具体出发点与交通待核实':wuchang ? '武昌片区' : /江汉路/.test(all) ? '江汉路片区' : '未明确，暂以汉口出发作假设'}`,
          budget ? `你提到的预算为${budget[1]}元；人均/总额范围尚需确认，以下不作为预算达标承诺。` : '预算未明确，以下按人均粗估，不含住宿与往返武汉交通。'],
        days, budget: [{ item: '餐饮', amount: `约${total * 80}—${total * 135}元/人` },
          { item: '市内交通', amount: `约${total * 30}—${total * 80}元/人，网约车按人数分摊` },
          { item: '住宿、门票、城际交通', amount: '未计入，按实际选择另行核算' }],
        notes: ['资料路线代表有具体目的地的参考组合，不代表已经预约；场馆闭馆或预约失败时，可换同片区其他室内场馆或休息。', ...(optionalDays.length?['远郊、非遗接待与主题重访属于待细化备选；先确认兴趣、接待、体力与接驳再保留。']:[]), '雨雪天以室内文博为主；雨天街巷只宜短时停留，雪天不默认安排江边或登高。', '预约、营业时间、门票及实时交通须出发前向景区或场馆核实。', '社区参访不默认开放或已预约，请先通过数命官网咨询。'] };
      followups = ['如果下雨，请给我室内替代方案', '请看看哪些天可以减少步行，安排得更轻松一些', '请比较行程中的地铁与轮渡交通'];
    }
  } else if (saig || (mode === 'saig' && !community && !spu)) {
    used = context.filter(c => ['saig'].includes(c.topic));
    answer = `**SAIG 数命SPU国际AI大赛**面向AI开发者、各行业从业者及学生，围绕真实需求与订单，强调做出可用成果并持续交付。${ref('saig')}\n\n**报名要准备：**\n- 以个人身份报名并独立参赛。\n- 提交项目简介、完整演示视频链接；产品体验或主页链接选填。\n- 发布视频时添加 SAIG 标签或 #SAIG。\n\n**本届线上赛题：**武汉介绍、社区介绍、武汉旅游规划、SPU及SAIG介绍，四项各25分。[O1]\n\n**时间（北京时间）：**\n- 2026年11月20日23:59：报名及作品提交截止。\n- 11月23日：公布入围名单。\n- 12月18日12:00至20日12:00：48小时线下赛。\n- 此后开展三个月市场检验；线下最终综合成绩为现场40%＋市场检验60%。[O1]\n\n官网规则为2026年10月27日核对的快照，后续变更以[数命官网](https://www.dlife.love/)为准。`;
    followups = composerGuidance('saig').questions;
  } else if (community || mode === 'community') {
    used = context.filter(c => ['community', 'spu'].includes(c.topic));
    answer = `**数命SPU社区**由数命科技（武汉）有限公司建设运营，已在**武汉江岸智民里、光谷创新天地**两处布局，合计近8000平方米。${ref('community')}\n\n社区面向全球AI开发者、创业者，以及希望学习和使用AI的人群，采用“**以订单养才**”的方式，把真实项目交付、人才培养和创业孵化结合起来。不会编程并不在这份说明中被列为排除条件，具体项目的能力要求仍需咨询。${ref('community')}\n\n**可以了解的方向：**\n- 跟随有经验的SPU，在真实任务中学习与AI协作。\n- 了解FDE交付服务与OPC一人公司创业。\n- 参与供需交流，探索真实需求与项目协作。\n\n**注意区分规划与开放：**AI工坊、智能体体验区、共享工坊及部分文旅体验在资料中属于规划内容；两处布局不代表所有设施已开放。资料未给出完整门牌、参访开放时段和预约规则，建议通过[官网](https://www.dlife.love/)咨询确认。${ref('community')}`;
    places = [{ id: 'community', name: '数命SPU社区', area: '江岸智民里 / 光谷创新天地', description: 'AI协作与真实项目实践；参访请先咨询，规划项目不等于已开放。', sourceId: source('community')?.id }];
    followups = composerGuidance('community').questions;
  } else if (spu) {
    used = context.filter(c => c.topic === 'spu');
    answer = `**SPU = Super Person Unit，中文为“超级个体单元”。**它指的是：个人借助AI，能够自主判断、组织资源、完成完整价值交付，并承担结果责任的能力状态。${ref('spu')}\n\n五项核心能力是：\n1. **独立判断**：理解问题，作出选择。\n2. **调用AI**：按任务选择智能体与工具。\n3. **组织任务**：拆解目标，协调资源。\n4. **完成交付**：产出真实、可用、可验收的结果。\n5. **承担责任**：核查、纠正并持续改进。${ref('spu')}\n\n素材中的理念公式是 **U = P^S**：P代表人的决断力，S代表AI带来的外部能力，U代表创造的价值；强调人的判断与责任是基础。BIWEN则是用于组织和调度生产力、推进任务交付的智能体。${ref('spu')}`;
    followups = composerGuidance(mode === 'saig' ? 'saig' : 'community').questions;
  } else {
    used = context.filter(c => c.topic === 'wuhan').slice(0, 2);
    answer = `欢迎来武汉！我是**江小豚**，你的城市与SPU社区接待员。\n\n**武汉三镇是武昌、汉口、汉阳**，城市位于长江与汉江交汇处，是湖北省省会，常被称为“江城”。武汉概览与旅游手册介绍了这里的历史文化、科教资源和江湖景观。${ref('wuhan')}\n\n第一次来，可以从这几种体验开始：\n- **历史文化**：黄鹤楼、湖北省博物馆。\n- **江湖风景**：东湖、汉口江滩。\n- **老街与过早**：江汉路一带，品尝热干面、豆皮等。\n\n告诉我停留几天、和谁同行、住在哪个区域，我可以帮你整理行程；也可以继续了解SPU社区和SAIG比赛。`;
    places = [{ id: 'yellow-crane', name: '黄鹤楼', area: '武昌', description: '从经典地标认识武汉的人文故事。', sourceId: used[0]?.id },
      { id: 'east-lake', name: '东湖', area: '武昌', description: '留一点时间给湖边与慢生活。', sourceId: used[0]?.id }];
    followups = composerGuidance('wuhan').questions;
  }
  return { answer, places, itinerary, followups:followups.filter(q=>q!==question), sources: [...new Map(used.map(c => [c.id, publicSource(c)])).values()] };
}
