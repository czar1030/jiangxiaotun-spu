"""Split a versioned sprite strip, retaining the generated alpha."""
from pathlib import Path
import argparse,hashlib,json
import numpy as np
from scipy import ndimage
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'output/imagegen/community-minis'
DEST=ROOT/'public/assets/community-minis'


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--version',choices=['v1','v2'],default='v1')
    version=parser.parse_args().version
    DEST.mkdir(parents=True,exist_ok=True)
    image=Image.open(SOURCE/f'porpoise-sprites-keyed-{version}.png').convert('RGBA')
    pixels=np.array(image)
    labels,count=ndimage.label(pixels[:,:,3]>4)
    counts=np.bincount(labels.ravel());counts[0]=0
    components=[]
    for identifier in np.argsort(counts)[-3:]:
        ys,xs=np.where(labels==identifier)
        components.append((int(xs.min()),identifier,(int(xs.min())-3,int(ys.min())-3,int(xs.max())+4,int(ys.max())+4)))
    components.sort()
    scale=494/max(box[2]-box[0] for _,_,box in components)
    names=['hello','joy','hope']
    metadata={'mode':'user-authorized imagegen fallback CLI, gpt-image-2',
              'source':f'output/imagegen/community-minis/porpoise-sprites-keyed-{version}.png',
              'prompt':f'output/imagegen/community-minis/porpoise-sprites-prompt-{version}.txt',
              'style':'soft plush' if version=='v1' else 'clean outlined 2D cartoon, restrained cel shading',
              'processing':'Three connected figures isolated; original generated RGBA retained, shared uniform scale, shared floor',
              'assets':[]}
    board=Image.new('RGBA',(900,340),'#163c4a')
    for index,((_,identifier,box),name) in enumerate(zip(components,names)):
        selected=ndimage.binary_dilation(labels==identifier,iterations=3)
        sprite=pixels.copy();sprite[:,:,3]=np.where(selected,pixels[:,:,3],0)
        sprite=Image.fromarray(sprite).crop(box)
        size=tuple(round(v*scale) for v in sprite.size)
        canvas=Image.new('RGBA',(512,544))
        canvas.alpha_composite(sprite.resize(size,Image.Resampling.LANCZOS),((512-size[0])//2,530-size[1]))
        asset=DEST/f'porpoise-{name}-{version}.webp'
        canvas.save(asset,lossless=True,method=6)
        metadata['assets'].append({'pose':name,'path':asset.relative_to(ROOT).as_posix(),'size':[512,544],
                                   'sha256':hashlib.sha256(asset.read_bytes()).hexdigest()})
        board.alpha_composite(canvas.resize((280,298),Image.Resampling.LANCZOS),(index*300+10,10))
    (DEST/f'provenance-{version}.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
    board.convert('RGB').save(SOURCE/f'porpoise-preview-{version}.jpg',quality=95)
    prompt=(SOURCE/f'porpoise-sprites-prompt-{version}.txt').read_text(encoding='utf-8-sig')
    report=['# Community mini porpoises','Mode: user-authorized imagegen fallback CLI / gpt-image-2.','',
            'Ten placements in the community scene; three poses with a shared baseline.','']
    for asset in metadata['assets']:
        path=ROOT/asset['path'];report.append(f'Asset: [{path.name}]({path.as_posix()})')
    report.extend(['','## Exact sprite-strip prompt',prompt])
    (SOURCE/f'delivery-{version}.md').write_text('\n'.join(report),encoding='utf-8')
    print('Prepared three mini porpoise poses with clean alpha and a shared baseline')


if __name__=='__main__':main()
