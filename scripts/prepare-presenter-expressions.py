"""Subtle brow acting on the existing approved head; no eye/face redesign."""
from pathlib import Path
import base64
import io
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'public/assets/jiangxiaotun-v5/reception.svg'
root = ET.fromstring(source.read_text(encoding='utf-8'))
head = next(node for node in root.iter() if node.get('data-soft') == 'head')
picture = next(node for node in head if node.tag.endswith('image'))
base = Image.open(io.BytesIO(base64.b64decode(picture.get('href').split(',', 1)[1]))).convert('RGBA')

def local(point):
    return point[0] - 175, point[1] - 110

styles = {
    'serious': [[(386, 414), (405, 416), (424, 422)], [(521, 422), (540, 416), (559, 414)]],
    'concerned': [[(386, 420), (405, 416), (424, 411)], [(521, 411), (540, 416), (559, 420)]],
}
previews = []
for name, paths in styles.items():
    result = base.copy()
    # Clean only the thin original pink brows; exclude hair, lashes and eyes.
    for x1, y1, x2, y2 in [(383, 409, 428, 425), (517, 409, 563, 425)]:
        for y in range(y1 - 110, y2 - 110):
            for x in range(x1 - 175, x2 - 175):
                r, g, b, a = base.getpixel((x, y))
                if a > 200 and r > 210 and 150 < b < 205 and r - g > 22 and 0 < g - b < 28:
                    sample = base.getpixel((x, y - 6))
                    if sample[0] > 220 and sample[1] > 190 and sample[2] > 175:
                        result.putpixel((x, y), sample)
    overlay = Image.new('RGBA', (base.width * 4, base.height * 4))
    draw = ImageDraw.Draw(overlay)
    for path in paths:
        a, b, c = [local(point) for point in path]
        points = []
        for i in range(25):
            t = i / 24
            points.append(tuple(round(4 * ((1-t)**2 * a[j] + 2*(1-t)*t*b[j] + t*t*c[j])) for j in range(2)))
        draw.line(points, fill=(184, 126, 107, 205), width=6, joint='curve')
    overlay = overlay.resize(base.size, Image.Resampling.LANCZOS)
    # The fringe remains in front. Never draw over the original lashes or iris.
    for y in range(298, 315):
        for x in range(205, 390):
            r, g, b, a = base.getpixel((x, y))
            if not (r > 220 and g > 190 and b > 175 and a > 200):
                overlay.putpixel((x, y), (0, 0, 0, 0))
    result.alpha_composite(overlay.filter(ImageFilter.GaussianBlur(.25)))
    # This rectangle encloses brows only; all other original pixels are exact.
    allowed = Image.new('L', base.size)
    mask = ImageDraw.Draw(allowed)
    mask.rectangle((205, 298, 253, 315), fill=255)
    mask.rectangle((342, 298, 390, 315), fill=255)
    result = Image.composite(result, base, allowed)
    assert result.getchannel('A').tobytes() == base.getchannel('A').tobytes()
    result.save(ROOT / f'public/assets/presenter/face-{name}.webp', lossless=True, method=6)
    previews.append(result)

board = Image.new('RGBA', (735, 420), '#f9faf3')
for i, image in enumerate([base, *previews]):
    board.alpha_composite(image.crop((180, 270, 425, 410)), (i * 245, 0))
board = board.crop((0, 0, 735, 140)).resize((1470, 280))
board.save(ROOT / 'qa/voice/presenter-brow-comparison.png')
