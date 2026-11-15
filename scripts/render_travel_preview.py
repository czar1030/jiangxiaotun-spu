"""Render the exact browser rig transforms at reproducible motion times."""
from pathlib import Path
import json,io,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw
import resvg_py
root=Path(__file__).resolve().parents[1]
poses=json.loads((root/'qa/travel/poses.json').read_text())
source=(root/'public/assets/jiangxiaotun-v5/travel.svg').read_text(encoding='utf-8')
board=Image.new('RGB',(1500,940),'#eeefdf')
for i,pose in enumerate(poses):
 tree=ET.fromstring(source)
 for node in tree.iter():
  for key,value in pose['attrs'].get(node.get('data-travel'),{}).items():node.set(key,value)
 image=Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=ET.tostring(tree,encoding='unicode'),width=300,height=420)))
 image.save(root/f"qa/travel/pose-{pose['seconds']}.png")
 x=i%5*300;y=i//5*470
 board.paste(image,(x,y+30),image)
 ImageDraw.Draw(board).text((x+12,y+10),f"{pose['seconds']}s",fill='#304f43')
board.save(root/'qa/travel/poseboard.jpg')
print('Rendered 10 travel poses')
