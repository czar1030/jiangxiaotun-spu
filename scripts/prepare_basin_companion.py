"""Extract the supplied basin-wearing Da Feiyu, without regenerating her artwork."""
from pathlib import Path
import hashlib
import json
import shutil

import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output/community-basin/reference.png'
SUPPLIED = Path('C:/Users/39620/AppData/Local/Temp/codex-clipboard-cb088a51-5355-4d39-9c77-21852c4ff36c.png')
DEST = ROOT / 'public/assets/community-basin'
QA = ROOT / 'qa/deepseek-basin'
for directory in [SOURCE.parent, DEST, QA]:
    directory.mkdir(parents=True, exist_ok=True)
if not SOURCE.exists():
    shutil.copyfile(SUPPLIED, SOURCE)
image = Image.open(SOURCE).convert('RGB')
assert image.size == (223, 281), 'The hand-refined trimap belongs to this exact attachment.'
rgb = np.array(image)

# Trace the bowl's top and rim, ears, individual outer locks, dress and both
# shoes. Everything far from this contour is fixed, so no white clothing or
# metallic highlights can be mistaken for background by the colour model.
outline = [
    (47,30),(61,27),(102,25),(150,27),(169,31),(182,40),(189,54),
    (194,75),(197,89),(205,92),(212,95),(211,100),(202,104),(193,106),
    (201,111),(212,117),(209,122),(196,126),(194,140),(202,155),
    (208,168),(209,180),(205,189),(198,195),(195,202),(198,208),
    (207,207),(207,213),(201,219),(192,222),(188,227),(179,230),
    (170,230),(167,235),(174,241),(173,247),(166,252),(154,256),
    (140,259),(138,269),(132,274),(120,274),(114,271),(108,274),
    (96,275),(88,272),(85,258),(68,255),(55,249),(47,243),(47,239),
    (54,232),(52,228),(46,229),(39,227),(33,222),(22,225),(13,222),
    (10,215),(14,211),(17,214),(22,214),(18,210),(14,205),(13,198),
    (14,191),(17,192),(18,197),(23,199),(26,196),(22,190),(21,181),
    (24,169),(29,156),(35,144),(36,131),(30,127),(20,128),(12,125),
    (9,120),(11,117),(20,113),(23,108),(21,105),(12,104),(7,101),
    (4,98),(5,94),(9,92),(15,90),(21,89),(24,77),(27,64),(32,51),
    (39,40),
]
mask = np.zeros(rgb.shape[:2], np.uint8)
cv2.fillPoly(mask, [np.array(outline, np.int32)], 1)
inside = ndimage.distance_transform_edt(mask)
outside = ndimage.distance_transform_edt(1-mask)
trimap = np.where(mask, cv2.GC_PR_FGD, cv2.GC_PR_BGD).astype(np.uint8)
trimap[inside > 3] = cv2.GC_FGD
trimap[outside > 2] = cv2.GC_BGD

# Background glimpses enclosed by the long hair are genuinely transparent.
holes = [
    [(37,133),(35,145),(30,156),(27,160),(29,151),(33,141)],
    [(191,135),(195,143),(198,150),(197,156),(194,152),(192,145)],
    [(196,165),(201,172),(202,180),(198,186),(195,187),(197,179)],
    [(27,177),(29,183),(30,189),(27,187),(25,182)],
]
for hole in holes:
    cv2.fillPoly(trimap, [np.array(hole, np.int32)], cv2.GC_BGD)
cv2.setRNGSeed(420)
cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), trimap, None,
            np.zeros((1,65),np.float64), np.zeros((1,65),np.float64),
            6, cv2.GC_INIT_WITH_MASK)
foreground = np.isin(trimap, [cv2.GC_FGD, cv2.GC_PR_FGD])
# Small tan openings between curls share the background colour but were too
# narrow for the conservative trimap. Limit this cleanup to the blue hair,
# away from the face, hands, metallic bowl and gold embroidery.
yy, xx = np.indices(foreground.shape)
col = rgb.astype(np.int16)
tan = (col[:,:,0]-col[:,:,1]>6) & (col[:,:,1]-col[:,:,2]>8)
hair_zone = (yy>125) & (yy<232) & ((xx<54)|(xx>171))
foreground[hair_zone & tan] = False
foreground[(yy>250) & tan & (col[:,:,0]<185)] = False
# A transparent slit separates the shoes; the photographed ground is not
# part of the character's outline.
ground_gaps = [
    [(110,259),(115,259),(115,271),(112,274),(109,272)],
    [(139,259),(145,259),(145,278),(137,278),(138,271)],
    [(83,259),(87,261),(88,272),(94,275),(94,280),(80,280)],
]
cut = np.zeros(foreground.shape,np.uint8)
for gap in ground_gaps:
    cv2.fillPoly(cut,[np.array(gap,np.int32)],1)
foreground[cut>0] = False
labels, _ = ndimage.label(foreground)
counts = np.bincount(labels.ravel()); counts[0] = 0
foreground = labels == counts.argmax()

# Fractional-pixel alpha, followed by colour decontamination from the opaque
# interior, removes the tan fringe without a dark outline or a broad blur.
alpha = cv2.GaussianBlur(foreground.astype(np.float32), (0,0), .42)
alpha[alpha < .025] = 0
alpha[alpha > .975] = 1
opaque = ndimage.binary_erosion(foreground, iterations=1)
_, nearest = ndimage.distance_transform_edt(~opaque, return_indices=True)
edge = (alpha > 0) & (alpha < .98)
clean = rgb.copy()
clean[edge] = rgb[nearest[0][edge], nearest[1][edge]]
rgba = np.dstack([clean, (alpha*255).round().astype(np.uint8)])
result = Image.fromarray(rgba)
box = result.getchannel('A').getbbox()
box = (max(0,box[0]-2), max(0,box[1]-2), min(image.width,box[2]+2), min(image.height,box[3]+2))
result = result.crop(box)
result.save(DEST/'basin-dafeiyu.webp', lossless=True, method=6)
result.save(QA/'basin-dafeiyu.png')

board = Image.new('RGB', (result.width*3, result.height), '#153d4a')
for i, colour in enumerate(['#153d4a','#ffffff','#111720']):
    tile = Image.new('RGBA',result.size,colour)
    tile.alpha_composite(result)
    board.paste(tile.convert('RGB'),(i*result.width,0))
board.resize((board.width*2,board.height*2)).save(QA/'edge-review.png')
(DEST/'provenance.json').write_text(json.dumps({
    'character':'DeepSeek 大肥鱼（铁盆造型）',
    'source':'User-supplied attachment cb088a51-5355-4d39-9c77-21852c4ff36c',
    'original':SOURCE.relative_to(ROOT).as_posix(),
    'originalSize':list(image.size), 'crop':list(box), 'assetSize':list(result.size),
    'processing':'Hand-refined trimap, local GrabCut segmentation, hair-gap cleanup, subpixel alpha and edge colour decontamination. Original artwork retained; no generation or upscaling.',
    'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'sha256':hashlib.sha256((DEST/'basin-dafeiyu.webp').read_bytes()).hexdigest(),
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Clean RGBA cutout: {result.width} x {result.height}; review: {QA / "edge-review.png"}')
