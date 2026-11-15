"""Articulated chin-rest and sleepy expressions, using the approved v5 layers.

No approved pose is rebuilt. All limbs keep shoulder/elbow/wrist pivots;
the bored hand is a small curled palm, not the open greeting hand.
"""
from pathlib import Path
import io
import xml.etree.ElementTree as ET
from PIL import Image
import resvg_py
import build_mascot_v5 as art
from build_mascot_greeting import picture, RIGHT_ARM

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/assets/jiangxiaotun-v5'
QA=ROOT/'qa/idle';QA.mkdir(parents=True,exist_ok=True)

FIST='''<g stroke="#a87969" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
 <path d="M-10-7Q0-9 9-4L11 9Q15 10 15 16L13 26Q10 32 3 32L-7 31Q-14 30-15 24L-15 12Q-14 6-10 5Z" fill="url(#skin)"/>
 <path d="M-11 22Q-7 18-3 22M-4 23Q0 19 4 23M4 23Q8 20 11 23M-12 12Q-4 10-1 16Q1 21-4 22L-10 22" fill="none" stroke="#d2a393" stroke-width="1"/>
 <path d="M-6 7Q0 5 5 8" fill="none" stroke="#fff5e8" stroke-width="2" opacity=".8"/>
 </g>'''

def mood_head(master,closed=False):
    result=master.copy()
    blink=Image.open(DEST/'blink.png').convert('RGBA')
    if closed:
        result.alpha_composite(blink,(175,110))
    else:
        # The actual approved iris/eyelash pixels are lowered into relaxed lids.
        # A closed-eye base cleans the old upper lashes before the lowered lid.
        for box in [(355,430,447,489),(499,429,591,489)]:
            x1,y1,x2,y2=box
            result.paste(blink.crop((x1-175,y1-110,x2-175,y2-110)),(x1,y1))
            eye=master.crop(box).resize((x2-x1,32),Image.Resampling.LANCZOS)
            result.paste(eye,(x1,451))
        # Hair is restored over the eye-patch edges, in its master coordinates.
        result.alpha_composite(art.draw(art.HAIR_FRONT,master.size))
        result.alpha_composite(art.draw('<use href="#crane" transform="translate(664 380) rotate(-10)"/>',master.size))
    for y in range(498,512):
        for x in range(456,482):result.putpixel((x,y),master.getpixel((452,y)))
    result.alpha_composite(art.draw('<path d="M461 506Q468 504 475 506" fill="none" stroke="#b77570" stroke-width="1.7" stroke-linecap="round"/>',master.size))
    return result.crop((175,110,820,535))

def main():
    master=Image.new('RGBA',(1024,1024));master.alpha_composite(Image.open(DEST/'welcome.png').convert('RGBA'),(175,110))
    head=master.crop((175,110,820,535));bored=mood_head(master);sleepy=mood_head(master,True)
    lower=master.crop((380,820,572,960))
    left_arm=art.draw(art.SLEEVES,master.size).crop((500,535,650,710))
    hand=art.masked(art.source_master(),'M604 672Q618 676 628 688L632 699L621 704L615 696L611 704L603 701L593 684Z').crop((500,535,650,710));left_arm.alpha_composite(hand)
    body=art.draw(art.COSTUME,master.size).crop((270,525,670,827))
    start=RIGHT_ARM.index('      <g stroke="#a87969"')
    end=RIGHT_ARM.index('    </g></g>',start)
    arm=RIGHT_ARM[:start]+FIST+RIGHT_ARM[end:]
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="175 110 645 850" width="645" height="850" aria-hidden="true" focusable="false">
    <metadata>江小豚 v5 idle acting: chin-rest, relaxed lids, sleepy blink. Same provenance and CC BY-NC-SA 4.0 as adjacent CREDITS.md.</metadata>
    {art.core.DEFS}{art.HAIR_DEFS}
    {picture(lower,380,820)}
    <g transform="translate(470 814)"><g data-rig="body"><g transform="translate(-470 -814)">
      <g transform="translate(603 795)"><g data-rig="tail"><g transform="translate(-603 -795)">{art.PORPOISE_TAIL}</g></g></g>
      {picture(left_arm,500,535)}{picture(body,270,525)}
      <path d="M436 526Q470 537 504 526L512 546L470 567L428 546Z" fill="url(#ivory)"/>
      <g transform="translate(474 528)"><g data-rig="head"><g transform="translate(-474 -528)">
        {picture(head,175,110)}<g data-rig="bored" opacity="0">{picture(bored,175,110)}</g>
        <g data-rig="blink" opacity="0">{picture(sleepy,175,110)}</g>
      </g></g></g>
      {arm}
    </g></g></g></svg>'''
    (DEST/'idle.svg').write_text(svg,encoding='utf-8')
    poses=[('rest',0,0,0,0,0,0),('lift',6,105,-6,-3,0,0),('bored',10,170,-10,-7,1,0),('sleepy',10,170,-10,-8,1,1)]
    frames=[]
    for name,shoulder,elbow,wrist,head_tilt,mood,blink in poses:
        tree=ET.fromstring(svg)
        for node in tree.iter():
            rig=node.get('data-rig')
            if rig in ['shoulder','elbow','wrist','head']:node.set('transform',f'rotate({dict(shoulder=shoulder,elbow=elbow,wrist=wrist,head=head_tilt)[rig]})')
            if rig=='bored':node.set('opacity',str(mood))
            if rig=='blink':node.set('opacity',str(blink))
        data=resvg_py.svg_to_bytes(svg_string=ET.tostring(tree,encoding='unicode'),skip_system_fonts=True)
        image=Image.open(io.BytesIO(data)).convert('RGBA');image.save(QA/(name+'.png'));frames.append(image)
    board=Image.new('RGB',(1120,420),'#315e50')
    for i,im in enumerate(frames):
        im=im.copy();im.thumbnail((280,390));board.paste(im,(i*280+(280-im.width)//2,10),im)
    board.save(QA/'poses.jpg',quality=95)
    print('Built idle.svg and qa/idle/poses.jpg; approved static poses unchanged.')

if __name__=='__main__':main()
