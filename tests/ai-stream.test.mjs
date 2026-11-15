import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {receiveResponse, generate, ServiceError} from '../lib/ai.mjs';

const encoder = new TextEncoder();
const event = value => 'data: ' + JSON.stringify(value) + '\r\n\r\n';
function streamed(text, step = 17, type = 'text/event-stream') {
  const bytes = encoder.encode(text);
  let position = 0;
  return new Response(new ReadableStream({pull(controller) {
    if (position >= bytes.length) { controller.close(); return; }
    controller.enqueue(bytes.slice(position, position += step));
  }}), {headers: {'Content-Type': type}});
}

test('incremental SSE handles split UTF8, CRLF, multiline data and completed snapshots without duplication', async () => {
  const text = ': keepalive\r\n\r\nevent: response.output_text.delta\r\ndata: {"type":"response.output_text.delta",\r\ndata: "delta":"江小豚欢迎你"}\r\n\r\n' +
    event({type: 'response.completed', response: {status: 'completed', output_text: '江小豚欢迎你'}});
  assert.equal(await receiveResponse(streamed(text, 1)), '江小豚欢迎你');
  assert.equal(await receiveResponse(streamed(text, 3, 'application/octet-stream')), '江小豚欢迎你');
});

test('protocol overhead exceeding the old 1.5 MB cap does not discard a small answer', async () => {
  const usage = event({type: 'response.reasoning_summary_text.delta', delta: 'x'.repeat(1400)}).repeat(1500);
  assert.ok(encoder.encode(usage).length > 1500000);
  assert.equal(await receiveResponse(streamed(usage + event({choices: [{delta: {content: '收到'}}]}) + 'data: [DONE]\n\n', 8192)), '收到');
});

test('JSON fallback supports both API styles and checks actual model truncation', async () => {
  assert.equal(await receiveResponse(Response.json({output_text: '正常', status: 'completed'})), '正常');
  assert.equal(await receiveResponse(Response.json({choices: [{message: {content: '你好'}, finish_reason: 'stop'}]})), '你好');
  for (const body of [{status: 'incomplete', output_text: '半截'}, {choices: [{message: {content: '半截'}, finish_reason: 'length'}]}]) {
    await assert.rejects(receiveResponse(Response.json(body)), {code: 'OUTPUT_TRUNCATED'});
  }
});

test('early EOF, malformed SSE, incomplete and excessive answer text are not accepted as success', async () => {
  await assert.rejects(receiveResponse(streamed(event({choices: [{delta: {content: '半截'}}]}))), {code: 'STREAM_INTERRUPTED'});
  await assert.rejects(receiveResponse(streamed('data: broken\n\ndata: [DONE]\n\n')), {code: 'STREAM_INTERRUPTED'});
  await assert.rejects(receiveResponse(streamed(event({type: 'response.incomplete', response: {status: 'incomplete'}}))), {code: 'OUTPUT_TRUNCATED'});
  await assert.rejects(receiveResponse(streamed(event({type: 'response.output_text.delta', delta: 'x'.repeat(270000)}), 8192)), {code: 'OUTPUT_TRUNCATED'});
});

test('upstream diagnostics stay private and a failed stream is cancelled', async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({start(controller) {
    controller.enqueue(encoder.encode(event({type: 'error', error: {message: 'private-provider-details'}})));
  }, cancel() { cancelled = true; }}), {headers: {'Content-Type': 'text/event-stream'}});
  await assert.rejects(receiveResponse(response), error => error instanceof ServiceError && !error.message.includes('private-provider-details'));
  assert.ok(cancelled);
});

test('requests set output budgets, preserve model and expose neither auth nor rate-limit bodies', async () => {
  const bodies = [];
  let status = 200, output = '{"answer":"欢迎"}';
  const server = http.createServer(async (req, res) => {
    const parts = []; for await (const part of req) parts.push(part);
    bodies.push(JSON.parse(Buffer.concat(parts)));
    res.writeHead(status, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(status === 200 ? {output_text: output} : {error: 'private-provider-details'}));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const config = {baseUrl: 'http://127.0.0.1:' + server.address().port, key: 'test-only', model: 'unchanged-model', style: 'responses'};
  try {
    assert.equal((await generate(config, [{role: 'user', content: '你好'}], 'json', undefined, {maxOutputTokens: 7000})).answer, '欢迎');
    assert.equal(bodies[0].max_output_tokens, 7000); assert.equal(bodies[0].model, 'unchanged-model');
    await generate({...config, style: 'chat'}, [{role: 'user', content: '你好'}], 'json');
    assert.equal(bodies[1].max_completion_tokens, 12000);
    for (const [value, code] of [[401, 'AUTH_ERROR'], [429, 'RATE_LIMITED']]) {
      status = value;
      await assert.rejects(generate(config, [{role: 'user', content: '你好'}], '', undefined), error => error.code === code && !error.message.includes('private-provider-details'));
    }
    status = 200; output = '已安排好完整行程。\n{"title":"武汉","days":[';
    await assert.rejects(generate(config, [{role: 'user', content: '安排8天行程'}], '', undefined), {code: 'INVALID_RESPONSE'});
    const abort = new AbortController(); abort.abort();
    await assert.rejects(generate(config, [{role: 'user', content: '你好'}], '', abort.signal), {code: 'TIMEOUT'});
  } finally { await new Promise(resolve => server.close(resolve)); }
});
