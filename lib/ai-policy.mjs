import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync, renameSync, rmdirSync, unlinkSync} from 'node:fs';
import {dirname, isAbsolute, resolve, sep} from 'node:path';
import {ServiceError} from './ai.mjs';

const reject = (message, code = 'AI_QUOTA_LIMIT', status = 429) => new ServiceError(message, status, code);
const integer = (env, name, fallback, max) => {
  if (env[name] === undefined || env[name] === '') return fallback;
  const value = Number(env[name]);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new Error(`Invalid ${name}`);
  return value;
};

// A reservation is charged before EVERY upstream call, including retries and
// itinerary segments. Failed calls are not refunded: billing may have occurred.
export function createAiPolicy({env = process.env, root, now = Date.now} = {}) {
  const production = env.NODE_ENV === 'production';
  const enabled = env.AI_ENABLED === 'true' || (!production && env.AI_ENABLED !== 'false');
  const confirmed = !production || env.AI_PROVIDER_BUDGET_CONFIRMED === 'true';
  const file = resolve(root, env.AI_USAGE_FILE || '.runtime/ai-usage.json');
  if (file === resolve(root, 'public') || file.startsWith(resolve(root, 'public') + sep)) throw new Error('AI usage file must be outside public/');
  const durablePath = !production || (Boolean(env.AI_USAGE_FILE) && isAbsolute(env.AI_USAGE_FILE));
  const limits = {
    calls: integer(env, 'AI_DAILY_CALL_LIMIT', 100, 10000),
    clientCalls: integer(env, 'AI_CLIENT_DAILY_CALL_LIMIT', 20, 1000),
    tokens: integer(env, 'AI_DAILY_OUTPUT_TOKEN_LIMIT', 200000, 10000000),
    maxOutput: integer(env, 'AI_MAX_OUTPUT_TOKENS', 12000, 12000),
    maxInput: integer(env, 'AI_MAX_INPUT_CHARS', 120000, 120000),
    concurrent: integer(env, 'AI_MAX_CONCURRENT_CALLS', 2, 4)
  };
  let active = 0;
  const allowed = enabled && confirmed && durablePath;
  function reserve(client, tokens) {
    let locked = false, temp;
    try {
      mkdirSync(dirname(file), {recursive: true, mode: 0o700});
      mkdirSync(file + '.lock', {mode: 0o700}); locked = true;
      const day = new Date(now()).toISOString().slice(0, 10);
      let state;
      try { state = JSON.parse(readFileSync(file, 'utf8')); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (state && (!/^\d{4}-\d{2}-\d{2}$/.test(state.day) || state.day > day ||
        !Number.isSafeInteger(state.calls) || state.calls < 0 || !Number.isSafeInteger(state.tokens) || state.tokens < 0 ||
        !state.clients || typeof state.clients !== 'object' || Array.isArray(state.clients) || Object.values(state.clients).some(n => !Number.isSafeInteger(n) || n < 0))) throw new Error('Invalid usage ledger');
      if (!state || state.day < day) state = {day, calls: 0, tokens: 0, clients: {}};
      // Store only an irreversible identifier, never IP addresses or chat text.
      const id = createHash('sha256').update(String(client)).digest('hex');
      const count = Object.hasOwn(state.clients, id) ? state.clients[id] : 0;
      if (state.calls >= limits.calls || state.tokens + tokens > limits.tokens) throw reject('今日在线 AI 额度已达上限，暂时使用资料直答。');
      if (count >= limits.clientCalls || (!count && Object.keys(state.clients).length >= 1000)) throw reject('当前访问来源的今日在线 AI 额度已达上限，暂时使用资料直答。');
      state.calls++; state.tokens += tokens; state.clients[id] = count + 1;
      temp = file + '.' + randomUUID() + '.tmp';
      writeFileSync(temp, JSON.stringify(state), {flag: 'wx', mode: 0o600});
      renameSync(temp, file); temp = undefined;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      // Do not silently reset a corrupt/unwritable ledger or leak file paths.
      throw reject('在线 AI 额度保护暂不可用，暂时使用资料直答。', 'AI_GUARD_UNAVAILABLE', 503);
    } finally {
      if (temp) { try { unlinkSync(temp); } catch {} }
      if (locked) { try { rmdirSync(file + '.lock'); } catch {} }
    }
  }
  return {
    enabled: allowed,
    async run(generator, config, messages, instructions, signal, options = {}, client = 'shared') {
      signal?.throwIfAborted();
      if (!allowed) throw reject('在线 AI 尚未开放，暂时使用资料直答。', 'AI_DISABLED', 503);
      if (instructions.length + JSON.stringify(messages).length > limits.maxInput) throw reject('本次上下文过长，请缩短问题或新建对话。', 'AI_INPUT_LIMIT', 413);
      const requested = options.maxOutputTokens ?? 12000;
      if (!Number.isSafeInteger(requested) || requested < 1) throw reject('无效的生成长度。', 'AI_INPUT_LIMIT', 400);
      const maxOutputTokens = Math.min(requested, limits.maxOutput);
      if (active >= limits.concurrent) throw reject('小豚正在回答其他访客，请稍后重试。', 'AI_BUSY');
      reserve(client, maxOutputTokens);
      active++;
      try { return await generator(config, messages, instructions, signal, {...options, maxOutputTokens}); }
      finally { active--; }
    }
  };
}

export function createRequestLimiter({now = Date.now, maximum = 1000} = {}) {
  const clients = new Map();
  return (client, route) => {
    const time = now();
    for (const [key, value] of clients) if (value.reset <= time) clients.delete(key);
    const key = route + ':' + client;
    if (!clients.has(key) && clients.size >= maximum) return false;
    const bucket = clients.get(key) || {count: 0, reset: time + 60000};
    clients.set(key, bucket);
    return ++bucket.count <= (route === 'speech' ? 30 : 12);
  };
}
