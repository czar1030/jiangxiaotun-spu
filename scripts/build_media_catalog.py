import json,hashlib,urllib.parse
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1];qa=root/'qa/media-research';dest=root/'public/assets/wuhan-media';dest.mkdir(exist_ok=True)
subs=json.loads((root/'data/media-subjects.json').read_text('utf8'))
subs += json.loads((root/'data/history-subjects.json').read_text('utf8'))
# Append new areas after existing subjects so saved M citation IDs stay stable.
subs += json.loads((root/'data/scenic-subjects.json').read_text('utf8'))
subs += json.loads((root/'data/common-subjects.json').read_text('utf8'))
subs += json.loads((root/'data/entry-subjects.json').read_text('utf8'))
if len({s['id'] for s in subs}) != len(subs): raise ValueError('duplicate subject id')
introductions=json.loads((root/'data/atlas-introductions.json').read_text('utf8'))
if set(introductions)!={s['id'] for s in subs}:raise ValueError('atlas introductions must cover every subject exactly once')
for s in subs:
 intro=introductions[s['id']].strip()
 if not intro or len(intro)>100:raise ValueError('atlas introduction must contain 1-100 characters: '+s['id'])
 s['introduction']=intro
history_ids={'yellow-crane','hubei-museum','wuhan-university','yangtze-bridge','jianghan','jianghan-customs','lihuangpi','gude-temple','qingchuan','guiyuan','guqin-terrace','gui-mountain','tanhualin','baotong-temple','changchun-temple','minzhong','pinghe','panlongcheng'}
for s in subs:
 if s['id'] in history_ids: s['tags']=list(dict.fromkeys([*s.get('tags',[]),'历史']))
# Explicitly selected after visual review; no watermark removal or invented replacements.
chosen={s['id']:s['id']+'-ctrip-1.jpg' for s in subs[:50] if (qa/(s['id']+'-ctrip-1.jpg')).exists()}
chosen.update({'wuhan-university':'wuhan-university-84bdab-1.jpg','jianghan':'jianghan-c25356-0.jpg','qingchuan':'sight-89781-1.jpg','haichang':'sight-136262-0.jpg','qintai-theater':'comment-1493468-0.jpg','gutian-bridge':'gutian-bridge-0148f4-0.jpg','jiqing-street':'sight-51332-0.jpg','happy-valley':'happy-valley-5af7c5-0.jpg','reganmian':'reganmian-626a1f-0.jpg','doupi':'restaurant-420176-9.jpg','hutangfen':'comment-11436060-6.jpg','mianwo':'mianwo-d4eaec-5.jpg','huanxituo':'huanxituo-374e51-9.jpg','nuomi-youtiao':'nuomi-youtiao-4b6de7-5.jpg','tangbao':'restaurant-31250978-14.jpg','shaomei':'restaurant-31250978-8.jpg','lotus-soup':'restaurant-hujin-13.jpg','wuchang-fish':'restaurant-11439171-1.jpg','youmen-prawn':'restaurant-11436393-12.jpg','duck-neck':'duck-neck-precise-0.jpg','re-dumpling':'re-dumpling-precise-1.jpg','wuhan-noodles':'comment-420176-2.jpg'})
# A rejected promotional poster must never pass through the default selection.
chosen['happy-valley']='happy-valley-5af7c5-0.jpg'
if (root/'data/media-selections.json').exists():chosen.update(json.loads((root/'data/media-selections.json').read_text('utf8')))
chosen.update(json.loads((root/'data/history-media-selections.json').read_text('utf8')))
chosen.update(json.loads((root/'data/scenic-media-selections.json').read_text('utf8')))
chosen.update(json.loads((root/'data/common-media-selections.json').read_text('utf8')))
chosen.update(json.loads((root/'data/entry-media-selections.json').read_text('utf8')))
(root/'data/media-selections.json').write_text(json.dumps(chosen,ensure_ascii=False,indent=2),encoding='utf8')
docs=json.loads((root/'data/knowledge.json').read_text('utf8'));guide=next(d for d in docs if d['id']=='wuhan-guide');seen=set();old={s['id']:s.get('image') for s in json.loads((dest/'catalog.json').read_text('utf8'))['subjects']} if (dest/'catalog.json').exists() else {}
for s in subs:
 for section in ([] if s.get('factUrl') else guide['sections']):
  names=[s['name'],*s['aliases']]
  matches=[(section['text'].find(n),n) for n in names if len(n)>=2 and n in section['text']]
  if matches and section['page']>7:
   pos,name=sorted(matches)[0];text=section['text'];s.update(factExcerpt=text[max(0,pos-30):pos+200].replace('\n',' '),factPage=section['page'],factUrl='/materials/'+urllib.parse.quote(guide['file'])+'#page='+str(section['page']),factLabel='比赛旅游资料 · PDF第'+str(section['page'])+'页');break
 file=chosen.get(s['id'])
 if not file:s['image']=None;continue
 p=qa/file;meta=json.loads(p.with_suffix('.json').read_text('utf8'));im=Image.open(p).convert('RGB');im.thumbnail((1600,1600));out=dest/(s['id']+'.webp');
 previous=old.get(s['id']) or {}
 if not meta.get('reviewed') and not previous.get('reviewed'):raise ValueError('visual review required: '+s['id'])
 input_sha=hashlib.sha256(p.read_bytes()).hexdigest()
 if not (out.exists() and previous.get('inputSha256')==input_sha):im.save(out,quality=87,method=4)
 sha=hashlib.sha256(out.read_bytes()).hexdigest()
 if sha in seen:raise ValueError('duplicate '+s['id'])
 seen.add(sha);s['image']={'src':'/assets/wuhan-media/'+out.name+'?v='+sha[:12],'alt':s.get('imageCaption') or s['name']+'实景照片','type':s.get('imageType','实景照片'),'caption':s.get('imageCaption') or s['name']+'实景照片','width':im.width,'height':im.height,'originalWidth':meta['originalWidth'],'originalHeight':meta['originalHeight'],'sourceUrl':meta['sourceUrl'],'originalUrl':meta['imageUrl'],'author':meta.get('author') or '原站未标明','rights':meta['rights'],'sha256':sha,'inputSha256':input_sha,'reviewedAt':meta.get('reviewedAt','2026-10-27'),'reviewed':True,'watermarkReview':meta.get('watermarkReview','人工核对未见可见水印，保留原画幅')}
 s.pop('query',None)
catalog={'version':4,'updatedAt':'2026-10-29','description':'武汉景点、美食、历史遗迹与历史人物图文资料库；每个条目含百字以内简短介绍，区分实景、历史照片、后人画作及纪念雕像，保留图源、资料来源与权利状态。','subjects':subs}
(dest/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf8')
print('subjects',len(subs),'photos',len(seen),'pending',[(s['id'],s['name']) for s in subs if not s['image']])
