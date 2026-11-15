import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadMedia, mediaChunks, attachMedia } from '../lib/media.mjs';
import { cleanCitationTokens, resolveSubject, enrichPlaces, subjectsMentioned, matchesAtlasSubject, stripModelImages } from '../public/media-utils.mjs';
import { createApp, root, sanitizeReply } from './test-server.mjs';
import { retrieve } from '../lib/knowledge.mjs';
import {localAnswer} from '../lib/fallback.mjs';
const subjects = loadMedia(root);

test('all eighteen curated FAQ questions answer the subject and show each matching image offline',()=>{
  const faqs=JSON.parse(readFileSync(resolve(root,'data/media-faq-coverage.json'),'utf8'));
  for(const {question,expected} of faqs){
    const reply=attachMedia(localAnswer([{role:'user',content:question}],'wuhan',[],subjects),subjects);
    for(const id of expected)assert.ok(reply.places.some(p=>p.atlasId===id&&p.image),`${question}: ${id}`);
  }
});

test('unknown model cards cannot crowd verified pictures out of the eight-card limit',()=>{
  const unknown=Array.from({length:8},(_,i)=>({name:'未收录店铺'+i}));
  const reply=enrichPlaces(unknown,subjects,'红楼与首义广场可以帮助理解武昌起义。',8);
  assert.equal(reply.length,8);
  assert.deepEqual(reply.filter(p=>p.image).map(p=>p.atlasId),['xinhai-north','shouyi-square']);
  assert.ok(reply.filter(p=>!p.atlasId).every(p=>p.image===null));
});

test('Optics Valley administrative area never becomes an unrelated East Lake landscape',()=>{
  assert.equal(resolveSubject(subjects,'东湖高新区'),null);
  assert.ok(!subjectsMentioned(subjects,'武汉东湖新技术开发区的AI产业发展。').some(s=>s.id==='east-lake'));
  assert.ok(subjectsMentioned(subjects,'东湖高新区发展创新，东湖适合休闲。').some(s=>s.id==='east-lake'));
});

test('founder and product references have attributed images of the actual subject',()=>{
  const cards=enrichPlaces([],subjects,'罗弼文创办数命科技，团队推出Mark 印。');
  assert.deepEqual(cards.map(p=>p.atlasId),['luo-biwen','markyin']);
  assert.equal(cards[0].image.type,'创业团队合影');
  assert.equal(cards[1].image.type,'官方产品图');
  assert.match(cards[0].image.sourceUrl,/wuhan.gov.cn/);
});

test('every atlas entry has a unique introduction within 100 characters, available to search and retrieval', () => {
  const introductions=JSON.parse(readFileSync(resolve(root,'data/atlas-introductions.json'),'utf8'));
  assert.deepEqual(Object.keys(introductions).sort(),subjects.map(s=>s.id).sort());
  for(const subject of subjects){
    assert.equal(subject.introduction,introductions[subject.id]);
    assert.ok([...subject.introduction].length>20&&[...subject.introduction].length<=100,subject.name);
    assert.ok(mediaChunks([subject])[0].text.includes(subject.introduction));
  }
  assert.equal(new Set(subjects.map(s=>s.introduction)).size,subjects.length);
  assert.ok(matchesAtlasSubject(subjects.find(s=>s.id==='yellow-crane'),'全部','崔颢'));
  assert.ok(matchesAtlasSubject(subjects.find(s=>s.id==='hubei-museum'),'全部','曾侯乙编钟'));
});

test('real names override incorrect model IDs and resolve local aliases', () => {
  assert.equal(resolveSubject(subjects, { id:'yellow-crane', name:'江汉路步行街 [K15]' }).id, 'jianghan');
  assert.equal(resolveSubject(subjects, '东湖樱花园').id, 'east-lake-sakura');
  assert.equal(resolveSubject(subjects, '武汉美术馆（汉口馆）').id, 'wuhan-art-museum');
  assert.equal(resolveSubject(subjects, '武汉美术馆（琴台馆）').id, 'qintai-art-museum');
  assert.equal(resolveSubject(subjects, '武汉美术馆（琴台新馆）').id, 'qintai-art-museum');
  assert.equal(resolveSubject(subjects, { id:'yellow-crane', name:'尚未收录的地方' }), null);
});

test('old conversations gain correct, distinct, trusted photos and aliases deduplicate', () => {
  const cards = enrichPlaces([
    { id:'jianghan', name:'江汉路' }, { id:'jianghan', name:'汉口江滩' },
    { id:'other', name:'江汉路步行街' }, { id:'other', name:'民众乐园' },
    { id:'yellow-crane', name:'未知地点', image:{src:'https://example.com/evil.jpg'} }
  ], subjects);
  assert.deepEqual(cards.map(p=>p.id), ['jianghan','hankou-river','minzhong','other']);
  assert.ok(cards.slice(0,3).every(p=>p.image?.src.startsWith('/assets/wuhan-media/')));
  assert.equal(new Set(cards.slice(0,3).map(p=>p.image.sha256)).size,3);
  assert.equal(cards.at(-1).image,null);
});

test('the museum institution, south exhibition building and north Red Building stay distinct', () => {
  for (const name of ['辛亥革命博物院','辛亥革命博物馆','辛亥革命博物院（南区）']) {
    const subject=resolveSubject(subjects,name);
    assert.equal(subject.id,'xinhai-south');
    assert.match(subject.name,/南区/);
  }
  for (const name of ['红楼','辛亥革命武昌起义纪念馆','辛亥革命博物院（北区）','武昌起义军政府旧址']) {
    assert.equal(resolveSubject(subjects,name).id,'xinhai-north');
  }
  const restored=enrichPlaces([{id:'other',name:'辛亥革命博物院'},{id:'other',name:'红楼'}],subjects);
  assert.equal(restored.length,2);
  assert.ok(restored.every(p=>p.image));
  assert.notEqual(restored[0].image.sha256,restored[1].image.sha256);
});

test('restored attraction cards resolve East Lake areas to distinct reviewed scenery', () => {
  const expected = [
    ['east-lake-tingtao', ['东湖听涛景区', '听涛景区', '东湖听涛', '武汉东湖风景区听涛景区']],
    ['east-lake-moshan', ['东湖磨山景区', '磨山风景区', '东湖磨山']],
    ['east-lake-luoyan', ['东湖落雁景区', '落雁景区', '东湖落雁']],
    ['east-lake-chuidi', ['东湖吹笛景区', '马鞍山森林公园', '武汉马鞍山森林公园']]
  ];
  for (const [id, names] of expected) {
    for (const name of names) assert.equal(resolveSubject(subjects, name)?.id, id, name);
  }
  const restored = enrichPlaces([
    {id:'other',name:'东湖听涛景区',image:null},
    {id:'other',name:'听涛景区'},
    {id:'east-lake',name:'磨山风景区'},
    {id:'other',name:'东湖落雁景区'},
    {id:'other',name:'马鞍山森林公园'}
  ], subjects);
  assert.deepEqual(restored.map(p=>p.id),expected.map(([id])=>id));
  assert.ok(restored.every(p=>p.image?.reviewed && p.atlasId===p.id));
  assert.equal(new Set(restored.map(p=>p.image.sha256)).size,4);
  assert.ok(subjectsMentioned(subjects,'上午听涛景区，下午去东湖磨山。').some(s=>s.id==='east-lake-tingtao'));
  assert.equal(resolveSubject(subjects,'东湖磨山樱花园').id,'east-lake-sakura');
  assert.equal(resolveSubject(subjects,'东湖磨山梅园').id,'east-lake-plum');
  assert.equal(resolveSubject(subjects,'落雁岛景区'),null);
  const oldOrder = [
    ...JSON.parse(readFileSync(resolve(root,'data/media-subjects.json'),'utf8')),
    ...JSON.parse(readFileSync(resolve(root,'data/history-subjects.json'),'utf8'))
  ];
  assert.deepEqual(subjects.slice(0,oldOrder.length).map(s=>s.id),oldOrder.map(s=>s.id));
});

test('people, their buildings and later artistic depictions are not confused', () => {
  const cards=enrichPlaces([{name:'张之洞'},{name:'张之洞博物馆'},{name:'詹天佑'},{name:'武汉詹天佑故居'}],subjects);
  assert.deepEqual(cards.map(s=>s.kind),['person','place','person','place']);
  assert.equal(resolveSubject(subjects,'宋庆龄汉口旧居纪念馆').id,'soong-house');
  assert.equal(resolveSubject(subjects,'宋庆龄汉口旧居纪念馆').kind,'place');
  assert.equal(resolveSubject(subjects,'李白').image.type,'后人画作');
  assert.match(resolveSubject(subjects,'李白').image.caption,/非.*真实容貌/);
  assert.equal(resolveSubject(subjects,'屈原').image.type,'纪念雕像');
  assert.equal(resolveSubject(subjects,'詹天佑').image.type,'历史照片');
  const restored=attachMedia({answer:'张之洞与武汉近代工业密切相关，可以参观张之洞与武汉博物馆。',places:[]},subjects);
  assert.deepEqual(new Set(restored.places.map(p=>p.id)),new Set(['zhang-zhidong','zhang-museum']));
});

test('the reported Red Building and Shouyi Square cards recover distinct photographs in saved conversations', () => {
  const saved={answer:'武汉敢为人先的精神，可以从武昌首义的历史中理解。可参观红楼与首义广场。',places:[
    {id:'other',name:'辛亥革命博物院北区（红楼）',image:null},
    {id:'other',name:'首义广场',image:null}
  ]};
  const server=attachMedia(saved,subjects);
  const browser=enrichPlaces(saved.places,subjects,saved.answer);
  assert.deepEqual(browser,server.places);
  assert.deepEqual(browser.map(p=>p.id),['xinhai-north','shouyi-square']);
  assert.ok(browser.every(p=>p.image?.reviewed && p.image.src.startsWith('/assets/wuhan-media/')));
  assert.notEqual(browser[0].image.sha256,browser[1].image.sha256);
  assert.ok(resolveSubject(subjects,'武昌首义广场').image.caption.includes('十八星旗'));
});

test('automatic-question screenshot cards regain their own images in old and new conversations', () => {
  const saved={answer:'可以了解武汉城市规划馆、汉阳江欣苑社区非遗展示中心、光谷创新天地与数命SPU社区。',places:[
    {id:'other',name:'武汉城市规划馆',image:null},
    {id:'other',name:'汉阳江欣苑社区非遗展示中心',image:null},
    {id:'other',name:'光谷创新天地',image:null},
    {id:'community',name:'数命SPU社区',image:null}
  ]};
  const server=attachMedia(saved,subjects);
  const browser=enrichPlaces(saved.places,subjects,saved.answer);
  assert.deepEqual(browser,server.places);
  assert.deepEqual(browser.map(p=>p.id),['wuhan-planning','jiangxinyuan','optics-innovation','spu-community']);
  assert.ok(browser.every(p=>p.image?.reviewed&&p.atlasId===p.id));
  assert.equal(new Set(browser.map(p=>p.image.sha256)).size,4);
  assert.equal(browser.at(-1).image.type,'规划设计图');
  assert.match(resolveSubject(subjects,'光谷创新天地').image.caption,/非SPU内部设施/);
  const oldOrder=['media','history','scenic','common'].flatMap(file=>JSON.parse(readFileSync(resolve(root,`data/${file}-subjects.json`),'utf8')));
  assert.deepEqual(subjects.slice(0,oldOrder.length).map(s=>s.id),oldOrder.map(s=>s.id));
});

test('future-city and community entry answers get photos even when the model omits all cards', () => {
  for(const [answer,expected] of [
    ['武汉规划展示馆、蜜蜂探索馆和路特斯全球智能工厂，可了解城市与科技。数命SPU社区在江岸智民里和光谷创新天地布局。',['wuhan-planning','bee-museum','lotus-factory','spu-community','zhiminli','optics-innovation']],
    ['江欣苑非遗展示中心可以结合武汉汉绣博物馆和高龙博物馆了解非遗。',['jiangxinyuan','hanxiu-museum','gaolong-museum']],
    ['SAIG 采用个人报名与独立参赛。',['saig']]
  ]){
    const cards=attachMedia({answer,places:[]},subjects).places;
    assert.deepEqual(cards.map(p=>p.id),expected);
    assert.ok(cards.every(p=>p.image?.reviewed));
  }
  assert.equal(resolveSubject(subjects,'武汉汉绣博物馆').id,'hanxiu-museum');
  assert.equal(resolveSubject(subjects,'其他城市的蜜蜂博物馆'),null);
  assert.equal(resolveSubject(subjects,'蜜蜂大世界'),null);
  assert.match(resolveSubject(subjects,'高龙博物馆').image.caption,/非.*馆舍/);
  assert.equal(resolveSubject(subjects,'SAIG').image.type,'赛事资料示意图');
});

test('common question photo coverage includes history, people, foods, family trips and ferry connections', () => {
  const cases=JSON.parse(readFileSync(resolve(root,'data/media-faq-coverage.json'),'utf8'));
  for(const {question,answer,expected} of cases){
    const reply=attachMedia({answer,places:[]},subjects);
    for(const id of expected){
      assert.ok(reply.places.some(p=>p.id===id&&p.image?.reviewed),`${question}: ${id}`);
    }
    assert.equal(new Set(reply.places.map(p=>p.image.sha256)).size,reply.places.length,question);
  }
  for(const name of ['中华路2号码头','武汉关2号码头','尚未收录的美食店']){
    assert.equal(resolveSubject(subjects,name),null,name);
  }
  for(const subject of subjects){
    for(const id of subject.relatedIds || [])assert.ok(subjects.some(s=>s.id===id),`${subject.id}: ${id}`);
  }
  const oldOrder=['media','history','scenic'].flatMap(file=>JSON.parse(readFileSync(resolve(root,`data/${file}-subjects.json`),'utf8')));
  assert.deepEqual(subjects.slice(0,oldOrder.length).map(s=>s.id),oldOrder.map(s=>s.id));
});

test('one museum or a memorial does not suppress a separate mention of another subject', () => {
  for(const answer of [
    '先看武汉博物馆，再去张之洞与武汉博物馆。',
    '先看张之洞与武汉博物馆，再去武汉博物馆。'
  ])assert.deepEqual(new Set(subjectsMentioned(subjects,answer).map(s=>s.id)),new Set(['wuhan-museum','zhang-museum']));
  assert.deepEqual(subjectsMentioned(subjects,'参观宋庆龄汉口旧居纪念馆。').map(s=>s.id),['soong-house']);
  assert.deepEqual(subjectsMentioned(subjects,'参观武汉美术馆（琴台新馆）。').map(s=>s.id),['qintai-art-museum']);
});

test('historical knowledge is searchable, sourced and preserves existing citation IDs', () => {
  const original=JSON.parse(readFileSync(resolve(root,'data/media-subjects.json'),'utf8'));
  assert.deepEqual(subjects.slice(0,original.length).map(s=>s.id),original.map(s=>s.id));
  assert.ok(subjects.filter(s=>matchesAtlasSubject(s,'人物')).length>=8);
  assert.ok(subjects.filter(s=>matchesAtlasSubject(s,'历史')).length>=30);
  assert.ok(matchesAtlasSubject(resolveSubject(subjects,'红楼'),'历史','武昌起义纪念馆'));
  assert.ok(!matchesAtlasSubject(resolveSubject(subjects,'红楼'),'人物','红楼'));
  const context=retrieve(mediaChunks(subjects),[{role:'user',content:'张之洞与武汉近代工业有什么关系？'}],'wuhan');
  const biography=context.find(c=>c.title.endsWith('张之洞'));
  assert.ok(biography);
  assert.match(biography.text,/汉阳铁厂/);
  assert.match(biography.url,/wuhan\.gov\.cn/);
  assert.ok(!context.find(c=>c.title.endsWith('李白'))?.text.includes('已收录该对象的实景照片'));
});

test('internal single, grouped and bare references are removed without losing paragraph breaks', () => {
  for (const text of ['江汉路[K15]','江汉路【K15、M12】','江汉路 (K15, M12)','江汉路 K15']) assert.equal(cleanCitationTokens(text),'江汉路');
  assert.equal(cleanCitationTokens('第一段[K2]\n第二段[M12]'),'第一段\n第二段');
});

test('model-generated image URLs cannot masquerade as the catalog photo cards', () => {
  const answer='北区为红楼[M71]。\n![红楼实景](https://example.com/not-an-image.html)\n[参观资料](https://example.com/info)';
  const cleaned=stripModelImages(answer);
  assert.ok(!cleaned.includes('not-an-image'));
  assert.ok(cleaned.includes('[参观资料](https://example.com/info)'));
  assert.equal(attachMedia({answer:cleaned,places:[{name:'红楼'}]},subjects).places[0].image.type,'实景照片');
});

test('photographs are complete, high resolution, unique, locally available and traceable', () => {
  assert.ok(subjects.length >= 70);
  const hashes = new Set();
  for (const subject of subjects) {
    const photo=subject.image; assert.ok(photo, `photo missing: ${subject.name}`);
    assert.ok(photo.reviewed);
    const storyOriginal = ['创业团队合影','官方产品图'].includes(photo.type);
    assert.ok(Math.max(photo.originalWidth,photo.originalHeight)>=(storyOriginal?600:1000));
    assert.ok(Math.min(photo.originalWidth,photo.originalHeight)>=(storyOriginal?280:520));
    assert.ok(/^https?:\/\//.test(photo.sourceUrl));
    const file=resolve(root,'public','.'+photo.src.split('?')[0]); assert.ok(existsSync(file));
    assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),photo.sha256);
    assert.ok(!hashes.has(photo.sha256)); hashes.add(photo.sha256);
  }
});

test('food photo knowledge can be retrieved and excluded attractions are not added', () => {
  const context=retrieve(mediaChunks(subjects),[{role:'user',content:'介绍糊米酒和热干面'}],'travel');
  assert.ok(context.some(c=>c.title.includes('糊米酒')));
  assert.ok(context.some(c=>c.title.includes('热干面')));
  assert.ok(!subjectsMentioned(subjects,'这次不去黄鹤楼，下午安排东湖。').some(s=>s.id==='yellow-crane'));
  const result=attachMedia({answer:'推荐三鲜豆皮和热干面',places:[]},subjects);
  assert.ok(result.places.some(p=>p.id==='doupi'&&p.image));
});

test('media citation IDs remain valid sources and untrusted model images are discarded', () => {
  const context=mediaChunks(subjects).slice(0,2);
  const result=sanitizeReply({answer:'看黄鹤楼[M1]。',sources:['M1','M9999'],places:[{id:'other',name:'黄鹤楼[K18]',image:{src:'https://example.com/evil.jpg'}}]},context);
  assert.deepEqual(result.sources.map(s=>s.id),['M1']);
  assert.equal(result.places[0].name,'黄鹤楼');
  assert.equal(result.places[0].image,undefined);
});

test('the public library and shared modules are served with usable MIME types', async () => {
  const app=createApp(); await new Promise(r=>app.listen(0,'127.0.0.1',r));
  try {
    const base=`http://127.0.0.1:${app.address().port}`;
    const response=await fetch(base+'/api/media'); const data=await response.json();
    assert.equal(data.subjects.length,subjects.length);
    const module=await fetch(base+'/media-utils.mjs'); assert.match(module.headers.get('content-type'),/javascript/);
    const catalog=await fetch(base+'/assets/wuhan-media/catalog.json'); assert.match(catalog.headers.get('content-type'),/application\/json/);
    for (const s of subjects) {const photo=await fetch(base+s.image.src,{method:'HEAD'});assert.equal(photo.status,200);assert.match(photo.headers.get('content-type'),/image\/webp/);}
  } finally {await new Promise(r=>app.close(r));}
});
