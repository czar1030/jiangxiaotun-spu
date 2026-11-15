"""Upgrade only the garment layers of existing rigs, preserving their painted heads.

Unlike rebuilding travel.svg, this also preserves any subsequent face and prop
corrections in the shipped assets. The shared build source remains reproducible.
"""
from pathlib import Path
import copy, hashlib, json, io, subprocess
import xml.etree.ElementTree as ET
from PIL import Image
import resvg_py
import mascot_couture as couture
from mascot_soft_layers import namespace_ids

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/assets/jiangxiaotun-v5'
QA=ROOT/'qa/mascot-couture-v2'
NS='http://www.w3.org/2000/svg'
ET.register_namespace('',NS)

def fragment(markup):return ET.fromstring(f'<g xmlns="{NS}">{markup}</g>')
def heads(root,attr):
    node=next(n for n in root.iter() if n.get(attr)=='head')
    return [hashlib.sha256(n.get('href','').encode()).hexdigest() for n in node.iter() if n.tag.endswith('image')]

def main():
    QA.mkdir(parents=True,exist_ok=True)
    report={}
    for scene,attribute in [('travel','data-travel'),('reception','data-soft'),('community','data-community')]:
        path=DEST/f'{scene}.svg'
        root=ET.fromstring(path.read_text(encoding='utf-8'))
        before=heads(root,attribute)
        backup=QA/f'{scene}-before.svg'
        if not backup.exists():backup.write_bytes(path.read_bytes())
        prefix=next(n.get('id') for n in root.iter() if n.get('id','').endswith('coutureJade')).removesuffix('coutureJade')
        garment=fragment(couture.MATERIALS+couture.skirt()+couture.BODICE)
        namespace_ids(garment,prefix)
        # Core symbols live outside the material fragment and already have
        # scene namespaces, so resolve those references explicitly as well.
        for n in garment.iter():
            if n.get('data-travel'):
                n.set(attribute,n.attrib.pop('data-travel'))
            for key,val in list(n.attrib.items()):
                for name in ['wave','phoenix','crane']:
                    val=val.replace(f'url(#{name})',f'url(#{prefix}{name})')
                    if val==f'#{name}':val=f'#{prefix}{name}'
                n.set(key,val)
        materials=garment[0]
        new_ids={n.get('id') for n in materials.iter() if n.get('id')}
        for parent in root.iter():
            for child in list(parent):
                if child.get('id') in new_ids:parent.remove(child)
        root.insert(0,materials)
        for group in list(garment)[1:]:
            paint=group.get('data-paint')
            old=next(n for n in root.iter() if n.get('data-paint')==paint)
            for parent in root.iter():
                if old in list(parent):
                    parent.insert(list(parent).index(old),group);parent.remove(old);break
        parts={n.get(attribute):n for n in root.iter() if n.get(attribute)}
        gold=f'url(#{prefix}coutureGold)'
        for side in ['right','left']:
            soft=parts[side+'Soft'];front=parts[side+'ForeOverlay']
            defs=[(soft,'Embroidery',{'fill':'none','stroke':gold,'stroke-width':'.85','opacity':'.8','stroke-linecap':'round','stroke-linejoin':'round'},None),
                  (front,'FrontEmbroidery',{'fill':'none','stroke':gold,'stroke-width':'.85','opacity':'.8','stroke-linecap':'round','stroke-linejoin':'round'},'Cuff'),
                  (front,'CuffShade',{'fill':'#69755c','opacity':'.22'},'CuffTrim'),
                  (front,'CuffFold',{'fill':'none','stroke':'#b8a780','stroke-width':'.9','opacity':'.7'},'CuffTrim')]
            for parent,name,attrs,anchor in defs:
                if side+name in parts:continue
                node=ET.Element(f'{{{NS}}}path',{attribute:side+name,**attrs})
                if anchor:parent.insert(list(parent).index(parts[side+anchor]),node)
                else:parent.append(node)
        for n in root.iter():
            if n.get('id','').endswith('softJade'):
                for stop,color in zip(n,['#8eaa86','#4e8a70','#296e5a','#154c41','#0e332f']):stop.set('stop-color',color)
        after=heads(root,attribute)
        assert before==after, f'{scene}: head artwork changed'
        ids=[n.get('id') for n in root.iter() if n.get('id')]
        assert len(ids)==len(set(ids)),f'{scene}: duplicate paint definition'
        path.write_text(ET.tostring(root,encoding='unicode'),encoding='utf-8')
        report[scene]={'head_images_preserved':len(before),'paint_ids_unique':True}
        if scene=='reception':
            attrs=json.loads(subprocess.run(['node',str(ROOT/'scripts/mascot_rest_attributes.mjs')],cwd=ROOT,capture_output=True,text=True,check=True).stdout)
            for node in root.iter():
                for key,value in attrs.get(node.get(attribute),{}).items():node.set(key,value)
            im=Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=ET.tostring(root,encoding='unicode'),width=645,height=850)))
            im.save(DEST/'reception-rest.webp',lossless=True,method=6)
    (QA/'asset-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()
