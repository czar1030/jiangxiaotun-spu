import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
path=root/'public/index.html'
s=path.read_text(encoding='utf-8')
for css in ['brand-symbol','chu-seal','footer-seal']:
    import re
    s=re.sub(f'class="{css}"(?: data-no-i18n)*',f'class="{css}" data-no-i18n',s)
path.write_text(s,encoding='utf-8')
path=root/'public/app.js';s=path.read_text(encoding='utf-8')
s=s.replace("'AI 接待 · ' + escape(result.meta.model)","escape(t('AI 接待')) + ' · ' + escape(result.meta.model)")
s=s.replace('alt="江小豚 · ${expressions[emotion].label}"','alt="${escape(t(\'江小豚\'))} · ${escape(t(expressions[emotion].label))}"')
path.write_text(s,encoding='utf-8')
path=root/'public/locales/en.json';pack=json.loads(path.read_text(encoding='utf-8'))
pack.update({
 '武汉 · 数命 SPU':'Wuhan · Shuming SPU',
 '数命 SPU 城市 AI 接待员 · SAIG 2026':'Shuming SPU City AI Concierge · SAIG 2026',
 '江湖有知音 · 此城有新意':'Two rivers. A thousand stories.',
 '江小豚 · 随时为你接待':'Jiang Xiaotun · Here for you',
 '东湖吹笛景区（马鞍山森林公园）':'East Lake Chuidi Scenic Area (Ma’anshan Forest Park)',
 '预算默认不含住宿及往返武汉交通；需要包含时请在备注说明。':'Budget is in CNY per person, excluding hotels and travel to/from Wuhan. Add a note if you want these included.',
 '资料直答':'Offline reference',
 '资料直答 · 本地资料':'Offline reference · Local sources',
 '一个人，':'One creator,',
 '也能创造更多。':'a world of possibilities.',
 '荆楚':'Jingchu',
 '江小豚':'Jiang Xiaotun'
})
for key,value in pack.items():
    pack[key]=value.replace('Suming','Shuming').replace('Fate SPU','Shuming SPU')
path.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Refined branding, English copy and decorative seals.')
