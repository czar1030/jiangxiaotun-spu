from pathlib import Path
import json, re
root=Path(__file__).resolve().parents[1]
en=json.loads((root/'public/locales/en.json').read_text(encoding='utf-8'))
scripts={'ar':r'[\u0600-\u06ff]','ja':r'[\u3040-\u30ff\u4e00-\u9fff]','ko':r'[\uac00-\ud7af]','hi':r'[\u0900-\u097f]','th':r'[\u0e00-\u0e7f]','ru':r'[\u0400-\u04ff]','zh-TW':r'[\u4e00-\u9fff]'}
keys=json.loads((root/'data/i18n-source.json').read_text(encoding='utf-8'))
for p in (root/'public/locales').glob('*.json'):
    d=json.loads(p.read_text(encoding='utf-8'))
    same=[k for k in keys if len(k)>5 and en.get(k)==d.get(k)] if p.stem!='en' else []
    bad=[k for k in keys if not d.get(k) or (p.stem in scripts and not re.search(scripts[p.stem],d[k]))]
    print(p.stem,'missing/wrong script:',len(bad),'English duplicates:',len(same))
    if same: print('Examples:',same[:12])
    print('Sample:',[d.get(k) for k in ['认识武汉','旅行规划','资料直答','发送消息']])
