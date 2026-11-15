// Manual integration check against the existing configured gateway. No keys,
// upstream bodies or request headers are printed or saved.
import {mkdirSync, writeFileSync} from 'node:fs';
import {createApp} from '../server.mjs';
import {generate} from '../lib/ai.mjs';

const started = Date.now();
const timings = [];
const server = createApp({generator: async (...args) => {
  const phase = args[4]?.stage || 'single', days = args[4]?.dayNumbers || [];
  const begin = Date.now();
  console.log(JSON.stringify({phase, days, event: 'start'}));
  try {
    const reply = await generate(...args);
    const timing = {phase, days, elapsedSeconds: Math.round((Date.now() - begin) / 1000), status: 'ok'};
    timings.push(timing); console.log(JSON.stringify(timing)); return reply;
  } catch (error) {
    const timing = {phase, days, elapsedSeconds: Math.round((Date.now() - begin) / 1000), code: error.code || 'ERROR'};
    timings.push(timing); console.log(JSON.stringify(timing)); throw error;
  }
}});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const result = await (await fetch('http://127.0.0.1:' + server.address().port + '/api/chat', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, signal: AbortSignal.timeout(315000),
    body: JSON.stringify({mode: 'travel', locale: 'zh-CN', messages: [{role: 'user', content:
      '我和父母来武汉玩8天，住江汉路，每人预算3000元不含住宿，不想走太多路，不去黄鹤楼，喜欢历史美食。请直接安排完整8天行程，以地铁为主，天气合适时可选一次轮渡，不安排高铁。'}]})
  })).json();
  const summary = {elapsedSeconds: Math.round((Date.now() - started) / 1000), mode: result.meta?.mode,
    generation: result.meta?.generation, code: result.meta?.code,
    dayNumbers: result.itinerary?.days?.map(day => day.day),
    stopCounts: result.itinerary?.days?.map(day => day.stops.length), timings};
  mkdirSync('qa/ai-generation', {recursive: true});
  writeFileSync('qa/ai-generation/live-eight-days.json', JSON.stringify(result, null, 2));
  writeFileSync('qa/ai-generation/live-summary.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
  if (result.meta?.mode !== 'ai' || result.meta?.generation?.complete !== true || result.itinerary?.days?.length !== 8) process.exitCode = 1;
} finally { await new Promise(resolve => server.close(resolve)); }
