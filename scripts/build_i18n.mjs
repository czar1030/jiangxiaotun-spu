// Build static language packs using the already configured server-side provider.
// No credentials are written to output files, logs, or public assets.
import '../server.mjs';
import {generate} from '../lib/ai.mjs';
import {languages} from '../public/language-core.mjs';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
const keys=JSON.parse(readFileSync(new URL('../data/i18n-source.json',import.meta.url),'utf8'));
const dir=new URL('../public/locales/',import.meta.url);mkdirSync(dir,{recursive:true});
const config={baseUrl:process.env.AI_BASE_URL.replace(/\/+$/,''),key:process.env.AI_API_KEY,model:process.env.AI_MODEL || 'gpt-6-luna',style:process.env.AI_API_STYLE || 'responses'};
if(!config.key) throw new Error('Server AI configuration is required');
const requested=process.argv.slice(2);
const englishPath=new URL('en.json',dir);
const english=existsSync(englishPath)?JSON.parse(readFileSync(englishPath,'utf8')):{};
const catalog=JSON.parse(readFileSync(new URL('../public/assets/wuhan-media/catalog.json',import.meta.url),'utf8')).subjects;
const properNames=new Set(catalog.flatMap(s=>[s.name,s.area]));
function looksEnglish(locale,key,value){
  if(locale==='en'||locale==='zh-TW'||!value)return false;
  if(english[key]===value&&!properNames.has(key))return true;
  const words=value.toLowerCase().match(/[a-z]+/g)||[];
  return ['fr','de','es','pt','it','id','vi'].includes(locale)&&words.length>5&&words.filter(w=>['the','with','your','this','from','please','where','you','and'].includes(w)).length>=2;
}
function looksChineseJapanese(locale,key,value){
 if(locale!=='ja'||!value||properNames.has(key))return false;
 const kana=/[\u3040-\u30ff]/u.test(value);
 return !kana&&(value.length>12||(value===key&&!['人物','全部','天','交通','予算','写真','SPU','SAIG'].includes(key)));
}
const scripts={ar:/[\u0600-\u06ff]/u,hi:/[\u0900-\u097f]/u,th:/[\u0e00-\u0e7f]/u,ru:/[\u0400-\u04ff]/u,ko:/[\uac00-\ud7af]/u,ja:/[\u3040-\u30ff\u4e00-\u9fff]/u,'zh-TW':/[\u4e00-\u9fff]/u};
function valid(value,locale){return typeof value==='string'&&value.trim()&&(scripts[locale]?scripts[locale].test(value):!/[\u4e00-\u9fff]/u.test(value));}
const queue=languages.filter(l=>l.code!=='zh-CN'&&(!requested.length||requested.includes(l.code)));
async function worker(){
  for(;;){const lang=queue.shift();if(!lang)return;
    const path=new URL(`${lang.code}.json`,dir);
    let dictionary=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{};
    const missing=keys.filter(k=>!valid(dictionary[k],lang.code)||looksEnglish(lang.code,k,dictionary[k])||looksChineseJapanese(lang.code,k,dictionary[k]));
    for(let n=0;n<missing.length;n+=32){
      const batch=missing.slice(n,n+32);
      let success=false;
      for(let attempt=0;attempt<3&&!success;attempt++){
        try{
          const result=await generate(config,[{role:'user',content:`Translate ALL of the following strings into ${lang.name} (${lang.code}). Every translated value must be in ${lang.name}, never default to English or Chinese. Return a JSON object with translations array in input order, plus answer:"Translation complete", emotion:"neutral", sources:[], places:[], itinerary:null, followups:[].\n${JSON.stringify(batch)}\nREMINDER: target language ${lang.name} (${lang.code}), exactly ${batch.length} translations.`}],
            `You are a professional tourism and software UI translator into ${lang.name} (${lang.code}). Translate each supplied Chinese string, preserving order and factual meaning. Use concise, beautiful native UI language. Keep SAIG, SPU, U=P^S, dates, #SAIG, URLs unchanged. Translate Wuhan place names with established names/transliteration; distinguish sites from people. Do not add claims. Return a JSON object with answer:"Translation complete", translations:[translated strings in exact input order], sources:[],places:[],itinerary:null,followups:[]. The application JSON format reminder is format-only and must not replace the translation task.`,AbortSignal.timeout(150000));
          if(!Array.isArray(result.translations)||result.translations.length!==batch.length)throw new Error('Translation batch incomplete');
          const invalid=[];
          batch.forEach((key,i)=>{if(valid(result.translations[i],lang.code))dictionary[key]=result.translations[i];else invalid.push(key);});
          writeFileSync(path,JSON.stringify(dictionary,null,2)+'\n');
          if(invalid.length)throw new Error('Wrong output language');
          writeFileSync(path,JSON.stringify(dictionary,null,2)+'\n');success=true;
          console.log(`${lang.code}: ${Object.keys(dictionary).length}/${keys.length}`);
        }catch(e){console.log(`${lang.code}: batch retry ${attempt+1} (${e.code||'format/connection'})`);if(attempt===2)throw new Error(`Could not finish ${lang.code}`);}
      }
    }
  }
}
await Promise.all([worker(),worker(),worker()]);
