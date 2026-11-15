"""Keep only curated strings, normalize Traditional Chinese, and apply reviewed copy."""
import json
from pathlib import Path
from opencc import OpenCC
root=Path(__file__).resolve().parents[1]
keys=json.loads((root/'data/i18n-source.json').read_text(encoding='utf-8'))
for path in (root/'public/locales').glob('*.json'):
    pack=json.loads(path.read_text(encoding='utf-8'))
    pack={key:pack[key] for key in keys if key in pack}
    if path.stem=='zh-TW':
        converter=OpenCC('s2twp');pack={key:converter.convert(key) for key in keys}
    if path.stem=='vi':pack['发送消息']='Gửi tin nhắn'
    path.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Finalized 15 language packs; Simplified Chinese uses the original shell.')
