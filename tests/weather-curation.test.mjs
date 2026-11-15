import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {weatherEditions,weatherSelection,weatherPlanPrompt,legacyWeatherPlaces,weatherPlaceIds} from '../public/weather-curation.mjs';
import {weatherIntent} from '../public/weather-intent.mjs';

test('each weather edition recommends real catalogued places with matching local photography and complete outing guidance',async()=>{
 const catalog=JSON.parse(await readFile(new URL('../public/assets/wuhan-media/catalog.json',import.meta.url),'utf8')).subjects;
 for(const edition of Object.values(weatherEditions)){
  assert.equal(new Set(edition.places.map(p=>p.id)).size,4);
  for(const p of edition.places){
   const subject=catalog.find(s=>s.id===p.id);assert.ok(subject,p.id);
   assert.equal(subject.name,p.name);
   await access(new URL(`../public/assets/wuhan-media/${p.id}.webp`,import.meta.url));
   for(const key of ['reason','access','note','enReason','enAccess','enNote'])assert.ok(p[key]?.length>10,`${p.id}: ${key}`);
   assert.equal(p.route.length,3);assert.equal(p.enRoute.length,3);
  }
 }
 assert.notDeepEqual(weatherEditions.clear.places.map(p=>p.id),weatherEditions.rain.places.map(p=>p.id));
 assert.notDeepEqual(weatherEditions.rain.places.map(p=>p.id),weatherEditions.snow.places.map(p=>p.id));
});

test('planning prompts retain the selected place and weather throughout subsequent weather detection',()=>{
 for(const [weather,edition] of Object.entries(weatherEditions))for(const p of edition.places)for(const locale of ['zh-CN','en']){
  const prompt=weatherPlanPrompt(weather,p.id,locale);
  assert.equal(weatherIntent(prompt),weather,`${weather}: ${p.id}: ${locale}`);
  assert.ok(prompt.includes(locale==='zh-CN'?p.name:p.en));
  assert.ok((locale==='zh-CN'?p.route:p.enRoute).every(stop=>prompt.includes(stop)));
  assert.match(prompt,locale==='zh-CN'?/范围就先按范围推荐/:/range without demanding exact days/);
 }
 const snow=weatherPlanPrompt('snow','east-lake-tingtao');
 assert.match(snow,/不安排轮渡/);assert.match(snow,/不要高铁/);assert.match(snow,/不要假装查询了实时/);
 const rain=weatherPlanPrompt('rain','tanhualin');assert.match(rain,/大雨优先室内/);
});

test('switching editions cannot retain an unrelated place and existing saved favourites remain valid',()=>{
 const selection=weatherSelection('rain','yellow-crane');
 assert.equal(selection.place.id,'tanhualin');
 assert.equal(weatherSelection('snow','hubei-museum').place.name,'湖北省博物馆');
 assert.equal(weatherSelection('unknown','unknown').place.id,'east-lake-greenway');
 assert.ok(Object.values(legacyWeatherPlaces).every(id=>weatherPlaceIds.has(id)));
 assert.match(weatherPlanPrompt('rain','guqin-terrace','zh-CN',true),/古琴台.*历史文化/);
});
