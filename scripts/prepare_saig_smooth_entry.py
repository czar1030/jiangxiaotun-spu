"""Register the walking collar and bake continuous, whole-drawing inbetweens.

No standing-leg warper or independently rotated elbow parts are used. Dense
correspondence is calculated offline between the actual drawn walking poses.
"""
from pathlib import Path
import hashlib
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw
import prepare_saig_sprite_entry as source

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'public/assets/saig-arena'
QA = ROOT/'qa/saig-entry-v5'
SUBFRAMES = 6


def smooth(x):
    x = np.clip(x, 0, 1)
    return x*x*x*(x*(x*6-15)+10)


def remap(im, dx, dy):
    """Premultiplied sampling keeps translucent outlines free of dark halos."""
    a = np.array(im).astype(np.float32)/255
    a[:, :, :3] *= a[:, :, 3:4]
    yy, xx = np.indices(a.shape[:2], dtype=np.float32)
    v = cv2.remap(a, xx-dx, yy-dy, cv2.INTER_CUBIC,
                  borderMode=cv2.BORDER_CONSTANT)
    v = np.clip(v, 0, 1)
    v[:, :, :3] /= np.maximum(v[:, :, 3:4], 1/255)
    return Image.fromarray(np.uint8(np.clip(v, 0, 1)*255))


def stabilize_collar(frames):
    # This patch is the same white/green collar in each source drawing. The
    # floor registration alone left its vertical position jumping by 17px.
    gray = [cv2.cvtColor(np.array(im)[:, :, :3], cv2.COLOR_RGB2GRAY) for im in frames]
    template = gray[0][238:263, 253:280]
    result, records = [], []
    for im, g in zip(frames, gray):
        match = cv2.matchTemplate(g[220:285, 227:309], template, cv2.TM_CCOEFF_NORMED)
        _, score, _, at = cv2.minMaxLoc(match)
        dx, dy = at[0]+227-253, at[1]+220-238
        if score < .7:
            raise ValueError('Walking collar correspondence needs review')
        yy, _ = np.indices((im.height, im.width), dtype=np.float32)
        weight = 1-smooth((yy-280)/180)
        result.append(remap(im, -dx*weight, -dy*weight))
        records.append({'collarOffset': [dx, dy], 'correlation': round(score, 4)})
    return result, records


def flow_input(im):
    a = np.array(im).astype(np.float32)/255
    # Alpha silhouette and internal linework both inform correspondence.
    rgb = a[:, :, :3]*a[:, :, 3:4]+.12*(1-a[:, :, 3:4])
    return cv2.cvtColor(np.uint8(rgb*255), cv2.COLOR_RGB2GRAY)


def between(a, b, subdivisions=SUBFRAMES):
    """Smooth the registered upper drawing; retain opaque, drawn leg poses.

    Leg occlusion cannot be inferred reliably by optical flow. Never morph or
    dissolve those silhouettes. The head/shoulder response is added afterwards.
    """
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    dis.setFinestScale(0)
    fields = [dis.calc(flow_input(a), flow_input(b), None),
              dis.calc(flow_input(b), flow_input(a), None)]
    yy, xx = np.indices((a.height, a.width), dtype=np.float32)
    upper = 1-smooth((yy-335)/35)
    fields = [cv2.GaussianBlur(np.clip(f, -26, 26), (0, 0), 3)*upper[:, :, None]
              for f in fields]
    rgba = []
    for im in [a, b]:
        v = np.array(im).astype(np.float32)/255
        v[:, :, :3] *= v[:, :, 3:4]
        rgba.append(v)
    result = [a]
    for step in range(1, subdivisions):
        t = step/subdivisions
        samples = [cv2.remap(pixels, xx-amount*f[:, :, 0], yy-amount*f[:, :, 1],
                             cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
                   for pixels, f, amount in [(rgba[0], fields[0], t), (rgba[1], fields[1], 1-t)]]
        # One source owns the silhouette; never show a dissolved hand or leg.
        v = samples[0 if t < .5 else 1].copy()
        v[:, :, :3] /= np.maximum(v[:, :, 3:4], 1/255)
        result.append(Image.fromarray(np.uint8(np.clip(v, 0, 1)*255)))
    return result


def coupled_weight_shift(im, phase, strength=1):
    # Head, collar and shoulders receive the SAME upper-body transform. The
    # support foot stays planted; small nod/lean follows the full stride.
    yy, xx = np.indices((im.height, im.width), dtype=np.float32)
    upper = 1-smooth((yy-280)/190)
    theta = 2*np.pi*phase
    angle = np.deg2rad(.32)*np.sin(theta)*strength
    pivot_x = 240 if im.width > 400 else 207
    dx = upper*(.65*np.sin(theta)-(yy-260)*angle)*strength
    dy = upper*(.9*(1-np.cos(2*theta))+(xx-pivot_x)*angle)*strength
    return remap(im, dx, dy)


def main():
    QA.mkdir(parents=True, exist_ok=True)
    first = source.split_sheet('saig-walk-sheet-keyed-v3.png', 4, 3)
    other = source.split_sheet('saig-walk-other-half-keyed-v3.png', 2, 2)
    selected = [first[0], first[1], first[2], *other, first[4]]
    result = {'version': 5, 'strideCycles': 1,
              'technique': 'native walking heads and bodies; collar registration and upper drawing inbetweens',
              'teams': {}}
    for team, version in [('blue', 7), ('red', 6)]:
        target = Image.open(OUT/f'commander-{team}-v{version}.webp').convert('RGBA')
        a, ra = source.register([selected[i] for i in [0, 1, 2, 7]], target)
        b, rb = source.register([selected[i] for i in [3, 4, 5, 6]], target)
        raw = a[:3]+b+[a[3]]
        # Register on the blue-width canvas before translating the coordinates
        # for the red canvas; both teams use identical source anatomy.
        if team == 'blue':
            _, collar_records = stabilize_collar(raw)
        normalized = []
        for im, record in zip(raw, collar_records):
            yy, _ = np.indices((im.height, im.width), dtype=np.float32)
            weight = 1-smooth((yy-280)/180)
            dx, dy = record['collarOffset']
            normalized.append(remap(im, -dx*weight, -dy*weight))
        if team == 'red':
            normalized = [source.recolor_red(im) for im in normalized]
        # Walking has its own complete head/face drawings, naturally connected
        # to these collars. The final confrontation head belongs to arrival.
        keys = normalized
        walk = []
        for i, im in enumerate(keys):
            transition = between(im, keys[(i+1) % len(keys)])
            walk.extend(coupled_weight_shift(f, (i+j/SUBFRAMES)/8)
                        for j, f in enumerate(transition))
        arrival, ar = source.register(source.split_sheet(f'saig-{team}-arrive-sheet-keyed-v3.png', 3, 2), target)
        arrival = [source.approved_head(im, target, team, 0, i) for i, im in enumerate(arrival)]
        final = target.resize(keys[0].size, Image.Resampling.LANCZOS)
        arrivals = [keys[0], *arrival, final]
        frames = walk+arrivals+[final]
        cw, ch = frames[0].size
        columns = 8
        rows = (len(frames)+columns-1)//columns
        atlas = Image.new('RGBA', (cw*columns, ch*rows))
        for i, im in enumerate(frames):
            atlas.alpha_composite(im, (i % columns*cw, i//columns*ch))
        filename = f'commander-{team}-entry-cels-v5.webp'
        atlas.save(OUT/filename, quality=92, method=6)
        result['teams'][team] = {'file': filename,
            'sha256': hashlib.sha256((OUT/filename).read_bytes()).hexdigest(),
            'cellWidth': cw, 'cellHeight': ch, 'columns': columns, 'rows': rows,
            'count': len(frames), 'walkFrames': list(range(len(walk))),
            'arrivalFrames': list(range(len(walk), len(walk)+len(arrivals))),
            'finalFrame': len(frames)-1, 'registration': ra[:3]+rb+[ra[3]]+ar,
            'collarRegistration': collar_records, 'keyframeStride': SUBFRAMES}
        review = []
        for im in walk:
            bg = Image.new('RGBA', im.size, '#15232e')
            bg.alpha_composite(im)
            review.append(bg.convert('RGB'))
        review[0].save(QA/f'{team}-walk.gif', save_all=True, append_images=review[1:],
                       duration=40, loop=0, disposal=2)
        board = Image.new('RGB', (cw*8, (ch+25)*3), '#15232e')
        d = ImageDraw.Draw(board)
        for k, i in enumerate(range(0, len(walk), 2)):
            x, y = k % 8*cw, k//8*(ch+25)
            board.paste(review[i], (x, y))
            d.text((x+10, y+ch+5), f'{team} / {i}', fill='white')
        board.save(QA/f'{team}-walk-inbetweens.jpg', quality=92)
        print(f'{team}: {len(walk)} walking + {len(arrivals)} arrival frames; {OUT.joinpath(filename).stat().st_size/1e6:.1f} MB', flush=True)
    (OUT/'sprite-entry-v5.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


if __name__ == '__main__':
    main()
