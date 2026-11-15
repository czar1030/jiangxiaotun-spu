import test from 'node:test';
import assert from 'node:assert/strict';
import {dayRevisionPrompt,itinerarySubjects,renderPlanOverview,readMarkdownTable,revisionPlanForDraft} from '../public/answer-layout.mjs';

const plan={title:'江城八天',days:[{day:1,title:'武昌文化',stops:[{name:'黄鹤楼'},{name:'东湖樱花园'}]},{day:2,title:'汉口街巷',stops:[{name:'江汉路'}]}]};
test('day revision drafts identify the actual day and preserve the remaining trip and visitor conditions',()=>{
  const before=structuredClone(plan);
  assert.match(dayRevisionPrompt(plan,2),/第2天「汉口街巷」.*其余天数和安排保持不变.*住宿、同行与预算/);
  assert.match(dayRevisionPrompt(plan,'2','en'),/day 2.*other days.*budget/);
  assert.equal(dayRevisionPrompt(plan,3),'');
  assert.deepEqual(plan,before);
});
test('editing an older plan carries that selected plan, while replacing the draft drops its context',()=>{
  const prefix=dayRevisionPrompt(plan,2);
  const context={prefix,plan};
  assert.equal(revisionPlanForDraft(context,prefix+'下午改去博物馆'),plan);
  assert.equal(revisionPlanForDraft(context,'重新介绍武汉'),undefined);
  assert.equal(revisionPlanForDraft(null,'请调整第2天'),undefined);
});
test('stop illustrations resolve specific reviewed subjects and omit unknown places and model image links',()=>{
  const subjects=[{id:'crane',name:'黄鹤楼',image:{src:'/crane.webp'}},{id:'lake',name:'东湖',image:{src:'/lake.webp'}},{id:'sakura',name:'东湖樱花园',image:{src:'/sakura.webp'}},{id:'street',name:'江汉路'}];
  const result=itinerarySubjects({...plan,days:[...plan.days,{stops:[{name:'未确认的咖啡馆',image:'https://model.invalid/photo.jpg'}]}]},subjects);
  assert.deepEqual(result.map(s=>s.id),['crane','sakura']);
});
test('daily overview uses message-scoped targets and escapes model-produced text',()=>{
  const html=renderPlanOverview([{day:8,title:'<img src=x onerror=alert(1)>',stops:[{name:'A & B'}]}],19);
  assert.match(html,/data-answer-jump="plan-19-day-0"/);
  assert.match(html,/DAY 08/);
  assert.ok(!html.includes('<img'));
  assert.match(html,/&amp;/);
  assert.match(renderPlanOverview(plan.days,20,false),/Itinerary overview/);
});
test('answer tables preserve columns, escaped pipes and following prose while refusing non-table text',()=>{
  const lines=['项目 | 金额 | 说明',':--- | ---: | :---:','交通 | 50 | A \\| B','门票 | 100 | <script>alert(1)</script>','','后续提醒'];
  const table=readMarkdownTable(lines,0);
  assert.equal(table.end,4);
  assert.match(table.html,/<th scope="col" style="text-align:right">金额/);
  assert.match(table.html,/A \| B/);
  assert.match(table.html,/&lt;script&gt;/);
  assert.ok(!table.html.includes('<script>'));
  assert.equal(readMarkdownTable(['江汉路 | 黄鹤楼','这里是普通文字'],0),null);
  assert.equal(readMarkdownTable(['项目 | 金额','---'],0),null);
});
