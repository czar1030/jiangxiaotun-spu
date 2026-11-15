"""Build complete-drawing walk and arrival atlases; never warp individual limbs."""
from pathlib import Path
import hashlib
import json
import numpy as np
import cv2
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/saig-arena'
QA = ROOT / 'qa/saig-entry-v3'


def split_sheet(name, columns, rows):
    source = Image.open(ROOT/'output/imagegen'/name).convert('RGBA')
    frames = []
    for row in range(rows):
        for col in range(columns):
            im = source.crop((round(col*source.width/columns), round(row*source.height/rows),
                              round((col+1)*source.width/columns), round((row+1)*source.height/rows)))
            a = np.array(im)
            # Generated sources already contain genuine alpha. Preserve it;
            # hidden RGB in transparent areas is not a brown background.
            a[a[:, :, 3] < 4] = 0
            count,labels,stats,_=cv2.connectedComponentsWithStats((a[:,:,3]>20).astype('uint8'))
            main=1+int(stats[1:,cv2.CC_STAT_AREA].argmax())
            core=(labels==main).astype('uint8')
            nearby=cv2.dilate(core,np.ones((7,7),np.uint8))
            keep=core.astype(bool)
            for component in range(1,count):
                if component!=main and np.any((labels==component)&(nearby>0)):
                    keep|=labels==component
            a[~keep]=0
            frames.append(Image.fromarray(a))
    return frames


def bounds(im):
    return im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()


def head_center(im):
    x0,y0,x1,y1 = bounds(im)
    mask = im.getchannel('A').point(lambda a:255 if a>40 else 0)
    b = mask.crop((0,0,im.width,round(y0+(y1-y0)*.49))).getbbox()
    return (b[0]+b[2])/2


def register(frames, target, scale_override=None):
    cw,ch = round(target.width/3),512
    target_head = head_center(target)/3
    scale = scale_override or (bounds(target)[3]-bounds(target)[1])/3/np.median([bounds(im)[3]-bounds(im)[1] for im in frames])
    prepared,records = [],[]
    for im in frames:
        b = bounds(im)
        dx = target_head-head_center(im)*scale
        dy = 1456/3-b[3]*scale
        image = im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA',(cw,ch))
        canvas.alpha_composite(image,(round(dx),round(dy)))
        prepared.append(canvas)
        records.append({'sourceBounds':list(b),'scale':float(scale),'offset':[round(dx),round(dy)]})
    return prepared,records


def recolor_red(im):
    a = np.array(im)
    rgb = a[:,:,:3].astype(float)/255
    yy,xx = np.indices(a.shape[:2])
    # Saturated blue fabric in the upper-body band only. Porpoise fins, the
    # tail and pale blue reflections are deliberately excluded.
    m = (yy>im.height*.39)&(yy<im.height*.63)&(xx>im.width*.23)&(xx<im.width*.70)&(rgb[:,:,2]>rgb[:,:,0]*1.18)&(rgb[:,:,2]>rgb[:,:,1]*1.08)&((rgb.max(2)-rgb.min(2))>.22)&(a[:,:,3]>10)
    lum=rgb[:,:,0]*.2126+rgb[:,:,1]*.7152+rgb[:,:,2]*.0722
    red=np.array([.80,.20,.27]);gain=lum[m]/(red@np.array([.2126,.7152,.0722]))
    a[:,:,:3][m]=np.clip(red[None,:]*gain[:,None]*255,0,255).astype('uint8')
    return Image.fromarray(a)


def approved_head(frame,target,team,phase=0,arrival_index=None):
    # Retain the approved face model in every cel. Only a rigid, small tilt is
    # added: complete legs and clothing remain exactly as newly drawn.
    fullmask=Image.new('L',target.size)
    pad=0 if team=='blue' else -100
    ImageDraw.Draw(fullmask).polygon([(0,0),(1070+pad,0),(1070+pad,595),(985+pad,605),
        (965+pad,645),(925+pad,670),(860+pad,694),(795+pad,703),(760+pad,696),
        (710+pad,683),(660+pad,688),(620+pad,705),(555+pad,716),(470+pad,710),(380+pad,700),(0,700)],fill=255)
    smallmask=fullmask.resize(frame.size,Image.Resampling.LANCZOS)
    base=frame.copy();a=np.array(base);alpha=a[:,:,3].copy();cut=np.array(smallmask)
    yy,xx=np.indices(alpha.shape);r,g,b=[a[:,:,k].astype(int) for k in range(3)]
    right=357 if team=='blue' else 324
    clear=(yy<220)&((xx<right)|(yy<185))
    warm=(r>g+6)&(r>b+10)&(g>b-8)
    clear|=(yy>=220)&(yy<247)&(xx<right)&warm
    clear|=(yy<247)&(r>g+22)&(g>b+32)&(xx>=right)
    # Raised gesture arms can overlap the lower-right head rectangle. Keep
    # their complete source drawing; the approved head supplies occlusion.
    if arrival_index is not None and arrival_index>=2:
        protect=(xx>(270 if team=='blue' else 215))&(yy>(198 if team=='blue' else 220))
        clear&=~protect
    alpha[clear]=0;base.putalpha(Image.fromarray(alpha))
    head=target.resize(frame.size,Image.Resampling.LANCZOS)
    ha=(np.array(head.getchannel('A')).astype(float)*cut/255).astype('uint8');head.putalpha(Image.fromarray(ha))
    angle=np.sin(phase*np.pi*2)*.55
    head=head.rotate(angle,resample=Image.Resampling.BICUBIC,center=(head_center(target)/3,233))
    base.alpha_composite(head)
    return base


def main():
    QA.mkdir(parents=True,exist_ok=True)
    first = split_sheet('saig-walk-sheet-keyed-v3.png',4,3)
    other = split_sheet('saig-walk-other-half-keyed-v3.png',2,2)
    # Contact, compression, recovery, passing, extension, opposite contact,
    # recovery, return. The second source supplies the actual near-leg pass.
    selected = [first[0],first[1],first[2],other[0],other[1],other[2],other[3],first[11]]
    result = {'version':3,'technique':'complete drawn cels; no limb deformation or pose crossfade','teams':{}}
    for team,version in [('blue',7),('red',6)]:
        target=Image.open(OUT/f'commander-{team}-v{version}.webp').convert('RGBA')
        # Source sheets have different cell resolutions. Normalize each group
        # with a shared scale, retaining individual pose silhouettes and bob.
        a,ra=register([selected[i] for i in [0,1,2,7]],target)
        b,rb=register([selected[i] for i in [3,4,5,6]],target)
        walk=a[:3]+b+[a[3]]
        registration=ra[:3]+rb+[ra[3]]
        if team=='red':walk=[recolor_red(im) for im in walk]
        walk=[approved_head(im,target,team,i/len(walk)) for i,im in enumerate(walk)]
        arrival_source=split_sheet(f'saig-{team}-arrive-sheet-keyed-v3.png',3,2)
        arrival,ar=register(arrival_source,target)
        arrival=[approved_head(im,target,team,0,i) for i,im in enumerate(arrival)]
        final=target.resize(walk[0].size,Image.Resampling.LANCZOS)
        frames=walk+arrival+[final]
        cw,ch=frames[0].size;columns=4;rows=(len(frames)+columns-1)//columns
        atlas=Image.new('RGBA',(columns*cw,rows*ch))
        for i,im in enumerate(frames):atlas.alpha_composite(im,((i%columns)*cw,(i//columns)*ch))
        filename=f'commander-{team}-entry-cels-v3.webp'
        atlas.save(OUT/filename,lossless=True,method=6)
        result['teams'][team]={'file':filename,'sha256':hashlib.sha256((OUT/filename).read_bytes()).hexdigest(),
            'cellWidth':cw,'cellHeight':ch,'columns':columns,'rows':rows,'count':len(frames),
            'walkFrames':list(range(len(walk))),'arrivalFrames':list(range(len(walk),len(walk)+len(arrival))),
            'finalFrame':len(frames)-1,'registration':registration+ar}
        board=Image.new('RGBA',(cw*4,(ch+28)*4),'#15232e');draw=ImageDraw.Draw(board)
        for i,im in enumerate(frames):
            x=(i%4)*cw;y=(i//4)*(ch+28);board.alpha_composite(im,(x,y));draw.text((x+10,y+ch+5),f'{team} / '+('walk ' if i<8 else 'arrive ' if i<14 else 'approved pose ')+str(i),fill='white')
        board.convert('RGB').save(QA/f'{team}-all-poses.jpg',quality=95)
        gif=[Image.new('RGBA',im.size,'#15232e') for im in walk]
        for bg,im in zip(gif,walk):bg.alpha_composite(im)
        gif[0].save(QA/f'{team}-walk.gif',save_all=True,append_images=gif[1:],duration=85,loop=0,disposal=2)
    (OUT/'sprite-entry-v3.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Prepared complete drawn walk/arrival atlases and review animations')


if __name__=='__main__':main()
