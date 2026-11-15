from pathlib import Path
import json,io,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw
import resvg_py
root=Path(__file__).resolve().parents[1]
poses=json.loads((root/'qa/sleepy/poses.json').read_text())
board=Image.new('RGB',(2400,1080),'#274553')
for i,pose in enumerate(poses):
 tree=ET.fromstring((root/f"public/assets/jiangxiaotun-v5/{pose['file']}.svg").read_text(encoding='utf-8'))
 for node in tree.iter():
  for key,value in pose['attrs'].get(node.get('data-'+pose['selector']),{}).items():node.set(key,value)
 im=Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=ET.tostring(tree,encoding='unicode'),width=240,height=325)))
 x=i%10*240;y=i//10*360
 board.paste(im,(x,y+25),im)
 ImageDraw.Draw(board).text((x+8,y+7),f"{pose['file']} {pose['seconds']}s",fill='#d6eee3')
 if pose['seconds']==4.2:im.save(root/f"qa/sleepy/{pose['file']}-rub.png")
board.save(root/'qa/sleepy/poseboard.jpg')
print('Rendered 30 sleepy poses across all rigs')
