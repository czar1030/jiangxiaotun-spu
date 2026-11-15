import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createApp} from './test-server.mjs';

const chapters=['poetry','courage','everyday','future'];
test('four reading destinations load independently, including every local image, without asking AI',async()=>{
  let generated=0;
  const server=createApp({generator:async()=>{generated++;throw new Error('Reading must not ask AI');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  try{
    const checked=new Set();
    for(const key of chapters){
      const response=await fetch(`${origin}/wuhan-${key}.html`);
      assert.equal(response.status,200,key);
      assert.match(response.headers.get('content-type'),/text\/html/);
      const html=await response.text();
      assert.match(html,new RegExp(`href="/\\?mode=wuhan#wuhan-story-${key}"`));
      assert.equal((html.match(/<h1\b/g)||[]).length,1);
      assert.ok(!/message-input|data-story-ask|\/api\/chat/.test(html));
      for(const other of chapters)assert.ok(html.includes(`/wuhan-${other}.html`));
      for(const image of html.matchAll(/<img\b[^>]*>/g))assert.match(image[0],/alt="[^"]+"/);
      const resources=[...html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
      for(const resource of resources){
        if(resource.startsWith('/?')||checked.has(resource))continue;
        checked.add(resource);
        const asset=await fetch(origin+resource,{method:'HEAD'});
        assert.equal(asset.status,200,`${key}: ${resource}`);
        if(resource.includes('.webp'))assert.match(asset.headers.get('content-type'),/image\/webp/);
      }
    }
    assert.equal(generated,0);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('chapters distinguish present-day places, archival events and industry illustrations',async()=>{
  const read=key=>readFile(new URL(`../public/wuhan-${key}.html`,import.meta.url),'utf8');
  const poetry=await read('poetry');
  assert.equal((poetry.match(/role="tabpanel"/g)||[]).length,3);
  assert.match(poetry,/并非武汉五月真的飞落梅花/);
  const history=await read('courage');
  for(const year of ['1911','1957','1998','2020'])assert.ok(history.includes(`id="history-${year}"`));
  assert.match(history,/非1998年抗洪现场/);
  assert.match(history,/2020年2月4日/);
  const food=await read('everyday');
  assert.equal((food.match(/data-food-category=/g)||[]).length,12);
  for(const category of ['all','breakfast','table','night','sweet'])assert.ok(food.includes(`data-food-filter="${category}"`));
  const future=await read('future');
  assert.match(future,/长江存储/);assert.match(future,/3D NAND/);
  assert.match(future,/非芯片实拍/);assert.match(future,/在建项目进展/);
  assert.match(future,/不承诺厂区、实验室或生产线向游客开放/);
});

test('new editorial images match their preserved source records',async()=>{
  const folder=new URL('../public/assets/wuhan-chapters/',import.meta.url);
  const provenance=JSON.parse(await readFile(new URL('provenance.json',folder),'utf8'));
  assert.ok(provenance.assets.some(asset=>asset.file==='wuhan-medics.webp'));
  assert.ok(provenance.assets.some(asset=>asset.file==='ymtc-detail.webp'));
  for(const asset of provenance.assets){
    const bytes=await readFile(new URL(asset.file,folder));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.file);
    assert.match(asset.sourceUrl,/^https:\/\/www\.(?:xinhuanet\.com|wehdz\.gov\.cn|ymtc\.com)\//);
  }
});
