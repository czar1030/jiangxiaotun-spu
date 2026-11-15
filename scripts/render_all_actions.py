"""Render production animation exports, preserving their real timing."""
from pathlib import Path
import io,json,sys,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw
import resvg_py
ROOT=Path(__file__).resolve().parents[1]
QA=ROOT/'qa/all-actions'
BG='#e6ebdf'
board_only='--board-only' in sys.argv
names=['greeting','welcome','listening','map','telescope','laptop','sleepy','chin-rest']
excerpt='--excerpt' in sys.argv
if excerpt:
 pos=sys.argv.index('--excerpt');names=[sys.argv[pos+1]]
 start,end=map(float,sys.argv[pos+2:pos+4])
board=Image.new('RGB',(1440,len(names)*345),BG)
for row,name in enumerate(names):
 data=json.loads((QA/f'{name}.json').read_text())
 tree=ET.fromstring((ROOT/f"public/assets/jiangxiaotun-v5/{data['asset']}.svg").read_text(encoding='utf-8'))
 nodes={n.get('data-'+data['selector']):n for n in tree.iter() if n.get('data-'+data['selector'])}
 marks={round(t*data['rate']):i for i,t in enumerate(data['marks'])}
 frames=[]
 for i,attrs in enumerate(data['frames']):
  if excerpt and not start<=i/data['rate']<end:continue
  for layer,values in attrs.items():
   for k,v in values.items():nodes[layer].set(k,v)
  if (board_only or name=='listening') and i not in marks:continue
  png=resvg_py.svg_to_bytes(svg_string=ET.tostring(tree,encoding='unicode'),width=240,height=316)
  rgba=Image.open(io.BytesIO(png)).convert('RGBA')
  img=Image.new('RGB',(240,345),BG);img.paste(rgba,(0,22),rgba)
  ImageDraw.Draw(img).text((12,7),f'{name} / {i/data["rate"]:.2f}s',fill='#234e48')
  if i in marks:board.paste(img,(marks[i]*240,row*345))
  if not board_only and name!='listening':frames.append(img)
 if frames:
  filename=name+('-excerpt' if excerpt else '')
  frames[0].save(QA/f'{filename}.webp',save_all=True,append_images=frames[1:],duration=50,loop=0,quality=85,method=3)
  # Export compact, complete clips for review; no accelerated time or morphs.
  if name in ['greeting','telescope','laptop','sleepy']:
   frames[0].save(QA/f'{filename}.gif',save_all=True,append_images=frames[1:],duration=50,loop=0,disposal=2)
 if not excerpt:board.save(QA/('contact-sheet.jpg' if board_only else 'all-actions-board.jpg'),quality=92)
 print(f'Rendered {name}',flush=True)
