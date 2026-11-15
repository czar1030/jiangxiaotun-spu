// Shared by the server and the browser, including restored conversations.
export function stripModelImages(value) {
  // Photos come from the reviewed catalog. A model may mistake a source page for an image URL.
  return String(value ?? '').replace(/!\[[^\]\n]*\]\([^\n]*?\)/g, '').trim();
}

export function cleanCitationTokens(value) {
  return String(value ?? '')
    .replace(/[\[【（(]\s*(?:(?:K|M)\d+|O1)(?:\s*[,，、;；]\s*(?:(?:K|M)\d+|O1))*\s*[\]】）)]/gi, '')
    .replace(/\b(?:K|M)\d+\b/g, '').replace(/[ \t]{2,}/g, ' ').trim();
}

export function normalizeSubjectName(value) {
  return cleanCitationTokens(value).normalize('NFKC').toLowerCase()
    .replace(/[（()）]/g, '').replace(/[\s·・—－-]/g, '');
}

export function matchesAtlasSubject(subject, filter = '全部', query = '') {
  const inCategory = filter === '全部' || subject.category === filter || (subject.tags || []).includes(filter);
  const needle = normalizeSubjectName(query);
  return inCategory && [subject.name, subject.area, subject.description, subject.introduction, ...(subject.aliases || []), ...(subject.tags || [])]
    .some(value => normalizeSubjectName(value).includes(needle));
}

export function resolveSubject(subjects, place) {
  const name = normalizeSubjectName(typeof place === 'string' ? place : place?.name);
  if (!name) return null;
  const candidates = subjects.filter(subject => !(subject.excludedTerms || []).some(term => name.includes(normalizeSubjectName(term))))
    .flatMap(subject => [subject.name, ...(subject.aliases || [])].map(alias => ({ subject, alias: normalizeSubjectName(alias) })));
  const exact = candidates.filter(c => c.alias === name).sort((a, b) => b.alias.length - a.alias.length)[0];
  if (exact) return exact.subject;
  // Specific names win: 东湖樱花园 must never resolve to a generic 东湖 photo.
  return candidates.filter(c => c.alias.length >= 3 && name.includes(c.alias))
    .sort((a, b) => b.alias.length - a.alias.length)[0]?.subject || null;
}

export function subjectsMentioned(subjects, text, limit = 6) {
  const normalized = normalizeSubjectName(text);
  const found = subjects.flatMap(subject => {
    const names = [...new Set([subject.name, ...(subject.aliases || [])].map(normalizeSubjectName))].filter(a => a.length >= 2);
    return names.flatMap(alias => {
      const matches = [];
      for (let index = normalized.indexOf(alias); index >= 0; index = normalized.indexOf(alias, index + 1)) {
        matches.push({subject, alias, index, end:index + alias.length});
      }
      return matches;
    });
  }).sort((a, b) => a.index - b.index || b.alias.length - a.alias.length);
  const seen = new Set();
  return found.filter(candidate => {
    const {subject, alias, index, end} = candidate;
    // Suppress only this occurrence of a nested name. A later standalone mention
    // of 武汉博物馆 must still work after 张之洞与武汉博物馆 (and vice versa).
    if (found.some(other => other.subject.id !== subject.id && other.index <= index && other.end >= end && other.alias.length > alias.length)) return false;
    if (/(?:不去|不安排|不推荐|排除|取消|避开|不包含|不考虑|不前往|删除)[^，。；！？]{0,6}$/.test(normalized.slice(Math.max(0, index - 12), index))) return false;
    if ((subject.excludedTerms || []).some(term => {
      const excluded = normalizeSubjectName(term);
      for (let at = normalized.indexOf(excluded, Math.max(0,index-excluded.length-1)); at >= 0 && at <= end; at = normalized.indexOf(excluded,at+1)) {
        const after=at+excluded.length;
        if ((at <= end && after >= index) || (after===index-1 && /[与的]/.test(normalized[after]))) return true;
      }
      return false;
    })) return false;
    if (seen.has(subject.id)) return false;
    seen.add(subject.id);
    return true;
  }).slice(0, limit).map(c => c.subject);
}

export function enrichPlaces(places, subjects, text = '', limit = 8) {
  const seen = new Set(), photos = new Set(), result = [];
  function add(place, subject) {
    const key = subject?.id || normalizeSubjectName(place.name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    const image = subject?.image;
    const usableImage = image && !photos.has(image.sha256) ? image : null;
    if (usableImage) photos.add(image.sha256);
    result.push({ ...place, id: subject?.id || (place.id === 'community' && /社区/.test(place.name) ? 'community' : 'other'), name: cleanCitationTokens(subject?.name || place.name),
      area: cleanCitationTokens(subject?.area || place.area), description: place.description || subject?.description || '',
      category: subject?.category || '景点', kind: subject?.kind || 'place', image: usableImage, photoSubject: subject?.name || null,
      atlasId: subject?.id || null });
  }
  const unresolved = [];
  for (const place of places || []) {
    const subject = resolveSubject(subjects, place);
    if (subject) add(place, subject); else unresolved.push(place);
  }
  for (const subject of subjectsMentioned(subjects, text, limit)) {
    if (result.length >= limit) break;
    add({ name: subject.name, area: subject.area, description: subject.description, sourceId: '' }, subject);
  }
  // Unknown model names must not occupy all slots ahead of verified photos.
  for (const place of unresolved) if (result.length < limit) add(place, null);
  return result.slice(0, limit);
}
