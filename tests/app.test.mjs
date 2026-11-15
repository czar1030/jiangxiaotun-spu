import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { loadKnowledge, retrieve, tokenize } from '../lib/knowledge.mjs';
import { localAnswer } from '../lib/fallback.mjs';
import {composerGuidance} from '../public/composer-guidance.mjs';

test('all twelve visible starter questions have relevant images in offline mode',async()=>{
  const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
    for(const mode of ['wuhan','travel','community','saig']){
      for(const content of composerGuidance(mode).questions){
        const res=await fetch(`http://127.0.0.1:${server.address().port}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,locale:'zh-CN',localOnly:true,messages:[{role:'user',content}]})});
        assert.equal(res.status,200);const reply=await res.json();
        assert.ok(reply.places.some(p=>p.image),content);
        if(/辛亥/.test(content))assert.ok(reply.places.some(p=>p.atlasId==='xinhai-north'));
        if(/创办/.test(content)){assert.match(reply.answer,/罗弼文/);assert.ok(reply.places.some(p=>p.atlasId==='luo-biwen'));}
        if(/住哪里/.test(content)){assert.match(reply.answer,/2号线/);assert.ok(reply.places.some(p=>p.atlasId==='wuhanguan-pier'));}
        assert.ok(!reply.followups.includes(content),'Do not invite the visitor to repeat the question just answered');
      }
    }
  }finally{await new Promise(r=>server.close(r));}
});
import { officialRules, systemPrompt } from '../lib/prompt.mjs';
import { parseReply, readEventStream } from '../lib/ai.mjs';
import { createApp, root, sanitizeReply } from './test-server.mjs';
import { resolveEmotion, validEmotion, mascotAsset } from '../public/mascot.mjs';

const { documents, chunks } = loadKnowledge(resolve(root, 'data/knowledge.json'));
const context = (text, mode = 'wuhan', history = []) => [...retrieve(chunks, [...history, { role: 'user', content: text }], mode), officialRules];
const local = (text, mode = 'wuhan', history = []) => localAnswer([...history, { role: 'user', content: text }], mode, context(text, mode, history));

test('all five official documents are indexed, with real PDF page addresses and math', () => {
  assert.equal(documents.length, 5);
  assert.equal(documents.find(d => d.id === 'wuhan-guide').pageCount, 211);
  assert.equal(documents.find(d => d.id === 'wuhan').pageCount, 7);
  assert.ok(chunks.some(c => c.topic === 'spu' && c.text.includes('U = P^S')));
  assert.ok(chunks.filter(c => c.topic === 'travel').every(c => c.url.endsWith(`#page=${c.page}`)));
});

test('Chinese retrieval retrieves destination information and retains short official documents', () => {
  assert.ok(tokenize('湖北省博物馆').includes('博物'));
  const selected = context('湖北省博物馆适合带孩子去吗？', 'travel');
  assert.ok(selected.some(c => c.topic === 'travel' && c.text.includes('湖北省博物馆')));
  for (const topic of ['community', 'saig', 'spu']) assert.ok(selected.some(c => c.topic === topic));
});

test('Wuhan introduction answers the three towns without replacing them with districts', () => {
  const result = local('武汉三镇指什么？');
  for (const name of ['武昌', '汉口', '汉阳']) assert.ok(result.answer.includes(name));
  assert.ok(result.sources.some(s => s.title === '武汉概览'));
});

test('community answer distinguishes plans from open facilities and includes both sites', () => {
  const result = local('不会编程可以参与社区吗？');
  assert.match(result.answer, /智民里/); assert.match(result.answer, /光谷创新天地/);
  assert.match(result.answer, /规划/); assert.match(result.answer, /不代表所有设施已开放/);
  assert.match(result.answer, /咨询/);
});

test('SAIG answer covers individual participation, video requirement, deadline and weights', () => {
  const result = local('SAIG报名需要提交什么？', 'saig');
  for (const text of ['个人', '视频', '23:59', '40%', '60%', 'SAIG']) assert.ok(result.answer.includes(text));
  assert.ok(result.sources.some(s => s.id === 'O1'));
});

test('SPU answer preserves formula and all five core abilities', () => {
  const result = local('SPU的五项核心能力是什么？');
  for (const name of ['独立判断', '调用AI', '组织任务', '完成交付', '承担责任', 'P^S']) assert.ok(result.answer.includes(name));
});

test('travel asks key conditions before a plan when days are absent', () => {
  const result = local('帮我规划武汉旅行', 'travel');
  assert.equal(result.itinerary, null); assert.match(result.answer, /几天/);
});

test('elderly travel has breaks, explicit budget assumptions and real source pages', () => {
  const result = local('我和父母来武汉两天，住江汉路，预算每人600元，不想走太多路，直接安排', 'travel');
  assert.equal(result.itinerary.days.length, 2);
  assert.ok(result.itinerary.assumptions.some(s => /江汉路/.test(s)));
  assert.ok(result.itinerary.assumptions.some(s => /600/.test(s)));
  assert.ok(result.itinerary.days.some(d => d.stops.some(s => /休息/.test(s.description))));
  assert.ok(result.sources.some(s => s.page > 0));
});

test('rain follow-up modifies day two while preserving a three-day trip and preferences', () => {
  const history = [{ role: 'user', content: '我和父母来武汉三天，住江汉路，预算每人600元，少走路，直接安排' }];
  const result = local('第二天下雨了，帮我修改', 'travel', history);
  assert.equal(result.itinerary.days.length, 3);
  assert.ok(result.itinerary.days[1].stops.some(s => s.name.includes('湖北省博物馆')));
  assert.ok(result.itinerary.days[1].stops.every(s => !/江滩|东湖/.test(s.name)));
  assert.ok(result.itinerary.assumptions.some(s => s.includes('江汉路')));
});

test('excluded landmark stays excluded when revising a trip', () => {
  const history = [{ role: 'user', content: '来武汉三天，直接安排' }];
  const result = local('把黄鹤楼取消，安排得更轻松', 'travel', history);
  assert.ok(result.itinerary.days.every(d => d.stops.every(s => !s.name.includes('黄鹤楼'))));
});

test('AI replies can be read as JSON or SSE, errors are never treated as success', () => {
  assert.equal(parseReply('```json\n{"answer":"你好"}\n```').answer, '你好');
  assert.equal(readEventStream('data: {"choices":[{"delta":{"content":"你好"}}]}\n\ndata: [DONE]\n'), '你好');
  assert.equal(readEventStream('event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"收到"}\n'), '收到');
  assert.throws(() => readEventStream('data: {"error":{"message":"failed"}}\n'));
  assert.throws(() => parseReply('not-json'));
});

test('model cannot invent source IDs or supply source URLs and excessive cards', () => {
  const selected = context('武汉三镇');
  const result = sanitizeReply({ answer: '武汉[K99999][O1]', sources: ['K99999', 'O1'], places: [] }, selected);
  assert.ok(!result.answer.includes('K99999')); assert.deepEqual(result.sources.map(s => s.id), ['O1']);
  assert.equal(result.sources[0].url, 'https://www.dlife.love/');
});

test('character expressions follow reply intent, including old replies and model failures', () => {
  assert.equal(resolveEmotion({ answer: '欢迎来武汉！' }, '介绍武汉'), 'happy');
  assert.equal(resolveEmotion({ answer: '请告诉我准备玩几天？' }, '帮我规划旅游'), 'thinking');
  assert.equal(resolveEmotion({ answer: '报名须提交视频。' }, 'SAIG报名要什么？'), 'serious');
  assert.equal(resolveEmotion({ itinerary: { days: [{ day: 1 }] } }, '武汉一日游'), 'happy');
  assert.equal(resolveEmotion({ emotion: 'happy', meta: { mode: 'local', code: 'UPSTREAM_ERROR' } }, '介绍武汉'), 'worried');
  assert.equal(resolveEmotion({ emotion: 'serious' }, '帮我解释一下'), 'serious');
  for (const invalid of ['__proto__', 'constructor', '../../.env', '<img src=x>', {}, null]) {
    assert.equal(validEmotion(invalid), undefined);
    assert.equal(mascotAsset(invalid), mascotAsset('neutral'));
  }
  assert.equal(sanitizeReply({ answer: '你好', emotion: '../../.env' }, []).emotion, undefined);
});

test('prompt states data limits, no realtime claims, and retains human responsibility', () => {
  const prompt = systemPrompt(context('SPU'), 'community');
  assert.match(prompt, /U=P\^S/); assert.match(prompt, /未联网查实时天气/); assert.match(prompt, /不承诺自动获得工作/);
});

test('HTTP serves the application, rejects malformed input and keeps secrets private', async () => {
  const server = createApp({ generator: async () => ({ answer: '真实资料[O1]', emotion: 'serious', sources: ['O1'], followups: ['介绍武汉'] }) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(base); assert.equal(page.status, 200); assert.match(await page.text(), /江小豚/);
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    for (const path of ['/.env', '/data/knowledge.json', '/server.mjs', '/%2e%2e%2f.env']) {
      assert.equal((await fetch(base + path)).status, 404, path);
    }
    const health = await (await fetch(base + '/api/health')).text();
    assert.ok(!health.includes(process.env.AI_API_KEY)); assert.ok(!health.includes('AI_API_KEY'));
    for (const body of ['{}', 'null', '{bad-json', '{"messages":[]}']) {
      assert.equal((await fetch(base + '/api/chat', { method: 'POST', body })).status, 400);
    }
    assert.equal((await fetch(base + '/api/chat', { method: 'POST', headers: { Origin: 'https://untrusted.example' }, body: '{}' })).status, 403);
    const response = await fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: '介绍武汉' }] }) });
    const result = await response.json(); assert.equal(result.meta.mode, 'ai'); assert.equal(result.sources[0].id, 'O1');
    assert.equal(result.emotion, 'serious');
    assert.ok(!JSON.stringify(result).includes(process.env.AI_API_KEY));
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('upstream outage clearly returns labeled local content rather than fake AI success', async () => {
  const server = createApp({ generator: async () => { throw new Error('provider internal diagnostics'); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/chat`, { method: 'POST', body: JSON.stringify({ messages: [{ role: 'user', content: 'SAIG报名要什么？' }], mode: 'saig' }) });
    const result = await response.json(); assert.equal(result.meta.mode, 'local'); assert.ok(result.sources.length);
    assert.equal(result.emotion, 'worried');
    assert.ok(!JSON.stringify(result).includes('provider internal diagnostics'));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
