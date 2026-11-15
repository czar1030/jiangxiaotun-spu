"""Build a lightly adapted reference mascot. This is derivative artwork, not a new IP.

Keep the source face, hair, costume and shading; add small Wuhan accessories.
Pillow handles image composition; PyMuPDF renders only the small vector overlay.
No image generation API is used. See the accompanying credits and licenses.
"""
from pathlib import Path
import base64
import hashlib
import io
import json
import math
import fitz
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/jiangxiaotun-v2'
SOURCE = DEST / 'sources/deepseek-idle-front.png'

def vector_layer(markup, size=(1024, 1024)):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{size[0]}" height="{size[1]}" viewBox="0 0 {size[0]} {size[1]}">{markup}</svg>'
    source = fitz.open(stream=svg.encode(), filetype='svg')
    pdf = fitz.open('pdf', source.convert_to_pdf())
    pix = pdf[0].get_pixmap(alpha=True)
    return Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGBA')

def patch_emblem(image, box=(425, 638, 522, 718)):
    # The whale on the apron is a costume motif, not an artist's signature.
    # Replace only its blue pixels; preserve the surrounding lace and stitching.
    mask = Image.new('L', image.size)
    pixels, alpha = image.load(), mask.load()
    x1, y1, x2, y2 = box
    for y in range(y1, y2):
        for x in range(x1, x2):
            r, g, b, a = pixels[x, y]
            if b > r + 22 and b > g + 9:
                alpha[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(5 if x2-x1>80 else 3)).filter(ImageFilter.GaussianBlur(.55))
    patch = image.copy()
    pp = patch.load()
    for y in range(y1-3, y2+4):
        left, right = pixels[x1-5, y], pixels[x2+6, y]
        for x in range(x1-3, x2+4):
            t = (x - x1+5) / (x2-x1+11)
            pp[x, y] = tuple(round(a * (1-t) + b * t) for a, b in zip(left, right))
    return Image.composite(patch, image, mask)

# A small crane replaces only the gold bow centre. A round-headed, finless
# porpoise replaces the spouting whale on the apron. All original hair and
# costume artwork stays in place.
WUHAN_DETAILS = '''
<g stroke-linecap="round" stroke-linejoin="round">
  <g transform="translate(668 380) rotate(-9)" stroke="#a37b3d" stroke-width="1.5">
    <path d="M-19 6Q-7-5 7 3Q14 9 6 14Q-6 18-19 6Z" fill="#f1d493"/>
    <path d="M6 7C17 1 8-7 16-12Q21-16 25-11" fill="none" stroke="#ffedb5" stroke-width="5.5"/>
    <path d="M24-11L35-8L24-6Z" fill="#d6a861" stroke="none"/>
    <circle cx="22" cy="-12" r="1.2" fill="#655d55" stroke="none"/>
    <path d="M-11 6Q-1 5 6 11" fill="none" stroke="#fff3cb"/>
    <path d="M-7 17L-10 29M3 17L7 28" fill="none" stroke="#e7c990" stroke-width="2"/>
    <circle cx="-10" cy="31" r="3" fill="#9ed1c6"/><circle cx="7" cy="30" r="3" fill="#9ed1c6"/>
  </g>
  <g stroke="#4976a1" stroke-width="1.5">
    <path d="M435 687C431 672 443 661 460 662C477 661 486 668 490 675C500 678 504 672 510 666Q516 680 503 686Q514 690 514 699Q502 703 491 692C478 705 448 710 438 697Q435 693 435 687Z" fill="#5b8ec3"/>
    <path d="M440 689Q453 704 476 696Q465 708 449 701Q441 698 440 689" fill="#b0d5e3" stroke="none"/>
    <circle cx="444" cy="680" r="2.4" fill="#f5fbff" stroke="none"/>
    <path d="M438 687Q443 692 448 688" fill="none" stroke="#e7f7ff" stroke-width="1.8"/>
    <path d="M434 712Q445 706 456 712T478 712T500 712" fill="none" stroke="#bc9b62" stroke-width="1.6"/>
  </g>
</g>'''

TOWER = '''<g stroke="#e6c785" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle r="14" fill="#29385e" stroke="none"/><path d="M-12 7H12M-9 3H9M-12-1L-6-4H6L12-1ZM-9-6L-4-9H4L9-6ZM-5-12L0-15L5-12M-6 0V6M6 0V6M-4-5V-2M4-5V-2M0-17V-15"/></g>'''

def source_frame(closed=False):
    pair = Image.open(SOURCE).convert('RGBA')
    image = pair.crop((1024 if closed else 0, 0, 2048 if closed else 1024, 1024))
    image = patch_emblem(image)
    image.alpha_composite(vector_layer(WUHAN_DETAILS))
    image.alpha_composite(vector_layer('<g transform="translate(462 757)">'+TOWER+'</g>'))
    return image

def with_smile(image):
    # A subtle smile changes the existing tiny mouth; facial proportions stay exact.
    patch = Image.new('RGBA', image.size)
    draw = ImageDraw.Draw(patch)
    draw.ellipse((458, 496, 479, 513), fill=(255, 239, 232, 255))
    draw.arc((460, 498, 477, 510), 4, 176, fill='#b95e6b', width=2)
    return Image.alpha_composite(image, patch.filter(ImageFilter.GaussianBlur(.25)))

def compact(image):
    # Preserve the head exactly. Shorten only the lower portion by 12%, keeping
    # the original full dress, both shoes and the complete tail in frame.
    cut = 533
    lower = image.crop((0, cut, 1024, 970))
    lower = lower.resize((1024, round(lower.height * .88)), Image.Resampling.LANCZOS)
    output = Image.new('RGBA', (1024, cut + lower.height))
    output.paste(image.crop((0, 0, 1024, cut)), (0, 0))
    output.paste(lower, (0, cut))
    return output.crop((175, 110, 820, output.height - 4))

def save_asset(name, image):
    image.save(DEST / f'{name}.png', optimize=True)
    image.save(DEST / f'{name}.webp', quality=94, method=6)
    data = base64.b64encode((DEST / f'{name}.png').read_bytes()).decode()
    # Editable vector accessories and attribution accompany this raster-derived
    # SVG wrapper; do not describe the source character as pure vector artwork.
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{image.width}" height="{image.height}" viewBox="0 0 {image.width} {image.height}" role="img" aria-labelledby="title desc"><title id="title">江小豚 · 蓝白女仆参考改编 · {name}</title><desc id="desc">基于上善无形、ZipZipPipe、YunYueSama 的鲸鱼娘形象轻度改编，新增黄鹤发饰与江豚围兜。CC BY-NC-SA 4.0。完整来源与许可见同目录 CREDITS.md。</desc><image width="{image.width}" height="{image.height}" href="data:image/png;base64,{data}"/></svg>'''
    (DEST / f'{name}.svg').write_text(svg, encoding='utf8')

opened = source_frame()
closed = source_frame(True)
for name, image in [('welcome', with_smile(opened)), ('blink', with_smile(closed)), ('thinking', closed), ('happy', with_smile(closed))]:
    save_asset(name, compact(image))
for name, image in [('avatar', opened), ('avatar-thinking', closed)]:
    image = image.crop((270, 205, 688, 623)).resize((256, 256), Image.Resampling.LANCZOS)
    save_asset(name, image)
(DEST / 'wuhan-details.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">'+WUHAN_DETAILS+'</svg>', encoding='utf8')
meta = {
    'name': '江小豚 · 蓝白女仆参考改编版',
    'type': 'reference-based derivative, raster character with vector accessories',
    'source': 'https://github.com/YunYueSama/codex-deepseek-pet/blob/main/assets/whale/idle-front.png',
    'settingReference': 'https://github.com/xiaoweigen/deepseek-dafeiyu-assets',
    'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'credits': ['上善无形（上善）', 'ZipZipPipe', 'YunYueSama', 'xiaoweigen（设定资料参考）'],
    'license': 'CC BY-NC-SA 4.0; retain applicable upstream attribution license',
    'changes': ['黄鹤发饰', '无喷泉、无背鳍的江豚围兜纹样', '下半身轻度压缩为更短圆的比例', '轻微微笑', '透明立绘与头像裁切', '闭眼状态与网页眨眼'],
    'aiImageGenerationUsed': False,
}
(DEST / 'provenance.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf8')
print('Built reference-based Wuhan mascot: welcome, blink, thinking, happy and avatars.')
