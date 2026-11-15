"""Reference-based Wuhan three-view sheet and distinct emotion/pose assets."""
from pathlib import Path
import shutil
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont
import build_mascot as core

DEST = core.DEST
SOURCE = DEST / 'sources'
source_art = Image.open(SOURCE / 'character-standard.png').convert('RGBA')
actions = Image.open(SOURCE / 'actions.png').convert('RGBA')

root = ET.fromstring('<svg>'+core.WUHAN_DETAILS+'</svg>')
parts = list(root[0])
crane = ET.tostring(parts[0], encoding='unicode')
porpoise = ET.tostring(parts[1], encoding='unicode')

def details(image, bow, apron=None, scale=.65, tower=None, worried=False):
    markup = f'<g transform="translate({bow[0]} {bow[1]}) scale({scale}) translate(-668 -380)">{crane}</g>'
    if apron:
        x,y,sx,sy = apron
        image = core.patch_emblem(image, (int(x-48*sx),int(y-45*sy),int(x+48*sx),int(y+35*sy)))
        markup += f'<g transform="translate({x} {y}) scale({sx} {sy}) translate(-475 -684)">{porpoise}</g>'
    if tower:
        markup += f'<g transform="translate({tower[0]} {tower[1]}) scale({scale})">{core.TOWER}</g>'
    if worried:
        markup += '<path d="M343 205Q352 219 348 223Q342 228 338 221Q337 217 343 205Z" fill="#bfe6f1" stroke="#fffdf4" stroke-width="1.6"/><path d="M175 247Q180 251 187 248" fill="none" stroke="#c3e7f2" stroke-width="2.8"/>'
    image.alpha_composite(core.vector_layer(markup, image.size))
    return image

def cut_background(image):
    # Only background white connected to an edge is removed. Enclosed white
    # costume, highlights and lace stay opaque.
    mask = Image.new('RGB', image.size)
    src, dst = image.load(), mask.load()
    for y in range(image.height):
        for x in range(image.width):
            r,g,b,a=src[x,y]
            if min(r,g,b)>233 and max(r,g,b)-min(r,g,b)<18: dst[x,y]=(255,255,255)
    ImageDraw.floodfill(mask,(0,0),(128,128,128),thresh=0)
    dst=mask.load()
    for y in range(image.height):
        for x in range(image.width):
            if dst[x,y]==(128,128,128): image.putpixel((x,y),(255,255,255,0))
    return image

views=[]
specs=[('front','正面',(45,0,545,605),(435,202),(294,437,.66,.66),(292,493)),
       ('side','侧面',(515,0,1015,605),(770,205),(644,438,.28,.66),(687,492)),
       ('back','背面',(1005,0,1505,605),(1096,197),None,(1265,492))]
for name,label,box,bow,apron,tower in specs:
    image=details(source_art.copy(),bow,apron,.7,tower)
    image=cut_background(image.crop(box))
    # Match the main illustration's slightly shorter body without changing the head.
    lower=image.crop((0,321,500,605)).resize((500,250),Image.Resampling.LANCZOS)
    compact=Image.new('RGBA',(500,590));compact.paste(image.crop((0,0,500,321)),(0,0));compact.paste(lower,(0,321))
    compact.save(DEST/(name+'-view.png'),optimize=True);compact.save(DEST/(name+'-view.webp'),quality=94,method=6)
    views.append((label,compact))

moods=[]
for name,label,n,bow,apron,tower in [
    ('happy','开心 · 张手欢迎',5,(337,188),(236,354,.47,.47),(234,386)),
    ('thinking','思考 · 托腮琢磨',2,(324,169),(241,349,.46,.46),(243,386)),
    ('serious','认真 · 鼓脸握拳',8,(335,184),(232,351,.46,.46),(234,387)),
    ('worried','困惑 · 垂眉汗珠',9,(334,184),(237,350,.46,.46),(236,387)),
]:
    x=n%4*512;y=n//4*512;im=actions.crop((x,y,x+512,y+512))
    before=im.copy()
    im=details(im,bow,apron,.47,tower,name=='worried')
    if name=='worried':
        # Folded hands remain in front of the apron embroidery.
        for box in [(203,333,236,366),(244,333,276,366)]:
            im.paste(before.crop(box),box[:2])
    im=im.crop((65,38,445,492))
    core.save_asset(name,im)
    # A shared face crop follows each pose's head placement instead of squeezing
    # a complete character into the chat avatar.
    avatar=im.crop((70,64,255,249)).resize((256,256),Image.Resampling.LANCZOS)
    core.save_asset('avatar-'+name,avatar)
    moods.append((label,im))

font=lambda n:ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',n)
serif=lambda n:ImageFont.truetype('C:/Windows/Fonts/simsun.ttc',n)
ink='#263956';muted='#7d8a98';gold='#bb9b61'
board=Image.new('RGB',(1800,1040),'#f5f7f7');draw=ImageDraw.Draw(board)
draw.text((65,40),'江小豚 · 武汉见面版',font=serif(44),fill=ink)
draw.text((67,103),'CHARACTER TURNAROUND  /  正面 · 侧面 · 背面',font=font(17),fill=muted)
for n,(label,im) in enumerate(views):
    x=65+n*570
    draw.rounded_rectangle((x,158,x+535,890),radius=24,fill='#fffefb',outline='#dde5e8',width=2)
    art=im.copy();art.thumbnail((520,650),Image.Resampling.LANCZOS)
    board.paste(art,(x+(535-art.width)//2,185),art)
    draw.line((x+38,792,x+497,792),fill='#e2e7e8',width=2)
    draw.text((x+215,825),label,font=font(27),fill=ink)
draw.text((67,922),'黄鹤小发饰  ·  江豚围兜  ·  黄鹤楼裙边刺绣  ·  蓝白蓬松裙与双叶尾鳍',font=font(22),fill=ink)
draw.text((67,977),'参考改编：上善无形 / ZipZipPipe / YunYueSama（github.com/YunYueSama/codex-deepseek-pet） · 设定参考 xiaoweigen',font=font(15),fill=muted)
draw.text((67,1003),'美术改编 CC BY-NC-SA 4.0 · 完整许可、来源及修改记录随素材保留',font=font(14),fill=muted)
board.save(DEST/'three-views.png');board.save(DEST/'three-views.webp',quality=92,method=6)

sheet=Image.new('RGB',(1800,840),'#f5f7f7');d=ImageDraw.Draw(sheet)
d.text((65,38),'江小豚的四种小情绪',font=serif(42),fill=ink)
d.text((67,100),'EMOTION & POSE  /  眼睛、眉毛、嘴型和手势一起表达',font=font(17),fill=muted)
for n,(label,im) in enumerate(moods):
    x=45+n*440;d.rounded_rectangle((x,150,x+420,697),radius=22,fill='#fffefb',outline='#dde5e8',width=2)
    art=im.copy();art.thumbnail((405,465),Image.Resampling.LANCZOS);sheet.paste(art,(x+(420-art.width)//2,170),art)
    d.text((x+40,651),label,font=font(23),fill=ink)
d.text((67,737),'同一角色设定：黄鹤发饰、江豚围兜、黄鹤楼纹样，在各个表情里保持一致。',font=font(20),fill=ink)
d.text((67,788),'参考改编：上善无形 / ZipZipPipe / YunYueSama · 设定参考 xiaoweigen · CC BY-NC-SA 4.0 · 详见 CREDITS.md',font=font(16),fill=muted)
sheet.save(DEST/'emotions.png');sheet.save(DEST/'emotions.webp',quality=92,method=6)
print('Built matching three views, four distinct emotions, avatars and two design sheets.')

import json,hashlib
meta=json.loads((DEST/"provenance.json").read_text("utf8"))
meta["additionalSources"]=[{"path":p.name,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()} for p in [SOURCE/"character-standard.png",SOURCE/"actions.png"]]
meta["emotionFrames"]={"happy":5,"thinking":2,"serious":8,"worried":9}
meta["changes"] += ["正侧背三视图", "黄鹤楼裙边刺绣", "四种独立表情与手势", "困惑汗珠"]
(DEST/"provenance.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding="utf8")
