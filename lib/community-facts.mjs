import {tokenize} from './knowledge.mjs';

// Same attributed reporting used by the community story page. Company revenue
// must never be described as the founder's personal income or members' earnings.
export function communityStoryChunks(startIndex) {
  return [{title:'长江日报 · 罗弼文与 Mark 印创业故事',url:'https://www.wuhan.gov.cn/sy/whyw/202605/t20260512_2763212.shtml',
    text:'长江日报2026年5月12日报道：罗弼文是数命科技（武汉）有限公司创始人，2017年回武汉创业。2025年团队与荆州博物馆合作，将56件楚文化文物做成能对话的AI明信片，产品名为Mark印，后来走向美国市场。报道提及2025年公司营收2亿元，这是公司营收而非创始人个人收入，更不是社区参与者的收益承诺。数命SPU社区由该公司建设运营；社区参与与开放规则以官方说明为准。'},
    {title:'湖北日报 · Mark 印卡片销售报道',url:'http://www.hbwmw.gov.cn/c/2026/05/81712.shtml',
    text:'湖北日报2026年5月26日报道，Mark印文物AI卡片在2025年10月至2026年5月销售约190万张，约95%来自美国市场。这与2025年公司营收属于不同统计时间、不同口径，不可换算成个人收入。'}]
    .map((entry,i)=>({...entry,id:`K${startIndex+i+1}`,docId:'community-story-report',topic:'community',page:null,tokens:new Set(tokenize(entry.text))}));
}
