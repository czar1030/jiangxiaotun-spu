import test from 'node:test';
import assert from 'node:assert/strict';
import {generateAnswer, travelRequest} from '../lib/itinerary-generation.mjs';
import {requestedDayRange, requestedDays} from '../lib/travel-days.mjs';
import {localAnswer} from '../lib/fallback.mjs';
import {plannerChoices} from '../public/travel-plan.mjs';
import {dayRanges, travelPlannerCopy} from '../public/travel-copy.mjs';
import {languages} from '../public/language-core.mjs';
import {loadMedia} from '../lib/media.mjs';
import {root} from './test-server.mjs';

test('range answers recover actual photos from prose when the model omits places',async()=>{
  let calls=0;
  const result=await generateAnswer({config:{},mode:'travel',instructions:'',messages:[{role:'user',content:'武汉玩1-5天，请先按范围推荐'}],mediaSubjects:loadMedia(root),
    generator:async()=>{calls++;return {...overview,places:[]};}});
  assert.equal(calls,1);assert.equal(result.generation.strategy,'range-overview');
  assert.ok(result.reply.places.length>=2);assert.ok(result.reply.places.every(p=>p.image));
});

test('opting to supply an exact duration after an overview permits a short clarification',async()=>{
  let calls=0;
  const result=await generateAnswer({config:{},mode:'travel',instructions:'',messages:[{role:'user',content:'武汉玩1-5天'},{role:'assistant',content:overview.answer},{role:'user',content:'我想补充具体天数，请帮我细化行程'}],
    generator:async()=>{calls++;return {answer:'这次实际游玩几天？我会保留你已有的偏好。',itinerary:null,places:[]};}});
  assert.equal(calls,1);assert.equal(result.generation.strategy,'clarification');assert.match(result.reply.answer,/几天/);
});

const request = range => '请按范围推荐武汉旅行，时间' + range + '天，和父母同行，住江汉路附近，预算每人2000元不含住宿，少走路，喜欢本地美食、历史文化和亲子科普，安排地铁与轮渡。';
const overview = {answer: '可以先从汉口江滩和江汉路步行街感受江城。时间短时优先选汉口同一片区，把老街、美食与江边短程散步组合起来；时间多时再加入湖北省博物馆与东湖一带。住江汉路附近，可以先安排住宿周边过早与休息，跨片区优先地铁，累了可用短程网约车接驳。天气与运营合适时，武汉关码头至中华路码头的普通轮渡可以作为跨江备选。费用按人均估算，保留住宿和往返交通不计入的口径，预约、开放和班次须出行前核实。\n\n如果方便，可以再告诉我具体玩几天，我能进一步细化安排。',
  itinerary: null, places: [{name: '汉口江滩'}, {name: '江汉路步行街'}], emotion: 'happy', followups: ['我想补充具体天数，请帮我细化行程']};

for (const [min, max] of dayRanges) {
  test(min + '–' + max + ' days gives recommendations before asking for exact days, online and offline', async () => {
    const messages = [{role: 'user', content: request(min + '–' + max)}]; let calls = 0;
    const result = await generateAnswer({config: {}, mode: 'travel', instructions: '', messages, signal: new AbortController().signal,
      generator: async (config, original, prompt, signal, options) => {
        calls++; assert.deepEqual(original, messages); assert.equal(options.stage, 'range-overview');
        assert.deepEqual(options.durationRange, [min, max]); assert.match(prompt, /正文先给推荐/); return overview;
      }});
    assert.equal(calls, 1); assert.equal(result.generation.strategy, 'range-overview'); assert.equal(result.reply.itinerary, null);
    const fallback = localAnswer(messages, 'travel', []);
    assert.equal(fallback.itinerary, null); assert.ok(fallback.places.length >= 2);
    assert.match(fallback.answer, new RegExp(min + '–' + max + '天'));
    assert.ok(fallback.answer.indexOf('江汉路') < fallback.answer.lastIndexOf('实际玩几天'));
    assert.match(fallback.answer, /地铁|号线/); assert.match(fallback.answer, /武汉关码头→中华路码头/);
    assert.match(fallback.answer, /2000元/); assert.ok(!/请先确认|确认后我再/.test(fallback.answer));
    if (max >= 10) assert.match(fallback.answer, /慢游|休息/);
  });
}

test('ranges override a stale exact plan, accept natural range wording, and never silently choose the upper endpoint', () => {
  for (const value of ['一到五天', '1至5天', '1–5 days']) assert.deepEqual(requestedDayRange(value), {min: 1, max: 5});
  assert.equal(requestedDays('一到五天'), null);
  for (const value of ['6–10 jours', '6–10 Tage', '6–10 días', '6–10 giorni', '6–10일']) {
    const parsed = travelRequest([{role: 'user', content: value}], 'travel');
    assert.deepEqual(parsed.range, {min: 6, max: 10}); assert.equal(parsed.days, null);
  }
  const oldPlan = {days: Array.from({length: 8}, (_, i) => ({day: i + 1}))};
  const messages = [{role: 'user', content: '原来安排8天'}, {role: 'user', content: '现在改为21-30天，先按范围推荐'}];
  assert.deepEqual(travelRequest(messages, 'travel', oldPlan).range, {min: 21, max: 30});
  assert.equal(travelRequest(messages, 'travel', oldPlan).days, null);
  messages.push({role: 'user', content: '现在确定4天，请安排'});
  assert.equal(travelRequest(messages, 'travel', oldPlan).days, 4); assert.equal(travelRequest(messages, 'travel', oldPlan).range, null);
  assert.equal(plannerChoices({days: '6-10'}).exactDays, null);
  assert.ok(!plannerChoices({days: '6-10'}).duration.includes('请先确认'));
  assert.equal(plannerChoices({days: '6-10', exactDays: '4'}).duration, '4 天');
});

test('range reception retries a question-only reply and does not accept a forced exact-day itinerary', async () => {
  let calls = 0;
  const result = await generateAnswer({config: {}, mode: 'travel', instructions: '', messages: [{role: 'user', content: request('6-10')}],
    signal: new AbortController().signal, generator: async () => {
      calls++; return calls === 1 ? {answer: '请先确认玩几天，确认后再推荐。', itinerary: null, places: []} : overview;
    }});
  assert.equal(calls, 2); assert.equal(result.reply.itinerary, null); assert.match(result.reply.answer, /汉口江滩/);
});

test('offline range suggestions respect excluded landmarks, no-ferry preferences and unrecognized lodging', () => {
  const result = localAnswer([{role: 'user', content: '武汉1-5天，住在未收录的某酒店，不去黄鹤楼，不要轮渡，少走路'}], 'travel', []);
  assert.ok(!result.places.some(place => place.name === '黄鹤楼'));
  assert.ok(!result.answer.includes('武汉关码头→中华路码头'));
  assert.ok(!result.answer.includes('江汉路站'));
  assert.match(result.answer, /未收录的某酒店/);
});

test('every language describes range-first recommendations and provides a localized range request', () => {
  for (const {code} of languages) {
    const copy = travelPlannerCopy(code); assert.ok(copy.rangeRequest?.trim(), code); assert.ok(copy.daysHelp?.trim(), code);
  }
  assert.match(travelPlannerCopy('zh-CN').daysHelp, /先按时间范围推荐/);
  assert.match(travelPlannerCopy('en').daysHelp, /recommendations across the selected range/);
});
