import http from 'node:http';
import { readFileSync, existsSync, statSync, realpathSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { loadKnowledge, retrieve, publicSource } from './lib/knowledge.mjs';
import { systemPrompt, officialRules } from './lib/prompt.mjs';
import { generate, ServiceError } from './lib/ai.mjs';
import {createAiPolicy, createRequestLimiter} from './lib/ai-policy.mjs';
import { generateAnswer } from './lib/itinerary-generation.mjs';
import {presenterVoices,synthesizePresenterSpeech} from './lib/presenter-speech.mjs';
import { localAnswer } from './lib/fallback.mjs';
import { loadMedia, mediaChunks, attachMedia } from './lib/media.mjs';
import {communityStoryChunks} from './lib/community-facts.mjs';
import {attachTransitJourney} from './public/travel-transit.mjs';
import {journeySelectionMessages} from './public/journey-list.mjs';
import {preferenceMessages} from './public/experience-core.mjs';
import { cleanCitationTokens } from './public/media-utils.mjs';
import { resolveEmotion, validEmotion } from './public/mascot.mjs';
import { normalizeFollowups } from './public/followups.mjs';
import { recoverReplyFormat } from './public/reply-format.mjs';
import {answerLocale, normalizeLocale, multilingualSubjects, registerSearchSubjects, expandMultilingualQuery, localizedReference, translated} from './lib/language.mjs';

export const root = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const path = resolve(root, '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadEnv();
const loaded = loadKnowledge(resolve(root, 'data/knowledge.json'));
const media = multilingualSubjects(loadMedia(root));
registerSearchSubjects(media);
const searchableChunks = [...loaded.chunks, ...communityStoryChunks(loaded.chunks.length), ...mediaChunks(media)];
const config = { baseUrl: (process.env.AI_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, ''),
  key: process.env.AI_API_KEY || '', model: process.env.AI_MODEL || 'deepseek-flash', style: process.env.AI_API_STYLE || 'chat' };
const publicRoot = realpathSync(resolve(root, 'public'));
const strings = (value, max = 6) => Array.isArray(value) ? value.filter(x => typeof x === 'string').map(x => x.slice(0, 1000)).slice(0, max) : [];
const safeText = (value, max = 1000) => typeof value === 'string' ? value.slice(0, max) : '';

export function sanitizeReply(reply, context) {
  reply = recoverReplyFormat(reply);
  const allowed = new Map(context.map(c => [c.id, c]));
  const cited = [...String(reply.answer || '').matchAll(/\b(?:K\d+|M\d+|O1)\b/g)].map(m => m[0]);
  const ids = [...new Set([...strings(reply.sources), ...cited])].filter(id => allowed.has(id));
  const itinerary = reply.itinerary && typeof reply.itinerary === 'object' && Array.isArray(reply.itinerary.days) ? {
    title: safeText(reply.itinerary.title, 100), summary: safeText(reply.itinerary.summary),
    assumptions: strings(reply.itinerary.assumptions),
    days: reply.itinerary.days.filter(day => day && typeof day === 'object').slice(0, 30).map((day, i) => ({ day: Number.isInteger(day.day) && day.day >= 1 && day.day <= 30 ? day.day : i + 1, title: safeText(day.title, 120),
      stops: (Array.isArray(day.stops) ? day.stops : []).filter(s => s && typeof s === 'object').slice(0, 8).map(s => ({ time: safeText(s.time, 60), name: safeText(s.name, 120), description: safeText(s.description), transport: safeText(s.transport), cost: safeText(s.cost, 200) })) })),
    budget: (Array.isArray(reply.itinerary.budget) ? reply.itinerary.budget : []).filter(b => b && typeof b === 'object').slice(0, 10).map(b => ({ item: safeText(b.item, 100), amount: safeText(b.amount, 200) })),
    notes: strings(reply.itinerary.notes)
  } : null;
  return { answer: safeText(reply.answer, 16000).replace(/\[((?:K|M)\d+|O1)\]/g, (m, id) => allowed.has(id) ? m : ''), emotion: validEmotion(reply.emotion),
    sources: ids.slice(0, 8).map(id => publicSource(allowed.get(id))), itinerary,
    places: (Array.isArray(reply.places) ? reply.places : []).slice(0, 8).filter(p => p && typeof p.name === 'string').map(p => ({ id: safeText(p.id, 60), name: cleanCitationTokens(safeText(p.name, 100)), displayName: cleanCitationTokens(safeText(p.displayName, 120)), area: cleanCitationTokens(safeText(p.area, 100)), description: safeText(p.description, 300), sourceId: allowed.has(p.sourceId) ? p.sourceId : '' })),
    followups: normalizeFollowups(reply.followups) };
}

export function createApp(options = {}) {
  const appConfig = options.config || config;
  const policy = createAiPolicy({env: options.env || process.env, root});
  const instanceId = randomUUID();
  const online = Boolean(appConfig.key) && policy.enabled;
  let state = { status: online ? 'configured' : 'unconfigured', lastError: null, lastSuccess: null };
  const requestAllowed = createRequestLimiter();
  const generator = options.generator || generate;
  const speechSynthesizer=options.speechSynthesizer||synthesizePresenterSpeech;
  const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; media-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { return json(res, 400, { error: '无效地址' }); }
    if (req.method === 'GET' && pathname === '/api/health') return json(res, 200, {
      app: 'wuhan-spu-concierge', instanceId, ...state, configured: online, model: appConfig.model, documents: loaded.documents.length,
      pages: loaded.documents.reduce((sum, d) => sum + (d.pageCount || 0), 0), chunks: loaded.chunks.length,
      media: { subjects: media.length, photos: media.filter(s => s.image).length },
      sources: loaded.documents.map(d => ({ id: d.id, title: d.title, pageCount: d.pageCount, url: `/materials/${encodeURIComponent(d.file)}` }))
    });
    if (req.method === 'GET' && pathname === '/api/media') return json(res, 200, { subjects: media });
    if (req.method === 'GET' && pathname === '/api/presenter/voices') return json(res,200,{voices:presenterVoices.filter(voice=>voice.id.endsWith('Neural')||process.platform==='win32')});
    if (req.method === 'POST' && pathname === '/api/presenter/speech') {
      if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'请求来源不匹配。'});}catch{return json(res,403,{error:'无效来源。'});}}
      if (!requestAllowed(req.socket.remoteAddress, 'speech')) return json(res, 429, {error:'语音请求有点密集，请稍后重试。'});
      const speechAbort=new AbortController();
      res.on('close',()=>{if(!res.writableEnded)speechAbort.abort();});
      try{
        const parts=[];let size=0;
        for await(const part of req){size+=part.length;if(size>12000)return json(res,413,{error:'讲解内容过长。'});parts.push(part);}
        let payload;try{payload=JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{return json(res,400,{error:'请求格式错误。'});}
        const audio=await speechSynthesizer(payload||{},speechAbort.signal);
        if(!res.destroyed){res.writeHead(200,{'Content-Type':audio.toString('ascii',0,4)==='RIFF'?'audio/wav':'audio/mpeg','Cache-Control':'no-store'});res.end(audio);}
      }catch(error){if(!res.destroyed)return json(res,error.status||503,{error:error.status?error.message:'语音暂不可用，请重试或切换音色。'});}
      return;
    }
    if (req.method === 'POST' && pathname === '/api/chat') {
      if (req.headers.origin) {
        try { if (new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error: '请求来源不匹配。' }); }
        catch { return json(res, 403, { error: '无效来源。' }); }
      }
      // Forwarded headers are deliberately ignored: visitors cannot choose their
      // own quota identity. Behind a proxy the shared limit is conservative.
      const ip = req.socket.remoteAddress || 'shared';
      if (!requestAllowed(ip, 'chat')) return json(res, 429, { error: '提问有点密集，请稍等一分钟再试。' });
      let payload;
      try {
        const parts = []; let size = 0;
        for await (const part of req) { parts.push(part); size += part.byteLength; if (size > 320000) throw new ServiceError('消息过长，请缩短后重试。', 413, 'TOO_LARGE'); }
        payload = JSON.parse(Buffer.concat(parts).toString('utf8'));
      } catch (e) { return json(res, e.status || 400, { error: e.status ? e.message : '请求格式错误。' }); }
      if (!payload || !Array.isArray(payload.messages) || !payload.messages.length) return json(res, 400, { error: '请先输入问题。' });
      let messages = payload.messages.slice(-14).filter(m => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string')
        .map(m => ({ role: m.role, content: m.content.trim().slice(0, m.role === 'assistant' ? 13000 : 3000) })).filter(m => m.content);
      if (!messages.length || messages.at(-1).role !== 'user') return json(res, 400, { error: '最后一条消息必须是你的问题。' });
      messages = [...preferenceMessages(payload.preferences), ...(payload.mode==='travel'?journeySelectionMessages(payload.journeyList,media):[]), ...messages];
      const mode = ['wuhan', 'community', 'travel', 'saig'].includes(payload.mode) ? payload.mode : 'wuhan';
      const preference = payload.locale === 'auto' ? 'auto' : normalizeLocale(payload.locale);
      const locale = answerLocale(preference, messages.at(-1).content, payload.uiLocale);
      const searchMessages = messages.map(m => m.role === 'user' ? {...m, content: expandMultilingualQuery(m.content)} : m);
      const context = [...retrieve(searchableChunks, searchMessages, mode), officialRules];
      const previousItinerary = sanitizeReply({itinerary: payload.previousItinerary}, context).itinerary;
      const reference = () => locale === 'zh-CN' ? localAnswer(searchMessages, mode, context, media) : localizedReference(messages, mode, context, locale);
      const present = result => attachMedia(attachTransitJourney({...result,
        followups:normalizeFollowups(result.followups).filter(q=>q.trim()!==messages.at(-1).content.trim())},messages),media);
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 300000);
      res.on('close', () => { if (!res.writableEnded) abort.abort(); });
      try {
        let result;
        if (payload.localOnly === true || !online) {
          result = reference();
          result.meta = { mode: 'local', locale, reason: locale === 'zh-CN' ? (payload.localOnly ? '你选择了资料直答。' : '尚未配置AI服务，以下为资料直答。') : translated(locale, '你选择了本地主题概览，未调用在线 AI。'), model: null };
        } else {
          const guardedGenerator = (...args) => policy.run(generator, ...args, ip);
          const {reply, generation} = await generateAnswer({generator: guardedGenerator, config: appConfig, messages,
            instructions: systemPrompt(context, mode, {locale, automatic: preference === 'auto'}, messages)+(payload.presentation===true?'\n本轮是江小豚面对面数字人讲解。语气年轻、清澈、有精神，有楚王后人的自信和底气，接待访客时自然亲切。使用利落的短句，先说结论，再讲2至3个具体重点；减少拖长句、软弱的填充词和省略号，按内容自然强调，一段最多一处感叹号。普通问题控制在约150至260个汉字或相当外语长度，少用标题和列表。仍保留资料引用、事实边界和原有JSON结构。用户明确索要完整行程时按原旅行规则提供完整itinerary，answer只口头介绍关键安排。':'') ,
            signal: abort.signal, mode, previousItinerary, locale, mediaSubjects: media});
          result = sanitizeReply(reply, context);
          state = { status: 'connected', lastError: generation.complete === false ? '部分行程尚未完成，可重试补齐。' : null, lastSuccess: new Date().toISOString() };
          result.meta = { mode: 'ai', model: appConfig.model, locale, generation, ...(generation.complete === false ? {code: 'PARTIAL_ITINERARY'} : {}) };
        }
        result.emotion = resolveEmotion(result, messages.at(-1).content, mode);
        return json(res, 200, present(result));
      } catch (error) {
        const code = error.code || 'UPSTREAM_ERROR';
        const reason = error instanceof ServiceError ? error.message : 'AI服务暂时不可用，请稍后重试。';
        state = { ...state, status: code === 'RATE_LIMITED' ? 'limited' : 'error', lastError: reason };
        if (res.destroyed) return;
        const fallback = reference();
        return json(res, 200, present({ ...fallback, emotion: 'worried', meta: { mode: 'local', reason: locale === 'zh-CN' ? reason : translated(locale,'在线 AI 暂不可用，已切换到本地主题概览。'), code, locale, model: null } }));
      } finally { clearTimeout(timeout); }
    }
    if (pathname.startsWith('/api/')) return json(res, 404, { error: '接口不存在。' });
    if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: '不支持的请求方式。' });
    const target = resolve(publicRoot, pathname === '/' ? 'index.html' : '.' + pathname);
    if (!target.startsWith(publicRoot + sep) || !existsSync(target) || !statSync(target).isFile()) return json(res, 404, { error: '文件不存在。' });
    const actual = realpathSync(target);
    if (!actual.startsWith(publicRoot + sep)) return json(res, 404, { error: '文件不存在。' });
    const types = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.json': 'application/json; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': ['.html', '.css', '.js', '.mjs', '.json'].includes(extname(target)) ? 'no-cache' : 'public, max-age=3600' });
    res.end(req.method === 'HEAD' ? undefined : readFileSync(actual));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const host = process.env.HOST || '127.0.0.1', port = Number(process.env.PORT) || 3210;
  createApp().listen(port, host, () => console.log(`江小豚已启动：http://${host}:${port} · ${loaded.documents.length}份资料 · 模型 ${config.model}`));
}
