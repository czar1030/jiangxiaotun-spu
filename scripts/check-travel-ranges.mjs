// Manual verification using the locally configured gateway; never log credentials.
import {mkdirSync, writeFileSync} from 'node:fs';
import {createApp} from '../server.mjs';

const server = createApp();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
mkdirSync('qa/ai-generation', {recursive: true});
try {
  await Promise.all(['1–5', '21–30'].map(async range => {
    const started = Date.now();
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/chat', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, signal: AbortSignal.timeout(210000),
      body: JSON.stringify({mode: 'travel', locale: 'zh-CN', messages: [{role: 'user', content:
        '请按范围推荐武汉旅行，旅行天数' + range + '天，和父母同行，住江汉路附近，每人2000元，不含住宿和往返武汉交通，少走路、留足休息，喜欢本地美食、历史文化和亲子科普，希望体验地铁与轮渡。'}]})
    });
    const reply = await response.json();
    writeFileSync('qa/ai-generation/live-range-' + range.replace('–', '-') + '.json', JSON.stringify(reply, null, 2));
    const passed = response.ok && reply.meta?.mode === 'ai' && reply.meta?.generation?.strategy === 'range-overview' &&
      reply.itinerary === null && reply.answer?.length >= 120 && reply.places?.length >= 2;
    console.log(JSON.stringify({range, passed, elapsedSeconds: Math.round((Date.now() - started) / 1000),
      mode: reply.meta?.mode, generation: reply.meta?.generation, places: reply.places?.map(place => place.name),
      opening: reply.answer?.slice(0, 180), closing: reply.answer?.slice(-220)}));
    if (!passed) process.exitCode = 1;
  }));
} finally { await new Promise(resolve => server.close(resolve)); }
