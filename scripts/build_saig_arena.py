"""Prepare isolated arena rigs from the approved mascot, retaining original proportions."""
from pathlib import Path
import xml.etree.ElementTree as ET
import json
from PIL import Image
from mascot_soft_layers import namespace_ids, fragment
from saig_quarter_view import quarter_view

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/assets/saig-arena'
NS='http://www.w3.org/2000/svg'
ET.register_namespace('',NS)

def build_commander(team):
    root=ET.parse(ROOT/'public/assets/jiangxiaotun-v5/reception.svg').getroot()
    parts={n.get('data-soft'):n for n in root.iter() if n.get('data-soft')}
    skin=next(n.get('id') for n in root.iter() if (n.get('id') or '').endswith('-skin'))
    custom=fragment(f'''<g data-soft="challengeHand" fill="url(#{skin})" stroke="#a87969" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
      <path data-soft="challengeFingers" d="M-6-12Q4-16 13-13L39-15Q46-15 46-11Q46-7 39-7L19-5Q28-4 28 1Q28 6 23 7Q27 12 21 16Q23 21 17 23L4 23Q-5 22-9 13L-11 3Z"/>
      <path d="M-8 1Q-3-8 5-5L15 0Q19 4 16 7Q14 9 9 6L3 4Q2 12-5 13"/>
      <path d="M10 10L20 11M9 16L18 17" fill="none" stroke="#d3a28d"/>
    </g>''')[0]
    parts['leftPalm'].append(custom)
    for side,name in [('right','foldNearHand'),('left','foldFarHand')]:
        parts[side+'Palm'].append(fragment(f'''<g data-soft="{name}" opacity="0" fill="url(#{skin})" stroke="#a87969" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round">
          <path d="M-12-7Q-4-13 4-9L24-5Q29-4 28 0Q28 3 23 3L10 1L23 4Q28 5 27 9Q26 12 21 11L9 8L20 12Q24 14 22 17Q20 20 15 17L2 13Q-8 13-12 6Z"/>
          <path d="M-7-5Q-5-15 1-16Q6-15 5-10L3-3" fill="url(#{skin})"/><path d="M5 4L17 7M4 9L14 13" fill="none" stroke="#d4a897"/>
        </g>'''))
    band=fragment(f'''<g data-soft="armband"><rect x="-29" y="-12" width="58" height="24" rx="8" fill="{'#368dff' if team=='blue' else '#ef4d5f'}" stroke="{'#9cd9ff' if team=='blue' else '#ffc0b5'}" stroke-width="2"/><path d="M-10-4L-3 4L4-4M8-4L15 4L22-4" fill="none" stroke="#fff" stroke-width="2.5"/></g>''')[0]
    # Above the sleeve, below the head: the band follows the upper-arm tangent.
    parts['body'].insert(list(parts['body']).index(parts['head']),band)
    quarter_view(root,parts)
    namespace_ids(root,'arena-'+team+'-')
    (DEST/f'commander-{team}.svg').write_text(ET.tostring(root,encoding='unicode'),encoding='utf-8')

def prepare_echo():
    import numpy as np
    source=ROOT/'output/imagegen/saig-echo-keyed-v2.png'
    if not source.exists():return
    im=Image.open(source).convert('RGBA')
    # Preserve API alpha when provided; otherwise perform chroma extraction first.
    if im.getextrema()[3][0]==255:raise ValueError('Run chroma extraction before preparing the Echo image')
    arr=np.array(im); alpha=arr[:,:,3]
    # Remove only very faint background haze; keep anti-aliased armor edges.
    arr[:,:,3]=np.clip((alpha.astype(float)-8)*255/247,0,255).astype('uint8')
    blue=Image.fromarray(arr);blue.save(DEST/'echo-blue-v2.webp',quality=94,method=6)
    hsv=np.array(blue.convert('RGB').convert('HSV'))
    # Recolor cyan/blue emissive components, keeping white armor and gold intact.
    select=(hsv[:,:,0]>112)&(hsv[:,:,0]<178)&(hsv[:,:,1]>62)
    hsv[:,:,0][select]=np.clip((hsv[:,:,0][select].astype(float)-140)*.18+1,0,8).astype('uint8')
    red=Image.fromarray(hsv,mode='HSV').convert('RGB').convert('RGBA')
    red.putalpha(blue.getchannel('A'));red.save(DEST/'echo-red-v2.webp',quality=94,method=6)
    guard=ROOT/'output/imagegen/saig-echo-guard-alpha-v3.png'
    if guard.exists():Image.open(guard).convert('RGBA').save(DEST/'echo-red-guard-v3.webp',quality=94,method=6)
    (DEST/'provenance.json').write_text(json.dumps({
      'asset':'Echo arena fan-art variations, not official game models',
      'generation':'User-authorized Image API, bundled imagegen CLI, gpt-image-2',
      'prompt':'output/imagegen/saig-echo-prompt-v2.txt',
      'source':'output/imagegen/saig-echo-keyed-v2.png',
      'red_guard_source':'output/imagegen/saig-echo-guard-keyed-v3.png',
      'red_guard_prompt':'output/imagegen/saig-echo-guard-prompt-v3.txt',
      'processing':'Blue alpha preserved; independent red crossed-arm pose chroma extracted with bundled remove_chroma_key.py, then WebP encoded; red mirrored at display time',
      'mascot':'New coherent three-quarter head turnaround from approved v5 identity; uniformly scaled, matched closed-eye patches. Native SVG costume with side/front collar, waist and skirt planes; inward-facing feet, blue commanding and red folded arms',
      'head_source':'output/imagegen/saig-quarter-head-keyed-v5.png',
      'head_prompt':'output/imagegen/saig-quarter-head-prompt-v5.txt',
      'blink_source':'output/imagegen/saig-quarter-blink-v5.png',
      'blink_prompt':'output/imagegen/saig-quarter-blink-prompt-v5.txt'
    },ensure_ascii=False,indent=2),encoding='utf-8')

if __name__=='__main__':
    DEST.mkdir(parents=True,exist_ok=True)
    if '--legacy-rigs' in __import__('sys').argv:
        for team in ['blue','red']:build_commander(team)
    else:
        from prepare_saig_commanders import main as prepare_commanders
        prepare_commanders()
    if '--commanders-only' not in __import__('sys').argv:prepare_echo()
    print('Built coherent arena poses and available Echo variants')
