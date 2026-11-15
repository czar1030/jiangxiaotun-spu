"""Render actual community controller transforms for visual review."""
from pathlib import Path
import json,io,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw
import resvg_py
root=Path(__file__).resolve().parents[1]
poses=json.loads((root/'qa/community/poses.json').read_text())
source=(root/'public/assets/jiangxiaotun-v5/community.svg').read_text(encoding='utf-8')
board=Image.new('RGB',(1500,940),'#274553')
for i,pose in enumerate(poses):
 tree=ET.fromstring(source)
 for node in tree.iter():
  for key,value in pose['attrs'].get(node.get('data-community'),{}).items():node.set(key,value)
 image=Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=ET.tostring(tree,encoding='unicode'),width=300,height=420)))
 image.save(root/f"qa/community/pose-{pose['seconds']}.png")
 x=i%5*300;y=i//5*470
 board.paste(image,(x,y+30),image)
 ImageDraw.Draw(board).text((x+12,y+10),f"{pose['seconds']}s",fill='#d6eee3')
board.save(root/'qa/community/poseboard.jpg')
print('Rendered 10 community poses')
