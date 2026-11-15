import test from 'node:test';
import assert from 'node:assert/strict';
import {receptionEmotion, resolveEmotion} from '../public/mascot.mjs';
import {normalizeFollowups} from '../public/followups.mjs';
import {sanitizeReply} from './test-server.mjs';
import {systemPrompt} from '../lib/prompt.mjs';

test('thinking only persists while a request is pending and completed plans override stale thinking labels', () => {
  const plan = {answer: '已安排八天行程', emotion: 'thinking', itinerary: {days: [{day: 1}]}};
  assert.equal(receptionEmotion({pending: true, result: plan}), 'thinking');
  assert.equal(receptionEmotion({result: plan, mode: 'travel'}), 'happy');
  assert.equal(resolveEmotion(plan), 'happy');
  assert.equal(receptionEmotion({result: {answer: '请告诉我准备玩几天？', emotion: 'thinking'}, mode: 'travel'}), 'neutral');
  assert.equal(receptionEmotion({result: {answer: '已取消', meta: {mode: 'error'}}}), 'worried');
  assert.equal(receptionEmotion({result: {emotion: 'thinking', meta: {code: 'PARTIAL_ITINERARY'}}}), 'worried');
  assert.equal(receptionEmotion({result: {emotion: 'serious'}, mode: 'saig'}), 'serious');
});

test('the three reported backwards questions become actionable requests without inventing personal facts', () => {
  const result = normalizeFollowups(['你们更想把哪一天安排得轻松些？', '有没有忌口，或更想尝试哪些武汉小吃？', '如果遇到下雨，希望优先改成室内历史场馆还是商圈休息？']);
  assert.deepEqual(result, ['请看看哪些天可以减少步行，安排得更轻松一些。', '请介绍武汉特色小吃的口味、常见食材和饮食注意事项。', '如果下雨，请帮我比较室内场馆和商圈休息的替代方案。']);
  assert.ok(result.every(text => !/我们没有忌口|对.*过敏|想优先改成/.test(text)));
  assert.deepEqual(normalizeFollowups(result), result);
});

test('genuine visitor requests survive while unknown assistant preference questions are omitted', () => {
  const good = ['你能推荐不辣的武汉小吃吗？', '请介绍SAIG参赛要求', '我们住江汉路，请调整第二天'];
  assert.deepEqual(normalizeFollowups(good), good);
  assert.deepEqual(normalizeFollowups(['你们准备住在哪里？', '你更喜欢什么风格？']), []);
  assert.deepEqual(normalizeFollowups([null, '', {}, '请介绍武汉', '请介绍武汉']), ['请介绍武汉']);
  assert.deepEqual(normalizeFollowups(['Do you have any dietary restrictions?']), ['Please recommend Wuhan dishes and explain their common ingredients and dietary considerations.']);
  assert.deepEqual(normalizeFollowups(['Which day is the museum closed?', 'Please show metro routes.', 'おすすめの料理を教えてください。']), ['Which day is the museum closed?', 'Please show metro routes.', 'おすすめの料理を教えてください。']);
});

test('server normalizes followups and the generation prompt distinguishes visitor buttons from assistant questions', () => {
  assert.equal(sanitizeReply({answer: '已完成', followups: ['有没有忌口，或更想尝试哪些武汉小吃？']}, []).followups[0], '请介绍武汉特色小吃的口味、常见食材和饮食注意事项。');
  const prompt = systemPrompt([], 'travel');
  assert.match(prompt, /原样当作访客的下一条消息/);
  assert.match(prompt, /不替用户编造过敏/);
});
