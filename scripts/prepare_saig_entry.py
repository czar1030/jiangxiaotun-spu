"""Derive entrance poses from the existing approved drawings; no new identity."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/saig-arena'


def build(team):
    image = Image.open(ROOT / 'output/imagegen/saig-walk-alpha-v2.png').convert('RGBA')
    if team == 'red':
        a = np.array(image)
        rgb = a[:, :, :3].astype(float) / 255
        yy, xx = np.indices(a.shape[:2])
        mask = ((xx > 345) & (xx < 610) & (yy > 690) & (yy < 875)
                & (rgb[:, :, 2] > rgb[:, :, 0] * 1.12)
                & (rgb[:, :, 2] > rgb[:, :, 1] * 1.05)
                & (rgb.max(2) - rgb.min(2) > .17))
        luminance = rgb[:, :, 0] * .2126 + rgb[:, :, 1] * .7152 + rgb[:, :, 2] * .0722
        red = np.array([.79, .20, .27])
        scale = luminance[mask] / (red @ np.array([.2126, .7152, .0722]))
        a[:, :, :3][mask] = np.clip(red[None, :] * scale[:, None] * 255, 0, 255).astype('uint8')
        image = Image.fromarray(a)
    if team == 'blue':
        padded = Image.new('RGBA', (1280, 1536))
        padded.alpha_composite(image, (100, 0))
        image = padded
    final = Image.open(DEST / f'commander-{team}-v{7 if team == "blue" else 6}.webp').convert('RGBA')
    width, height = final.size
    yy = np.arange(height)[:, None]
    smooth = lambda x: x*x*(3-2*x)
    torso = smooth(np.clip((yy-680)/45, 0, 1)) * (1-smooth(np.clip((yy-1080)/55, 0, 1)))
    mask = Image.fromarray(np.tile((torso*255).astype('uint8'), (1, width)))
    if team == 'blue':
        reach = Image.new('L', final.size)
        ImageDraw.Draw(reach).polygon([(895,730),(925,660),(1210,605),(1240,750),(1040,870),(840,870)], fill=255)
        mask = Image.fromarray(np.maximum(np.array(mask), np.array(reach)))
    image = Image.composite(image, final, mask)
    pad = 0 if team == 'blue' else -100
    head = Image.new('L', final.size)
    ImageDraw.Draw(head).polygon([(0,0),(1100+pad,0),(1100+pad,580),(965+pad,598),
        (935+pad,655),(905+pad,695),(810+pad,720),(640+pad,735),(470+pad,725),(270+pad,715),(0,715)], fill=255)
    image = Image.composite(final, image, head.filter(ImageFilter.GaussianBlur(.7)))
    name = f'commander-{team}-walk-v2.webp'
    image.save(DEST/name, lossless=True, method=6)
    # Each complete leg is one soft surface beneath the skirt. This permits
    # front/back overlap in a forward stride without stretching the other leg
    # or squeezing shoes through a single connected sheet of empty space.
    parts = Image.new('RGB', final.size, (0, 0, 255))
    draw = ImageDraw.Draw(parts)
    if team == 'blue':
        near = [(458,1174),(608,1211),(550,1300),(555,1480),(325,1480),(325,1350),(395,1240)]
        far = [(680,1200),(828,1198),(870,1280),(980,1340),(980,1450),(712,1450),(672,1300)]
    else:
        near = [(415,1175),(572,1214),(510,1310),(525,1480),(315,1480),(315,1350),(365,1250)]
        far = [(613,1205),(737,1198),(765,1295),(850,1340),(850,1440),(590,1440),(590,1320)]
    draw.polygon(near, fill=(255,0,0));draw.polygon(far,fill=(0,255,0))
    parts.save(DEST/f'commander-{team}-walk-parts-v2.png')
    # The aligned closed-eye texture keeps the same body and every outline.
    blink = Image.open(DEST/f'commander-{team}-blink-v{7 if team == "blue" else 6}.webp').convert('RGBA')
    eye_mask = Image.new('L', final.size)
    d = ImageDraw.Draw(eye_mask)
    if team == 'blue':
        d.rounded_rectangle((610,465,800,620), radius=12, fill=255)
        d.rounded_rectangle((835,435,925,575), radius=10, fill=255)
    else:
        d.rounded_rectangle((500,460,700,625), radius=12, fill=255)
        d.rounded_rectangle((760,430,845,570), radius=10, fill=255)
    Image.composite(blink, image, eye_mask.filter(ImageFilter.GaussianBlur(2))).save(DEST/f'commander-{team}-walk-blink-v2.webp',lossless=True,method=6)
    return {'file': name, 'source': 'output/imagegen/saig-walk-alpha-v2.png',
        'registrationSource': f'commander-{team}-v{7 if team == "blue" else 6}.webp',
        'processing': 'New identity-preserving API drawing with relaxed free arms. Preserve registered final face and lower hem/feet for the planted pose transition. Blue canvas padded 100px; red armband recolored within its fabric only.',
        'sha256': hashlib.sha256((DEST/name).read_bytes()).hexdigest()}


if __name__ == '__main__':
    metadata = {'poses': {team: build(team) for team in ['blue', 'red']},
        'reference': 'https://www.bilibili.com/video/BV1sQdmBEE3t/',
        'note': 'Reference used for timing and body mechanics only; no reference footage is embedded in the site.'}
    (DEST/'entry-provenance.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
