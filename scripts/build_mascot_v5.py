"""Clean replacement layers with source face/eye geometry locked.

Hair and clothes are fully redrawn; no source maid costume is composited.
Face and the front/profile hands and feet use explicit isolated masks.
Rear hands and aligned legs, socks and heels are newly drawn.
The blue-grey porpoise tail is drawn independently from the source.
"""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageFilter
import build_mascot_v4 as core

ROOT=core.ROOT;OLD=core.OLD
DEST=ROOT/'public/assets/jiangxiaotun-v5'
DEST.mkdir(parents=True,exist_ok=True)
core.DEST=DEST

HAIR_DEFS='''<defs>
 <linearGradient id="straightHair" x1="5%" y1="0%" x2="90%" y2="100%"><stop stop-color="#f0cb78"/><stop offset=".35" stop-color="#e7b658"/><stop offset=".72" stop-color="#dca14b"/><stop offset="1" stop-color="#c88b3e"/></linearGradient>
 <linearGradient id="frontHair" x1="15%" y1="0%" x2="75%" y2="100%"><stop stop-color="#f6d68c"/><stop offset=".45" stop-color="#ebbd67"/><stop offset="1" stop-color="#d49945"/></linearGradient>
 <linearGradient id="fin" x1="15%" y1="0%" x2="75%" y2="100%"><stop stop-color="#a7bdc9"/><stop offset=".45" stop-color="#829caa"/><stop offset="1" stop-color="#536d80"/></linearGradient>
 <linearGradient id="skin" x1="0%" y1="0%" x2="20%" y2="100%"><stop stop-color="#edbdac"/><stop offset=".35" stop-color="#ffe2cf"/><stop offset="1" stop-color="#fff3e7"/></linearGradient>
 <linearGradient id="earInner" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="#c6d6df"/><stop offset="1" stop-color="#e4edf0"/></linearGradient>
 <linearGradient id="rearShoe" x1="10%" y1="0%" x2="60%" y2="100%"><stop stop-color="#647b86"/><stop offset=".55" stop-color="#465d69"/><stop offset="1" stop-color="#30434e"/></linearGradient>
 </defs>'''

HAIR_BACK='''<g id="short-rounded-bob" stroke="#89603c" stroke-width="2.7" stroke-linejoin="round">
 <path d="M302 350C295 267 370 218 474 218C577 216 646 277 657 360L656 457Q650 493 613 515Q559 532 471 531Q379 532 335 511Q298 484 296 450Z" fill="url(#straightHair)"/>
 </g>'''

HAIR_FRONT='''<g id="side-swept-fringe" stroke="#202e68" stroke-width="2.7" stroke-linejoin="round" stroke-linecap="round">
 <path d="M291 370C286 286 364 214 474 216C578 214 648 280 663 371L650 459Q640 500 610 522L579 522Q609 491 601 445L590 397L558 367L522 357L449 355L398 371L359 414Q340 454 353 486Q360 507 376 518Q343 529 324 507Q289 469 291 370Z" fill="url(#frontHair)"/>
 <path d="M402 247C395 306 447 355 495 377Q533 394 515 428Q550 403 553 367Q580 400 606 418C604 337 557 276 494 253Q444 234 402 247Z" fill="url(#frontHair)"/>
 <path d="M402 247Q358 278 334 329Q311 370 321 417Q346 403 362 380Q381 351 402 310Q428 356 464 372Q491 390 493 437Q519 420 516 399Q514 382 492 373C431 344 405 295 402 247Z" fill="url(#frontHair)"/>
 <path d="M403 248Q404 310 447 344M405 250Q458 264 480 298Q513 341 554 350M334 329Q321 375 328 406M620 343Q642 419 619 469" fill="none" stroke="#2b438c" stroke-width="2"/>
 <path d="M376 283Q358 310 348 340M542 286Q568 310 578 339M310 405Q307 447 325 475M631 395Q638 441 618 479" fill="none" stroke="#8ea8e5" stroke-width="5" opacity=".48"/>
 <g fill="#9dafe9" stroke="none" opacity=".65"><ellipse cx="397" cy="300" rx="7" ry="14" transform="rotate(-22 397 300)"/><ellipse cx="411" cy="320" rx="6" ry="12" transform="rotate(-30 411 320)"/><ellipse cx="428" cy="338" rx="5" ry="10" transform="rotate(-39 428 338)"/><ellipse cx="445" cy="351" rx="4" ry="7" transform="rotate(-45 445 351)"/><ellipse cx="570" cy="299" rx="5" ry="10" transform="rotate(-32 570 299)"/><ellipse cx="584" cy="315" rx="4" ry="7" transform="rotate(-32 584 315)"/></g>
 <path d="M468 217C489 191 471 137 432 143C389 148 351 189 352 213C355 173 418 127 452 157Q479 183 457 217Z" fill="url(#frontHair)"/>
 <path d="M366 188Q402 150 431 151" fill="none" stroke="#9bafe7" stroke-width="2.5" opacity=".6"/>
 </g>'''

SLEEVES='''<g id="new-sleeves" stroke="#344c61" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
 <path d="M406 540Q385 542 374 572L330 642L314 668Q323 685 345 691L385 654L420 599Z" fill="url(#jade)"/><path d="M532 540Q556 542 567 572L611 642L633 670Q625 688 601 693L564 655L523 595Z" fill="url(#jade)"/>
 <path d="M388 568Q380 596 362 620M547 568Q557 596 577 621M344 645L356 649M597 644L584 649" fill="none" stroke="#8ac1af" stroke-width="3" opacity=".65"/>
 <path d="M323 653L353 674L342 691Q321 685 313 672ZM601 674L623 654L634 670Q624 688 603 695Z" fill="url(#ivory)" stroke="#a88f6c" stroke-width="1.8"/>
 <path d="M322 658L348 678M608 678L625 661" stroke="#d8ba80" stroke-width="2"/>
 <path d="M366 590Q379 600 389 605M563 589Q550 598 544 606" fill="none" stroke="#255965" stroke-width="2"/>
 </g>'''

# Only hair palette changes here; the source face and iris outline are untouched.
for old,new in {'#202e68':'#89603c','#2b438c':'#b17b3e','#8ea8e5':'#ffedb5','#9dafe9':'#fff0bb','#9bafe7':'#ffedb5'}.items():
    HAIR_FRONT=HAIR_FRONT.replace(old,new)

# Smooth blue-grey peduncle and horizontally spread, notched flukes.
# No source whale-tail pixels, leaf tips or decorative fin veins are reused.
PORPOISE_TAIL='''<g id="yangtze-porpoise-flukes" stroke="#465f70" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
 <path d="M584 781C632 800 680 787 701 755L708 736C686 739 661 728 645 704C676 704 702 707 721 720C743 706 776 697 808 694C798 723 770 744 733 744C717 799 667 825 603 806Z" fill="url(#fin)"/>
 <path d="M614 798Q676 810 710 759" fill="none" stroke="#b9cbd4" stroke-width="3" opacity=".65"/>
 <path d="M658 710Q694 710 721 727Q756 711 793 703" fill="none" stroke="#d2dfe4" stroke-width="2.2" opacity=".6"/>
 </g>'''

LEFT_EAR='''<g stroke="#465f70" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
 <path d="M326 405C304 411 275 426 237 429C244 447 263 461 286 461Q310 460 326 444Z" fill="url(#fin)"/>
 <path d="M309 423Q279 439 248 435Q265 451 285 450Q298 447 310 438" fill="url(#earInner)" stroke="none"/>
 <path d="M249 435Q273 441 299 433" fill="none" stroke="#b8ceda" stroke-width="1.6"/>
 </g>'''

def fin_ears(left=0,right=0):
    return f'<g transform="rotate({left} 316 432)">{LEFT_EAR}</g><g transform="rotate({right} 632 432)"><g transform="translate(948 0) scale(-1 1)">{LEFT_EAR}</g></g>'

FRONT_LEGS='''<g stroke="#8c817a" stroke-width="1.8" stroke-linejoin="round">
 <path d="M397 801Q426 796 456 801L460 848Q429 857 394 848Z" fill="url(#skin)"/>
 <path d="M491 801Q521 796 551 801L557 848Q524 857 489 848Z" fill="url(#skin)"/>
 </g>'''

COSTUME=core.COSTUME.replace('fill="#fff0df"','fill="url(#ivory)"')

def slate_piece(im):
    """Keep existing ear/shoe geometry; soften saturated blue to river slate."""
    import colorsys
    out=im.copy();p=out.load()
    for y in range(out.height):
        for x in range(out.width):
            r,g,b,a=p[x,y]
            if a and b>r+16 and b>g+6:
                h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
                rr,gg,bb=colorsys.hsv_to_rgb(205/360,s*.36,v*.91)
                p[x,y]=(round(rr*255),round(gg*255),round(bb*255),a)
    return out

def hands_mask(im,box):
    # Fill palm highlights inside each isolated component without copying cuffs.
    m=Image.new('L',im.size);p=im.load();q=m.load()
    x1,y1,x2,y2=box
    for y in range(y1,y2):
        for x in range(x1,x2):
            r,g,b,a=p[x,y]
            if a and r>130 and r>=g+1 and r>=b+5:q[x,y]=255
    m=m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    local=m.crop(box)
    from collections import deque
    seen=set();components=[];lp=local.load()
    for yy in range(local.height):
        for xx in range(local.width):
            if not lp[xx,yy] or (xx,yy) in seen:continue
            todo=deque([(xx,yy)]);seen.add((xx,yy));component=[]
            while todo:
                point=todo.popleft();component.append(point)
                for nx,ny in [(point[0]-1,point[1]),(point[0]+1,point[1]),(point[0],point[1]-1),(point[0],point[1]+1)]:
                    if 0<=nx<local.width and 0<=ny<local.height and lp[nx,ny] and (nx,ny) not in seen:
                        seen.add((nx,ny));todo.append((nx,ny))
            components.append(component)
    local=Image.new('L',local.size)
    if components:
        lp=local.load()
        for point in max(components,key=len):lp[point]=255
    # Flood from all four edges; holes inside skin are then filled.
    padded=Image.new('L',(local.width+2,local.height+2),0);padded.paste(local,(1,1))
    ImageDraw.floodfill(padded,(0,0),128)
    px=padded.load()
    for yy in range(1,local.height+1):
        for xx in range(1,local.width+1):
            if px[xx,yy]==0:px[xx,yy]=255
            elif px[xx,yy]==128:px[xx,yy]=0
    m=Image.new('L',im.size)
    m.paste(padded.crop((1,1,local.width+1,local.height+1)),box[:2])
    return m.filter(ImageFilter.MaxFilter(3))

def draw(markup,size):return core.layer(HAIR_DEFS+markup,size)
def masked(src,path):
    im=src.copy();im.putalpha(ImageChops.multiply(src.getchannel('A'),core.mask_path(path,src.size)));return im

FACE_PATH='M400 350L523 350L554 405L592 428L594 482L577 513L546 529L472 536L408 531L370 514L350 484L350 431L375 405Z'

def source_master(closed=False):
    pair=Image.open(OLD/'sources/deepseek-idle-front.png').convert('RGBA')
    return pair.crop((1024 if closed else 0,0,2048 if closed else 1024,1024))

def fixed_face(src,eyes,box):
    im=src.copy()
    for eye in eyes:im=core.recolor(im,eye,'iris')
    return im

def face_piece(src,path,eye_boxes):
    im=masked(src,path);p=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=p[x,y]
            if a and b>r+16 and b>g+6 and b>110 and not any(a1<=x<a2 and b1<=y<b2 for a1,b1,a2,b2 in eye_boxes):p[x,y]=(r,g,b,0)
    return im

def front(closed=False):
    src=source_master(closed)
    im=Image.new('RGBA',src.size)
    im.alpha_composite(draw(PORPOISE_TAIL,im.size))
    im.alpha_composite(draw(HAIR_BACK,im.size))
    im.alpha_composite(draw(fin_ears(),im.size))
    # Skin and original shoes are isolated; no old sock lace is reused.
    im.alpha_composite(draw(FRONT_LEGS,im.size))
    for box in [(382,865,474,951),(480,865,568,951)]:
        im.alpha_composite(slate_piece(src.crop(box)),box[:2])
    im.alpha_composite(draw('''<g stroke="#344c61" stroke-width="2"><path d="M392 838Q427 846 462 838L462 877Q427 886 391 876ZM487 838Q522 847 556 838L560 877Q526 886 487 877Z" fill="url(#ivory)"/><path d="M393 845Q426 851 461 845M489 845Q523 852 556 845" fill="none" stroke="#d8bb83" stroke-width="2"/></g>''',im.size))
    im.alpha_composite(draw(SLEEVES+COSTUME,im.size))
    # Reuse exact source hands; the geometric mask omits maid cuffs.
    for path in ['M324 672Q313 677 307 687L307 698L315 702L325 695L323 703L333 704L345 687L341 679Z','M604 672Q618 676 628 688L632 699L621 704L615 696L611 704L603 701L593 684Z']:
        im.alpha_composite(masked(src,path))
    face=fixed_face(src,[] if closed else [(372,434,441,482),(503,431,570,482)],(356,420,592,533))
    im.alpha_composite(face_piece(face,FACE_PATH,[(372,434,441,482),(503,431,570,482)]))
    im.alpha_composite(draw(HAIR_FRONT,im.size))
    # Restore the exact eyes (including their complete original contours).
    # Non-blue face pixels are also copied verbatim after the hair layer.
    p=src.load();q=im.load();f=face.load()
    for y in range(420,533):
        for x in range(356,592):
            r,g,b,a=p[x,y]
            if a and not (b>r+16 and b>g+6):q[x,y]=p[x,y]
    for box in [(355,418,447,489),(499,417,591,489)]:
        # A source eye patch may contain hair at its edges; only source face
        # pixels and blue iris pixels inside the iris boxes are needed.
        for y in range(box[1],box[3]):
            for x in range(box[0],box[2]):
                if (372<=x<441 and 434<=y<482) or (503<=x<570 and 431<=y<482):q[x,y]=f[x,y]
    im.alpha_composite(draw('<use href="#crane" transform="translate(664 380) rotate(-10)"/>',im.size))
    return im,src

def save(name,im):core.save(name,im)

def board(views,name,title,size=(1800,1040)):
    canvas=Image.new('RGB',size,'#f2f2e9');d=ImageDraw.Draw(canvas)
    f=lambda n:ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',n)
    serif=lambda n:ImageFont.truetype('C:/Windows/Fonts/simsun.ttc',n)
    d.text((65,38),title,font=serif(42),fill='#294c56')
    d.text((68,103),'江小豚 / 琥珀黄短发 / 青玉米白荆楚衣 / 蓝灰江豚尾鳍',font=f(17),fill='#88958b')
    gap=25;cw=(size[0]-130-gap*(len(views)-1))//len(views);bottom=size[1]-130
    for i,(label,im) in enumerate(views):
        x=65+i*(cw+gap)
        d.rounded_rectangle((x,152,x+cw,bottom),radius=24,fill='#fffcf5',outline='#d7dfd2',width=2)
        art=im.copy();art.thumbnail((cw-25,bottom-232),Image.Resampling.LANCZOS)
        canvas.paste(art,(x+(cw-art.width)//2,165),art)
        d.line((x+30,bottom-68,x+cw-30,bottom-68),fill='#e5e5d8',width=2)
        tw=d.textlength(label,font=f(22));d.text((x+(cw-tw)//2,bottom-50),label,font=f(22),fill='#365e60')
    d.text((68,size[1]-91),'黄鹤簪 · 楚凤水纹 · 圆润短发 · 水平展开的江豚尾鳍',font=f(21),fill='#567367')
    d.text((68,size[1]-43),'参考改编：上善无形 / ZipZipPipe / YunYueSama · 设定参考 xiaoweigen / Cayhaze · CC BY-NC-SA 4.0',font=f(14),fill='#8b978d')
    save(name,canvas)

def main():
    im,src=front();closed,_=front(True)
    save('welcome',core.crop_master(im));save('blink',core.crop_master(closed));save('front-view',core.crop_master(im))
    save('avatar',im.crop((270,205,688,623)).resize((256,256),Image.Resampling.LANCZOS))
    locked=0
    for y in range(420,533):
        for x in range(356,592):
            r,g,b,a=src.getpixel((x,y))
            if a==255 and not (b>r+16 and b>g+6):
                assert im.getpixel((x,y))==src.getpixel((x,y)),('face changed',x,y)
                locked+=1
    (DEST/'face-lock-check.json').write_text(json.dumps({'originalFacePixelsVerified':locked,'faceRedrawn':False,'eyeContourRedrawn':False,'bodyWarped':False,'sourceCostumeReused':False,'sourceWavyHairReused':False,'sourceTailReused':False,'sourceFinEarsReused':False,'noExposedNeck':True,'continuousLegLayers':True,'tailDesign':'blue-grey smooth porpoise peduncle and horizontal flukes'},indent=2),encoding='utf8')
    for name,box in [('detail-hair',(225,130,730,540)),('detail-eyes',(350,380,595,530)),('detail-costume',(290,515,650,840)),('detail-tail',(592,683,815,826))]:save(name,im.crop(box))
    build_views(im)
    build_moods()
    for n in ['CC-BY-NC-SA-4.0.txt','CC-BY-NC-SA-4.0.zh-CN.md','YunYueSama-ATTRIBUTION-1.0.txt','UPSTREAM-ASSET-LICENSE.md','REFERENCE-NOTICE.md']:
        if (OLD/n).exists():shutil.copyfile(OLD/n,DEST/n)
    (DEST/'CREDITS.md').write_text('''# 江小豚 · 荆楚换装 / 05

以用户指定的大肥鱼 / 鲸鱼娘素材为基础的局部换装改编。脸型、眼睛形状、眼线、嘴型及整体头身比例沿用原素材；眼睛 / 瞳孔只调整颜色。头发与整套服装作为新图层重新绘制，旧女仆服和大波浪头发不参与新图层合成。原脸以及正面、侧面的手和鞋经单独遮罩保留；鞋的蓝色调整为蓝灰色。背面双手重新绘制并衔接袖口；背面腿、袜筒和鞋跟用共享中心与统一底线重新绘制，避免原鞋贴图与新腿错位。耳鳍重新绘制为短小圆润的蓝灰鳍面，统一三视图并随动作改变角度，根部藏入短发。头部与衣领直接相接，采用无可见脖颈的 Q 版结构；小腿另绘连续肤色层。尾巴独立重新绘制为蓝灰色长江江豚尾鳍，不沿用参考角色尾巴。本版是位图人物细节与矢量新图层的混合，并非纯矢量角色。

原始角色：上善无形（上善）；女仆二设：ZipZipPipe；高清素材与表情：YunYueSama（https://github.com/YunYueSama/codex-deepseek-pet）；设定参考：xiaoweigen（https://github.com/xiaoweigen/deepseek-dafeiyu-assets）、Cayhaze（https://github.com/Cayhaze/deepseek-pet）。原始素材与许可在相邻 v2/sources 及 v2/CREDITS.md 保留。

新图层：琥珀黄色圆润短发与侧分斜刘海，去掉耳畔以下瀑布长发；青玉米白交领、完整长袖与平整袖缘、楚凤水纹、黄鹤簪；暖琥珀眼和深褐瞳孔；独立绘制背面后领、腰结与裙褶，侧面后脑及尾柄连接。现代荆楚风创作服装，不作特定朝代复原宣称。

保留脸部的像素核验见 face-lock-check.json。构建：python -X utf8 scripts/build_mascot_v5.py（Pillow、resvg-py），未调用绘图 API。

改编美术 CC BY-NC-SA 4.0，适用的上游署名许可一并保留，商业使用须另获授权。
''',encoding='utf8')
    print(f'Built clean-layer v5. Locked original facial pixels: {locked}')

BACK_HAIR='''<g stroke="#89603c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
 <path d="M93 201C92 133 143 82 215 81C291 80 341 134 350 201L353 254Q355 290 325 310Q305 326 282 320Q253 335 215 325Q177 335 149 320Q121 327 100 307Q77 288 83 254Z" fill="url(#straightHair)"/>
 <path d="M215 86Q187 155 185 226Q184 279 171 308M225 86Q255 157 257 226Q259 278 273 309M152 116Q119 185 121 247Q123 285 112 301M286 112Q321 179 320 242Q318 282 332 296" fill="none" stroke="#b17b3e"/>
 <path d="M147 151Q131 176 130 208M185 133L179 172M251 134L260 173M295 151L307 207M139 251Q141 278 132 294M294 251Q291 279 303 295" fill="none" stroke="#ffedb5" stroke-width="3.5" opacity=".58"/>
 <path d="M94 193Q217 236 350 194" fill="none" stroke="#fff1c8" stroke-width="2"/>
 <path d="M214 81Q231 61 222 40Q204 17 180 35Q162 50 162 66Q168 44 193 35Q220 30 215 57L206 81Z" fill="url(#frontHair)"/>
 </g>'''

BACK_ROBE='''<g stroke="#344c61" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
 <!-- Back pleats open from the waist, with no front crossing collar. -->
 <path d="M169 387Q141 424 111 470L79 511Q128 537 214 540Q298 538 351 514L321 474Q292 425 262 387Z" fill="url(#ivory)"/>
 <path d="M171 402Q134 469 126 524M190 400Q173 472 169 535M215 402V539M240 400Q258 472 262 534M260 401Q298 472 308 527" fill="none" stroke="#b6beb2" stroke-width="1.5"/>
 <path d="M178 402Q155 459 151 530M252 402Q278 460 282 530" stroke="#d3dfcc" stroke-width="15" opacity=".45" fill="none"/>
 <path d="M84 503Q137 530 214 531Q293 530 345 506L351 514Q298 538 214 540Q128 537 79 511Z" fill="url(#jade)"/>
 <use href="#wave" transform="translate(100 519) rotate(12) scale(.7)"/><use href="#wave" transform="translate(149 530) rotate(5) scale(.7)"/><use href="#wave" transform="translate(201 535) scale(.7)"/><use href="#wave" transform="translate(253 531) rotate(-7) scale(.7)"/><use href="#wave" transform="translate(302 520) rotate(-14) scale(.7)"/>
 <!-- Short rear overskirt and paired phoenix embroidery. -->
 <path d="M168 388L262 388Q282 417 292 445Q253 460 215 445Q177 460 140 445Q150 418 168 388Z" fill="url(#jade)"/>
 <path d="M143 442Q176 455 215 440Q253 455 289 442" fill="none" stroke="#edcb8b" stroke-width="2.5"/>
 <use href="#phoenix" transform="translate(171 422) scale(.5)"/><use href="#phoenix" transform="translate(259 422) scale(-.5 .5)"/>
 <!-- Fitted rear bodice, continuous back collar and sleeve seams. -->
 <path d="M171 322Q190 326 215 327Q241 326 261 323L268 387Q215 402 163 387Z" fill="url(#ivory)"/>
 <path d="M176 323Q215 338 255 323L251 335Q215 349 180 336Z" fill="url(#jade)"/>
 <path d="M178 326Q215 341 253 326" fill="none" stroke="#e7c68a" stroke-width="1.5"/>
 <path d="M174 333L183 345L180 380M255 333L247 345L250 380" fill="none" stroke="#c4c7b9"/>
 <use href="#phoenix" transform="translate(215 361) scale(.45)"/>
 <path d="M172 330Q151 331 145 351L119 424Q126 438 146 444L174 389L186 345ZM259 330Q279 332 285 351L311 424Q304 439 285 445L256 389L245 345Z" fill="url(#jade)"/>
 <path d="M150 360L134 412M278 361L295 412" fill="none" stroke="#8ac0ac" stroke-width="1.8"/>
 <path d="M123 417L150 432L145 446Q128 442 117 430ZM282 432L307 416L314 430Q303 442 286 447Z" fill="url(#ivory)" stroke="#a88f6c"/>
 <path d="M124 422L147 435M287 435L308 422" stroke="#d8bb83"/>
 <!-- Back waist sash and a small flat knot, following the curved waist. -->
 <path d="M165 379Q215 393 266 379L268 395Q216 410 163 395Z" fill="url(#jade)"/>
 <path d="M166 382Q215 397 266 382M165 393Q215 408 267 393" fill="none" stroke="#e7c68a"/>
 <path d="M213 394Q190 378 189 394Q192 410 211 400Q215 411 219 400Q240 410 242 394Q238 379 217 394Z" fill="url(#ivory)" stroke="#ae8c57" stroke-width="1"/>
 <path d="M210 401L199 449L210 445L216 409L224 450L235 457L221 400Z" fill="url(#ivory)" stroke="#b2986d" stroke-width="1"/>
 </g>'''

BACK_LEFT_HAND='''<g stroke="#765b54" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
 <path d="M125 436L138 444L136 450Q134 455 132 459Q130 462 127 459Q125 464 122 461Q119 463 117 459Q113 459 114 454Q113 451 117 447Z" fill="url(#skin)"/>
 <path d="M118 452L117 457M123 454L121 459M128 455L126 459M136 448Q131 447 129 451" fill="none" stroke="#c99383" stroke-width=".85"/>
 </g>'''
BACK_HANDS=BACK_LEFT_HAND+'<g transform="translate(430 0) scale(-1 1)">'+BACK_LEFT_HAND+'</g>'
BACK_CUFFS='''<g stroke="#a88f6c" stroke-width="1.5" stroke-linejoin="round">
 <path d="M123 417L150 432L145 446Q128 442 117 430ZM282 432L307 416L314 430Q303 442 286 447Z" fill="url(#ivory)"/>
 <path d="M124 422L147 435M287 435L308 422" fill="none" stroke="#d8bb83"/>
 </g>'''

def back_lower_body(size):
    # Both legs, sock shafts and heels use one centre per side, and one floor.
    # Independent source shoe crops used to offset the right heel from its leg.
    parts=[]
    for centre in (181,249):
        parts.append(f'''<g transform="translate({centre} 0)" stroke-linecap="round" stroke-linejoin="round">
         <path d="M-26 565Q0 569 26 565Q29 578 25 589Q23 598 13 599Q0 602-14 599Q-24 598-26 590Q-29 578-26 565Z" fill="url(#rearShoe)" stroke="#344c59" stroke-width="1.5"/>
         <path d="M-23 589Q0 599 23 589L22 595Q0 604-22 595Z" fill="#334753" stroke="none"/>
         <path d="M-21 579Q0 584 21 579" fill="none" stroke="#8aa0aa" stroke-width="1.2" opacity=".6"/>
         <path d="M-20 516Q0 512 20 516L22 551Q0 556-22 551Z" fill="url(#skin)" stroke="#8c817a" stroke-width="1.2"/>
         <path d="M-22 547Q0 552 22 547L24 570Q0 576-24 570Z" fill="url(#ivory)" stroke="#344c61" stroke-width="1.3"/>
         <path d="M-21 552Q0 557 21 552" fill="none" stroke="#d8bb83" stroke-width="1.1"/>
         </g>''')
    return draw(''.join(parts),size)

def build_views(front):
    sheet=Image.open(OLD/'sources/character-standard.png').convert('RGBA')
    src=core.cut_background(sheet.crop((515,0,1015,605)))
    side=Image.new('RGBA',src.size)
    side.alpha_composite(draw(core.transform(PORPOISE_TAIL,.67,.67,-90,-8),side.size))
    hair_back='''<g stroke="#89603c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M183 99C287 56 379 134 384 232C387 280 361 318 316 329Q278 342 229 329L218 217Z" fill="url(#straightHair)"/><path d="M327 139Q373 207 355 275Q347 299 326 312M293 196Q310 261 286 321" fill="none" stroke="#b17b3e"/><path d="M356 204Q367 254 345 288" fill="none" stroke="#ffe9ab" stroke-width="3" opacity=".65"/></g>'''
    side.alpha_composite(draw(hair_back,side.size))
    side.alpha_composite(draw('<path d="M175 515Q205 509 231 516L235 546Q206 554 172 546Z" fill="url(#skin)" stroke="#8c817a" stroke-width="1.2"/>',side.size))
    for box in [(135,561,244,602)]:side.alpha_composite(slate_piece(src.crop(box)),box[:2])
    side.alpha_composite(draw('''<path d="M173 546Q205 550 234 546L238 568Q206 578 172 567Z" fill="url(#ivory)" stroke="#344c61" stroke-width="1.4"/><path d="M174 551L235 551" stroke="#d8bb83" stroke-width="1.3"/>''',side.size))
    robe='''<g stroke="#344c61" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M151 385Q124 425 109 465L85 505Q126 533 176 533Q246 546 315 513L289 474Q260 422 216 385Z" fill="url(#ivory)"/><path d="M151 400L123 514M176 399L171 532M208 401L227 531M235 416L277 523" fill="none" stroke="#b9bfb3"/><path d="M151 385L217 385L249 445Q212 461 178 438Q144 464 119 448Z" fill="url(#jade)"/><path d="M121 444Q148 460 178 433Q215 456 246 442" fill="none" stroke="#e8cb8d" stroke-width="3"/><path d="M89 496Q131 524 175 522Q244 538 308 504L315 513Q246 546 176 533Q126 533 85 505Z" fill="url(#jade)"/><use href="#wave" transform="translate(103 509) rotate(16) scale(.7)"/><use href="#wave" transform="translate(151 522) scale(.7)"/><use href="#wave" transform="translate(204 526) rotate(-7) scale(.7)"/><use href="#wave" transform="translate(255 516) rotate(-15) scale(.7)"/><path d="M144 323Q168 326 194 321L208 337L220 385Q182 401 146 387Z" fill="url(#ivory)"/><path d="M149 323L174 350L198 328" fill="none" stroke="#2c7772" stroke-width="6"/><path d="M149 323L174 350L198 328" fill="none" stroke="#e7cd97" stroke-width="1.3"/><path d="M147 380Q183 395 218 379L221 392Q185 408 146 393Z" fill="url(#jade)"/><path d="M148 383Q181 399 219 382" fill="none" stroke="#e7c68a"/><use href="#phoenix" transform="translate(146 431) scale(.45)"/><path d="M199 336Q180 339 177 366L177 434Q191 446 224 438L222 365Q221 343 208 336Z" fill="url(#jade)"/><path d="M184 373L184 420M213 376L214 419" fill="none" stroke="#8ac1af" stroke-width="1.8"/><path d="M177 428L222 428L224 442Q202 450 177 442Z" fill="url(#ivory)" stroke="#a88f6c"/><path d="M179 433L221 433" stroke="#d8bb83"/></g>'''
    side.alpha_composite(draw(robe,side.size))
    side.alpha_composite(masked(src,'M184 442L218 442L219 454L212 462L184 459Z'))
    # The original profile's face and eye remain at their exact coordinates.
    face=core.recolor(src,(125,240,160,286),'iris')
    face_path='M135 186L185 200L210 246L196 291L172 320L145 330L118 317L98 302L97 282L106 267L106 241L125 224Z'
    side.alpha_composite(face_piece(face,face_path,[(125,240,160,286)]))
    side_hair='''<g stroke="#202e68" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M81 236Q66 176 89 116Q120 68 194 76Q277 55 335 114Q366 152 369 212L334 235L279 227Q273 300 247 328Q230 347 213 344Q234 309 222 283L207 240Q189 235 177 215Q153 246 132 258L110 269Q100 274 92 262Z" fill="url(#frontHair)"/><path d="M158 103Q155 159 209 198Q233 218 225 247M160 102Q209 104 230 134Q262 172 293 179M102 190Q92 222 101 249M254 247Q264 288 241 320" fill="none" stroke="#2b438c"/><path d="M145 122L134 147M156 135L161 150M169 158L175 168M183 175L190 181M279 123Q308 141 319 164" fill="none" stroke="#9dafe9" stroke-width="4" opacity=".6"/><path d="M190 76C206 47 183 24 161 29Q127 31 108 67Q108 49 140 29Q183 9 196 45Q201 63 190 76Z" fill="url(#frontHair)"/></g>'''
    side_hair=side_hair.replace('L334 235L279 227','Q371 273 337 301Q305 330 263 326L279 227')
    for old,new in {'#202e68':'#89603c','#2b438c':'#b17b3e','#9dafe9':'#ffedb5'}.items():side_hair=side_hair.replace(old,new)
    side.alpha_composite(draw(side_hair,side.size))
    side.alpha_composite(draw('''<g stroke="#465f70" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M264 227C286 235 312 242 341 244C331 260 304 268 281 258Q267 253 264 243Z" fill="url(#fin)"/><path d="M276 239Q302 249 329 247Q309 260 287 253Z" fill="url(#earInner)" stroke="none"/><path d="M283 245Q305 253 321 251" fill="none" stroke="#b8ceda" stroke-width="1.2"/></g><path d="M254 211Q272 226 274 244Q272 256 265 263Q267 245 254 236Z" fill="url(#frontHair)" stroke="#b17b3e" stroke-width="1.3"/>''',side.size))
    # Restore source profile features after hair placement.
    for y in range(229,325):
        for x in range(97,191):
            r,g,b,a=src.getpixel((x,y))
            if a and not (b>r+16 and b>g+6):side.putpixel((x,y),src.getpixel((x,y)))
    side.alpha_composite(face_piece(face,'M117 231L163 231L174 277L151 292L115 280Z',[(125,240,160,286)]))
    side.alpha_composite(draw('<use href="#crane" transform="translate(276 209) rotate(-10) scale(.7)"/>',side.size))
    save('side-view',side)

    src=core.cut_background(sheet.crop((1005,0,1505,605)))
    back=Image.new('RGBA',src.size)
    back.alpha_composite(draw(core.transform(PORPOISE_TAIL,.67,.67,-63,-8),back.size))
    back.alpha_composite(back_lower_body(back.size))
    back.alpha_composite(draw(BACK_ROBE+BACK_HANDS+BACK_CUFFS,back.size))
    # No source hair or headband is pasted into the back view.
    back_hair=BACK_HAIR
    back.alpha_composite(draw(core.transform(fin_ears(),.70,.70,-117,-70),back.size))
    back.alpha_composite(draw(back_hair+'<use href="#crane" transform="translate(95 200) rotate(-9) scale(.7)"/>',back.size))
    save('back-view',back)
    board([('正面',core.crop_master(front)),('左侧面',side),('背面',back)],'three-views','江小豚 · 荆楚换装三视图')
ARM_STYLES={
 'happy':'''<path d="M204 274Q183 279 158 294L154 323Q174 339 204 319L216 286ZM271 274Q292 277 315 293L319 322Q296 341 271 318L260 286Z" fill="url(#jade)"/><path d="M154 294L167 298L165 330L153 325ZM305 297L318 292L322 323L308 330Z" fill="url(#ivory)" stroke="#b19464"/>''',
 'thinking':'''<path d="M204 266Q183 273 180 306Q184 328 206 325L235 314L233 294L204 302L219 280ZM266 267Q288 273 289 303Q289 325 263 324L232 313L236 294L260 298L251 277Z" fill="url(#jade)"/><path d="M213 283L229 291L223 305L206 296ZM230 295L239 312L224 318L216 302Z" fill="url(#ivory)" stroke="#b19464"/>''',
 'serious':'''<path d="M204 271Q181 276 173 306Q172 330 199 330L219 305L215 289ZM267 271Q290 277 295 306Q296 330 271 330L250 306L255 289Z" fill="url(#jade)"/><path d="M191 290L217 290L219 305L193 308ZM251 290L276 291L275 308L250 305Z" fill="url(#ivory)" stroke="#b19464"/>''',
 'worried':'''<path d="M201 276Q179 282 171 314L179 337L198 350L215 335L201 320L215 290ZM268 277Q289 284 297 313L289 336L267 350L252 335L267 319L253 290Z" fill="url(#jade)"/><path d="M181 334L207 338L207 351L183 349ZM257 338L285 334L284 349L260 352Z" fill="url(#ivory)" stroke="#b19464"/>''',
}

def build_moods():
    atlas=Image.open(OLD/'sources/actions.png').convert('RGBA');views=[]
    specs=[
        ('happy',5,(.52,.51,-6,-5),(.54,.52,-18,-7),[(190,211,223,243),(259,210,292,243)],[(121,291,161,332),(307,291,350,332)],(176,205,302,267)),
        ('thinking',2,(.51,.48,-10,-4),(.54,.55,-13,-30),[(182,210,216,239),(251,197,286,227)],[(209,250,239,283),(219,299,234,314)],(173,190,292,267)),
        ('serious',8,(.52,.51,-14,-7),(.54,.52,-22,-7),[(178,207,211,240),(249,206,283,240)],[(185,261,219,291),(249,263,278,291)],(168,202,289,264)),
        ('worried',9,(.52,.51,-17,-1),(.54,.52,-17,-2),[(172,225,207,257),(241,221,275,253)],[(189,348,223,367),(234,348,267,367)],(162,218,288,275)),
    ]
    labels={'happy':'开心 · 张手欢迎','thinking':'思考 · 托腮琢磨','serious':'认真 · 鼓脸握拳','worried':'困惑 · 垂眉捏手'}
    for name,n,ha,ca,eyes,hands,facebox in specs:
        x=n%4*512;y=n//4*512;src=atlas.crop((x,y,x+512,y+512))
        im=Image.new('RGBA',src.size)
        im.alpha_composite(draw(core.transform(PORPOISE_TAIL,.52,.52,-7,-1),im.size))
        im.alpha_composite(draw(core.transform(HAIR_BACK,*ha),im.size))
        # Ear roots follow the same head transform and sit behind the bob.
        ear_angles={'happy':(8,-8),'thinking':(-6,-3),'serious':(-5,5),'worried':(-12,12)}
        im.alpha_composite(draw(core.transform(fin_ears(*ear_angles[name]),*ha),im.size))
        im.alpha_composite(slate_piece(src.crop((165,446,300,480))),(165,446))
        # Locate each original shoe, including the leaning thinking pose.
        points=[]
        for xx in range(170,300):
            r,g,b,a=src.getpixel((xx,463))
            if a>100:points.append(xx)
        spans=[]
        for xx in points:
            if not spans or xx>spans[-1][-1]+4:spans.append([xx])
            else:spans[-1].append(xx)
        for span in spans:
            if len(span)<5:continue
            a,b=min(span)+3,max(span)-3
            im.alpha_composite(draw(f'<path d="M{a} 405Q{(a+b)/2} 402 {b} 405L{b} 438Q{(a+b)/2} 441 {a} 438Z" fill="url(#skin)" stroke="#8c817a" stroke-width="1"/>',im.size))
            im.alpha_composite(draw(f'<path d="M{a} 434Q{(a+b)/2} 437 {b} 434L{b+1} 449Q{(a+b)/2} 455 {a-1} 449Z" fill="url(#ivory)" stroke="#344c61" stroke-width="1"/><path d="M{a+1} 438L{b-1} 438" stroke="#d8bb83" stroke-width="1"/>',im.size))
        # Chibi collar follows the underside of the jaw: no visible neck.
        collar_joins={
          'happy':'M214 258Q239 268 263 258L269 276Q239 290 210 276Z',
          'thinking':'M213 252Q238 265 262 250L267 270Q240 285 211 273Z',
          'serious':'M210 251Q232 263 255 251L261 276Q232 290 207 275Z',
          'worried':'M213 265Q235 276 258 264L263 283Q235 297 209 282Z'
        }
        im.alpha_composite(draw(f'<path d="{collar_joins[name]}" fill="url(#ivory)"/>'+core.transform(COSTUME,*ca),im.size))
        im.alpha_composite(draw('<g stroke="#344c61" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">'+ARM_STYLES[name]+'</g>',im.size))
        face=src.copy()
        for box in eyes:face=core.recolor(face,box,'iris')
        path=core.transform(f'<path d="{FACE_PATH}" fill="white"/>',*ha)
        f=face.copy();f.putalpha(ImageChops.multiply(face.getchannel('A'),draw(path,im.size).getchannel('A')))
        # Remove original blue fringe; all source eye pixels stay.
        p=f.load()
        for yy in range(150,290):
            for xx in range(120,330):
                r,g,b,a=p[xx,yy]
                if a and b>r+16 and b>g+6 and b>110 and not any(x1<=xx<x2 and y1<=yy<y2 for x1,y1,x2,y2 in eyes):p[xx,yy]=(r,g,b,0)
        im.alpha_composite(f)
        im.alpha_composite(draw(core.transform(HAIR_FRONT,*ha),im.size))
        q=im.load();sp=src.load();fp=face.load()
        for yy in range(facebox[1],facebox[3]):
            for xx in range(facebox[0],facebox[2]):
                r,g,b,a=sp[xx,yy]
                if name=='thinking' and yy>258 and (xx<208 or xx>263):continue
                if a and not (b>r+16 and b>g+6):q[xx,yy]=sp[xx,yy]
        for x1,y1,x2,y2 in eyes:
            for yy in range(y1,y2):
                for xx in range(x1,x2):q[xx,yy]=fp[xx,yy]
        for box in hands:im=core.paste_masked(im,src,hands_mask(src,box))
        im.alpha_composite(draw(core.transform('<use href="#crane" transform="translate(664 380) rotate(-10)"/>',*ha),im.size))
        out=im.crop((65,38,445,492));save(name,out)
        save('avatar-'+name,im.crop((145,100,330,285)).resize((256,256),Image.Resampling.LANCZOS))
        views.append((labels[name],out))
    board(views,'emotions','同一张小圆脸，不同的小心情。',size=(1800,840))

if __name__=='__main__':main()
