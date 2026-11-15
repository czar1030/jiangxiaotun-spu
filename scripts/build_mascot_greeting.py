"""Build an articulated greeting from the approved v5 character layers.

The face, eyes, hair and costume retain the approved master coordinates.
Only the mouth expression and an open greeting hand are new drawings.
Run this script separately; it never rebuilds or replaces the original poses.
"""
from pathlib import Path
import base64
import io
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageChops
import build_mascot_v5 as art

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/jiangxiaotun-v5'
QA = ROOT / 'qa/greeting'
QA.mkdir(parents=True, exist_ok=True)


def embedded(im):
    out = io.BytesIO()
    im.save(out, format='WEBP', lossless=True, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(out.getvalue()).decode('ascii')


def picture(im, x, y, **attrs):
    extra = ' '.join(f'{k}="{v}"' for k, v in attrs.items())
    return f'<image x="{x}" y="{y}" width="{im.width}" height="{im.height}" href="{embedded(im)}" {extra}/>'


def smile(im):
    # A tiny mouth-only patch; all eye contours and face outlines are retained.
    im = im.copy()
    for y in range(390, 400):
        for x in range(285, 306):
            im.putpixel((x, y), im.getpixel((280, y)))
    mouth = art.draw('''<path d="M458 503Q468 514 479 502Q475 518 467 516Q461 513 458 503Z" fill="#c96b69" stroke="#ad6761" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M462 512Q468 508 474 512Q470 516 467 515Z" fill="#f4b1a0" stroke="none"/>
      <path d="M459 503Q469 506 477 503" fill="none" stroke="#fff3e9" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="398" cy="493" rx="16" ry="5" fill="#efaaa0" opacity=".13"/>
      <ellipse cx="548" cy="493" rx="16" ry="5" fill="#efaaa0" opacity=".13"/>''', (1024, 1024))
    im.alpha_composite(mouth.crop((175, 110, 820, 535)))
    return im


# Shoulder, elbow and wrist each have their own pivot. The forearm overlaps
# the upper sleeve at the elbow, and the palm overlaps the cuff at the wrist.
RIGHT_ARM = '''<g transform="translate(398 554)"><g data-rig="shoulder">
  <g transform="translate(-398 -554)" stroke="#344c61" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <path d="M407 540Q386 540 376 563L345 607Q350 624 374 628L417 584L422 565Z" fill="url(#jade)"/>
    <path d="M390 560Q381 586 363 605" fill="none" stroke="#8ac1af" stroke-width="3" opacity=".65"/>
  </g>
  <g transform="translate(-40 59)"><g data-rig="elbow"><g transform="translate(-358 -613)">
    <g stroke="#344c61" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M345 599Q359 601 376 617L347 678Q333 688 313 671L326 646Z" fill="url(#jade)"/>
      <path d="M350 618L333 653" fill="none" stroke="#8ac1af" stroke-width="2.4" opacity=".6"/>
    </g>
    <g transform="translate(327 676)"><g data-rig="wrist">
      <g stroke="#a87969" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-10-7Q0-8 9-4L10 7Q15 6 18 10Q20 14 15 16L10 16L9 29Q8 34 4 33L2 36Q-2 38-5 34Q-10 36-12 31Q-16 31-16 26L-17 17Q-16 8-11 5Z" fill="url(#skin)"/>
        <path d="M-10 21L-10 29M-4 22L-4 32M2 22L2 32M10 16Q6 15 4 19" fill="none" stroke="#cf9f8d" stroke-width="1"/>
        <path d="M-7 9Q-1 6 5 10" fill="none" stroke="#fff5e8" stroke-width="2" opacity=".8"/>
      </g>
    </g></g>
    <g stroke="#a88f6c" stroke-width="1.8" stroke-linejoin="round">
      <path d="M322 653L353 674L343 691Q323 686 313 672Z" fill="url(#ivory)"/>
      <path d="M322 658L348 678" fill="none" stroke="#d8ba80" stroke-width="2"/>
    </g>
  </g></g></g>
</g></g>'''


def main():
    master = Image.new('RGBA', (1024, 1024))
    master.alpha_composite(Image.open(DEST/'welcome.png').convert('RGBA'), (175, 110))
    head = master.crop((175, 110, 820, 535))
    blink = Image.open(DEST/'blink.png').convert('RGBA').crop((0, 0, 645, 425))
    blink = smile(blink)
    lower = master.crop((380, 820, 572, 960))
    resting_arm = art.draw(art.SLEEVES, master.size).crop((500, 535, 650, 710))
    hand = art.masked(art.source_master(), 'M604 672Q618 676 628 688L632 699L621 704L615 696L611 704L603 701L593 684Z').crop((500, 535, 650, 710))
    resting_arm.alpha_composite(hand)
    body = art.draw(art.COSTUME, master.size).crop((270, 525, 670, 827))
    # Preserve the approved happy expression and open-handed welcome, rather than
    # trying to approximate it with the tiny mouth patch used for a hover wave.
    happy = Image.open(DEST/'happy.png').convert('RGBA')
    head_shapes = art.HAIR_BACK+art.fin_ears(8,-8)+f'<path d="{art.FACE_PATH}" fill="white"/>'+art.HAIR_FRONT+'<use href="#crane" transform="translate(664 380) rotate(-10)"/>'
    head_mask = art.draw(art.core.transform(head_shapes,.52,.51,-6,-5),(512,512)).crop((65,38,445,492)).getchannel('A')
    happy_head = happy.copy()
    happy_head.putalpha(ImageChops.multiply(happy.getchannel('A'),head_mask))
    happy_lower = happy.crop((0, 304, 380, 454))
    happy_torso = art.draw(art.core.transform(art.COSTUME,.54,.52,-18,-7),(512,512)).crop((65,38,445,492))
    happy_right = happy.crop((48, 234, 154, 304))
    happy_left = happy.crop((199, 234, 294, 304))
    # Same fit and centre as showing the original happy portrait in this frame.
    happy_scale = 850/454
    happy_x = 175+(645-380*happy_scale)/2
    welcoming = f'''<g data-rig="welcome" opacity="0"><g transform="translate({happy_x} 110) scale({happy_scale})">
      {picture(happy_lower,0,304)}
      <g transform="translate(139 239)"><g data-rig="happyRight"><g transform="translate(-139 -239)">{picture(happy_right,48,234)}</g></g></g>
      <g transform="translate(206 239)"><g data-rig="happyLeft"><g transform="translate(-206 -239)">{picture(happy_left,199,234)}</g></g></g>
      <path d="M149 220Q174 230 198 220L204 238Q174 252 145 238Z" fill="url(#ivory)"/>
      {picture(happy_torso,0,0)}
      <g transform="translate(174 232)"><g data-rig="happyHead"><g transform="translate(-174 -232)">{picture(happy_head,0,0)}</g></g></g>
    </g></g>'''
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="175 110 645 850" width="645" height="850" aria-hidden="true" focusable="false">
      <metadata>江小豚 v5 articulated greeting; adapted layers under CC BY-NC-SA 4.0; see adjacent CREDITS.md.</metadata>
      {art.core.DEFS}{art.HAIR_DEFS}
      <g data-rig="waveLegs" opacity="1">{picture(lower, 380, 820)}</g>
      <g transform="translate(470 814)"><g data-rig="body"><g transform="translate(-470 -814)">
        <g data-rig="wave" opacity="1">
        <g transform="translate(603 795)"><g data-rig="tail"><g transform="translate(-603 -795)">{art.PORPOISE_TAIL}</g></g></g>
        {RIGHT_ARM}
        {picture(resting_arm, 500, 535)}
        {picture(body, 270, 525)}
        <path d="M436 526Q470 537 504 526L512 546L470 567L428 546Z" fill="url(#ivory)"/>
        <g transform="translate(474 528)"><g data-rig="head"><g transform="translate(-474 -528)">
          {picture(head,175,110)}
          <g data-rig="smile" opacity="0">{picture(smile(head),175,110)}</g>
          <g data-rig="blink" opacity="0">{picture(blink,175,110)}</g>
        </g></g></g>
        </g>
        {welcoming}
      </g></g></g>
    </svg>'''
    (DEST/'greeting.svg').write_text(svg, encoding='utf8')
    # Sample key poses in the exact same rig that the browser animates.
    import resvg_py
    poses = [('rest',0,0,0,0), ('lift',28,38,30,-2), ('wave',49,72,60,-4.8), ('wave-other',35,57,40,-2.8), ('welcome',0,0,0,0)]
    images=[]
    for name, shoulder, elbow, wrist, tilt in poses:
        root=ET.fromstring(svg)
        for el in root.iter():
            part=el.get('data-rig')
            if part in ['shoulder','elbow','wrist','head']:
                el.set('transform',f"rotate({dict(shoulder=shoulder,elbow=elbow,wrist=wrist,head=tilt)[part]})")
            if part=='smile':el.set('opacity','0' if name=='rest' else '1')
            if name=='welcome':
                if part in ['wave','waveLegs']:el.set('opacity','0')
                if part=='welcome':el.set('opacity','1')
                if part=='happyRight':el.set('transform','rotate(7)')
                if part=='happyLeft':el.set('transform','rotate(-6)')
                if part=='happyHead':el.set('transform','rotate(-3)')
        data=resvg_py.svg_to_bytes(svg_string=ET.tostring(root,encoding='unicode'),skip_system_fonts=True)
        im=Image.open(io.BytesIO(data)).convert('RGBA');im.save(QA/(name+'.png'));images.append(im)
    board=Image.new('RGB',(1400,420),'#315e50')
    for i,im in enumerate(images):
        im.thumbnail((280,385));board.paste(im,(i*280+(280-im.width)//2,10),im)
    board.save(QA/'poses.jpg',quality=94)
    print('Built articulated greeting.svg; reference poses in qa/greeting.')


if __name__ == '__main__':
    main()
