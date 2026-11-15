"""Prepare the generated Echo cutout and its foreground contact hand."""
from pathlib import Path
import argparse,hashlib,json
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--version',choices=['v2','v3'],default='v2')
version=parser.parse_args().version
SOURCE = ROOT / f'output/imagegen/echo-community-alpha-{version}.png'
DEST = ROOT / 'public/assets/community-echo'
DEST.mkdir(parents=True, exist_ok=True)
image = Image.open(SOURCE).convert('RGBA')
assert image.size == (1024,1536)
alpha = image.getchannel('A')
assert alpha.getextrema()[0] == 0, 'The delivered image must retain its real alpha'
assert alpha.getbbox(), 'Empty character'
# Split at the wrist on a calm, solid section of the armor. The hand sits in
# front of Jiangxiaotun; the elbow and body remain behind her head and sleeve.
mask = Image.new('L',image.size)
ImageDraw.Draw(mask).polygon([(659,723),(870,694),(890,841),(705,850)],fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(1.2))
touch = image.copy()
touch.putalpha(ImageChops.multiply(alpha,mask))
body = image.copy()
body.putalpha(ImageChops.multiply(alpha,ImageChops.invert(mask)))
body.save(DEST/f'echo-body-{version}.webp',quality=94,method=6)
touch.save(DEST/f'echo-hand-{version}.webp',lossless=True,method=6)
metadata = {
 'character':'Echo / 回声, Overwatch, Blizzard Entertainment',
 'kind':f'AI-generated {"realistic" if version=="v2" else "soft anime cel-shaded"} fan-art cutout; not an official game render',
 'model':'gpt-image-2',
 'workflow':'Imagegen skill fallback CLI, reference-guided image edit',
 'prompt':f'output/imagegen/echo-community-prompt-{version}.txt',
 'source':SOURCE.relative_to(ROOT).as_posix(),
 'size':list(image.size),
 'contactPixel':[740,770],
 'layers':{'body':f'echo-body-{version}.webp','foregroundHand':f'echo-hand-{version}.webp'},
 'references':['user attachment cf4097d6-c2cc-4e1c-983a-8ecc61939014',
               'user attachment 32cdeec8-45e8-4528-ab4f-b88c4a3b4c46',
               'user attachment bf91bb8b-ca69-4be2-a1d5-508555722300'],
 'styleReference':'user attachment dd41e1ac-77b3-42a2-bea6-80e16ca4ee20' if version=='v3' else None,
 'sha256':{name:hashlib.sha256((DEST/filename).read_bytes()).hexdigest() for name,filename in [('body',f'echo-body-{version}.webp'),('foregroundHand',f'echo-hand-{version}.webp')]}
}
(DEST/('provenance.json' if version=='v2' else f'provenance-{version}.json')).write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Prepared Echo {version} body and shoulder-contact hand with preserved alpha')
