import test from 'node:test';
import assert from 'node:assert/strict';
import {greetingMotion,sampleGreeting,motionRate,restingPose} from '../public/mascot-motion.mjs';

test('presentation-time sampling keeps the inbetweens on 30/60/120 Hz displays',()=>{
 for(const kind of ['wave','welcome']){
  const clip=greetingMotion(kind),at=1.525;
  const pose=sampleGreeting(clip,at),a=clip.frames[91],b=clip.frames[92];
  for(const part of Object.keys(restingPose))assert.ok(Math.abs(pose[part]-(a[part]+b[part])/2)<1e-10,part);
  assert.deepEqual(sampleGreeting(clip,-1),clip.frames[0]);
  assert.deepEqual(sampleGreeting(clip,100),clip.frames.at(-1));
  for(const rate of [30,60,120]){
   let previous=sampleGreeting(clip,0);
   for(let frame=1;frame<=clip.duration/1000*rate;frame++){
    const next=sampleGreeting(clip,frame/rate);
    for(const key of ['head','body','shoulder','elbow','wrist'])assert.ok(Math.abs(next[key]-previous[key])<110/rate,`${rate}Hz ${key}`);
    previous=next;
   }
  }
 }
});

for(const kind of ['wave','welcome']){
 test(`${kind} uses dense continuous curves, natural limits, and a settled landing`,()=>{
  const {duration,frames}=greetingMotion(kind);
  assert.equal(motionRate,60);
  assert.ok(frames.length>300);
  assert.equal(frames.length,Math.round(duration/1000*60)+1);
  assert.deepEqual(frames[0],{offset:0,...restingPose});
  const last=frames.at(-1);
  for(const part of ['shoulder','elbow','wrist','head','body','tail','lift']){
   assert.ok(Math.abs(last[part])<1e-8,part);
   // Bound changes per rendered sample; sharp reversals made the previous wrist look stiff.
   for(let index=1;index<frames.length;index++){
    assert.ok(Math.abs(frames[index][part]-frames[index-1][part])<1.8,`${part} at ${index}`);
   }
  }
  assert.equal(last.smile,1);
  assert.equal(last.blink,0);
  assert.ok(frames.every(frame=>frame.shoulder>=0&&frame.shoulder<50&&frame.elbow>=0&&frame.elbow<78&&frame.wrist>=0&&frame.wrist<75));
 });
}

test('clicking during a wave starts the welcome from the visible pose without a jump',()=>{
 const wave=greetingMotion('wave');
 for(const index of [30,90,150,220]){
  const initial=wave.frames[index];
  const welcome=greetingMotion('welcome',initial);
  for(const part of Object.keys(restingPose))assert.equal(welcome.frames[0][part],initial[part],part);
  assert.equal(welcome.frames.at(-1).shoulder,0);
 }
 assert.notDeepEqual(greetingMotion('wave').frames,greetingMotion('welcome').frames);
});

test('hover wave uses the shoulder and elbow with a delayed playful head tilt',()=>{
 const middle=greetingMotion('wave').frames.filter(frame=>frame.offset>.45&&frame.offset<.65);
 const span=part=>Math.max(...middle.map(frame=>frame[part]))-Math.min(...middle.map(frame=>frame[part]));
 assert.ok(span('shoulder')>10);
 assert.ok(span('elbow')>14);
 assert.ok(span('head')>1.5);
 assert.ok(middle.every(frame=>frame.welcome===0&&frame.wave===1));
});

test('click reveals the approved happy face and both open arms, replacing the wave and its legs',()=>{
 const {frames}=greetingMotion('welcome');
 const opened=frames.filter(frame=>frame.offset>.25&&frame.offset<.75);
 assert.ok(opened.every(frame=>frame.welcome===1&&frame.wave===0&&frame.waveLegs===0));
 assert.ok(opened.some(frame=>frame.happyRight>6&&frame.happyLeft<-4&&frame.happyHead<-2));
 assert.equal(frames.at(-1).welcome,1);
});
