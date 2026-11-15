import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {languages,normalizeLocale,answerLocale} from '../public/language-core.mjs';
import {expandMultilingualQuery,multilingualSubjects,localizedReference,offlineNotice,offlineTopics,languagePacks,registerSearchSubjects} from '../lib/language.mjs';
import {loadMedia,mediaChunks} from '../lib/media.mjs';
import {loadKnowledge,retrieve} from '../lib/knowledge.mjs';
import {resolveSubject} from '../public/media-utils.mjs';
import {officialRules} from '../lib/prompt.mjs';
import {createApp,root,sanitizeReply} from './test-server.mjs';
const subjects=multilingualSubjects(loadMedia(root));registerSearchSubjects(subjects);
const {chunks}=loadKnowledge(`${root}/data/knowledge.json`);

test('automatic reception follows visitor language and explicit selection remains stable',()=>{
 for(const [text,locale]of [
  ['Please plan two days in Wuhan with my parents.','en'],['両親と武漢を旅行したいです。','ja'],
  ['우한에서 이틀 여행하고 싶어요.','ko'],['أريد زيارة ووهان مع والدي','ar'],['Je voyage avec mes parents.','fr'],
  ['Ich möchte Wuhan mit meinen Eltern besuchen.','de'],['武汉三镇是什么？','zh-CN']])assert.equal(answerLocale('auto',text,'zh-CN'),locale,text);
 assert.equal(answerLocale('ja','Please tell me about Wuhan.','en'),'ja');
 assert.equal(normalizeLocale('../../.env'),'zh-CN');assert.equal(normalizeLocale('pt-BR'),'pt');assert.equal(normalizeLocale('zh-Hant'),'zh-TW');
});

test('all selectable languages have complete curated UI, source-grounded fallback and photo names',()=>{
 const keys=JSON.parse(readFileSync(`${root}/data/i18n-source.json`,'utf8'));
 const scripts={ar:/[\u0600-\u06ff]/u,ja:/[\u3040-\u30ff\u4e00-\u9fff]/u,ko:/[\uac00-\ud7af]/u,hi:/[\u0900-\u097f]/u,th:/[\u0e00-\u0e7f]/u,ru:/[\u0400-\u04ff]/u};
 for(const {code}of languages.filter(l=>l.code!=='zh-CN')){
  const pack=languagePacks.get(code);
  for(const key of [...keys,offlineNotice,...Object.values(offlineTopics),...subjects.map(s=>s.name)]){
   assert.equal(typeof pack[key],'string',`${code}: missing ${key}`);
   assert.ok(pack[key].trim(),`${code}: blank ${key}`);
   if(scripts[code])assert.match(pack[key],scripts[code],`${code}: wrong language ${key}`);
  }
  assert.match(pack[offlineTopics.saig],/U\s*=\s*P\s*\^\s*S/);
 }
});

test('foreign landmark names retrieve Chinese evidence and keep museum and photos correctly associated',()=>{
 for(const [name,id]of [['Yellow Crane Tower','yellow-crane'],['Hubei Provincial Museum','hubei-museum'],['黄鶴楼','yellow-crane']]){
  assert.equal(resolveSubject(subjects,{id:'east-lake',name})?.id,id);
 }
 for(const text of ['Tell me about Hubei Provincial Museum.','湖北省博物館を紹介してください。']){
  const query=expandMultilingualQuery(text);
  const selected=retrieve([...chunks,...mediaChunks(subjects)],[{role:'user',content:query}],'wuhan');
  assert.ok(selected.some(c=>c.text.includes('湖北省博物馆')));
  assert.ok(selected.some(c=>c.topic==='community'));
 }
 const expanded=expandMultilingualQuery('My parents need an indoor plan if it is raining.');
 assert.match(expanded,/父母少走路/);assert.match(expanded,/下雨室内/);
});

test('a separately requested second day keeps its original travel day number',()=>{
 const result=sanitizeReply({answer:'Revised day 2.',itinerary:{days:[{day:2,title:'A rainy day indoors',stops:[]}] }},[]);
 assert.equal(result.itinerary.days[0].day,2);
});

test('HTTP passes chosen language and canonical image name rules to the model without translating history',async()=>{
 let captured;
 const server=createApp({generator:async(config,messages,prompt)=>{
  captured={messages,prompt};return {answer:'Welcome to Yellow Crane Tower. [O1]',sources:['O1'],places:[{name:'黄鹤楼',displayName:'Yellow Crane Tower',description:'A riverside landmark.'}]};
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const messages=[{role:'user',content:'我和父母住江汉路，少走路。'},{role:'assistant',content:'We can plan a relaxed trip.'},{role:'user',content:'Please keep those preferences.'}];
  const result=await(await fetch(`http://127.0.0.1:${server.address().port}/api/chat`,{method:'POST',body:JSON.stringify({locale:'en',messages})})).json();
  assert.match(captured.prompt,/接待语言[\s\S]*en/);assert.match(captured.prompt,/displayName/);
  assert.deepEqual(captured.messages,messages);assert.equal(result.meta.locale,'en');
  assert.equal(result.places[0].atlasId,'yellow-crane');assert.ok(result.places[0].image.src);assert.equal(result.places[0].displayName,'Yellow Crane Tower');
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('outage keeps reception in Japanese and explicitly offers a local overview instead of an invented customized plan',async()=>{
 const server=createApp({generator:async()=>{throw new Error('private diagnostics');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const result=await(await fetch(`http://127.0.0.1:${server.address().port}/api/chat`,{method:'POST',body:JSON.stringify({locale:'auto',mode:'travel',messages:[{role:'user',content:'両親と武漢を二日間旅行したいです。'}]})})).json();
  assert.equal(result.meta.locale,'ja');assert.equal(result.meta.mode,'local');assert.equal(result.itinerary,null);
  assert.match(result.answer,/[\u3040-\u30ff]/u);assert.ok(result.sources.length);assert.ok(!JSON.stringify(result).includes('private diagnostics'));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
