"""Isolate the approved mascot's amber irises; keep the original face and lashes.

Only this story illustration uses these layers. Source attribution remains in
assets/jiangxiaotun-v5/CREDITS.md. Requires Pillow and resvg-py.
"""
from pathlib import Path
import io
import resvg_py
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/community-story'
SOURCE = ROOT / 'public/assets/jiangxiaotun-v5/welcome.png'
IRIS = 'M218 325C228 321 246 322 251 326C259 332 261 342 259 351C258 360 253 366 247 368C239 370 229 370 222 368C211 361 208 346 213 332Z'


def main():
    original = Image.open(SOURCE).convert('RGBA')
    for side, transform, box in [
        ('left', '', (202, 316, 270, 380)),
        ('right', 'translate(594 0) scale(-1 1)', (324, 316, 392, 380)),
    ]:
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="645" height="850"><path d="{IRIS}" transform="{transform}" fill="white"/></svg>'
        mask = Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=svg))).getchannel('A')
        iris = original.copy()
        iris.putalpha(ImageChops.multiply(original.getchannel('A'), mask))
        iris.crop(box).save(DEST / f'invitation-iris-{side}.webp', lossless=True, method=6)
    print('Isolated two original amber irises for the community invitation.')


if __name__ == '__main__':
    main()
