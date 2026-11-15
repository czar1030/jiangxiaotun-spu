"""Extract the user's seated character, retaining all enclosed white details."""
from pathlib import Path
import hashlib
import json
import shutil

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output/community-rim/reference.png'
DEST = ROOT / 'public/assets/community-rim'
QA = ROOT / 'qa/community-rim'
for folder in (SOURCE.parent, DEST, QA):
    folder.mkdir(parents=True, exist_ok=True)
if not SOURCE.exists():
    shutil.copyfile('C:/Users/39620/AppData/Local/Temp/codex-clipboard-cc1f5177-91d8-40c8-9d11-e5e4c3f75d59.png', SOURCE)

rgb = np.array(Image.open(SOURCE).convert('RGB'))
white = rgb.min(axis=2) > 242
labels, _ = ndimage.label(white)
outside_ids = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
outside = np.isin(labels, outside_ids[outside_ids != 0])
components, _ = ndimage.label(~outside)
sizes = np.bincount(components.ravel())
sizes[0] = 0
silhouette = components == sizes.argmax()
# Only the exterior contour is matted; the white blouse and eye highlights
# remain opaque. The detached black mark at the attachment's right is omitted.
edge = silhouette & (ndimage.distance_transform_edt(silhouette) < 1.5)
alpha = silhouette.astype(float)
alpha[edge] = 1 - rgb.min(axis=2)[edge] / 255
alpha[alpha < .06] = 0
clean = rgb.astype(float)
soft = (alpha > 0) & (alpha < 1)
clean[soft] = np.clip((clean[soft] - 255 * (1 - alpha[soft, None])) / alpha[soft, None], 0, 255)
result = Image.fromarray(np.dstack((clean.round().astype('uint8'), (alpha * 255).round().astype('uint8'))))
result.save(DEST / 'seated-companion.png')
result.save(DEST / 'seated-companion.webp', lossless=True, method=6)
board = Image.new('RGB', (result.width * 3, result.height))
for i, colour in enumerate(('#123244', '#ffffff', '#25232b')):
    tile = Image.new('RGBA', result.size, colour)
    tile.alpha_composite(result)
    board.paste(tile.convert('RGB'), (i * result.width, 0))
board.resize((board.width * 2, board.height * 2)).save(QA / 'edge-review.png')
(DEST / 'provenance.json').write_text(json.dumps({
    'source': 'User-supplied attachment cc1f5177-91d8-40c8-9d11-e5e4c3f75d59',
    'original': SOURCE.relative_to(ROOT).as_posix(),
    'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'processing': 'Exterior-connected white removal, largest silhouette selection and white-matte decontamination. Original pixels and enclosed white details retained.',
    'originalSize': list(result.size),
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared transparent seated character: {result.size}')
