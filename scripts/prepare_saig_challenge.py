"""Prepare the blue challenge without shrinking its head to fit the reach."""
from pathlib import Path
import copy, hashlib, json
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/saig-arena'


def main():
    previous = json.loads((DEST/'commander-provenance-v6.json').read_text(encoding='utf-8'))
    opened = Image.open(ROOT/'output/imagegen/saig-challenge-alpha-v7.png').convert('RGBA')
    closed = Image.open(ROOT/'output/imagegen/saig-challenge-blink-alpha-v7.png').convert('RGBA')
    if opened.size != closed.size:
        raise ValueError('The blink must use the original challenge canvas')
    mask = Image.new('L', opened.size)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((520,445,710,558), radius=12, fill=255)
    draw.rounded_rectangle((774,403,855,510), radius=10, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(2))
    closed = Image.composite(closed, opened, mask)
    # Reuse the rival's uniform scale and floor height. A wider transparent
    # canvas accommodates the hand; the head and clothing are never squeezed.
    scale = previous['shared_scale']
    size = tuple(round(v*scale) for v in opened.size)
    floor = opened.getchannel('A').point(lambda a:255 if a>90 else 0).getbbox()[3]
    offset = ((1280-size[0])//2, 1456-round(floor*scale))
    prepared = []
    for expression, source in [('open',opened), ('blink',closed)]:
        canvas = Image.new('RGBA',(1280,1536))
        canvas.alpha_composite(source.resize(size,Image.Resampling.LANCZOS),offset)
        suffix = '-blink' if expression == 'blink' else ''
        canvas.save(DEST/f'commander-blue{suffix}-v7.webp',lossless=True,method=6)
        prepared.append(canvas)
    difference = ImageChops.difference(*prepared).convert('RGB').getbbox()
    assert difference and difference[1] > 400 and difference[3] < 700
    metadata = copy.deepcopy(previous)
    metadata.pop('size',None)
    metadata['poses']['red']['size'] = [1024,1536]
    metadata['poses']['blue'] = {
        'pose':'challenge', 'size':[1280,1536], 'scale':scale, 'offset':offset,
        'source':'output/imagegen/saig-challenge-keyed-v7.png',
        'prompt':'output/imagegen/saig-challenge-prompt-v7.txt',
        'blink_prompt':'output/imagegen/saig-challenge-blink-prompt-v7.txt',
        'asset':'commander-blue-v7.webp', 'blink_asset':'commander-blue-blink-v7.webp',
        'blink_difference_bbox':difference,
        'sha256':hashlib.sha256((DEST/'commander-blue-v7.webp').read_bytes()).hexdigest(),
    }
    (DEST/'commander-provenance-v7.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
    report = ['# Blue challenge v7','Mode: user-authorized imagegen fallback CLI / gpt-image-2.',
              'Red keeps the approved v6 folded-arm art.', '']
    for key in ['asset','blink_asset']:
        path = DEST/metadata['poses']['blue'][key]
        report.append(f'Asset: [{path.name}]({path.as_posix()})')
    for name in ['saig-challenge-prompt-v7.txt','saig-challenge-blink-prompt-v7.txt']:
        path = ROOT/'output/imagegen'/name
        report.extend(['',f'Prompt: [{name}]({path.as_posix()})','',path.read_text(encoding='utf-8-sig')])
    (ROOT/'output/imagegen/saig-challenge-delivery-v7.md').write_text('\n'.join(report),encoding='utf-8')
    board = Image.new('RGBA',(900,600),'#14212e')
    blue = prepared[0].resize((480,576),Image.Resampling.LANCZOS)
    red = Image.open(DEST/'commander-red-v6.webp').transpose(Image.Transpose.FLIP_LEFT_RIGHT).resize((384,576),Image.Resampling.LANCZOS)
    board.alpha_composite(blue,(0,0));board.alpha_composite(red,(510,0))
    board.convert('RGB').save(ROOT/'output/imagegen/saig-challenge-preview-v7.jpg',quality=95)
    print('Prepared full-body blue challenge, eye-only blink, and preserved rival scale')


if __name__ == '__main__':
    main()
