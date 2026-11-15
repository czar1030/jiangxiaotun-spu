const digits={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
export function requestedDayRange(text) {
 const match=[...String(text).matchAll(/([1-9]\d?|[一二两三四五六七八九十]{1,3})\s*[-–—~～至到]\s*([1-9]\d?|[一二两三四五六七八九十]{1,3})\s*(?:天|日|days?\b|jours?\b|Tage[n]?\b|d[ií]as?\b|giorni\b|일)/giu)].at(-1);
 if(!match)return null;
 const min=requestedDays(match[1]+'天'),max=requestedDays(match[2]+'天');
 return min&&max&&min<=max?{min,max}:null;
}

export function requestedDays(text){
 // A duration range is a preference, not confirmation of its upper endpoint.
 if(/具体天数尚未确定/.test(text.split('；').at(-1)))return null;
 text=text.replace(/[\d一二两三四五六七八九十]+\s*[-–—~～至到]\s*[\d一二两三四五六七八九十]+\s*[天日]/gu,'');
 const matches=[...text.matchAll(/(?<![第\d一二两三四五六七八九十])([1-9]\d{0,2}|[一二两三四五六七八九十]{1,3})\s*[天日]/gu)];
 const raw=matches.at(-1)?.[1];
 if(!raw)return /半天/.test(text)?1:null;
 let value=Number(raw);
 if(!value){
  const [tens,ones]=raw.split('十');
  value=raw.includes('十')?(digits[tens]||1)*10+(digits[ones]||0):digits[raw];
 }
 return value?Math.min(30,Math.max(1,value)):null;
}
