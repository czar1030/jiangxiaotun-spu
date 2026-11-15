"""Replace the small jade engraving without rebuilding character or motion layers."""
from pathlib import Path
import copy,hashlib,io,json,subprocess,xml.etree.ElementTree as ET
from PIL import Image
import resvg_py
from mascot_couture import BODICE

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/assets/jiangxiaotun-v5'
QA=ROOT/'qa/yellow-crane-pendant'
NS='http://www.w3.org/2000/svg'
ET.register_namespace('',NS)
OLD='M521 695H530M521 686L526 682L531 687M521 687L526 690L531 687M524 690V694M528 690V694'

def main():
 QA.mkdir(parents=True,exist_ok=True)
 fragment=ET.fromstring(f'<g xmlns="{NS}">{BODICE}</g>')
 motif=next(n for n in fragment.iter() if n.get('data-paint')=='yellow-crane-pendant')
 report={}
 for scene,attr in [('reception','data-soft'),('travel','data-travel'),('community','data-community')]:
  path=DEST/f'{scene}.svg';root=ET.fromstring(path.read_text(encoding='utf-8'))
  images=lambda tree:[hashlib.sha256(n.get('href','').encode()).hexdigest() for n in tree.iter() if n.tag.endswith('image')]
  before=images(root)
  anchors=[n.get(attr) for n in root.iter() if n.get(attr)]
  matches=[(parent,node) for parent in root.iter() for node in parent if node.get('d')==OLD or node.get('data-paint')=='yellow-crane-pendant']
  assert len(matches)==1,(scene,len(matches))
  backup=QA/f'{scene}-before.svg'
  if not backup.exists():backup.write_bytes(path.read_bytes())
  parent,old=matches[0];parent.insert(list(parent).index(old),copy.deepcopy(motif));parent.remove(old)
  assert before==images(root)
  assert anchors==[n.get(attr) for n in root.iter() if n.get(attr)]
  path.write_text(ET.tostring(root,encoding='unicode'),encoding='utf-8')
  report[scene]={'head_and_prop_images_preserved':True,'animation_anchors_preserved':True,'miniature_tower_roofs':5}
  if scene=='reception':
   attrs=json.loads(subprocess.run(['node',str(ROOT/'scripts/mascot_rest_attributes.mjs')],cwd=ROOT,capture_output=True,text=True,check=True).stdout)
   for n in root.iter():
    for k,v in attrs.get(n.get(attr),{}).items():n.set(k,v)
   svg=ET.tostring(root,encoding='unicode')
   im=Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=svg,width=645,height=850)))
   im.save(DEST/'reception-rest.webp',lossless=True,method=6)
   im.save(QA/'character.png')
   root.set('viewBox','508 668 35 75');root.set('width','280');root.set('height','600')
   png=resvg_py.svg_to_bytes(svg_string=ET.tostring(root,encoding='unicode'),width=280,height=600,background='#e6ebdf')
   (QA/'pendant-detail.png').write_bytes(png)
 (QA/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()
