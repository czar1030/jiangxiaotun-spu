"""Travel acting layers, keeping the approved head and porpoise silhouette."""
from pathlib import Path
import io
from PIL import Image, ImageChops
import build_mascot_v5 as art
from build_mascot_greeting import picture, smile
from build_mascot_idle import mood_head
from mascot_soft_layers import soften_arms,namespace_ids
import mascot_couture as couture

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/jiangxiaotun-v5'

def main():
    master = Image.new('RGBA', (1024, 1024))
    master.alpha_composite(Image.open(DEST/'welcome.png').convert('RGBA'), (175, 110))
    head = master.crop((175,110,820,535))
    blink = Image.open(DEST/'blink.png').convert('RGBA').crop((0,0,645,425))
    # Old y=820 crops retained the hem: it became a floating stripe on tiptoe.
    feet = master.crop((380,834,572,960))
    ear_mask=art.draw(art.fin_ears(),master.size).crop((175,110,820,535)).getchannel('A')
    hair=couture.polish_hair(art.draw(art.HAIR_FRONT,master.size),art.draw).crop((175,110,820,535))
    ahoge=head.crop((0,0,645,104))
    def clean_head(image):
        result=image.copy()
        result.putalpha(ImageChops.subtract(result.getchannel('A'),ear_mask))
        result.alpha_composite(hair)
        result.paste((0,0,0,0),(0,0,645,104))
        return result
    # Keep the large, approved happy eyes in the welcoming pose.
    import xml.etree.ElementTree as ET
    source=ET.fromstring((DEST/'greeting.svg').read_text(encoding='utf-8'))
    happy=next(node for node in source.iter() if node.get('data-rig')=='happyHead')
    happy_image=next(node for node in happy.iter() if node.tag.endswith('image'))
    happy_href=happy_image.get('href')
    def arm(side):
        mirror='1' if side=='right' else '-1'
        x=398 if side=='right' else 542
        return f'''<g transform="translate({x} 556) scale({mirror} 1)"><g data-travel="{side}Upper">
          <path d="M-18-8Q0-21 19-7L18 80Q0 99-18 81Z" fill="url(#ivory)" stroke="#8d9278" stroke-width="2.5"/>
          <path d="M-10 5L-10 64" fill="none" stroke="#fff9df" stroke-width="4"/>
          <g transform="translate(0 82)"><g data-travel="{side}Fore">
          <path d="M-18-8Q0-15 18-8L16 73Q0 89-16 73Z" fill="url(#jade)" stroke="#344c61" stroke-width="2.4"/>
          <path d="M-16 59L16 59L16 74Q0 85-16 74Z" fill="url(#ivory)" stroke="#a88f6c" stroke-width="2"/>
          <path d="M-13 64L13 64" stroke="#d8ba80" stroke-width="2"/><path d="M-12 3Q-2 8 11 2M-11 14Q-5 17 2 14M-9 54L1 51" fill="none" stroke="#416b65" stroke-opacity=".6" stroke-width="1.4"/>
          <g transform="translate(0 83)"><g data-travel="{side}Hand"><path d="M-12-5Q-15 4-12 17Q-9 25-4 24Q2 29 7 23Q14 24 15 16L14 3Q22 3 21-4Q18-9 11-7L8-12L-7-13Z" fill="url(#skin)" stroke="#a87969" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M-6 12L-5 21M1 13L2 22M8 12L8 20" stroke="#cd9e89" fill="none"/>
          </g></g></g></g></g></g>'''
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="175 110 645 850" aria-hidden="true" focusable="false">
      <metadata>江小豚 · 旅行装与可动道具。Approved v5 head; see adjacent CREDITS.md.</metadata>
      {art.core.DEFS}{art.HAIR_DEFS}{couture.MATERIALS}
      <defs><linearGradient id="mapPaper" x2="0" y2="1"><stop stop-color="#fff9df"/><stop offset="1" stop-color="#e5d4a2"/></linearGradient></defs>
      <g data-travel="feet"><g fill="url(#skin)" stroke="#b79781" stroke-width="1.6"><path data-travel="leftLeg" d="M397 791L456 791L460 864L394 864Z"/><path data-travel="rightLeg" d="M491 791L551 791L557 864L489 864Z"/></g><g data-travel="leftFoot">{picture(feet.crop((0,0,95,126)),380,834)}</g><g data-travel="rightFoot">{picture(feet.crop((95,0,192,126)),475,834)}</g></g>
      <g data-travel="body">
      <g data-travel="tail">{art.PORPOISE_TAIL}</g>
      {couture.skirt()}
      {arm('right')}{arm('left')}
      {couture.BODICE}
      <g stroke="#8d9278" stroke-width="2" stroke-linejoin="round">
       <path d="M508 558L418 716" fill="none" stroke="#765e49" stroke-width="11"/>
       <path d="M508 558L418 716" fill="none" stroke="#d0ad71" stroke-width="5"/>
       <g data-travel="bag"><rect x="391" y="700" width="76" height="66" rx="16" fill="url(#coutureLeather)" stroke="#785e42"/>
       <path d="M392 711Q429 739 466 711" fill="url(#coutureLeather)" stroke="#785e42"/>
       <path d="M397 711Q430 736 461 711M398 738V750Q398 759 407 759H452Q460 759 460 751V738" fill="none" stroke="#ecd6a5" stroke-width=".9" stroke-dasharray="1.2 2.4"/>
       <circle cx="430" cy="733" r="5" fill="url(#coutureGold)" stroke="#8e703f" stroke-width="1"/><circle cx="429" cy="731" r="1.7" fill="#fff6d4" stroke="none"/></g>
       <g data-travel="scarf"><path d="M488 583Q506 592 514 615L493 640L484 611L469 596" fill="#75a69a" stroke="#416c62"/></g>
      </g>
      <g data-travel="head" transform="rotate(0 474 528)">
        <g data-travel="leftEar">{art.LEFT_EAR}</g><g data-travel="rightEar"><g transform="translate(948 0) scale(-1 1)">{art.LEFT_EAR}</g></g>
        {picture(clean_head(head),175,110)}
        <g data-travel="smile" opacity="0">{picture(clean_head(smile(head)),175,110)}</g>
        <g data-travel="happy" opacity="0"><image href="{happy_href}" x="148" y="109" width="711" height="850"/></g>
        <g data-travel="blink" opacity="0">{picture(clean_head(blink),175,110)}</g>
        <g data-travel="bored" opacity="0">{picture(clean_head(mood_head(master)),175,110)}</g>
        <g data-travel="sleepy" opacity="0">{picture(clean_head(mood_head(master,True)),175,110)}</g>
        <g data-travel="ahoge">{picture(ahoge,175,110)}</g>
      </g>
      <g data-travel="rightForeOverlay"><path d="M-18-8Q0-15 18-8L16 73Q0 89-16 73Z" fill="url(#jade)" stroke="#344c61" stroke-width="2.4"/><path d="M-16 59L16 59L16 74Q0 85-16 74Z" fill="url(#ivory)" stroke="#a88f6c" stroke-width="2"/><path d="M-13 64L13 64" stroke="#d8ba80" stroke-width="2"/><path d="M-12 3Q-2 8 11 2M-11 14Q-5 17 2 14M-9 54L1 51" fill="none" stroke="#416b65" stroke-opacity=".6" stroke-width="1.4"/></g>
      <g data-travel="leftForeOverlay"><path d="M-18-8Q0-15 18-8L16 73Q0 89-16 73Z" fill="url(#jade)" stroke="#344c61" stroke-width="2.4"/><path d="M-16 59L16 59L16 74Q0 85-16 74Z" fill="url(#ivory)" stroke="#a88f6c" stroke-width="2"/><path d="M-13 64L13 64" stroke="#d8ba80" stroke-width="2"/><path d="M-12 3Q-2 8 11 2M-11 14Q-5 17 2 14M-9 54L1 51" fill="none" stroke="#416b65" stroke-opacity=".6" stroke-width="1.4"/></g>
      <g data-travel="map" opacity="0"><g transform="translate(-89 -50)" stroke-linejoin="round">
       <path d="M0 6L59 0L119 12L178 5L178 99L119 107L59 95L0 102Z" fill="url(#mapPaper)" stroke="#9b8964" stroke-width="2.5"/>
       <path d="M59 0L59 95M119 12L119 107" stroke="#c5b687" stroke-width="2"/>
       <path d="M24 0Q70 48 100 50T169 104" fill="none" stroke="#9cbdb4" stroke-width="16" opacity=".7"/>
       <path d="M8 71L38 71L75 35L132 35L160 19M29 17L29 43L89 83L165 83" stroke="#bca16a" stroke-width="3" fill="none"/>
       <path d="M21 84L52 64L99 70L144 38" stroke="#497c6d" stroke-width="3" fill="none" stroke-dasharray="4 4"/>
       <g fill="#f4ebcf" stroke="#527c6e" stroke-width="2"><circle cx="52" cy="64" r="5"/><circle cx="144" cy="38" r="5"/></g>
       <path d="M99 51C83 51 82 70 99 81C116 70 115 51 99 51Z" fill="#ae6e4e"/><circle cx="99" cy="62" r="4" fill="#fff2cd"/>
      </g></g>
      <g data-travel="glass" opacity="0"><path d="M-5 2L-8 44Q0 52 8 44L5 2" fill="#a18a5d" stroke="#665c46" stroke-width="2.5"/>
       <circle cy="-28" r="29" fill="#d5e9df" fill-opacity=".65" stroke="#b99f64" stroke-width="7"/><circle cy="-28" r="24" fill="none" stroke="#527d72" stroke-width="2"/>
       <path d="M-15-36Q-10-47 3-46" stroke="#fffce7" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <g data-travel="scope" opacity="0"><g data-travel="scopeBarrel">
       <path d="M-85-17L72-10L72 10L-85 17Z" fill="url(#coutureBrass)" stroke="#665b42" stroke-width="3"/>
       <path d="M-66-16L-14-14L-14 14L-66 16Z" fill="#50766a" stroke="#3e6056" stroke-width="2"/>
       <path d="M-63-11L-18-10" stroke="#a9c3a3" stroke-width="3"/>
       <rect x="-92" y="-23" width="20" height="46" rx="6" fill="url(#coutureBrass)" stroke="#665b42" stroke-width="3"/>
       <ellipse cx="-92" rx="7" ry="19" fill="#9ebdb6" stroke="#476c63" stroke-width="3"/>
       <rect x="57" y="-12" width="22" height="24" rx="4" fill="#496b61" stroke="#314f49" stroke-width="2"/>
       <path d="M-52 18Q-32 73 15 57" stroke="#8b7050" stroke-width="3" fill="none"/>
      </g></g>
      {''.join(f'''<g data-travel="{side}Palm" stroke="#a87969" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
       <g data-travel="{side}Open"><path d="M-9-7Q-13 0-11 10L-17 6Q-23 4-21 10L-12 21L-8 32Q-6 37-3 33L-3 23L0 38Q3 42 5 37L5 23L10 34Q14 38 15 33L11 19L17 26Q22 29 21 23L15 6Q12-5 6-8Z" fill="url(#skin)"/><path d="M-6 9Q0 6 7 11M-5 18Q1 15 8 18" fill="none" stroke="#d2a393"/></g>
       <g data-travel="{side}Grip" opacity="0"><path d="M-11-8Q-15 0-12 15L-7 23Q1 29 11 22L15 13L13-5L6-11Z" fill="url(#skin)"/>
        <g data-travel="{side}Fingers">
        <g data-travel="{side}Index"><path d="M-8 2Q-3-2 2 2L11 5Q16 8 12 12L1 10Q-5 12-8 8Z" fill="url(#skin)"/><path d="M3 3L2 8" stroke="#dbb29c"/></g>
        <g data-travel="{side}Middle"><path d="M-9 9Q-4 5 2 9L12 11Q16 15 12 18L1 16Q-6 18-9 14Z" fill="url(#skin)"/><path d="M4 10L3 15" stroke="#dbb29c"/></g>
        <g data-travel="{side}Ring"><path d="M-7 17Q-3 13 2 16L9 18Q13 22 8 24L0 22Q-5 24-7 20Z" fill="url(#skin)"/><path d="M3 17L2 21" stroke="#dbb29c"/></g>
        </g>
        <g data-travel="{side}Thumb"><path d="M-11-2Q-22-3-21 4Q-19 10-7 11L0 8Q3 4-2 2Z" fill="url(#skin)"/><path d="M-15 1L-10 4" stroke="#fff0dc" stroke-width="2"/></g>
       </g></g>''' for side in ['right','left'])}
      </g>
    </svg>'''
    tree=ET.fromstring(svg)
    soften_arms(tree)
    namespace_ids(tree,'travel-')
    (DEST/'travel.svg').write_text(ET.tostring(tree,encoding='unicode'),encoding='utf-8')
    print('Built travel.svg with continuous sleeves; use preview_travel.mjs for acting poses.')

if __name__=='__main__':main()
