"""Render the real rig attributes from preview_couture.mjs for visual review."""
from pathlib import Path
import io
import json
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw
import resvg_py

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT/'qa/mascot-couture'
poses = json.loads((QA/'poses.json').read_text())
board = Image.new('RGB', (1500, 1410), '#eef0e4')
labels = ImageDraw.Draw(board)
three = Image.new('RGB', (1050, 480), '#eef0e4')
for i, pose in enumerate(poses):
    tree = ET.fromstring((ROOT/f'public/assets/jiangxiaotun-v5/{pose["scene"]}.svg').read_text(encoding='utf-8'))
    for node in tree.iter():
        for key, value in pose['attrs'].get(node.get('data-'+pose['attribute']), {}).items():
            node.set(key, value)
    png = resvg_py.svg_to_bytes(svg_string=ET.tostring(tree, encoding='unicode'), width=300, height=420)
    image = Image.open(io.BytesIO(png))
    image.save(QA/f'{pose["scene"]}-{pose["name"]}.png')
    x, y = i % 5*300, i//5*470
    board.paste(image, (x, y+30), image)
    labels.text((x+12, y+10), pose['scene']+' / '+pose['name'], fill='#304f43')
    if pose['name'] == 'normal':
        three.paste(image, (25+(i//5)*350, 30), image)
board.save(QA/'gesture-board.jpg', quality=95)
three.save(QA/'three-scenes.png')
print('Rendered the three scene designs and 15 gesture poses')
