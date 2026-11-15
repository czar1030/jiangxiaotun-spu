import test from 'node:test';
import assert from 'node:assert/strict';
import {IdleTimeline} from '../public/mascot-idle-policy.mjs';
import {idleLine} from '../public/mascot-idle-lines.mjs';
import {languages} from '../public/language-core.mjs';

test('waiting first produces one curious glance, then boredom and finally sleepiness',()=>{
 const clock=new IdleTimeline(1000);
 assert.equal(clock.next(12999),null);
 assert.equal(clock.next(13000),'curious');
 assert.equal(clock.next(18000),null);
 assert.equal(clock.next(60999),null);
 assert.equal(clock.next(61000),'bored');
 assert.equal(clock.next(120999),'bored');
 assert.equal(clock.next(121000),'sleepy');
});

test('interaction or returning from a hidden tab starts a fresh waiting interval',()=>{
 const clock=new IdleTimeline(0);
 assert.equal(clock.next(80000),'bored');
 clock.reset(80000);
 assert.equal(clock.next(81000),null);
 assert.equal(clock.next(92000),'curious');
 clock.reset(93000);
 assert.equal(clock.next(104999),null);
 assert.equal(clock.next(105000),'curious');
});

test('every reception language has distinct idle captions without source-language fallbacks',()=>{
 for(const {code}of languages){
  const captions=['curious','bored','sleepy'].map(pose=>idleLine(code,pose));
  assert.equal(new Set(captions).size,3,code);
  assert.ok(captions.every(text=>typeof text==='string'&&text.length>5),code);
  if(!['zh-CN','zh-TW','ja'].includes(code))assert.ok(captions.every(text=>!/[\u4e00-\u9fff]/u.test(text)),code);
 }
});
