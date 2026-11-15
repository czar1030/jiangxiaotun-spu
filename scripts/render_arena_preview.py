"""Offline inverse-sampled review of the live commander mesh and blink textures."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
dest=root/'qa/saig-arena/rivals-v7'
board=Image.new('RGB',(1600,1040),'#17232e')
for i,pose in enumerate(json.loads((dest/'poses.json').read_text())):
    suffix='-blink' if pose['blink']>.5 else ''
    version=pose['artwork']['version']
    image=Image.open(root/f"public/assets/saig-arena/commander-{pose['team']}{suffix}-v{version}.webp").convert('RGBA')
    mesh=[(tuple(box),tuple(quad)) for box,quad in pose['inverse']]
    image=image.transform(image.size,Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
    if pose['team']=='red':image=image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    image=image.resize((round(image.width*480/image.height),480),Image.Resampling.LANCZOS)
    image.save(dest/f"{pose['team']}-{pose['time']}.png")
    x=i%4*400;y=i//4*520
    board.paste(image,(x,y),image)
    ImageDraw.Draw(board).text((x+12,y+492),f"{pose['team']} / {pose['time']}s",fill='white')
board.save(dest/'poseboard.jpg',quality=95)
