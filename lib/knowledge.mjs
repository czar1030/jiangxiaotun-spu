import { readFileSync } from 'node:fs';

export function tokenize(text) {
  const normalized = text.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
  const tokens = normalized.match(/[a-z0-9]+/g) || [];
  const chinese = normalized.match(/[\u4e00-\u9fff]+/g) || [];
  for (const run of chinese) {
    for (let i = 0; i < run.length - 1; i++) tokens.push(run.slice(i, i + 2));
  }
  return [...new Set(tokens)];
}

export function buildKnowledge(documents) {
  const chunks = [];
  for (const doc of documents) {
    for (const section of doc.sections) {
      const text = section.text.replace(/\s+/g, ' ').trim();
      for (let start = 0; start < text.length; start += 900) {
        const part = text.slice(start, start + 1100);
        if (!part) continue;
        chunks.push({ id: `K${chunks.length + 1}`, docId: doc.id, topic: doc.topic,
          title: doc.title, page: section.page, text: part,
          url: `/materials/${encodeURIComponent(doc.file)}${section.page ? `#page=${section.page}` : ''}`,
          tokens: new Set(tokenize(part)) });
        if (start + 1100 >= text.length) break;
      }
    }
  }
  return chunks;
}

export function retrieve(chunks, messages, mode = 'wuhan') {
  const recentUsers = messages.filter(m => m.role === 'user').slice(-4);
  const latest = recentUsers.at(-1)?.content || '';
  const query = tokenize(recentUsers.map(m => m.content).join(' '));
  const finalTokens = new Set(tokenize(latest));
  const frequency = new Map();
  for (const token of query) frequency.set(token, chunks.filter(c => c.tokens.has(token)).length);
  const travel = mode === 'travel' || /行程|旅游|游玩|天|父母|孩子|下雨|预算|江汉路|黄鹤楼|东湖/.test(latest);
  const topics = travel ? ['travel'] : [mode];
  const ranked = chunks.map(chunk => {
    let score = topics.includes(chunk.topic) ? 1.8 : 0;
    for (const token of query) {
      if (chunk.tokens.has(token)) score += Math.log(1 + chunks.length / (1 + frequency.get(token))) * (finalTokens.has(token) ? 2 : 0.7);
    }
    return { chunk, score };
  }).sort((a, b) => b.score - a.score);
  // The three brief official documents always remain in context, even when
  // a mixed question uses unusual wording. Tourism uses page-level retrieval.
  const mandatory = chunks.filter(c => ['saig', 'community', 'spu'].includes(c.topic));
  const selected = [...mandatory];
  const overview = ranked.find(r => r.chunk.topic === 'wuhan');
  if (overview) selected.push(overview.chunk);
  for (const { chunk } of ranked) {
    if (!selected.some(c => c.id === chunk.id)) selected.push(chunk);
    if (selected.length >= 17) break;
  }
  return selected;
}

export function loadKnowledge(path) {
  const documents = JSON.parse(readFileSync(path, 'utf8'));
  return { documents, chunks: buildKnowledge(documents) };
}

export function publicSource(chunk) {
  return { id: chunk.id, title: chunk.title, page: chunk.page, url: chunk.url,
    excerpt: chunk.text.slice(0, 180) + (chunk.text.length > 180 ? '…' : '') };
}
