export const presenterTopics=Object.freeze({
  wuhan:{title:'跟小豚，认识武汉',short:'认识武汉',color:'#719583',eyebrow:'一江两岸 · 江湖有知音',
    greeting:'你好，我是江小豚！欢迎来到武汉。长江与汉江在这里交汇，也把汉口、武昌、汉阳连在一起。我们可以从黄鹤楼的诗意、荆楚文化的来处，聊到热干面的烟火气。你想先认识哪一种武汉？',
    cards:[['江湖与城市','长江、汉江与武汉三镇','江'],['荆楚与历史','从荆楚文脉到敢为人先','楚'],['街巷与生活','过早、热干面与江城烟火','早']],
    questions:['武汉为什么叫江城？','带我认识武汉的荆楚文化','武汉有哪些值得尝试的过早美食？']},
  travel:{title:'让小豚，带你游武汉',short:'规划旅行',color:'#6996a0',eyebrow:'按你的节奏 · 慢慢逛江城',
    greeting:'出发前，先和我聊聊吧！你准备在武汉待多久、和谁同行、住在哪里？我会结合项目里的旅行资料，帮你把景点、过早和休息排进同一条顺路的行程。带父母、怕走累，或者遇上下雨，也可以随时告诉我，我们一起调整。',
    cards:[['先说你的喜欢','天数、同行人、住宿与预算','01'],['把地方连成路线','按片区安排，留出吃饭与休息','02'],['边聊边调整','疲劳、雨天与交通都可以再商量','03']],
    questions:['第一次去武汉，1到3天可以怎么玩？','带父母在武汉玩两天，少走路怎么安排？','武汉下雨时有哪些室内游玩选择？']},
  community:{title:'和小豚，走进 SPU',short:'SPU 社区',color:'#729da7',eyebrow:'人和 AI · 一起把事情做成',
    greeting:'欢迎来到数命SPU社区！SPU是超级个体单元，关注人借助AI学习、创作与协作，把想法做成真实项目。武汉的布局包括江岸智民里和光谷创新天地。我可以陪你了解社区故事、创办团队和参与方向。资料里仍在规划中的设施，我也会和已经有的内容区分清楚。',
    cards:[['认识 SPU','超级个体单元 · 人与 AI 协作','人'],['两处武汉布局','江岸智民里 · 光谷创新天地','城'],['从想法到作品','学习、创作与真实项目','创']],
    questions:['SPU是什么意思？','不会编程的人可以怎么参与社区？','介绍社区的创办故事和团队']},
  saig:{title:'听小豚，讲清 SAIG',short:'SAIG 赛事',color:'#9f8872',eyebrow:'从真实需求出发 · 交付你的作品',
    greeting:'想参加SAIG？我陪你先把任务看清楚。这个城市AI接待员赛题有四项能力：介绍武汉、介绍SPU社区、规划武汉旅行，以及介绍SPU与SAIG，每项二十五分。项目保存的是十月二十七日核对的规则快照，最新赛程和报名安排，我们仍要以官网为准。你想先了解赛题，还是提交材料？',
    cards:[['四项真实能力','武汉 · 社区 · 旅行 · SPU / SAIG','25×4'],['个人参赛与交付','项目简介与完整演示视频','交付'],['先核实再出发','规则快照：2026-10-27 · 以官网为准','核实']],
    questions:['四项赛题具体怎么评分？','报名需要提交哪些材料？','SAIG的重要时间和参赛要求是什么？']}
});

export const presenterAudition='我是江小豚。荆楚的故事，我来讲！江城的风雨，我陪你面对。不必慌张，抬起头，我们一起向前！';

export function speechText(value){
  return String(value||'').replace(/```[\s\S]*?```/g,'').replace(/!\[[^\]]*\]\([^)]*\)/g,'')
    .replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\[(?:K\d+|M\d+|O1)\]/g,'')
    .replace(/https?:\/\/[^\s)]+/g,'').replace(/^[ \t]*[|].*$/gm,'')
    .replace(/^[ \t]*(?:#{1,6}\s*|[-*+]\s+|\d+[.)、]\s*)/gm,'').replace(/[*_`~]/g,'')
    .replace(/[ \t]+/g,' ').replace(/\n{2,}/g,'。').replace(/\n/g,' ').replace(/。{2,}/g,'。').trim();
}
export function splitSpeech(value,max=160){
  const text=speechText(value);const chunks=[];let current='';
  for(const sentence of text.match(/[^。！？.!?;；]+[。！？.!?;；]*|[。！？.!?;；]+/gu)||[]){
    let rest=sentence;
    if(current&&current.length+rest.length>max){chunks.push(current);current='';}
    while(rest.length>max){let end=rest.lastIndexOf('，',max-1);if(end<max/2)end=rest.lastIndexOf(' ',max-1);if(end<max/2)end=max;else end++;chunks.push(rest.slice(0,end));rest=rest.slice(end);}
    current+=rest;
  }
  if(current.trim())chunks.push(current.trim());return chunks;
}
export function replySpeech(result){
  const text=speechText(result?.answer);if(text.length<=650)return text;
  const chunks=splitSpeech(text,160);let short='';
  for(const chunk of chunks){if(short.length+chunk.length>480)break;short+=chunk;}
  return short+' 详细内容我放在旁边了，你也可以接着问我。';
}
