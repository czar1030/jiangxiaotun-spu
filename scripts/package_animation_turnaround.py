"""Package the inspected generated turnaround and its animation references."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'output/imagegen/jiangxiaotun-turnaround-v1'
DEST = ROOT / 'output/jiangxiaotun-animation-reference-v1'
DEST.mkdir(exist_ok=True)
generated = Image.open(SOURCE / 'turnaround-generated.png').convert('RGB')
# The provider returned uneven column widths despite the prompt. Find the
# actual white gutters; equal-third cuts would amputate the front tail.
columns = (np.array(generated).min(axis=2) < 220).sum(axis=0) > 2
spans = []
for x, occupied in enumerate(columns):
    if occupied:
        if not spans or x > spans[-1][-1] + 1:
            spans.append([x])
        else:
            spans[-1].append(x)
assert len(spans) == 3, 'Inspect figure boundaries before packaging.'
width = max(span[-1] - span[0] + 1 for span in spans) + 144
width = ((width + 15) // 16) * 16
height = ((generated.height + 79) // 16) * 16
image = Image.new('RGB', (width * 3, height), 'white')
for i, name in enumerate(('front', 'left-profile', 'back')):
    span = spans[i]
    left, right = max(0, span[0] - 5), min(generated.width, span[-1] + 6)
    crop = generated.crop((left, 0, right, generated.height))
    panel = Image.new('RGB', (width, height), 'white')
    panel.paste(crop, ((width - crop.width) // 2, 32))
    panel.save(DEST / f'{name}.png')
    image.paste(panel, (i * width, 0))
image.save(DEST / 'jiangxiaotun-three-views.png')
preview = image.copy()
preview.thumbnail((1800, 1200), Image.Resampling.LANCZOS)
preview.save(DEST / 'preview.png')
shutil.copyfile(SOURCE / 'current-front-reference.png', DEST / 'current-web-front.png')
shutil.copyfile(SOURCE / 'current-front-transparent.png', DEST / 'current-web-front-transparent.png')
shutil.copyfile(SOURCE / 'turnaround-prompt.txt', DEST / 'generation-prompt.txt')
shutil.copyfile(ROOT / 'public/assets/jiangxiaotun-v5/CREDITS.md', DEST / 'CREDITS.md')
(DEST / '使用说明.txt').write_text('''江小豚 · AI 动画角色参考包

jiangxiaotun-three-views.png：纯白底正面、左侧面、背面三视图，供角色一致性参考。
front.png / left-profile.png / back.png：由同一张三视图拆出的独立视图，没有分别重新生成。
current-web-front.png：直接从当前网站角色和渲染器导出的正面，作为脸型、比例、衣服细节的原始基准。
current-web-front-transparent.png：同一网页正面的透明底版本。

制作：沿用用户已配置的绘图 API，通过 imagegen CLI 的 gpt-image-2 图像编辑模式制作。输入为当前网页正面和旧版结构三视图；当前正面优先，侧面和背面按当前服装补全。没有替换网站现有角色。
完整生成提示词见 generation-prompt.txt；原始素材及改编署名见 CREDITS.md。

使用建议：
1. 将三视图作为角色设定参考，将独立正面作为首帧参考；若平台支持多图，再上传网页原始正面锁定脸型。
2. 每次先制作 5–8 秒、单一动作的片段，避免同时转身、跑跳、挥手和切镜头。
3. 保持琥珀短发、金色眼睛、黄鹤簪、青玉米白荆楚服装和蓝灰江豚尾鳍，不改变头身比。

招呼动作提示词参考：
固定全身镜头，江小豚先注意到镜头，眼神柔和地看向观众，微微歪头，嘴角轻轻上扬，重心自然移向支撑腿，再抬起右手做两次小幅柔软挥手。肩、上臂、前臂和手腕连续衔接；头部随身体微动，发梢、衣袖和裙摆略有延迟地跟随。随后自然收手，回到与首帧接近的站姿。保持单一口型，不出现重影、穿模、多余手指、脚部滑动或头身脱节。白色背景、柔和均匀光线，角色身份和服装细节与参考图一致。
''', encoding='utf-8')
(DEST / 'manifest.json').write_text(json.dumps({
    'character': '江小豚', 'model': 'gpt-image-2', 'mode': 'imagegen CLI edit',
    'sheetSize': list(image.size), 'generatedSize': list(generated.size),
    'viewSize': [width, height], 'views': ['front', 'left-profile', 'back'],
    'processing': 'Original generated pixels retained without upscaling; white gutters detected before splitting and re-spacing, retaining every hair and tail tip.',
    'sheetSha256': hashlib.sha256((DEST / 'jiangxiaotun-three-views.png').read_bytes()).hexdigest(),
    'reference': 'Current website reception.svg with live resting pose; older views for side/back topology only',
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
archive = DEST.parent / (DEST.name + '.zip')
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as bundle:
    for path in sorted(DEST.iterdir()):
        if path.is_file():
            bundle.write(path, path.name)
print(json.dumps({'sheetSize': list(image.size), 'directory': str(DEST), 'archive': str(archive)}, ensure_ascii=False))
