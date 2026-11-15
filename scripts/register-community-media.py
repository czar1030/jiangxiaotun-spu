"""Append existing, attributed story assets without changing old media IDs."""
from pathlib import Path
from PIL import Image
import hashlib,json,shutil

root=Path(__file__).resolve().parents[1]
catalog_path=root/'public/assets/wuhan-media/catalog.json'
intro_path=root/'data/atlas-introductions.json'
catalog=json.loads(catalog_path.read_text(encoding='utf-8'))
intros=json.loads(intro_path.read_text(encoding='utf-8'))
entries=[
 dict(id='luo-biwen',name='罗弼文',area='武汉',category='人物',kind='person',tags=['创业'],aliases=['数命科技创始人','罗弼文与团队'],
  description='数命科技（武汉）有限公司创始人，2017年回武汉创业。团队将楚文化与AI结合，推出Mark印文物明信片；图为罗弼文与团队合影，非个人标准肖像。',
  asset='founder-team.webp',type='创业团队合影',alt='罗弼文与团队合影；人物位置以报道原注为准',source='https://www.wuhan.gov.cn/sy/whyw/202605/t20260512_2763212.shtml'),
 dict(id='markyin',name='Mark印文物AI明信片',area='武汉 / 荆州',category='景点',kind='product',tags=['科技','楚文化'],aliases=['Mark印','Mark 印','文物AI明信片'],
  description='数命团队将文物故事与AI对话结合的明信片产品，曾与荆州博物馆合作，并走向美国市场。图片为官方越王勾践剑卡片素材，不是文物实物照片。',
  asset='markyin-sword.webp',type='官方产品图',alt='Mark印越王勾践剑AI明信片官方产品图，非文物实物照片',source='https://www.markyin.com/'),
]
for row in entries:
 if any(s['id']==row['id'] for s in catalog['subjects']):continue
 asset=row.pop('asset');image_type=row.pop('type');alt=row.pop('alt');source=row.pop('source')
 src=root/'public/assets/community-story'/asset
 dest=root/'public/assets/wuhan-media'/f"{row['id']}.webp"
 shutil.copyfile(src,dest)
 width,height=Image.open(src).size
 digest=hashlib.sha256(src.read_bytes()).hexdigest()
 row.update(introduction=row['description'],factUrl=source,factLabel='原始报道 / 产品官网',factExcerpt=row['description'])
 row['image']=dict(src=f"/assets/wuhan-media/{row['id']}.webp?v={digest[:12]}",alt=alt,type=image_type,caption=alt,
  width=width,height=height,originalWidth=width,originalHeight=height,sourceUrl=source,originalUrl=f'/assets/community-story/{asset}',
  author='原站未标明',rights='来源报道或产品官方素材；保留原始权利状态',sha256=digest,inputSha256=digest,
  reviewedAt='2026-10-30',reviewed=True,watermarkReview='逐张核对身份、图像类型与原画幅；产品文字属于卡片设计本身，保留原图。')
 catalog['subjects'].append(row);intros[row['id']]=row['introduction']
catalog['updatedAt']='2026-10-30'
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
intro_path.write_text(json.dumps(intros,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"Catalog: {len(catalog['subjects'])} entries; old IDs preserved.")
