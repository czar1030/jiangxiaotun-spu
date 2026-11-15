import test from 'node:test';
import assert from 'node:assert/strict';
import {presenterTopics,speechText,splitSpeech,replySpeech} from '../public/presenter-content.mjs';
import {PresenterSpeaker} from '../public/presenter-speaker.mjs';
import {createApp} from './test-server.mjs';
import {PresenterSession,answerBlocks} from '../public/presenter-session.mjs';
import {synthesizePresenterSpeech} from '../lib/presenter-speech.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(fetcher=async()=>new Response(new Blob(['audio']))){
  const audios=[],states=[],errors=[],revoked=[];
  const speaker=new PresenterSpeaker({fetcher,onState:value=>states.push(value),onError:value=>errors.push(value),urlApi:{createObjectURL:()=>`blob:${audios.length}`,revokeObjectURL:value=>revoked.push(value)},audioFactory:()=>{
    const audio={currentTime:0,duration:10,paused:true,play(){this.paused=false;this.onplaying?.();return Promise.resolve();},pause(){this.paused=true;},removeAttribute(){},load(){},end(){this.onended?.();}};
    audios.push(audio);return audio;
  }});return {speaker,audios,states,errors,revoked};
}
test('speech reads content without citations, markdown, links or table noise',()=>{
  const text='## 江城\n**黄鹤楼**见[资料](https://example.org)。[K12]\n| 时间 | 景点 |\n|---|---|\n武汉欢迎你！';
  assert.equal(speechText(text).replace(/\s/g,''),'江城黄鹤楼见资料。武汉欢迎你！');
  const chunks=splitSpeech('长江与汉江在这里交汇。'+ '慢慢认识武汉，'.repeat(100),160);
  assert.ok(chunks.length>1);assert.ok(chunks.every(chunk=>chunk.length<=160));
  assert.ok(replySpeech({answer:'这是一段完整的话。'.repeat(100)}).length<550);
  assert.deepEqual(Object.keys(presenterTopics),['wuhan','travel','community','saig']);
});
test('pause and resume are tied to real audio and stop settles the pending playback',async()=>{
  const f=fixture(),play=f.speaker.play('你好，我是江小豚。');await flush();
  assert.equal(f.speaker.status,'speaking');f.speaker.pause();assert.equal(f.audios[0].paused,true);assert.equal(f.speaker.status,'paused');
  f.speaker.resume();assert.equal(f.speaker.status,'speaking');f.speaker.stop();await play;
  assert.equal(f.speaker.status,'idle');assert.equal(f.audios[0].paused,true);assert.equal(f.revoked.length,1);
});
test('switching topic invalidates an older speech request even if its audio arrives later',async()=>{
  const pending=[];const f=fixture(()=>new Promise(resolve=>pending.push(resolve)));
  const old=f.speaker.play('旧主题的声音。');const next=f.speaker.play('新主题的声音。');
  pending[0](new Response(new Blob(['old'])));await old;assert.equal(f.audios.length,0);
  pending[1](new Response(new Blob(['new'])));await flush();assert.equal(f.audios.length,1);
  f.audios[0].end();await next;assert.equal(f.speaker.status,'idle');assert.deepEqual(f.errors,[]);
});
test('a pause while preparing survives until explicit resume, and errors reset acting state',async()=>{
  let release;const f=fixture(()=>new Promise(resolve=>release=resolve));const play=f.speaker.play('你好。');f.speaker.pause();release(new Response(new Blob(['audio'])));await flush();
  assert.equal(f.speaker.status,'paused');assert.equal(f.audios[0].paused,true);f.speaker.resume();f.audios[0].end();await play;
  const failed=fixture(async()=>new Response(JSON.stringify({error:'声音暂不可用'}),{status:503,headers:{'Content-Type':'application/json'}}));
  await failed.speaker.play('你好');assert.equal(failed.speaker.status,'idle');assert.deepEqual(failed.errors,['声音暂不可用']);
});
test('presenter speech serves audio on the same origin and rejects malformed/cross-origin calls',async()=>{
  const server=createApp({speechSynthesizer:async payload=>{assert.equal(payload.voice,'zh-CN-XiaoxiaoNeural');return Buffer.from('ID3test-audio');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const response=await fetch(base+'/api/presenter/speech',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({text:'你好',voice:'zh-CN-XiaoxiaoNeural'})});
    assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'audio/mpeg');assert.equal(await response.text(),'ID3test-audio');
    assert.match(response.headers.get('content-security-policy'),/media-src 'self' blob:/);
    const blocked=await fetch(base+'/api/presenter/speech',{method:'POST',headers:{Origin:'https://example.org'},body:'{}'});assert.equal(blocked.status,403);
    const malformed=await fetch(base+'/api/presenter/speech',{method:'POST',body:'{'});assert.equal(malformed.status,400);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('trimming a topic keeps evidence attached and travel followups retain their last full plan',()=>{
  const session=new PresenterSession(4),plan={days:[{day:1,title:'汉口'},{day:2,title:'武昌'}],budget:[{item:'交通',amount:'约50元'}]};
  session.add('travel','user','带父母玩两天');session.add('travel','assistant','安排好了',{itinerary:plan,sources:[{title:'旅游资料'}]});
  session.add('travel','user','第二天下雨');session.add('travel','assistant','可以这样修改',{sources:[{title:'雨天参考'}]});
  session.add('travel','user','减少步行');
  assert.equal(session.entries('travel').length,4);assert.equal(session.entries('travel')[0].result.sources[0].title,'旅游资料');
  assert.equal(session.latestPlan('travel'),plan);assert.equal(session.latestPlan('wuhan'),undefined);
  session.add('travel','assistant','这次请求未完成',{meta:{mode:'error'}});
  assert.equal(session.messages('travel').at(-1).content,'减少步行');assert.equal(session.latestReply('travel').content,'可以这样修改');
  for(let i=0;i<8;i++)session.add('travel','user','继续调整');assert.equal(session.latestPlan('travel'),plan);
});

test('displayed answers preserve table facts and literal text while speech omits table noise',()=>{
  const text='## 费用\n| 项目 | 预算 |\n| --- | --- |\n| 地铁 | 约20元/人 |\n\n- **需预约** [K3]\n<script>example</script>';
  const blocks=answerBlocks(text);assert.equal(blocks[0].text,'费用');
  assert.deepEqual(blocks[1],{type:'table',headers:['项目','预算'],rows:[['地铁','约20元/人']]});
  assert.equal(blocks[2].text,'需预约');assert.equal(blocks[3].text,'<script>example</script>');
});

test('replaying a prerecorded intro reuses its audio without requesting new synthesis',async()=>{
  const calls=[];const f=fixture(async url=>{calls.push(url);return new Response(new Blob(['audio']));});
  const first=f.speaker.play('你好。',{audioUrl:'/assets/presenter/voices/wuhan-imperial.mp3'});await flush();f.audios[0].end();await first;
  const replay=f.speaker.play('你好。',{audioUrl:'/assets/presenter/voices/wuhan-imperial.mp3'});await flush();f.audios[1].end();await replay;
  assert.deepEqual(calls,['/assets/presenter/voices/wuhan-imperial.mp3']);assert.equal(f.revoked.length,2);
});

test('stopping during prefetched narration prevents the next chunk from playing',async()=>{
  const pending=[];const f=fixture(()=>new Promise(resolve=>pending.push(resolve)));
  const play=f.speaker.play('第一段讲解。'.repeat(40));pending[0](new Response(new Blob(['first'])));await flush();
  assert.equal(f.audios.length,1);assert.equal(pending.length,2);f.speaker.stop();await play;
  pending[1](new Response(new Blob(['late'])));await flush();assert.equal(f.audios.length,1);assert.deepEqual(f.errors,[]);
});

test('malformed speech parameters fail cleanly before starting a speech process',async()=>{
  for(const payload of [null,[],1,{text:''},{text:12}])assert.throws(()=>synthesizePresenterSpeech(payload),{status:400});
  await assert.rejects(synthesizePresenterSpeech({text:'你好',locale:{bad:true}},AbortSignal.abort()),/Aborted/);
});
