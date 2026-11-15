import {recoverReplyFormat, hasSerializedItinerary} from '../public/reply-format.mjs';

export class ServiceError extends Error {
  constructor(message, status = 502, code = 'UPSTREAM_ERROR') { super(message); this.status = status; this.code = code; }
}

export function parseReply(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const recovered = recoverReplyFormat({answer: trimmed});
  if (recovered.itinerary) return recovered;
  let parsed;
  try { parsed = JSON.parse(trimmed); }
  catch {
    const start = trimmed.indexOf('{'), end = trimmed.lastIndexOf('}');
    if (start < 0 || end < start) throw new ServiceError('AI返回了无法解析的内容，请重试。', 502, 'INVALID_RESPONSE');
    try { parsed = JSON.parse(trimmed.slice(start, end + 1)); }
    catch { throw new ServiceError('AI返回了不完整的内容，请重试。', 502, 'INVALID_RESPONSE'); }
  }
  if (!parsed || typeof parsed.answer !== 'string' || !parsed.answer.trim()) throw new ServiceError('AI回复为空，请重试。', 502, 'INVALID_RESPONSE');
  return recoverReplyFormat(parsed);
}

const limits = { wire: 32 * 1024 * 1024, event: 2 * 1024 * 1024, text: 256 * 1024 };
const truncated = () => new ServiceError('本段回答尚未生成完整，需要精简后重新生成。', 502, 'OUTPUT_TRUNCATED');
function checkStatus(body) {
  if (body.error || body.type === 'error' || body.type === 'response.failed' || body.status === 'failed') {
    throw new ServiceError('AI上游服务暂时不可用，请稍后重试。');
  }
  if (body.type === 'response.incomplete' || body.status === 'incomplete' || body.choices?.some(c => c.finish_reason === 'length')) throw truncated();
  if (body.choices?.some(c => c.finish_reason === 'content_filter')) throw new ServiceError('AI未能完成本次回答，请调整问题后重试。', 502, 'CONTENT_FILTERED');
}
function responseText(body) {
  return body.output_text || body.output?.flatMap(item => item.content || []).filter(c => c.type === 'output_text').map(c => c.text).join('') || '';
}

// Retain only one SSE event and the answer. Reasoning and repeated protocol
// snapshots never accumulate as part of the answer budget.
function eventDecoder() {
  let buffer = '', data = [], eventSize = 0, output = '', terminal = false, malformed = false;
  const append = text => {
    if (typeof text !== 'string') return;
    output += text;
    if (output.length > limits.text) throw truncated();
  };
  const dispatch = () => {
    const value = data.join('\n'); data = []; eventSize = 0;
    if (!value.trim()) return;
    if (value.trim() === '[DONE]') { terminal = true; return; }
    let item;
    try { item = JSON.parse(value); } catch { malformed = true; return; }
    checkStatus(item); if (item.response) checkStatus(item.response);
    append(item.choices?.[0]?.delta?.content);
    if (item.type === 'response.output_text.delta') append(item.delta);
    if (item.type === 'response.completed') {
      if (!output) append(responseText(item.response || {}));
      terminal = true;
    }
    if (item.choices?.some(c => c.finish_reason)) terminal = true;
  };
  const line = value => {
    if (!value) { dispatch(); return; }
    if (value.startsWith('data:')) {
      const payload = value.slice(5).replace(/^ /, '');
      eventSize += payload.length;
      if (eventSize > limits.event) throw new ServiceError('AI单条数据异常，请重试。', 502, 'INVALID_RESPONSE');
      data.push(payload);
    }
  };
  return {
    push(chunk) {
      buffer += chunk;
      let end;
      while ((end = buffer.indexOf('\n')) >= 0) {
        line(buffer.slice(0, end).replace(/\r$/, ''));
        buffer = buffer.slice(end + 1);
      }
      if (buffer.length > limits.event) throw new ServiceError('AI单条数据异常，请重试。', 502, 'INVALID_RESPONSE');
    },
    finish(strict = false) {
      if (buffer) line(buffer.replace(/\r$/, ''));
      dispatch();
      if (strict && (!terminal || malformed)) throw new ServiceError('AI连接提前结束，本段回答未完整接收。', 502, 'STREAM_INTERRUPTED');
      return output;
    }
  };
}

export function readEventStream(text) {
  const parser = eventDecoder(); parser.push(text); return parser.finish();
}

export async function receiveResponse(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new ServiceError('AI未返回有效内容，请稍后重试。', 502, 'INVALID_RESPONSE');
  const decoder = new TextDecoder();
  let parser = null, raw = '', wireBytes = 0, settled = false;
  let isStream = /text\/event-stream/i.test(response.headers.get('content-type') || '');
  const consume = chunk => {
    if (isStream) { parser ||= eventDecoder(); parser.push(chunk); return; }
    raw += chunk;
    // Compatible gateways may omit the SSE content type; even "data:" can
    // arrive over multiple chunks.
    if (/^\s*(?:event:|data:|:)/.test(raw)) {
      isStream = true; parser = eventDecoder(); parser.push(raw); raw = '';
    } else if (raw.length > limits.event) throw new ServiceError('AI响应数据异常，请重试。', 502, 'INVALID_RESPONSE');
  };
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      wireBytes += value.byteLength;
      if (wireBytes > limits.wire) throw new ServiceError('AI连接数据异常，请稍后重试。', 502, 'STREAM_LIMIT');
      consume(decoder.decode(value, {stream: true}));
    }
    consume(decoder.decode());
    let text;
    if (isStream) text = parser.finish(true);
    else {
      let json;
      try { json = JSON.parse(raw); } catch { throw new ServiceError('AI返回格式异常，请稍后重试。', 502, 'INVALID_RESPONSE'); }
      checkStatus(json);
      text = responseText(json) || json.choices?.[0]?.message?.content;
      if (typeof text === 'string' && text.length > limits.text) throw truncated();
    }
    settled = true; return text;
  } finally {
    if (!settled) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function generate(config, messages, instructions, signal, options = {}) {
  const responses = config.style === 'responses';
  const deepseek = new URL(config.baseUrl).hostname === 'api.deepseek.com';
  const maxTokens = options.maxOutputTokens || 12000;
  const requestMessages = messages.map((message, index) => ({ ...message, content: message.content +
    (index === messages.length - 1 && message.role === 'user' ? '\n\n【接待应用输出格式（仅格式，不改变访客的回答语言）】请只输出一个合法JSON对象，不要在JSON外输出任何文字。必须有answer（Markdown字符串，事实附[K数字]或[O1]）、emotion（neutral/happy/thinking/serious/worried之一，与回复内容对应）、sources（实际引用的资料ID数组）、places（地点卡片数组）、itinerary（行程对象或null）、followups（后续问题字符串数组）。行程对象必须使用title、summary、assumptions、days、budget、notes字段；days中每项使用day、title、stops；stops中每项使用time、name、description、transport、cost；budget每项使用item、amount。地点卡片使用id、name、displayName、area、description、sourceId。资料规则与详细格式遵循系统说明。' : '') }));
  const body = responses ? {
    model: config.model, instructions, store: false, stream: true, max_output_tokens: maxTokens,
    input: requestMessages.map(m => ({ role: m.role, content: [{ type: m.role === 'assistant' ? 'output_text' : 'input_text', text: m.content }] }))
  } : { model: config.model, messages: [{ role: 'system', content: instructions }, ...requestMessages], stream: true, max_completion_tokens: maxTokens };
  if (!responses && deepseek) {
    delete body.max_completion_tokens;
    body.max_tokens = maxTokens;
    body.thinking = {type:'disabled'};
  }
  let response;
  try {
    response = await fetch(config.baseUrl + '/' + (responses ? 'responses' : 'chat/completions'), {
      method: 'POST', headers: { Authorization: 'Bearer ' + config.key, 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
      body: JSON.stringify(body), signal
    });
  } catch {
    if (signal?.aborted) throw new ServiceError('生成超时或已取消，可以稍后重试。', 504, 'TIMEOUT');
    throw new ServiceError('暂时无法连接AI服务，请检查服务端网络。', 502, 'NETWORK_ERROR');
  }
  if (!response.ok) {
    // Never forward upstream bodies: they may contain diagnostics or secrets.
    await response.body?.cancel();
    if ([401, 403].includes(response.status)) throw new ServiceError('AI接口认证失败，请在服务端核对密钥与权限。', 502, 'AUTH_ERROR');
    if (response.status === 429) throw new ServiceError('AI服务当前限流或额度不足，请稍后重试。', 503, 'RATE_LIMITED');
    throw new ServiceError('AI上游暂时无法生成回答，请稍后重试。');
  }
  let text;
  try { text = await receiveResponse(response); }
  catch (error) {
    if (signal?.aborted) throw new ServiceError('生成超时或已取消，可以稍后重试。', 504, 'TIMEOUT');
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('AI连接提前结束，本段回答未完整接收。', 502, 'STREAM_INTERRUPTED');
  }
  if (typeof text !== 'string' || !text.trim()) throw new ServiceError('AI未返回有效内容，请稍后重试。', 502, 'INVALID_RESPONSE');
  try { return parseReply(text); }
  catch (error) {
    if (text.trim().length > 12 && !/^(?:\{|\[|```)/.test(text.trim()) && !hasSerializedItinerary(text)) return {
      answer: text, sources: [...new Set([...text.matchAll(/\[(K\d+|O1)\]/g)].map(m => m[1]))],
      itinerary: null, places: [], followups: []
    };
    throw error;
  }
}
