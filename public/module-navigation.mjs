export const moduleModes = ['wuhan', 'travel', 'community', 'saig'];

export function modeFromUrl(value) {
  const mode = new URL(value, 'http://localhost').searchParams.get('mode');
  return moduleModes.includes(mode) ? mode : null;
}

export function moduleUrl(value, mode, {preserveHash = false, preserveEntry = false} = {}) {
  if (!moduleModes.includes(mode)) throw new RangeError('Unknown module');
  const url = new URL(value, 'http://localhost');
  url.searchParams.set('mode', mode);
  if (!preserveEntry) for (const key of ['compose', 'atlas']) url.searchParams.delete(key);
  if (!preserveHash) url.hash = '';
  return url.pathname + url.search + url.hash;
}
