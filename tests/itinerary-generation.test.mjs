import test from 'node:test';
import assert from 'node:assert/strict';
import {generateAnswer, travelRequest} from '../lib/itinerary-generation.mjs';
import {ServiceError} from '../lib/ai.mjs';
import {createApp} from './test-server.mjs';

const days = count => Array.from({length: count}, (_, i) => i + 1);
const replyFor = (indices, outline = false) => ({answer: '根据资料安排的行程[K1]', sources: ['K1'], places: [], followups: [], itinerary: {
  title: '武汉慢游', summary: '同区慢游', assumptions: ['我和父母共3人', '住江汉路', '不去黄鹤楼', '少走路'],
  days: indices.map(day => ({day, title: '片区' + day, stops: outline ? [] : [{time: '上午', name: '地点' + day, description: '轻松游览并休息', transport: '地铁静态参考', cost: '约30元/人'}]})),
  budget: [{item: '全程餐饮交通门票', amount: '总计不超过3000元/人，不含住宿'}], notes: ['营业和交通以出行时核实为准']
}});
const input = count => ({config: {}, instructions: '遵守资料，不安排高铁', mode: 'travel', locale: 'zh-CN', signal: new AbortController().signal,
  messages: [{role: 'user', content: '我和父母来武汉' + count + '天，住江汉路，不去黄鹤楼，少走路，预算每人3000，直接安排'}]});

for (const count of [8, 30]) test(count + '-day generation merges every original day exactly once with one shared budget and bounded concurrency', async () => {
  const args = input(count); let active = 0, peak = 0; const calls = [];
  args.generator = async (config, messages, prompt, signal, options) => {
    assert.deepEqual(messages, args.messages); assert.match(prompt, /住江汉路|遵守资料/);
    calls.push(options); active++; peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, options.stage === 'segment' && options.dayNumbers[0] === 1 ? 10 : 1)); active--;
    return replyFor(options.dayNumbers, options.stage === 'outline');
  };
  const result = await generateAnswer(args);
  assert.deepEqual(result.reply.itinerary.days.map(day => day.day), days(count));
  assert.equal(new Set(result.reply.itinerary.days.map(day => day.stops[0].name)).size, count);
  assert.equal(result.reply.itinerary.budget.length, 1); assert.equal(peak, 2);
  assert.equal(result.generation.complete, true); assert.equal(calls.length, 1 + Math.ceil(count / 4));
});

test('a missing or duplicate segment day is regenerated once before merging', async () => {
  const args = input(8); let attempts = 0;
  args.generator = async (config, messages, prompt, signal, options) => {
    if (options.stage === 'segment' && options.dayNumbers[0] === 5 && !attempts++) return replyFor([5, 5, 7, 8]);
    return replyFor(options.dayNumbers, options.stage === 'outline');
  };
  const result = await generateAnswer(args);
  assert.deepEqual(result.reply.itinerary.days.map(day => day.day), days(8)); assert.equal(attempts, 2);
});

test('a truncated normal answer is regenerated as complete JSON with a bounded retry', async () => {
  let calls = 0;
  const args = {...input(2), generator: async () => { if (!calls++) throw new ServiceError('cut', 502, 'OUTPUT_TRUNCATED'); return replyFor([1, 2]); }};
  assert.equal((await generateAnswer(args)).reply.itinerary.days.length, 2); assert.equal(calls, 2);
});

test('a persistently failed segment preserves honest partial results with original day numbers', async () => {
  const args = input(8); let calls = 0;
  args.generator = async (config, messages, prompt, signal, options) => {
    if (options.stage === 'segment' && options.dayNumbers[0] === 1) { calls++; throw new ServiceError('cut', 502, 'OUTPUT_TRUNCATED'); }
    return replyFor(options.dayNumbers, options.stage === 'outline');
  };
  const result = await generateAnswer(args);
  assert.deepEqual(result.reply.itinerary.days.map(day => day.day), [5, 6, 7, 8]); assert.equal(calls, 2);
  assert.deepEqual(result.generation.missingDays, [1, 2, 3, 4]); assert.equal(result.generation.complete, false);
  assert.match(result.reply.answer, /不是完整行程/); assert.match(result.reply.itinerary.notes[0], /尚未生成成功/);
});

test('day-two rain edit keeps all untouched days and overall budget exactly unchanged', async () => {
  const args = input(8); args.previousItinerary = replyFor(days(8)).itinerary;
  args.messages.push({role: 'user', content: '第二天下雨了，帮我修改'});
  let calls = 0;
  args.generator = async (config, messages, prompt, signal, options) => {
    calls++; assert.equal(options.stage, 'revision'); assert.deepEqual(options.dayNumbers, [2]);
    assert.match(prompt, /少走路/); const patch = replyFor([2]); patch.itinerary.days[0].stops[0].name = '湖北省博物馆'; return patch;
  };
  const result = await generateAnswer(args);
  assert.equal(calls, 1); assert.equal(result.reply.itinerary.days[1].stops[0].name, '湖北省博物馆');
  for (const day of [1, 3, 4, 5, 6, 7, 8]) assert.deepEqual(result.reply.itinerary.days[day - 1], args.previousItinerary.days[day - 1]);
  assert.deepEqual(result.reply.itinerary.budget, args.previousItinerary.budget);
});

test('ranges override older exact durations and unrelated competition questions do not trigger segmentation', () => {
  const history = input(8).messages;
  for (const content of ['现在选6-10天，具体天数尚未确定', 'Plan a 6–10 days trip']) {
    const request = travelRequest([...history, {role: 'user', content}], 'travel', replyFor(days(8)).itinerary);
    assert.equal(request.days, null); assert.equal(request.uncertain, true);
  }
  assert.equal(travelRequest([{role: 'user', content: 'Plan an 8 days Wuhan trip'}], 'travel').days, 8);
  assert.equal(travelRequest([{role: 'user', content: 'SAIG还有8天报名截止吗？'}], 'travel').intent, false);
});

test('authentication and quota failures never cause automatic retries', async () => {
  for (const code of ['AUTH_ERROR', 'RATE_LIMITED']) {
    let calls = 0;
    await assert.rejects(generateAnswer({...input(8), generator: async () => { calls++; throw new ServiceError('failure', 502, code); }}), {code});
    assert.equal(calls, 1);
  }
});

test('retrying missing days preserves completed segments and the original budget', async () => {
  const args = input(8); const previous = replyFor([5, 6, 7, 8]).itinerary;
  args.previousItinerary = previous; args.messages.push({role: 'user', content: '请补齐缺失的天数'});
  const segments = [];
  args.generator = async (config, messages, prompt, signal, options) => {
    if (options.stage === 'segment') segments.push(options.dayNumbers);
    return replyFor(options.dayNumbers, options.stage === 'outline');
  };
  const result = await generateAnswer(args);
  assert.deepEqual(segments, [[1, 2, 3, 4]]);
  assert.deepEqual(result.reply.itinerary.days.slice(4), previous.days);
  assert.deepEqual(result.reply.itinerary.budget, previous.budget);
  assert.equal(result.generation.complete, true);
});

test('cancellation stops retries and prevents scheduling subsequent batches', async () => {
  const args = input(30), abort = new AbortController(); args.signal = abort.signal;
  let segmentCalls = 0;
  args.generator = async (config, messages, prompt, signal, options) => {
    if (options.stage === 'outline') return replyFor(options.dayNumbers, true);
    segmentCalls++; abort.abort(); throw new ServiceError('cancelled', 504, 'TIMEOUT');
  };
  await assert.rejects(generateAnswer(args)); assert.equal(segmentCalls, 1);
});

test('server passes structured previous itinerary intact and attaches journey after final merge', async () => {
  const server = createApp({generator: async (config, messages, instructions, signal, options) => replyFor(options.dayNumbers, options.stage === 'outline')});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/chat', {method: 'POST', body: JSON.stringify({mode: 'travel', messages: input(8).messages})});
    const result = await response.json();
    assert.equal(result.meta.mode, 'ai'); assert.equal(result.meta.generation.complete, true);
    assert.deepEqual(result.itinerary.days.map(day => day.day), days(8));
    assert.equal(result.itinerary.budget.length, 1);
    assert.ok(result.itinerary.journey);
    const previous = replyFor(days(8)).itinerary;
    const patchResponse = await fetch('http://127.0.0.1:' + server.address().port + '/api/chat', {method: 'POST', body: JSON.stringify({mode: 'travel',
      messages: [...input(8).messages, {role: 'user', content: '第二天下雨了，请修改'}], previousItinerary: previous})});
    const patch = await patchResponse.json();
    assert.equal(patch.meta.generation.strategy, 'revision');
    assert.deepEqual(patch.itinerary.days[7], previous.days[7]);
    const malformed = await fetch('http://127.0.0.1:' + server.address().port + '/api/chat', {method: 'POST', body: JSON.stringify({mode: 'travel',
      messages: input(8).messages, previousItinerary: {days: [null], budget: [null]}})});
    assert.equal(malformed.status, 200);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
