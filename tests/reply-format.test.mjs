import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recoverReplyFormat, hasSerializedItinerary} from '../public/reply-format.mjs';
import {parseReply} from '../lib/ai.mjs';
import {generateAnswer} from '../lib/itinerary-generation.mjs';
import {sanitizeReply} from './test-server.mjs';

const pasted = readFileSync(new URL('./fixtures/inline-itinerary.txt', import.meta.url), 'utf8');
const text = pasted.slice(pasted.indexOf('已把武汉小吃'));
const plan = JSON.parse(text.slice(text.indexOf('{')));

test('the actual reported response recovers all eight itinerary cards instead of raw JSON prose', () => {
  const reply = parseReply(text);
  assert.equal(reply.itinerary.days.length, 8);
  assert.equal(reply.itinerary.days.reduce((sum, day) => sum + day.stops.length, 0), 24);
  assert.match(reply.answer, /已把武汉小吃融入8天行程/);
  assert.ok(!reply.answer.includes('"days"'));
  assert.match(reply.itinerary.budget.at(-1).amount, /900/);
  assert.equal(sanitizeReply(reply, []).itinerary.days.length, 8);
});

test('saved conversations recover without losing original metadata, citation objects or followup buttons', () => {
  const original = {answer: text, itinerary: null, sources: [{id: 'K1', title: '手册', url: '/materials/test.pdf'}],
    meta: {mode: 'ai', model: 'unchanged'}, followups: ['请减少步行']};
  const recovered = recoverReplyFormat(original);
  assert.equal(recovered.itinerary.days.length, 8);
  assert.deepEqual(recovered.sources, original.sources);
  assert.deepEqual(recovered.meta, original.meta);
  assert.deepEqual(recovered.followups, original.followups);
  assert.deepEqual(recoverReplyFormat(recovered), recovered);
});

test('standalone plans, fenced plans and serialized reply envelopes preserve prose and genuine structure', () => {
  const fenced = recoverReplyFormat({answer: '已完成。\n```json\n' + JSON.stringify(plan) + '\n```\n请核实营业。'});
  assert.equal(fenced.answer, '已完成。\n\n请核实营业。');
  assert.equal(parseReply(JSON.stringify(plan)).itinerary.days.length, 8);
  const envelope = {answer: '按你的条件安排好了。', sources: ['K1'], itinerary: plan};
  const parsed = parseReply(JSON.stringify(envelope));
  assert.equal(parsed.answer, envelope.answer); assert.deepEqual(parsed.sources, ['K1']);
  assert.equal(parsed.itinerary.days.length, 8);
});

test('balanced parsing respects escaped quotes and braces inside strings, leaving ordinary text unchanged', () => {
  const custom = structuredClone(plan);
  custom.days[0].stops[0].description = '展牌写着 {江城}，以及"江汉关"；不是另一个JSON。';
  const recovered = recoverReplyFormat({answer: '参考说明\n' + JSON.stringify({unrelated: true}) + '\n' + JSON.stringify(custom)});
  assert.deepEqual(recovered.itinerary.days[0].stops[0].description, custom.days[0].stops[0].description);
  for (const answer of ['武汉的江湖风景值得慢慢看。', '示例 {"days":"not a plan"}', '不完整 {"title":"武汉", "days":[']) {
    assert.deepEqual(recoverReplyFormat({answer}), {answer});
  }
  assert.ok(hasSerializedItinerary('已完成\n{"title":"武汉","days":['));
});

test('a falsely completed response without itinerary triggers recovery instead of masquerading as clarification', async () => {
  let calls = 0;
  const generator = async (config, messages, instructions, signal, options) => {
    calls++;
    if (calls === 1) return {answer: '已把武汉小吃安排进8天行程，并控制在900元以内。', itinerary: null};
    return {answer: '已安排。', itinerary: {...plan, days: options.dayNumbers.map(day => ({...plan.days[day - 1], stops: options.stage === 'outline' ? [] : plan.days[day - 1].stops}))}};
  };
  const result = await generateAnswer({generator, config: {}, messages: [{role: 'user', content: '请把小吃安排进8天行程，预算每人900元'}],
    mode: 'travel', instructions: '', signal: new AbortController().signal});
  assert.equal(calls, 4); assert.equal(result.reply.itinerary.days.length, 8); assert.equal(result.generation.complete, true);
});

test('an entire genuine plan returned during outline generation is retained and validated', async () => {
  let calls = 0;
  const result = await generateAnswer({generator: async () => { calls++; return {answer: text, itinerary: null}; },
    config: {}, messages: [{role: 'user', content: '请把武汉小吃安排进8天行程'}], mode: 'travel', instructions: '', signal: new AbortController().signal});
  assert.equal(calls, 1); assert.equal(result.generation.complete, true);
  assert.equal(result.reply.itinerary.days.length, 8); assert.ok(!result.reply.answer.includes('"days"'));
});

test('genuine clarification remains possible when inputs or budget actually need confirmation', async () => {
  const result = await generateAnswer({generator: async () => ({answer: '预算不足，请确认能否增加预算？', itinerary: null, needsClarification: true}),
    config: {}, messages: [{role: 'user', content: '武汉8天，每人1元，请安排'}], mode: 'travel', instructions: '', signal: new AbortController().signal});
  assert.equal(result.generation.strategy, 'clarification'); assert.equal(result.reply.itinerary, null);
});
