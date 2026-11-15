"""Soft reception character for Wuhan and SAIG, without travel/VR equipment."""
from pathlib import Path
import xml.etree.ElementTree as ET
import io,json,subprocess
from PIL import Image
import resvg_py
from mascot_soft_layers import namespace_ids

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/assets/jiangxiaotun-v5'
ET.register_namespace('','http://www.w3.org/2000/svg')

def main():
    root=ET.fromstring((DEST/'travel.svg').read_text(encoding='utf-8'))
    parts={n.get('data-travel'):n for n in root.iter() if n.get('data-travel')}
    for key in ['bag','scarf','map','glass','scopeBarrel']:
        for child in list(parts[key]):parts[key].remove(child)
    for parent in root.iter():
        for child in list(parent):
            if child.get('d','').startswith('M508 558L418 716'):parent.remove(child)
    for node in root.iter():
        if node.get('data-travel'):node.set('data-soft',node.attrib.pop('data-travel'))
    namespace_ids(root,'reception-')
    (DEST/'reception.svg').write_text(ET.tostring(root,encoding='unicode'),encoding='utf-8')
    attributes=json.loads(subprocess.run(['node',str(ROOT/'scripts/mascot_rest_attributes.mjs')],cwd=ROOT,capture_output=True,text=True,check=True).stdout)
    for node in root.iter():
        for key,value in attributes.get(node.get('data-soft'),{}).items():node.set(key,value)
    image=Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=ET.tostring(root,encoding='unicode'),width=645,height=850)))
    image.save(DEST/'reception-rest.webp',lossless=True,method=6)
    print('Built reception.svg: soft Jingchu character for Wuhan and SAIG')

if __name__=='__main__':main()
