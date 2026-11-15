import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAiPolicy, createRequestLimiter} from '../lib/ai-policy.mjs';
import {createApp} from '../server.mjs';
import {generateAnswer} from '../lib/itinerary-generation.mjs';
import {ServiceError} from '../lib/ai.mjs';

function fixture(t, settings = {}) {
  const root = mkdtempSync(join(tmpdir(), 'spu-policy-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const file = join(root, 'usage.json');
  const env = {NODE_ENV:'production', AI_ENABLED:'true', AI_PROVIDER_BUDGET_CONFIRMED:'true', AI_USAGE_FILE:file, ...settings};
  return {root, env, file, policy: createAiPolicy({root, env})};
}
const invoke = (policy, generator, client = 'visitor') => policy.run(generator, {}, [{role:'user', content:'你好'}], 'safe instructions', undefined, {maxOutputTokens:10}, client);

test('public AI is off unless explicitly enabled, capped and given a private usage path', t => {
  const {root, env} = fixture(t);
  for (const override of [{AI_ENABLED:undefined}, {AI_PROVIDER_BUDGET_CONFIRMED:undefined}, {AI_USAGE_FILE:undefined}]) {
    assert.equal(createAiPolicy({root, env:{...env, ...override}}).enabled, false);
  }
  assert.throws(() => createAiPolicy({root, env:{...env, AI_USAGE_FILE:join(root,'public','usage.json')}}), /outside public/);
  assert.throws(() => createAiPolicy({root, env:{AI_DAILY_CALL_LIMIT:'NaN'}}), /Invalid/);
});

test('daily cap survives restart and changing visitor IDs cannot bypass the global cap', async t => {
  const {policy, env, root, file} = fixture(t, {AI_DAILY_CALL_LIMIT:'2'});
  let calls=0; const generator=async()=>++calls;
  await invoke(policy, generator, 'a');
  const restarted=createAiPolicy({root,env});
  await invoke(restarted,generator,'b');
  await assert.rejects(invoke(restarted,generator,'c'),{code:'AI_QUOTA_LIMIT'});
  assert.equal(calls,2);
  const ledger=readFileSync(file,'utf8');assert.ok(!ledger.includes('visitor'));
});

test('client cap, token reservation and input bound stop calls before they spend', async t => {
  const {policy} = fixture(t, {AI_CLIENT_DAILY_CALL_LIMIT:'1', AI_DAILY_OUTPUT_TOKEN_LIMIT:'20', AI_MAX_INPUT_CHARS:'100'});
  let calls=0; const gen=async()=>++calls;
  await invoke(policy,gen,'a');
  await assert.rejects(invoke(policy,gen,'a'),{code:'AI_QUOTA_LIMIT'});
  await invoke(policy,gen,'b');
  await assert.rejects(invoke(policy,gen,'c'),{code:'AI_QUOTA_LIMIT'});
  await assert.rejects(policy.run(gen,{},[], 'x'.repeat(101),undefined,{},'d'),{code:'AI_INPUT_LIMIT'});
  assert.equal(calls,2);
});

test('in-flight limit rejects excess calls and cancellation does not consume a call', async t => {
  const {policy,file}=fixture(t,{AI_MAX_CONCURRENT_CALLS:'1'});
  let complete;
  const pending=invoke(policy,()=>new Promise(r=>complete=r));
  await assert.rejects(invoke(policy,async()=>{}),{code:'AI_BUSY'});
  complete(); await pending;
  await assert.rejects(policy.run(async()=>{}, {},[], '', AbortSignal.abort(),{},'a'));
  assert.equal(JSON.parse(readFileSync(file)).calls,1);
  await invoke(policy,async()=>{});
});

test('failed calls remain charged; retries cannot bypass reservations', async t => {
  const {policy,file}=fixture(t,{AI_DAILY_CALL_LIMIT:'1'});let calls=0;
  const generator=async()=>{calls++;throw new ServiceError('retry',502,'INVALID_RESPONSE');};
  await assert.rejects(generateAnswer({generator:(...args)=>policy.run(generator,...args,'a'),config:{},messages:[{role:'user',content:'你好'}],instructions:'safe',mode:'wuhan'}),{code:'AI_QUOTA_LIMIT'});
  assert.equal(calls,1);assert.equal(JSON.parse(readFileSync(file)).calls,1);
});

test('invalid ledgers fail closed without leaking paths; UTC reset is explicit', async t => {
  const {root,env,file,policy}=fixture(t);
  writeFileSync(file,'not valid');
  await assert.rejects(invoke(policy,async()=>{}),error=>error.code==='AI_GUARD_UNAVAILABLE'&&!error.message.includes(root));
  let time=Date.parse('2026-11-16T23:59:59Z');
  writeFileSync(file,JSON.stringify({day:'2026-11-16',calls:1,tokens:10,clients:{}}));
  const limited=createAiPolicy({root,env:{...env,AI_DAILY_CALL_LIMIT:'1'},now:()=>time});
  await assert.rejects(invoke(limited,async()=>{}),{code:'AI_QUOTA_LIMIT'});
  time+=2000;await invoke(limited,async()=>{});
  assert.equal(JSON.parse(readFileSync(file)).day,'2026-11-17');
});

test('request limiter bounds new identities and recovers after the window',()=>{
  let time=0;const allowed=createRequestLimiter({now:()=>time,maximum:1});
  for(let n=0;n<12;n++)assert.equal(allowed('a','chat'),true);
  assert.equal(allowed('a','chat'),false);assert.equal(allowed('b','chat'),false);
  time=60000;assert.equal(allowed('b','chat'),true);
});

test('server denies secret files, does not disclose a configured key, and stays offline by default',async t=>{
  let calls=0;
  const server=createApp({env:{NODE_ENV:'production'},config:{key:'test-private-key-must-not-leak',model:'test'},generator:async()=>{calls++;}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}`;
  for (const path of ['/.env','/.git/config','/lib/ai.mjs','/server.mjs','/../.env','/%2e%2e%2f.env','/.runtime/ai-usage.json']) assert.equal((await fetch(base+path)).status,404,path);
  const health=await (await fetch(base+'/api/health')).text();assert.ok(!health.includes('test-private-key'));assert.equal(JSON.parse(health).configured,false);
  const reply=await (await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'武汉三镇是什么'}]})})).json();
  assert.equal(reply.meta.mode,'local');assert.equal(calls,0);assert.ok(!JSON.stringify(reply).includes('test-private-key'));
});
