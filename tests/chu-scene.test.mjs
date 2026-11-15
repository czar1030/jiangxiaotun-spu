import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chuCopy,chuChapters} from '../public/chu-scene-copy.mjs';
import {languages} from '../public/language-core.mjs';

test('cultural chapters resolve to distinct photographed subjects with historical source links',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../public/assets/wuhan-media/catalog.json',import.meta.url),'utf8'));
 const subjects=Array.isArray(catalog)?catalog:catalog.subjects;
 const ids=chuChapters.flatMap(chapter=>chapter.subjects);
 assert.equal(ids.length,9);
 assert.equal(new Set(ids).size,9);
 for(const id of ids){
  const subject=subjects.find(item=>item.id===id);
  assert.ok(subject,`Unknown atlas subject: ${id}`);
  assert.ok(subject.factUrl,`Missing source: ${id}`);
  assert.ok(subject.image?.src?.startsWith('/assets/wuhan-media/'),`Untrusted or missing photo: ${id}`);
 }
});

test('every reception language has complete, distinct cultural navigation and chapter descriptions',()=>{
 const headings=[];
 for(const {code} of languages){
  const copy=chuCopy(code);headings.push(copy.heading0);
  assert.equal(Object.keys(copy).length,18);
  for(const [key,text]of Object.entries(copy))assert.ok(typeof text==='string'&&text.trim().length>=3,`${code}: ${key}`);
  assert.equal(new Set([copy.antiquity,copy.poetry,copy.everyday]).size,3,code);
  if(!['zh-CN','zh-TW','ja'].includes(code))assert.ok(!/[\u4e00-\u9fff]/u.test(Object.values(copy).join(' ')),code);
 }
 assert.equal(new Set(headings).size,languages.length);
});
