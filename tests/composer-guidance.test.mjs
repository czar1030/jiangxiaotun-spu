import test from 'node:test';
import assert from 'node:assert/strict';
import {composerGuidance} from '../public/composer-guidance.mjs';
import {languages} from '../public/language-core.mjs';
import {localAnswer} from '../lib/fallback.mjs';
import {systemPrompt} from '../lib/prompt.mjs';
import {localizedReference} from '../lib/language.mjs';
import {createApp} from './test-server.mjs';

const modes = ['wuhan', 'travel', 'community', 'saig'];
test('every reception language has distinct, complete guidance for all four modules', () => {
  for (const {code} of languages) {
    const groups = modes.map(mode => composerGuidance(mode, code));
    assert.equal(new Set(groups.map(group => group.placeholder)).size, 4, code);
    for (const [index, group] of groups.entries()) {
      assert.equal(group.questions.length, 3, `${code}: ${modes[index]}`);
      assert.ok(group.questions.every(question => typeof question === 'string' && question.trim()));
      assert.equal(group.placeholder, group.questions[0]);
      assert.equal(group.planner, modes[index] === 'travel');
      if (!code.startsWith('zh') && code !== 'ja') assert.doesNotMatch(group.questions.join(''), /[\u4e00-\u9fff]/u);
    }
  }
});

test('the Chinese defaults cover city history and AI, trips, community, and competition separately', () => {
  assert.match(composerGuidance('wuhan').questions.join(''), /历史.*辛亥革命.*AI/);
  assert.match(composerGuidance('travel').questions.join(''), /1–5天.*地铁.*轮渡.*父母/);
  for (const mode of ['community', 'saig']) {
    assert.doesNotMatch(composerGuidance(mode).questions.join(''), /游玩|旅游|历史|景点|父母/);
  }
  assert.match(composerGuidance('community').questions.join(''), /编程.*创办.*项目/);
  assert.match(composerGuidance('saig').questions.join(''), /条件.*材料.*截止.*评分/);
});

test('local answers keep their followups on topic, while explicit cross-topic questions still work', () => {
  for (const mode of modes) {
    const result = localAnswer([{role: 'user', content: composerGuidance(mode).questions[0]}], mode, []);
    if (mode !== 'travel') assert.deepEqual(result.followups, composerGuidance(mode).questions.slice(1));
    if (['community', 'saig'].includes(mode)) assert.doesNotMatch(result.followups.join(''), /游玩|旅游|历史|景点|父母/);
  }
  const crossTopic = localAnswer([{role: 'user', content: 'SAIG报名需要提交什么材料？'}], 'wuhan', []);
  assert.deepEqual(crossTopic.followups, composerGuidance('saig').questions);
  assert.ok(localAnswer([{role: 'user', content: '我和父母在武汉玩两天，请安排旅游行程'}], 'community', []).itinerary);
});

test('online generation is instructed to keep suggestions on topic without restricting visitor input', () => {
  const prompt = systemPrompt([], 'community');
  assert.match(prompt, /默认建议与followups只围绕当前入口主题/);
  assert.match(prompt, /用户明确主动跨主题提问时，按用户本轮主题回答/);
});

test('foreign-language reference replies keep topic-specific suggestions in the selected language', () => {
  for (const {code} of languages) {
    for (const mode of modes) {
      const reply = localizedReference([{role: 'user', content: ''}], mode, [], code);
      assert.deepEqual(reply.followups, composerGuidance(mode, code).questions);
    }
  }
});

test('HTTP receives the exact visible question and the selected module for every entry', async () => {
  let received;
  const server = createApp({generator: async (_config, messages, instructions) => {
    received = {messages, instructions};
    return {answer: '这是与当前问题相关的说明。', followups: []};
  }});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    for (const mode of modes) {
      const question = composerGuidance(mode).questions[0];
      const messages = [{role: 'user', content: question}];
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/chat`, {
        method: 'POST', body: JSON.stringify({mode, locale: 'zh-CN', messages})
      });
      assert.equal(response.status, 200);
      await response.json();
      assert.deepEqual(received.messages, messages);
      assert.ok(received.instructions.includes(`当前入口：${mode}。`));
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
