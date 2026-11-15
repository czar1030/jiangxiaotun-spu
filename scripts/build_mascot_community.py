"""Community equipment and continuous fabric layers for the approved v5 character."""
from pathlib import Path
import xml.etree.ElementTree as ET
import base64,io
from PIL import Image,ImageDraw
from mascot_soft_layers import soften_arms,namespace_ids

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/assets/jiangxiaotun-v5'
NS='http://www.w3.org/2000/svg'
ET.register_namespace('',NS)

def fragment(text):
    return ET.fromstring(f'<g xmlns="{NS}">{text}</g>')

def main():
    root=ET.fromstring((DEST/'travel.svg').read_text(encoding='utf-8'))
    parts={n.get('data-travel'):n for n in root.iter() if n.get('data-travel')}
    # Move only the existing irises down a few pixels to read the screen.
    # The face, eyelids, eye contour and hair retain their approved pixels.
    head_image=next(n for n in parts['head'] if n.tag.endswith('image'))
    head=Image.open(io.BytesIO(base64.b64decode(head_image.get('href').split(',',1)[1]))).convert('RGBA')
    focused=head.copy()
    for box in [(388,439,435,482),(510,438,558,482)]:
        bounds=tuple(value-(175 if i%2==0 else 110) for i,value in enumerate(box))
        mask=Image.new('L',head.size);ImageDraw.Draw(mask).ellipse(bounds,fill=255)
        shifted=Image.new('RGBA',head.size);shifted.alpha_composite(head,(0,3))
        # Reveal sclera at the top, then reuse the exact pupil/iris colors below.
        patch=Image.new('RGBA',head.size,'#fff9f2');patch.alpha_composite(shifted)
        focused.paste(patch,(0,0),mask)
    out=io.BytesIO();focused.save(out,format='WEBP',lossless=True,method=6)
    focus=fragment(f'''<g data-travel="focus" opacity="0"><image href="data:image/webp;base64,{base64.b64encode(out.getvalue()).decode()}" x="175" y="110" width="645" height="425"/></g>''')[0]
    parts['head'].insert(list(parts['head']).index(parts['blink']),focus)
    for key in ['bag','scarf']:
        for child in list(parts[key]):parts[key].remove(child)
    # Remove the travel bag strap; the Jingchu collar and porpoise silhouette stay.
    for parent in root.iter():
        for child in list(parent):
            if child.get('d','').startswith('M508 558L418 716'):parent.remove(child)
    root.insert(0,fragment('''<defs>
     <linearGradient id="communityMetal" x2=".8" y2="1"><stop stop-color="#eff9f5"/><stop offset=".5" stop-color="#a9cbd0"/><stop offset="1" stop-color="#709ea9"/></linearGradient>
     <linearGradient id="communityGlass" x2=".8" y2="1"><stop stop-color="#24495b"/><stop offset="1" stop-color="#0c263b"/></linearGradient>
    </defs>'''))
    parts['head'].append(fragment('''<g stroke-linejoin="round" stroke-linecap="round">
     <path d="M318 358Q329 242 470 236Q594 239 624 356" fill="none" stroke="#476876" stroke-width="18"/>
     <path d="M318 354Q339 254 470 249Q578 251 618 352" fill="none" stroke="#dbeee8" stroke-width="9"/>
     <rect x="348" y="296" width="249" height="85" rx="31" fill="url(#communityMetal)" stroke="#436679" stroke-width="3"/>
     <path d="M368 311Q471 294 577 313L578 355Q469 373 368 354Z" fill="url(#communityGlass)" stroke="#496c78" stroke-width="2"/>
     <path d="M382 320Q428 310 474 316" fill="none" stroke="#d0f6eb" stroke-width="4" opacity=".65"/>
     <path d="M524 327L539 337L524 347M547 327L562 337L547 347" fill="none" stroke="#83dfd4" stroke-width="2.5"/>
     <circle cx="389" cy="339" r="8" fill="#77d8cb"/><circle cx="389" cy="339" r="3" fill="#d6fff1"/>
     <rect x="312" y="370" width="26" height="43" rx="11" fill="url(#communityMetal)" stroke="#496d7c" stroke-width="2"/>
     <path d="M320 383V398" stroke="#72cfc8" stroke-width="4"/>
     <path d="M606 372Q619 402 608 427" fill="none" stroke="#dcece6" stroke-width="8"/>
     <circle cx="608" cy="428" r="6" fill="#7fe3d6" stroke="#436679" stroke-width="2"/>
    </g>'''))
    for side in ['right','left']:
        parts[side+'Fore'].append(fragment('''<path d="M-15 56L15 56" stroke="#b2e8dd" stroke-width="3"/>
         <rect x="-9" y="60" width="18" height="9" rx="3" fill="#214651" stroke="#97d3c9" stroke-width="1"/>
         <path d="M-4 64H4" stroke="#a0f2de" stroke-width="2"/>'''))
    laptop=fragment('''<g data-travel="laptop" opacity="0" stroke-linejoin="round">
     <g data-travel="display">
      <path d="M355 591Q355 584 362 584H555Q563 584 563 592V691H355Z" fill="url(#communityMetal)" stroke="#416477" stroke-width="3"/>
      <path d="M364 596H553V680H364Z" fill="url(#communityGlass)"/>
      <circle cx="458" cy="590" r="2" fill="#396775"/>
      <g data-travel="screenLines" fill="none" stroke-linecap="round" stroke-width="3">
       <path d="M379 610H410M379 623H398M405 623H447M391 636H429M436 636H465M391 649H414M422 649H443M379 663H429" stroke="#8edbd0"/>
       <path d="M419 610H441M450 610H465M452 623H472M443 663H465" stroke="#a9bece" opacity=".65"/>
       <path d="M487 620L496 611H519L530 620V644L519 654H496L487 644Z" stroke="#7ac8c7" stroke-width="2"/>
       <circle cx="503" cy="629" r="3" fill="#abf4e4"/><circle cx="516" cy="629" r="3" fill="#abf4e4"/>
       <path d="M503 640H516M509 604V610" stroke="#9ce4da" stroke-width="2"/>
      </g><path data-travel="screenCursor" d="M434 658V668" stroke="#d2fff1" stroke-width="3"/>
     </g>
     <path d="M354 689H562L592 716Q593 722 585 723H362Q354 723 352 718L342 701Q339 695 354 689Z" fill="url(#communityMetal)" stroke="#416477" stroke-width="3"/>
     <path d="M360 695H554L572 709H359Z" fill="#507886"/>
     <path d="M371 699H553M368 704H559M386 695L390 709M410 695L414 709M434 695L438 709M458 695L462 709M482 695L486 709M506 695L510 709M530 695L534 709" stroke="#b2d6d5" stroke-width="1.3"/>
     <path d="M433 713H484L487 719H433Z" fill="#d6e8e1" stroke="#85acb0"/>
     <path d="M366 720H419" stroke="#e7fcf2" stroke-width="2"/>
    </g>''')[0]
    body=parts['body'];body.insert(list(body).index(parts['leftForeOverlay']),laptop)
    soften_arms(root,electronics=True)
    for node in root.iter():
        if node.get('data-travel'):node.set('data-community',node.attrib.pop('data-travel'))
    # Multiple character SVGs share the page. Hidden rigs must not supply this
    # character's gradients or clipping paths through duplicate document IDs.
    namespace_ids(root,'community-')
    (DEST/'community.svg').write_text(ET.tostring(root,encoding='unicode'),encoding='utf-8')
    print('Built community.svg: forehead VR, wrist devices and supported laptop')

if __name__=='__main__':main()
