import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { tokenize } from './knowledge.mjs';
import { enrichPlaces } from '../public/media-utils.mjs';

export function loadMedia(root) {
  const path = resolve(root, 'public/assets/wuhan-media/catalog.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')).subjects : [];
}

export function mediaChunks(subjects) {
  return subjects.map((subject, index) => {
    const text = `武汉图文条目：${subject.name}。类别：${subject.category}；片区：${subject.area}。别称：${(subject.aliases || []).join('、')}。${subject.description}。` +
      (subject.introduction ? `简短介绍：${subject.introduction}` : '') +
      `历史主题：${(subject.tags || []).join('、')}。` +
      (subject.factExcerpt ? `${subject.factLabel || '资料摘要'}：${subject.factExcerpt}` : '本条目用于图片与名称识别，不提供实时开放、票价或预约证据。') +
      (subject.image ? `已收录图像，类型：${subject.image.type || '实景照片'}。图像说明：${subject.image.caption || subject.image.alt}；图片源页面：${subject.image.sourceUrl}。` : '暂未收录核实后的图像。') +
      (subject.relatedIds?.length ? `相关图文条目：${subject.relatedIds.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join('、')}。` : '');
    return { id: `M${index + 1}`, docId: 'wuhan-atlas', topic: subject.id === 'saig' ? 'saig' : ['spu-community','zhiminli','optics-innovation','luo-biwen','markyin'].includes(subject.id) ? 'community' : subject.kind === 'person' ? 'wuhan' : 'travel', title: `武汉图文资料库 · ${subject.name}`,
      page: subject.factPage || null, url: subject.factUrl || `/?atlas=${encodeURIComponent(subject.id)}`,
      text, tokens: new Set(tokenize(text)) };
  });
}

export function attachMedia(result, subjects) {
  const planText = result.itinerary?.days?.flatMap(day => day.stops.map(stop => stop.name)).join(' ') || '';
  return { ...result, places: enrichPlaces(result.places, subjects, `${planText} ${result.answer}`, 8) };
}
