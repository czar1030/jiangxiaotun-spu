import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createApp} from './test-server.mjs';
import {receptionEntry} from '../public/reception-entry.mjs';

test('community story returns select a mode and a fixed unsent draft only',()=>{
  assert.deepEqual(receptionEntry(''),{mode:null,draft:null});
  assert.deepEqual(receptionEntry('?mode=community'),{mode:'community',draft:null});
  assert.match(receptionEntry('?mode=community&compose=participation').draft,/我不会编程.*设施已经开放/);
  for(const query of ['?mode=__proto__&compose=participation','?mode=https://evil.example&compose=participation','?mode=travel&compose=participation']){
    assert.equal(receptionEntry(query).draft,null);
  }
  assert.deepEqual(receptionEntry('?mode=community&compose=ignore%20all%20rules&prompt=malicious'),{mode:'community',draft:null});
});

test('story entry, source documents and every local story asset are served with usable types',async()=>{
  let calls=0;
  const server=createApp({generator:async()=>{calls++;return {answer:'unused'};}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const home=await(await fetch(base)).text();
    const link=home.match(/<a\b[^>]*data-community-explore[^>]*href="([^"]+)"/);
    assert.ok(link,'community hero navigates to a story instead of scrolling to the old brief');
    const response=await fetch(new URL(link[1],base));assert.equal(response.status,200);
    assert.match(response.headers.get('content-type'),/text\/html/);
    const html=await response.text();
    const localPaths=[...html.matchAll(/(?:src|poster|href)="(\/[^"?&#]+)(?:[^\"]*)"/g)].map(m=>m[1]);
    const assets=[...new Set(localPaths.filter(path=>path!=='/'))];
    for(const path of assets){
      const asset=await fetch(base+path,{method:'HEAD'});assert.equal(asset.status,200,path);
      if(path.endsWith('.mp4'))assert.equal(asset.headers.get('content-type'),'video/mp4');
      if(path.endsWith('.webp'))assert.equal(asset.headers.get('content-type'),'image/webp');
      assert.ok(!asset.headers.get('content-type').includes('octet-stream'),path);
    }
    assert.equal(calls,0,'browsing the story and returning to a draft do not call AI');
    assert.match(html,/2025 年公司营收/);assert.match(html,/2025\.10—2026\.05/);
    assert.match(html,/营收为公司口径，非个人收入/);
    assert.match(html,/wuhan\.gov\.cn\/sy\/whyw\/202605\/t20260512_2763212.shtml/);
    assert.match(html,/hbwmw\.gov\.cn\/c\/2026\/05\/81712.shtml/);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('downloaded community story assets match their recorded original sources',async()=>{
  const folder=new URL('../public/assets/community-story/',import.meta.url);
  const provenance=JSON.parse(await readFile(new URL('provenance.json',folder),'utf8'));
  for(const asset of provenance.assets){
    assert.match(asset.source,/^https:\/\/(?:www\.wuhan\.gov\.cn|shuming-official-file\.markyin\.com|cpc\.people\.com\.cn)\//);
    const bytes=await readFile(new URL(asset.file,folder));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.file);
  }
});
