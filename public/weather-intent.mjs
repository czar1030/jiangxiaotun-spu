// Descriptions and hypothetical requests drive scenery, never a live forecast.
export function weatherIntent(text) {
  const patterns=[
    ['clear',/(?:放晴|晴天|雨停了|雪停了|不下雨|不下雪|没下雨|没下雪|晴れ|맑은|sunny|clear skies|stopped (?:raining|snowing)|no (?:rain|snow)|not (?:raining|snowing)|pas de (?:neige|pluie)|kein(?:en)? (?:schnee|regen)|sin (?:nieve|lluvia)|sem (?:neve|chuva))/giu],
    ['snow',/(?:下雪|雪天|大雪|小雪|降雪|雪が|눈이|눈 오는|\bsnow(?:s|y|ing|fall)?\b|\bneige\b|\b(?:schnee|schneit)\b|\bniev[ae]\b|\bnev[ea]\b|снег|ثلج|बर्फ|\bsalju\b|หิมะ|tuyết)/giu],
    ['rain',/(?:下雨|雨天|大雨|小雨|降雨|雨が|비가|비 오는|\brain(?:s|y|ing)?\b|\bpluie\b|\bregen\b|\blluvia\b|\bpioggia\b|\bchuva\b|дожд|مطر|बारिश|\bhujan\b|ฝน|mưa)/giu]
  ];
  const hits=patterns.flatMap(([kind,pattern])=>[...String(text).matchAll(pattern)].map(m=>({kind,index:m.index,length:m[0].length})));
  const clears=hits.filter(h=>h.kind==='clear');
  return hits.filter(h=>h.kind==='clear'||!clears.some(c=>h.index>=c.index&&h.index<c.index+c.length)).sort((a,b)=>b.index-a.index)[0]?.kind||null;
}
export function describedWeather(messages=[]) {
  return messages.filter(m=>m.role==='user').map(m=>weatherIntent(m.content)).filter(Boolean).at(-1)||null;
}
