import {routeSelections} from './reference-routes.mjs';
import {transitPreferences, resolveTransitLocation, metroRoute} from '../public/travel-transit.mjs';

// Offline range recommendations remain useful without pretending to be a
// model-generated daily itinerary or selecting the range's upper endpoint.
export function rangeReference(messages, range, context, subjects=[]) {
  const all = messages.filter(message => message.role === 'user').map(message => message.content).join('；');
  const preferences = transitPreferences(messages);
  const excluded = ['黄鹤楼', '东湖', '江汉路', '汉口江滩', '湖北省博物馆', '武汉科技馆'].filter(name =>
    new RegExp('(?:不去|取消|不要去|不想去)' + name + '|' + name + '(?:取消|不去)').test(all));
  const selection=routeSelections(messages,subjects);
  const selectedNames=subjects.filter(s=>selection.include.has(s.id)).map(s=>s.name);
  const excludedNames=subjects.filter(s=>selection.exclude.has(s.id)).map(s=>s.name);
  const allowed = name => !excludedNames.some(n=>name===n)&&(!excluded.some(exclusion=>name.includes(exclusion))||selectedNames.includes(name));
  const used = context.filter(chunk => ['travel', 'wuhan'].includes(chunk.topic)).slice(0, 4);
  const citation = used[0] ? '[' + used[0].id + ']' : '';
  const groups = [
    ...subjects.filter(s=>selection.include.has(s.id)).map(s=>({title:'旅行清单 · '+(s.area||'兴趣备选'),names:[s.name],detail:'这是你主动选中的地点，先按所在片区留出半日；与其他组合择一或替换，不把所有清单地点硬塞进短行程。'})),
    {title: '汉口老街与江风', names: ['江汉路步行街', '江汉关博物馆', '汉口江滩'], detail: '把老街、文博和江边短程散步组合起来，中间留足用餐与坐下休息时间。'},
    {title: '武昌文博与湖景', names: ['湖北省博物馆', '东湖听涛景区', '黄鹤楼'], detail: '选感兴趣的展区或一小段湖岸；少走路时不安排环湖，登楼可换成周边观景。'},
    ...(/亲子|科普|孩子|小孩/.test(all) ? [{title: '科普体验备选', names: ['武汉科技馆'], detail: '按兴趣选择科普展区，开放、预约和适龄规则需核实；喜欢科普不代表一定有儿童同行。'}] : []),
    ...(range.max >= 5 ? [{title: '时间充裕再拓展汉阳', names: ['晴川阁', '古琴台', '武汉美术馆（琴台馆）'], detail: '晴川与琴台分成两段半日组合，户外与美术馆按天气、体力取舍，避免一天反复跨江。'}] : []),
    ...(range.max >= 6 ? [
      {title:'汉口艺术与城市记忆',names:['武汉美术馆','宋庆龄汉口旧居纪念馆','武汉博物馆'],detail:'江汉路周边的艺术与近代历史可组合一日，汉口站一带的武汉博物馆另留半日，不必连着赶场。'},
      {title:'首义与工业历史',names:['辛亥革命博物院（北区·红楼）','辛亥革命博物院（南区）','张之洞与武汉博物馆'],detail:'首义两馆安排在武昌同一天，工业历史另留给汉阳；每天先选一至两处，中间完整午休。'}
    ]:[]),
    ...(range.max >= 11 ? [{title:'兴趣深入与科普备选',names:['湖北省科学技术馆','盘龙城遗址博物院'],detail:'两处分别留出半日或一日，先确认预约、距离和兴趣；盘龙城不与光谷安排在同一天，额外时间用于深读与休整。'}]:[])
  ].map(group => ({...group, names: group.names.filter(name=>allowed(name)&&(!preferences.rain||/博物|科技馆|科学技术馆|美术馆|纪念馆/.test(name))),
    ...(preferences.rain?{detail:preferences.snow?'雪天以室内参观为主，减少户外接驳，保暖并留足休息；开放与预约须核实。':'雨天以室内参观为主，缩短户外步行，开放与预约须核实。'}:{})})).filter(group => group.names.length);
  const nearby = preferences.lodging;
  const budget = [...all.matchAll(/(?:预算|每人|人均)[^\d；;\n]{0,15}(\d{2,6})\s*元?/gu)].at(-1)?.[1];
  const short = range.max <= 5 ? '时间较短时，优先选汉口一组；有2–3天可再加文博或湖景，接近4–5天再扩展其他片区。这里是可选组合，不要求把所有地方都走完。' :
    '在这个范围的较短端，先挑老街、文博与江湖风景等核心体验；多出来的时间用于同片区慢游、兴趣场馆、美食与休息，不需要每天增加远处的新景点。';
  const routes = [];
  if (nearby) for (const name of groups.flatMap(group => group.names)) {
    const destination = resolveTransitLocation(name);
    const route = destination && metroRoute(nearby.station, destination.station);
    if (!route) continue;
    routes.push('- **' + name + '**：' + (route.legs.length ? route.legs.map(leg => leg.line + '号线 ' + leg.from + '→' + leg.to + '（' + leg.direction + '方向）').join('，换乘 ') :
      '同站片区，可按体力选择短距离步行或地面接驳') + '。');
    if (routes.length >= 4) break;
  }
  const ferry = preferences.noFerry || preferences.rain ? '' : '\n天气和运营合适时，可选一次**' +
    (nearby?.bank === 'wuchang' ? '中华路码头→武汉关码头' : '武汉关码头→中华路码头') +
    '**普通轮渡，两端仍需步行或短途接驳；轮渡可替代一次跨江交通，不必与同段地铁重复乘坐。';
  const answer = '**先看看' + range.min + '–' + range.max + '天可以怎样玩武汉。** 不用现在就确定具体天数。\n\n' + short + '\n\n' +
    groups.map(group => '**' + group.title + '**\n' + group.names.join('、') + '。' + group.detail).join('\n\n') + citation +
    (preferences.snow?'\n\n**雪天慢游**\n优先室内、就近用餐与休息，不为了看雪安排江边或登高；降雪、路况和运营需出发前核实。':'') +
    '\n\n**本地美食**\n住宿附近过早可选热干面、三鲜豆皮等，游览途中就近用餐，不为吃一顿饭跨江赶路；具体配料、口味与过敏原向店家核实。' +
    '\n\n**住宿周边与交通**\n' + (preferences.lodgingText ? '你提供的住宿区域是**' + preferences.lodgingText + '**。' : '住宿地点尚未确定，可先按汉口、武昌或汉阳片区选择相邻地点，减少跨江。') +
    (nearby ? '以**' + nearby.station + '站**作区域参考，酒店门口到车站和出口需按实际地址确认。\n' : '街区内短程步行为主，跨片区优先地铁，疲劳时可选短程网约车。\n') + routes.join('\n') + ferry +
    '\n\n**预算与出行提醒**\n' + (budget ? '已记住你提到的' + budget + '元预算，保留原先的人均/全员口径及不含项目。' : '') +
    '具体天数未定，先按景点门票、市内交通和每日餐饮考虑取舍，不承诺尚未核算的全程金额。带长辈或希望少走路时，每次只挑2–3个相邻游览点并安排午休。' +
    '以上为本地资料参考与静态站序，不是实时导航；营业、门票、预约、站外步行和轮渡运营须出行前核实。' +
    '\n\n如果方便，可以再告诉我实际玩几天，我能进一步为你细化更合适的武汉安排；暂时不确定也可以先按上面的方向选择。';
  return {answer, itinerary: null, emotion: 'happy', used,
    places: groups.flatMap(group => group.names.map(name => ({id: 'other', name, area: group.title, description: group.detail,
      sourceId: used.find(chunk => chunk.text?.includes(name))?.id || ''}))).slice(0, 8),
    followups: ['请先推荐住宿附近适合轻松游玩的地方', '请比较这些片区的地铁和轮渡出行方式', '我想补充具体天数，请帮我细化行程']};
}
