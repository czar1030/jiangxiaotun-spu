"""Render production pose attributes; no separate mock animation."""
from pathlib import Path
import io,json,xml.etree.ElementTree as ET
from PIL import Image
import resvg_py
ROOT=Path(__file__).resolve().parents[1]
qa=ROOT/'qa/motion-fluidity'
root=ET.fromstring((ROOT/'public/assets/jiangxiaotun-v5/reception.svg').read_text(encoding='utf-8'))
nodes={n.get('data-soft'):n for n in root.iter() if n.get('data-soft')}
frames=[]
for attrs in json.loads((qa/'wave-30fps.json').read_text()):
 for name,values in attrs.items():
  for key,value in values.items():nodes[name].set(key,value)
 png=resvg_py.svg_to_bytes(svg_string=ET.tostring(root,encoding='unicode'),width=300,height=395)
 image=Image.new('RGB',(300,410),'#e9eee0')
 image.paste(Image.open(io.BytesIO(png)),(0,5),Image.open(io.BytesIO(png)))
 frames.append(image)
durations=[round((i+1)*1000/30)-round(i*1000/30) for i in range(len(frames))]
frames[0].save(qa/'wave-30fps.webp',save_all=True,append_images=frames[1:],duration=durations,loop=0,quality=90,method=4)
# GIF timings use centiseconds: three frames span 100 ms, exactly 30 fps on average.
frames[0].save(qa/'wave-30fps.gif',save_all=True,append_images=frames[1:],duration=[30,40,30]*(len(frames)//3),loop=0,disposal=2)
print(f'Rendered {len(frames)} frames, duration {sum(durations)} ms')
