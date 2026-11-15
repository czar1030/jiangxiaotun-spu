"""True turnaround head with a native side/front costume, not a warped front."""
import base64,io
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from mascot_soft_layers import fragment
from saig_costume import costume
ROOT=Path(__file__).resolve().parents[1]

def picture(image):
    data=io.BytesIO();image.save(data,format='WEBP',lossless=True,method=6)
    return 'data:image/webp;base64,'+base64.b64encode(data.getvalue()).decode()

def quarter_view(root,parts):
    head=Image.open(ROOT/'output/imagegen/saig-quarter-head-keyed-v5.png').convert('RGBA')
    closed=Image.open(ROOT/'output/imagegen/saig-quarter-blink-v5.png').convert('RGBA')
    if head.size!=closed.size:raise ValueError('Blink artwork must align with head')
    # Keep exact original pixels outside the two eye regions. The closed-eye
    # layer never redraws the silhouette, hair or face contour during a blink.
    mask=Image.new('L',head.size);draw=ImageDraw.Draw(mask)
    draw.polygon([(513,795),(573,785),(706,802),(780,844),(795,902),(780,966),(689,977),(580,966),(521,927)],fill=255)
    draw.polygon([(908,804),(993,799),(1020,832),(1021,925),(988,968),(912,963),(877,906)],fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(5))
    closed=Image.composite(closed,head,mask)
    bounds=(57,50,1198,1121)
    head=head.crop(bounds);closed=closed.crop(bounds)
    # Retain the returned alpha and remove isolated magenta key spill only.
    for image in [head,closed]:
        arr=np.array(image)
        spill=(arr[:,:,0]>arr[:,:,1]*1.4)&(arr[:,:,2]>arr[:,:,1]*1.4)&(arr[:,:,3]<220)
        arr[:,:,3][spill]=0
        image.paste(Image.fromarray(arr))
    for file,image in [('head-quarter-v5',head),('head-quarter-blink-v5',closed)]:
        image.save(ROOT/f'public/assets/saig-arena/{file}.webp',lossless=True,method=6)
    # One uniform scale preserves the skull and cheek proportions. No yaw warp,
    # asymmetric stretch, extra back-of-head oval or frontal face decal.
    width=400;height=width*head.height/head.width;x=287;y=534-height
    def head_image(image):
        return fragment(f'<image x="{x}" y="{y}" width="{width}" height="{height}" href="{picture(image)}"/>')[0]
    head_group=parts['head']
    for child in list(head_group):head_group.remove(child)
    head_group.append(head_image(head))
    for name in ['leftEar','rightEar','smile','happy','blink','bored','sleepy','ahoge']:
        group=parts[name]
        for child in list(group):group.remove(child)
        group.attrib.pop('transform',None)
        head_group.append(group)
    parts['blink'].append(head_image(closed))
    body=parts['body']
    body_image=next(node for node in body if node.tag.endswith('image'))
    index=list(body).index(body_image);body.remove(body_image)
    body_image=costume();body.insert(index,body_image)
    # The far sleeve is behind the turned torso. Forearms have an explicit
    # far-to-near order, so crossed arms overlap instead of passing through.
    body.remove(parts['leftSoft']);body.insert(list(body).index(body_image),parts['leftSoft'])
    for name in ['leftForeOverlay','leftPalm','rightForeOverlay','rightPalm']:
        body.remove(parts[name]);body.append(parts[name])
    parent=next(node for node in root.iter() if parts['tail'] in list(node))
    tail=parts['tail'];index=list(parent).index(tail);parent.remove(tail)
    wrapper=fragment('<g data-soft="tailYaw" transform="matrix(-.78 0 0 .93 858 54)"/>')[0]
    wrapper.append(tail);parent.insert(index,wrapper)
    feet=parts['feet']
    for child in list(feet):feet.remove(child)
    feet.extend(fragment('''<g data-soft="rightFoot" stroke="#655f55" stroke-width="1.8" stroke-linejoin="round">
      <path d="M509 804H543L545 860Q527 868 509 860Z" fill="#ffe2cf"/>
      <path d="M509 854Q527 860 544 854V887Q527 893 508 886Z" fill="#f8eedb"/><path d="M511 863L542 865" stroke="#d6b97e"/>
      <path d="M503 882Q520 875 542 880L546 895L563 905Q574 916 566 925Q538 936 507 929Q497 921 499 906Z" fill="#435c68" stroke="#30434e"/>
      <path d="M502 919Q529 930 568 918L567 926Q538 937 507 930Z" fill="#263c4a"/><path d="M511 894Q529 890 540 895L546 909Q529 918 508 909Z" fill="#f8eedb" stroke="#8c9d9e"/>
      <path d="M511 896L541 899" stroke="#d8bb83"/><path d="M552 911L560 914" stroke="#9bb0b7"/>
    </g><g data-soft="leftFoot" stroke="#655f55" stroke-width="1.8" stroke-linejoin="round">
      <path d="M439 806H478L480 868Q459 876 438 866Z" fill="#ffe2cf"/>
      <path d="M439 860Q459 866 479 860V899Q459 907 437 898Z" fill="#fff5e2"/><path d="M440 869L477 871" stroke="#d6b97e"/>
      <path d="M437 890Q447 883 473 887L478 904L500 914Q513 926 507 936Q471 950 437 940Q427 932 431 916Z" fill="#506b77" stroke="#30434e"/>
      <path d="M431 930Q459 943 509 929L507 938Q470 951 437 941Z" fill="#2d4350"/><path d="M440 902Q456 897 474 902L479 917Q457 927 437 917Z" fill="#fff4e1" stroke="#8c9d9e"/>
      <path d="M440 905L476 907" stroke="#d8bb83"/><path d="M492 921L501 925" stroke="#b4c9ca"/>
    </g>'''))
    root.set('data-view','three-quarter-45')
