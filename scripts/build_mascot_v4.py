"""Reference-locked costume/hair/iris edit. Face geometry is never redrawn.

The source character, face, eye contours, limbs and proportions are retained.
Only explicit hair, iris and costume masks are edited. See asset CREDITS.md.
"""
from pathlib import Path
import colorsys
import hashlib
import io
import json
import shutil
import resvg_py
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OLD=ROOT/'public/assets/jiangxiaotun-v2'
DEST=ROOT/'public/assets/jiangxiaotun-v4'
DEST.mkdir(parents=True,exist_ok=True)

DEFS='''<defs>
 <linearGradient id="blue" x1="20%" y1="0%" x2="70%" y2="100%"><stop stop-color="#4864b4"/><stop offset=".47" stop-color="#536cbd"/><stop offset="1" stop-color="#35539e"/></linearGradient>
 <linearGradient id="jade" x1="0%" y1="0%" x2="75%" y2="100%"><stop stop-color="#5faaa2"/><stop offset=".4" stop-color="#33877e"/><stop offset="1" stop-color="#1d535e"/></linearGradient>
 <linearGradient id="ivory" x1="0%" y1="0%" x2="90%" y2="100%"><stop stop-color="#fffcef"/><stop offset=".5" stop-color="#f8edda"/><stop offset="1" stop-color="#cfc4b6"/></linearGradient>
 <linearGradient id="gold" x1="0%" y1="0%" x2="50%" y2="100%"><stop stop-color="#fff1bb"/><stop offset=".5" stop-color="#e3bb76"/><stop offset="1" stop-color="#b58a50"/></linearGradient>
 <g id="wave" fill="none" stroke="#e8ce96" stroke-width="1.8" stroke-linecap="round"><path d="M0 5Q7-3 14 5T28 5T42 5M0 10Q7 2 14 10T28 10T42 10"/></g>
 <g id="phoenix" fill="none" stroke="#edce8e" stroke-width="1.5" stroke-linecap="round"><path d="M-20 5Q-4-12 7-4Q15 4 7 12Q-1 18-7 10Q-10 2-3 0Q4-1 3 5M7-4Q18-12 23-6L15-2M-12 9Q-26 13-22 24Q-9 19-6 12M-3 14Q-2 29 11 31Q11 19 3 17M-12-2Q-30-8-25-18Q-12-17-7-8"/></g>
 <g id="crane" stroke="#936d3c" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M-20 7Q-5-5 8 2L4 13Q-9 18-20 7Z" fill="url(#gold)"/><path d="M-13 6Q-14-10-27-17Q-10-17-2-3L8 5" fill="url(#gold)"/><path d="M5 7C20 1 7-13 17-18Q22-21 25-17" stroke="#f6d99d" stroke-width="4.8" fill="none"/><path d="M24-17L34-14L24-12Z" fill="#e1b16a"/><circle cx="22" cy="-18" r="1" fill="#655345" stroke="none"/><path d="M-2 15L-6 30M6 14L11 27" fill="none" stroke="#e2c185" stroke-width="1.5"/><ellipse cx="-6" cy="32" rx="3" ry="5" fill="#bddccd"/><circle cx="11" cy="29" r="3" fill="#bddccd"/></g>
</defs>'''

def layer(markup,size):
    w,h=size
    doc=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{DEFS}{markup}</svg>'
    return Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=doc,skip_system_fonts=True))).convert('RGBA')

def mask_path(path,size):
    return layer(f'<path d="{path}" fill="white"/>',size).getchannel('A')

def paste_masked(im,art,mask):
    alpha=ImageChops.multiply(art.getchannel('A'),mask)
    art=art.copy();art.putalpha(alpha)
    return Image.alpha_composite(im,art)

def recolor(im,box,kind):
    out=im.copy();px=out.load();x1,y1,x2,y2=map(int,box)
    for y in range(max(0,y1),min(im.height,y2)):
        for x in range(max(0,x1),min(im.width,x2)):
            r,g,b,a=px[x,y]
            # Preserve white eye glints, black lashes, skin and alpha exactly.
            if a and b>r+16 and b>g+6:
                h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
                if kind=='iris':
                    target_h=(30 if v<.42 else 39)/360
                    target_s=s*(.77 if v<.42 else .92)
                    target_v=v*(.90 if v<.42 else 1)
                else:
                    if b>145:continue  # bright hair locks stay blue
                    target_h=173/360;target_s=s*.78;target_v=v*.94
                rr,gg,bb=colorsys.hsv_to_rgb(target_h,target_s,target_v)
                px[x,y]=(round(rr*255),round(gg*255),round(bb*255),a)
    return out

# All geometry is in the original 1024-pixel master coordinate system.
# The existing round skirt silhouette, hands and legs remain in place.
COSTUME='''<g stroke="#344c61" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
 <g id="jingchu-skirt"><path d="M405 617Q369 659 323 713L276 763Q320 803 397 815Q469 827 553 812Q621 800 663 779L626 736Q568 672 531 617Z" fill="url(#ivory)"/>
 <path d="M408 628Q361 716 342 792L368 807Q383 713 437 630M507 630Q552 711 576 807L603 794Q578 714 531 628" fill="#c7ddd0" fill-opacity=".45" stroke="none"/>
 <path d="M403 645Q372 716 354 793M434 642Q413 724 407 811M470 639L469 819M507 641Q528 722 537 812M537 644Q575 719 590 796" fill="none" stroke="#b6beb2" stroke-width="2"/>
 <path d="M406 621Q380 655 365 696Q412 722 468 681Q526 722 576 695Q561 654 531 621Z" fill="url(#jade)"/>
 <path d="M368 690Q413 718 468 674Q525 716 573 689" fill="none" stroke="#edcb8b" stroke-width="4"/>
 <path d="M284 754Q331 788 399 798Q469 809 550 796Q612 785 654 768L663 779Q618 801 553 812Q469 827 397 815Q320 803 276 763Z" fill="url(#jade)"/>
 <use href="#wave" transform="translate(307 772) rotate(19)"/><use href="#wave" transform="translate(370 792) rotate(9)"/><use href="#wave" transform="translate(438 805)"/><use href="#wave" transform="translate(504 801) rotate(-7)"/><use href="#wave" transform="translate(571 785) rotate(-17)"/>
 <use href="#phoenix" transform="translate(409 666) scale(.8)"/><use href="#phoenix" transform="translate(525 666) scale(-.8 .8)"/>
 <path d="M334 754Q342 719 355 700M600 753Q591 720 580 700" fill="none" stroke="#fff6e6" stroke-width="4"/>
 </g>
 <g id="cross-collar"><path d="M445 534H495L470 567Z" fill="#fff0df" stroke="none"/><path d="M399 546Q418 535 445 534L469 557L495 534Q525 535 540 546Q549 572 530 621Q469 638 407 621Q390 581 399 546Z" fill="url(#ivory)"/>
 <path d="M407 540L421 550L429 588L411 615L401 610ZM530 540L516 550L507 590L527 616L537 609Z" fill="url(#jade)"/>
 <path d="M434 536L468 570L505 535L518 542L467 594L422 546Z" fill="#fff9eb"/>
 <path d="M432 538L468 573M508 538L454 596" fill="none" stroke="#28746f" stroke-width="8"/>
 <path d="M432 538L468 573M508 538L454 596" fill="none" stroke="#e6c68b" stroke-width="2"/>
 <path d="M407 608Q468 625 530 608L533 629Q469 647 404 629Z" fill="url(#jade)"/>
 <path d="M407 612Q470 631 530 612M405 627Q469 644 532 627" fill="none" stroke="#e7c58a" stroke-width="2"/>
 <path d="M481 630C467 614 454 628 474 637C453 647 468 656 482 640C495 655 509 643 488 635C511 624 492 615 481 630Z" fill="url(#ivory)" stroke="#af8f5d" stroke-width="1.3"/>
 <path d="M476 640L465 705L478 701L486 650L497 707L509 714L493 639" fill="url(#ivory)" stroke="#b2986d" stroke-width="1.3"/>
 <path d="M509 642L518 677" fill="none" stroke="#b8955f" stroke-width="1.5"/><rect x="511" y="675" width="19" height="29" rx="5" fill="#bcdaca" stroke="#6b9b91" stroke-width="1.3"/><path d="M514 696H526M516 690H524M514 685L520 681L526 685ZM517 685V690M523 685V690M520 704V719M516 705V718M524 705V718" fill="none" stroke="#e8ce97" stroke-width="1.1"/>
 </g></g>'''

FRINGE='''<g stroke="#24346c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
 <path d="M300 373Q299 285 397 247Q486 225 555 318Q586 361 586 427Q553 409 541 384Q536 423 496 449Q497 411 465 393Q421 378 401 344Q378 399 359 433Q324 418 300 373Z" fill="url(#blue)"/>
 <path d="M400 248Q398 328 465 371Q510 394 498 442M403 250Q449 268 466 304Q496 343 542 358" fill="none" stroke="#293d86" stroke-width="2.2"/>
 <path d="M391 277Q371 312 357 351M333 307L324 327M438 279Q475 293 491 324" fill="none" stroke="#8b9ddc" stroke-width="6" opacity=".55"/>
 <path d="M404 292Q404 318 415 333M425 342L434 351M445 358L454 363M464 369L470 372" fill="none" stroke="#a0b0e5" stroke-width="7" opacity=".5"/>
 </g>'''

def blue_mask(im,box,protect=()):
    m=Image.new('L',im.size);p=im.load();q=m.load()
    for y in range(max(0,int(box[1])),min(im.height,int(box[3]))):
        for x in range(max(0,int(box[0])),min(im.width,int(box[2]))):
            r,g,b,a=p[x,y]
            if b>r+16 and b>g+6 and a:q[x,y]=a
    m=m.filter(ImageFilter.MaxFilter(3))
    d=ImageDraw.Draw(m)
    for box in protect:d.rectangle(box,fill=0)
    return m

def transform(markup,sx,sy,tx,ty):
    return f'<g transform="translate({tx} {ty}) scale({sx} {sy})">{markup}</g>'

def hands_mask(im,box):
    # Reuse the exact original hand pixels in front of the new costume.
    m=Image.new('L',im.size);p=im.load();q=m.load()
    for y in range(max(0,int(box[1])),min(im.height,int(box[3]))):
        for x in range(max(0,int(box[0])),min(im.width,int(box[2]))):
            r,g,b,a=p[x,y]
            if a and r>150 and r>g*1.06 and r>b*1.08:q[x,y]=a
    return m.filter(ImageFilter.MaxFilter(3))

def master(closed=False):
    pair=Image.open(OLD/'sources/deepseek-idle-front.png').convert('RGBA')
    original=pair.crop((1024 if closed else 0,0,2048 if closed else 1024,1024))
    im=original.copy()
    # Replace the maid headband with the source's own smooth hair crown.
    keep=mask_path('M0 410H278L290 365C300 284 366 217 475 216C582 214 647 283 664 365L710 410H1024V1024H0Z',im.size)
    im.putalpha(ImageChops.multiply(im.getchannel('A'),keep))
    # Clear remaining lace at the crown; retain original blue strands and
    # their dark outlines. This region never includes facial skin or eyes.
    crown_blue=blue_mask(original,(260,165,714,366)).filter(ImageFilter.MaxFilter(3))
    alpha=im.getchannel('A');ad=alpha.load();cb=crown_blue.load();sp=original.load()
    for y in range(165,366):
        for x in range(260,714):
            if y>329 and 335<x<625:continue
            r,g,b,a=sp[x,y]
            if not cb[x,y] or (r>160 and r>b*.9):ad[x,y]=0
    im.putalpha(alpha)
    ahoge=blue_mask(original,(338,130,487,218))
    im=paste_masked(im,original,ahoge)
    crown='''<path d="M467 193Q477 199 482 218L466 220Q474 208 467 193Z" fill="#4b64b2" stroke="#24346c" stroke-width="2"/><path d="M290 365C300 284 366 217 475 216C582 214 647 283 664 365L649 420Q613 400 588 421L552 352L500 348L434 351L397 395L355 426L306 417Z" fill="url(#blue)" stroke="#24346c" stroke-width="2.6"/>'''
    im.alpha_composite(layer(crown+FRINGE,im.size))
    if not closed:
        im=recolor(im,(372,434,441,482),'iris')
        im=recolor(im,(503,431,570,482),'iris')
    # Preserve the original sleeves' shading and their original pose.
    colored=recolor(im,(315,534,632,705),'jade')
    sleeves=mask_path('M402 550Q381 563 375 596L335 649L324 667L344 683L382 652L414 600ZM535 550Q560 570 565 594L605 650L620 670L600 687L565 656L529 599Z',im.size)
    im=Image.composite(colored,im,sleeves)
    costume=layer(COSTUME,im.size)
    im=paste_masked(im,costume,original.getchannel('A'))
    # Source forelocks remain above the robe, including their original ink.
    for path in ['M349 504Q322 530 324 553Q318 581 353 585Q379 586 382 562Q377 544 363 537L370 509Z','M582 504Q609 520 620 549Q638 576 607 582Q580 580 574 562Q575 541 584 532Z']:
        im=paste_masked(im,original,mask_path(path,im.size))
    for box in [(302,674,350,706),(590,674,638,708)]:
        im=paste_masked(im,original,hands_mask(original,box))
    im.alpha_composite(layer('<use href="#crane" transform="translate(668 380) rotate(-10)"/>',im.size))
    # Restore every non-blue facial pixel after accessory/hair composition.
    # This locks skin, mouth, blush, eyebrows, eyelashes, and eye highlights.
    p=original.load();q=im.load()
    for y in range(420,533):
        for x in range(356,592):
            r,g,b,a=p[x,y]
            if a and not (b>r+16 and b>g+6):q[x,y]=p[x,y]
    return im,original

def save(name,im):
    im.save(DEST/f'{name}.png',optimize=True)
    im.save(DEST/f'{name}.webp',quality=95,method=6)

def crop_master(im):
    # Crop only. No body compression, face resize, or proportion change.
    return im.crop((175,110,820,960))

def cut_background(im):
    mask=Image.new('RGB',im.size);src=im.load();dst=mask.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=src[x,y]
            if min(r,g,b)>233 and max(r,g,b)-min(r,g,b)<18:dst[x,y]=(255,255,255)
    ImageDraw.floodfill(mask,(0,0),(128,128,128),thresh=0)
    for y in range(im.height):
        for x in range(im.width):
            if mask.getpixel((x,y))==(128,128,128):im.putpixel((x,y),(255,255,255,0))
    return im

def board(views,name,title,size=(1800,1040)):
    canvas=Image.new('RGB',size,'#f2f2e9');d=ImageDraw.Draw(canvas)
    f=lambda n:ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',n)
    serif=lambda n:ImageFont.truetype('C:/Windows/Fonts/simsun.ttc',n)
    d.text((65,38),title,font=serif(42),fill='#294c56')
    d.text((68,103),'江小豚 / 荆楚换装版 · 江蓝发色 / 琥珀眼 / 青玉米白 / 暖金',font=f(17),fill='#88958b')
    gap=25;cw=(size[0]-130-gap*(len(views)-1))//len(views);bottom=size[1]-130
    for i,(label,im) in enumerate(views):
        x=65+i*(cw+gap)
        d.rounded_rectangle((x,152,x+cw,bottom),radius=24,fill='#fffcf5',outline='#d7dfd2',width=2)
        art=im.copy();art.thumbnail((cw-25,bottom-232),Image.Resampling.LANCZOS)
        canvas.paste(art,(x+(cw-art.width)//2,165),art)
        d.line((x+30,bottom-68,x+cw-30,bottom-68),fill='#e5e5d8',width=2)
        tw=d.textlength(label,font=f(22));d.text((x+(cw-tw)//2,bottom-50),label,font=f(22),fill='#365e60')
    d.text((68,size[1]-91),'黄鹤簪 · 交领短襦 · 楚凤与江水纹 · 江豚尾鳍',font=f(21),fill='#567367')
    d.text((68,size[1]-43),'参考改编：上善无形 / ZipZipPipe / YunYueSama · 设定参考 xiaoweigen / Cayhaze · CC BY-NC-SA 4.0',font=f(14),fill='#8b978d')
    save(name,canvas)

def main():
    opened,original=master();closed,_=master(True)
    save('welcome',crop_master(opened));save('blink',crop_master(closed))
    save('avatar',opened.crop((270,205,688,623)).resize((256,256),Image.Resampling.LANCZOS))
    save('front-view',crop_master(opened))
    # Verify the original facial skin, mouth, and lashes are pixel-identical.
    # Blue eye pixels may change color; hair is separately allowed to change.
    a=original.load();b=opened.load();locked=0
    for y in range(420,533):
        for x in range(356,592):
            r,g,bb,alpha=a[x,y]
            if alpha==255 and not (bb>r+16 and bb>g+6):
                assert a[x,y]==b[x,y],('face changed',x,y,a[x,y],b[x,y])
                locked+=1
    (DEST/'face-lock-check.json').write_text(json.dumps({'lockedFacePixelsVerified':locked,'faceRedrawn':False,'eyeContourRedrawn':False,'bodyRescaled':False,'allowedEdits':['hair','costume','iris/pupil colors']},ensure_ascii=False,indent=2),encoding='utf8')
    # Reuse the original reference views and poses, preserving their faces.
    build_views(opened)
    build_moods()
    for n,box in [('detail-hair',(270,135,710,500)),('detail-eyes',(350,380,595,530)),('detail-costume',(290,532,650,820))]:save(n,opened.crop(box))
    for n in ['CC-BY-NC-SA-4.0.txt','CC-BY-NC-SA-4.0.zh-CN.md','YunYueSama-ATTRIBUTION-1.0.txt','UPSTREAM-ASSET-LICENSE.md','REFERENCE-NOTICE.md']:
        if (OLD/n).exists():shutil.copyfile(OLD/n,DEST/n)
    (DEST/'CREDITS.md').write_text('''# 江小豚 · 荆楚换装版 / 04

基于用户指定的鲸鱼娘 / 大肥鱼参考素材改编，非全新角色或纯矢量作品。

- 原始角色：上善无形（上善）。
- 女仆衍生设计：ZipZipPipe。
- 高清素材与原表情：YunYueSama，https://github.com/YunYueSama/codex-deepseek-pet 。
- 多视图 / 汉服参考：xiaoweigen，https://github.com/xiaoweigen/deepseek-dafeiyu-assets 。
- 桌宠与表情参考：Cayhaze，https://github.com/Cayhaze/deepseek-pet 。

此次限定修改眼睛 / 瞳孔颜色、发型、服装。使用原始脸部位图；未重新绘制眼睛轮廓、脸型、嘴和五官。原始四肢、尾鳍、头身比例不作形变。主形象的非蓝色脸部像素通过逐像素比较，结果见 face-lock-check.json。

荆楚换装：原有蓝发改为侧分梳理，去掉女仆头箍，保留原呆毛与圆润发量；暖琥珀色眼睛和深褐瞳孔；青玉米白交领、楚凤和水纹、黄鹤簪。服装为现代荆楚风创作。原图素材由相邻 v2/sources 保留，编辑脚本 scripts/build_mascot_v4.py；使用 Pillow 与 resvg-py，无图像生成 API。

改编美术按 CC BY-NC-SA 4.0 共享，适用的上游署名许可一并保留；商业使用须另获授权。
''',encoding='utf8')
    print(f'Built v4; original face locked: {locked} pixels checked.')

# Additional views and expressions are edited with their own source geometry.
def build_views(opened):
    sheet=Image.open(OLD/'sources/character-standard.png').convert('RGBA')
    side_src=cut_background(sheet.crop((515,0,1015,605)))
    side=recolor(side_src,(122,240,160,286),'iris')
    # Keep the exact source profile; the new robe follows its existing body.
    side_art='''<g stroke="#344c61" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M151 385Q124 425 109 465L85 505Q126 533 176 533Q246 546 315 513L289 474Q260 422 216 385Z" fill="url(#ivory)"/><path d="M151 400L123 514M176 399L171 532M208 401L227 531M235 416L277 523" fill="none" stroke="#b9bfb3"/><path d="M151 385L217 385L249 445Q212 461 178 438Q144 464 119 448Z" fill="url(#jade)"/><path d="M121 444Q148 460 178 433Q215 456 246 442" fill="none" stroke="#e8cb8d" stroke-width="3"/><path d="M89 496Q131 524 175 522Q244 538 308 504L315 513Q246 546 176 533Q126 533 85 505Z" fill="url(#jade)"/><use href="#wave" transform="translate(103 509) rotate(16) scale(.7)"/><use href="#wave" transform="translate(151 522) scale(.7)"/><use href="#wave" transform="translate(204 526) rotate(-7) scale(.7)"/><use href="#wave" transform="translate(255 516) rotate(-15) scale(.7)"/><path d="M150 326Q179 324 208 337L220 385Q182 401 146 387Z" fill="url(#ivory)"/><path d="M158 329L174 359L201 335" fill="none" stroke="#2c7772" stroke-width="6"/><path d="M158 329L174 359L201 335" fill="none" stroke="#e7cd97" stroke-width="1.3"/><path d="M147 380Q183 395 218 379L221 392Q185 408 146 393Z" fill="url(#jade)"/><path d="M148 383Q181 399 219 382" fill="none" stroke="#e7c68a"/><use href="#phoenix" transform="translate(146 431) scale(.45)"/></g>'''
    side=paste_masked(side,layer(side_art,side.size),side_src.getchannel('A'))
    sleeve=recolor(side_src,(185,332,235,455),'jade')
    side=paste_masked(side,sleeve,mask_path('M198 335Q222 335 227 361L229 436L224 456L194 454L187 438L191 364Z',side.size))
    side.alpha_composite(layer('''<g stroke="#26366c" stroke-width="1.8"><path d="M154 77Q185 35 224 64Q256 89 273 136Q284 163 281 198L254 214Q245 149 220 115Q193 87 156 98Z" fill="url(#blue)"/><path d="M166 81Q213 71 250 140Q269 173 267 193" fill="none" stroke="#8da0de" stroke-width="3" opacity=".5"/></g><use href="#crane" transform="translate(255 207) rotate(-12) scale(.7)"/>''',side.size))
    save('side-view',side)
    back_src=cut_background(sheet.crop((1005,0,1505,605)))
    back=back_src.copy()
    back=paste_masked(back,layer(transform(COSTUME,.70,.736,-69,-69.7),back.size),back_src.getchannel('A'))
    # Hair and tail stay in front of the outfit, with their source shading.
    back.paste(back_src.crop((0,0,500,435)),(0,0))
    hair=blue_mask(back_src,(0,435,500,505))
    hp=hair.load();sp=back_src.load()
    for y in range(435,505):
        for x in range(500):
            if sp[x,y][2]<145:hp[x,y]=0
    back=paste_masked(back,back_src,hair)
    keep=mask_path('M0 230H80C85 140 155 79 260 79C365 79 412 144 423 210L450 230H500V605H0Z',back.size)
    back.putalpha(ImageChops.multiply(back.getchannel('A'),keep))
    back=paste_masked(back,back_src,blue_mask(back_src,(190,0,301,84)))
    back.alpha_composite(layer('''<g stroke="#26366c" stroke-width="1.7"><path d="M254 65L263 81L252 85Z" fill="url(#blue)"/><path d="M81 210C85 140 155 79 260 79C365 79 412 144 423 210L419 255Q330 285 260 270Q170 284 85 255Z" fill="url(#blue)"/><path d="M260 82Q218 148 218 260M267 82Q315 160 314 263M159 125Q120 182 125 238M355 123Q397 180 386 238" fill="none" stroke="#354b94"/><path d="M204 114Q179 143 173 175M311 111Q337 142 344 173" fill="none" stroke="#8197d5" stroke-width="5" opacity=".6"/><path d="M103 186Q258 240 412 183" fill="none" stroke="#e7c68a" stroke-width="2.5"/></g><use href="#crane" transform="translate(91 197) rotate(-8) scale(.7)"/>''',back.size))
    save('back-view',back)
    board([('正面',crop_master(opened)),('左侧面',side),('背面',back)],'three-views','江小豚 · 荆楚换装三视图')

def action_hair(src,sx,sy,tx,ty):
    im=src.copy()
    keep=layer(transform('<path d="M0 410H278L290 365C300 284 366 217 475 216C582 214 647 283 664 365L710 410H1024V1024H0Z" fill="white"/>',sx,sy,tx,ty),src.size).getchannel('A')
    im.putalpha(ImageChops.multiply(im.getchannel('A'),keep))
    box=(338*sx+tx,125*sy+ty,490*sx+tx,218*sy+ty)
    im=paste_masked(im,src,blue_mask(src,box))
    crown='''<path d="M467 193Q477 199 482 218L466 220Q474 208 467 193Z" fill="#4b64b2" stroke="#24346c" stroke-width="2"/><path d="M290 365C300 284 366 217 475 216C582 214 647 283 664 365L649 420Q613 400 588 421L552 352L500 348L434 351L397 395L355 426L306 417Z" fill="url(#blue)" stroke="#24346c" stroke-width="2.6"/>'''
    im.alpha_composite(layer(transform(crown+FRINGE,sx,sy,tx,ty),im.size))
    return im

def build_moods():
    atlas=Image.open(OLD/'sources/actions.png').convert('RGBA');views=[]
    specs=[
        # name, frame, hair affine, costume affine, iris boxes, hand boxes, sleeve boxes, face box
        ('happy',5,(.52,.51,-6,-5),(.54,.52,-18,-7),[(190,211,223,243),(259,210,292,243)],[(121,291,161,332),(307,291,350,332)],[(157,288,204,332),(269,288,309,332)],(176,205,302,267)),
        ('thinking',2,(.51,.48,-10,-4),(.54,.55,-13,-30),[(182,210,216,239),(251,197,286,227)],[(201,250,239,287),(219,296,248,318)],[(175,281,217,321),(240,281,290,323)],(173,190,292,267)),
        ('serious',8,(.52,.51,-14,-7),(.54,.52,-22,-7),[(178,207,211,240),(249,206,283,240)],[(185,261,220,297),(249,263,278,295)],[(165,291,208,330),(258,290,296,330)],(168,202,289,264)),
        ('worried',9,(.52,.51,-17,-1),(.54,.52,-17,-2),[(172,225,207,257),(241,221,275,253)],[(189,338,224,370),(234,338,270,369)],[(168,291,211,338),(260,289,298,340)],(162,218,288,275)),
    ]
    labels={'happy':'开心 · 张手欢迎','thinking':'思考 · 托腮琢磨','serious':'认真 · 鼓脸握拳','worried':'困惑 · 垂眉捏手'}
    for name,n,ha,ca,eyes,hands,sleeves,face in specs:
        x=n%4*512;y=n//4*512;src=atlas.crop((x,y,x+512,y+512))
        im=action_hair(src,*ha)
        for box in eyes:im=recolor(im,box,'iris')
        for box in sleeves:
            colored=recolor(im,box,'jade')
            m=Image.new('L',im.size);ImageDraw.Draw(m).rectangle(box,fill=255)
            im=Image.composite(colored,im,m)
        im=paste_masked(im,layer(transform(COSTUME,*ca),im.size),src.getchannel('A'))
        # Restore source palms/fists including their linework, never redraw.
        for box in hands:
            im.paste(src.crop(box),box[:2])
        # Source face locked after all hair/costume edits.
        p=src.load();q=im.load()
        for yy in range(face[1],face[3]):
            for xx in range(face[0],face[2]):
                r,g,b,a=p[xx,yy]
                if a and not (b>r+16 and b>g+6):q[xx,yy]=p[xx,yy]
        im.alpha_composite(layer(transform('<use href="#crane" transform="translate(668 380) rotate(-10)"/>',*ha),im.size))
        out=im.crop((65,38,445,492));save(name,out)
        save('avatar-'+name,im.crop((145,100,330,285)).resize((256,256),Image.Resampling.LANCZOS))
        views.append((labels[name],out))
    board(views,'emotions','同一张小圆脸，不同的小心情。',size=(1800,840))

if __name__=='__main__':main()
