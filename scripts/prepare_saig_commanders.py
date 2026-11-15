"""Align cohesive full-body rival poses and eye-only blink textures."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFilter,ImageChops

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/assets/saig-arena'
SOURCES={'blue':'hips','red':'folded'}

def clean(image):
    arr=np.array(image.convert('RGBA'));rgb=arr[:,:,:3].astype(float)
    alpha=Image.fromarray(arr[:,:,3]);eroded=np.array(alpha.filter(ImageFilter.MinFilter(5)))
    edge=arr[:,:,3]>eroded
    # Generated cutouts retain alpha. Remove saturated key spill at the outer
    # edge only; the amber hair, warm outlines and jade costume stay intact.
    spill=((rgb[:,:,0]>210)&(rgb[:,:,1]>220)&(rgb[:,:,2]<110))|((rgb[:,:,0]>200)&(rgb[:,:,1]<85)&(rgb[:,:,2]<115))|((rgb[:,:,0]<110)&(rgb[:,:,1]>180)&(rgb[:,:,2]>180))
    arr[:,:,3][edge&spill]=0
    return Image.fromarray(arr)

def main():
    DEST.mkdir(parents=True,exist_ok=True)
    images={team:clean(Image.open(ROOT/f'output/imagegen/saig-{pose}-keyed-v6.png')) for team,pose in SOURCES.items()}
    if len({im.size for im in images.values()})!=1:raise ValueError('Rival poses must share framing')
    boxes=[im.getchannel('A').point(lambda a:255 if a>90 else 0).getbbox() for im in images.values()]
    bounds=(min(b[0] for b in boxes)-4,min(b[1] for b in boxes)-4,max(b[2] for b in boxes)+4,max(b[3] for b in boxes)+4)
    scale=min(920/(bounds[2]-bounds[0]),1390/(bounds[3]-bounds[1]))
    size=(round((bounds[2]-bounds[0])*scale),round((bounds[3]-bounds[1])*scale))
    offset=((1024-size[0])//2,1456-size[1])
    metadata={'generation':'User-authorized imagegen fallback CLI, gpt-image-2','size':[1024,1536],
      'orientation':'Both sources face right in three-quarter view; red is mirrored in the scene',
      'shared_source_bounds':bounds,'shared_scale':scale,'poses':{}}
    previews=[]
    for team,pose in SOURCES.items():
        opened=images[team]
        closed=clean(Image.open(ROOT/f'output/imagegen/saig-{pose}-blink-v6.png'))
        if closed.size!=opened.size:raise ValueError('Blink must use original canvas')
        mask=Image.new('L',opened.size);draw=ImageDraw.Draw(mask)
        draw.rounded_rectangle((545,435,748,555),radius=18,fill=255)
        draw.rounded_rectangle((790,404,885,535),radius=14,fill=255)
        mask=mask.filter(ImageFilter.GaussianBlur(2.5))
        closed=Image.composite(closed,opened,mask)
        prepared=[]
        for expression,im in [('open',opened),('blink',closed)]:
            canvas=Image.new('RGBA',(1024,1536))
            canvas.alpha_composite(im.crop(bounds).resize(size,Image.Resampling.LANCZOS),offset)
            name=f'commander-{team}'+('-blink' if expression=='blink' else '')+'-v6.webp'
            canvas.save(DEST/name,lossless=True,method=6)
            prepared.append(canvas)
        difference=ImageChops.difference(prepared[0],prepared[1]).convert('RGB').getbbox()
        assert difference and difference[1]>400 and difference[3]<700, 'Blink must only replace eyes'
        metadata['poses'][team]={'pose':pose,'source':f'output/imagegen/saig-{pose}-keyed-v6.png',
          'prompt':f'output/imagegen/saig-{pose}-prompt-v6.txt','blink_prompt':f'output/imagegen/saig-{pose}-blink-prompt-v6.txt',
          'asset':f'commander-{team}-v6.webp','blink_asset':f'commander-{team}-blink-v6.webp','blink_difference_bbox':difference,
          'sha256':hashlib.sha256((DEST/f'commander-{team}-v6.webp').read_bytes()).hexdigest()}
        im=prepared[0].resize((320,480),Image.Resampling.LANCZOS)
        if team=='red':im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        previews.append(im)
    (DEST/'commander-provenance-v6.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
    board=Image.new('RGBA',(740,520),'#14212e')
    for i,im in enumerate(previews):board.alpha_composite(im,(i*400,10))
    board.convert('RGB').save(ROOT/'output/imagegen/saig-rivals-preview-v6.jpg',quality=95)
    # A compact review record links every final asset and retains exact prompts.
    report=['# Jiang Xiaotun rival poses v6','Mode: user-authorized imagegen fallback CLI / gpt-image-2.','']
    for team,pose in SOURCES.items():
        for expr in ['', '-blink']:
            asset=DEST/f'commander-{team}{expr}-v6.webp'
            prompt=ROOT/f'output/imagegen/saig-{pose}{expr}-prompt-v6.txt'
            report.extend([f'## {team}{expr}',f'Asset: [{asset.name}]({asset.as_posix()})',f'Prompt: [{prompt.name}]({prompt.as_posix()})','',prompt.read_text(encoding='utf-8'),''])
    (ROOT/'output/imagegen/saig-rivals-delivery-v6.md').write_text('\n'.join(report),encoding='utf-8')
    print('Prepared coherent blue hip stance and red folded stance, aligned eye-only blinks')
    if (ROOT/'output/imagegen/saig-challenge-alpha-v7.png').exists():
        from prepare_saig_challenge import main as prepare_challenge
        prepare_challenge()

if __name__=='__main__':main()
