import test from 'node:test';
import assert from 'node:assert/strict';
import {generate} from '../lib/ai.mjs';

test('DeepSeek uses its token budget and non-thinking chat API without leaking credentials',async t=>{
  const original=globalThis.fetch;let request;
  globalThis.fetch=async(url,options)=>{
    request={url,...options,body:JSON.parse(options.body)};
    return new Response(JSON.stringify({choices:[{message:{content:'{"answer":"欢迎"}'},finish_reason:'stop'}]}),{headers:{'Content-Type':'application/json'}});
  };
  t.after(()=>globalThis.fetch=original);
  const result=await generate({baseUrl:'https://api.deepseek.com/v1',key:'unit-test-key',model:'deepseek-flash',style:'chat'},[{role:'user',content:'你好'}],'json',undefined,{maxOutputTokens:500});
  assert.equal(result.answer,'欢迎');assert.equal(request.url,'https://api.deepseek.com/v1/chat/completions');
  assert.equal(request.body.model,'deepseek-flash');assert.equal(request.body.max_tokens,500);assert.equal(request.body.max_completion_tokens,undefined);
  assert.deepEqual(request.body.thinking,{type:'disabled'});assert.ok(!JSON.stringify(request.body).includes('unit-test-key'));
});
