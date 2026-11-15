// Shared locale policy. Only allowlisted language identifiers enter prompts or paths.
export const languages = Object.freeze([
  ['zh-CN', '简体中文', 'Simplified Chinese'], ['zh-TW', '繁體中文', 'Traditional Chinese'],
  ['en', 'English', 'English'], ['ja', '日本語', 'Japanese'], ['ko', '한국어', 'Korean'],
  ['fr', 'Français', 'French'], ['de', 'Deutsch', 'German'], ['es', 'Español', 'Spanish'],
  ['pt', 'Português', 'Portuguese'], ['it', 'Italiano', 'Italian'], ['ru', 'Русский', 'Russian'],
  ['ar', 'العربية', 'Arabic'], ['hi', 'हिन्दी', 'Hindi'], ['id', 'Bahasa Indonesia', 'Indonesian'],
  ['th', 'ไทย', 'Thai'], ['vi', 'Tiếng Việt', 'Vietnamese']
].map(([code, label, name]) => Object.freeze({code, label, name})));
export function normalizeLocale(value, fallback = 'zh-CN') {
  if (typeof value !== 'string') return fallback;
  const tag = value.toLowerCase().replaceAll('_', '-');
  if (/^zh(?:-|$)/.test(tag)) return /tw|hk|hant|mo/.test(tag) ? 'zh-TW' : 'zh-CN';
  return languages.find(l => l.code.toLowerCase() === tag || l.code === tag.split('-')[0])?.code || fallback;
}
export function detectLanguage(text, fallback = 'zh-CN') {
  if (/[\u3040-\u30ff]/u.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/u.test(text)) return 'ko';
  if (/[\u0600-\u06ff]/u.test(text)) return 'ar';
  if (/[\u0900-\u097f]/u.test(text)) return 'hi';
  if (/[\u0e00-\u0e7f]/u.test(text)) return 'th';
  if (/[\u0400-\u04ff]/u.test(text)) return 'ru';
  if (/[\u4e00-\u9fff]/u.test(text)) return /臺|灣|遊|請|麼|這|個|體|劃|館/u.test(text) ? 'zh-TW' : 'zh-CN';
  const value = text.toLowerCase();
  const clues = {fr:/\b(bonjour|je|jours|voyage|avec|musée|merci|français)\b/gu,
    de:/\b(hallo|ich|tage|reise|mit|bitte|deutsch|über)\b/gu,
    es:/\b(hola|quiero|días|viaje|con|gracias|español)\b/gu,
    pt:/\b(olá|quero|dias|viagem|com|obrigado|português)\b/gu,
    it:/\b(ciao|vorrei|giorni|viaggio|grazie|italiano)\b/gu,
    id:/\b(halo|saya|hari|wisata|dengan|tolong|indonesia)\b/gu,
    vi:/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/gu,
    en:/\b(hello|please|the|days|trip|travel|with|what|how|my|parents|english)\b/gu};
  const scores = Object.entries(clues).map(([locale, regex]) => [locale, [...value.matchAll(regex)].length]).sort((a,b)=>b[1]-a[1]);
  return scores[0]?.[1] ? scores[0][0] : /[a-z]{3}/i.test(value) ? 'en' : fallback;
}
export function answerLocale(preference, text, uiLocale = 'zh-CN') {
  return preference === 'auto' ? detectLanguage(text, normalizeLocale(uiLocale)) : normalizeLocale(preference, normalizeLocale(uiLocale));
}
