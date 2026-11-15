"""Prepare the generated miniature head without changing the established mascot."""
from pathlib import Path
import hashlib,json
from PIL import Image

root=Path(__file__).resolve().parents[1]
source=root/'output/imagegen/planner-peeker-keyed-v1.png'
im=Image.open(source).convert('RGBA')
assert im.getchannel('A').getextrema()[0]==0
im=im.crop(im.getchannel('A').getbbox())
im.thumbnail((376,376),Image.Resampling.LANCZOS)
canvas=Image.new('RGBA',(384,384))
canvas.alpha_composite(im,((384-im.width)//2,(384-im.height)//2))
dest=root/'public/assets/jiangxiaotun-v5/planner-peeker-v1.webp'
canvas.save(dest,lossless=True,method=6)
metadata={'mode':'User-authorized imagegen fallback CLI / gpt-image-2',
 'source':source.relative_to(root).as_posix(),'prompt':'output/imagegen/planner-peeker-prompt-v1.txt',
 'reference':'public/assets/jiangxiaotun-v5/avatar.png','asset':dest.relative_to(root).as_posix(),
 'size':[384,384],'processing':'Preserved generated alpha; cropped transparent margins and uniformly resized',
 'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
(root/'output/imagegen/planner-peeker-provenance-v1.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
print(dest)
