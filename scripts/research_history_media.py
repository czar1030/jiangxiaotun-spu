"""Collect traceable history candidates. Selection and visual review are separate."""
from pathlib import Path
import concurrent.futures, hashlib, html, io, json, re, urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa/media-research'
HISTORY = ROOT / 'qa/history'
HISTORY.mkdir(exist_ok=True)
SITES = {
    'xinhai-north': 9102, 'xinhai-south': 147069,
    'fifth-congress': 50901, 'august-seven': 9206,
    'soong-house': 1714457, 'national-government': 9101,
    'qiyimen': 1494058, 'nongjiangsuo': 1471665,
    'zhang-museum': 4733359, 'dazhimen': 143259685,
    'yuji-palace': 89780,
}
DENY = ['redocn.', 'nipic.', 'vcg.', '699pic', 'photophoto.', 'shutterstock.',
        'gettyimages.', 'alamy.', 'scpo.', 'kfzimg.', 'kongfz.', '997788.',
        'zhuokearts.', 'artron.', 'artfoxlive.', 'mianfeiwendang.', 'douyin.',
        'quanmin.', 'mbd.baidu.', 'chinayis.', 'zywxds.']

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'}), timeout=12).read(20000000)

def site_data(item):
    sid, poi = item
    cache = HISTORY / (sid + '.json')
    if cache.exists(): return sid, json.loads(cache.read_text('utf8'))
    try:
        url = f'https://you.ctrip.com/sight/wuhan145/{poi}.html'
        page = fetch(url).decode('utf8')
        match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', page, re.S)
        detail = json.loads(match[1])['props']['pageProps']['initialState']['poiDetail']
        cache.write_text(json.dumps(detail,ensure_ascii=False,indent=2),encoding='utf8')
        return sid, detail
    except Exception as e:
        print('SITE ERROR', sid, str(e)[:100], flush=True)
        return sid, {}

def download(job):
    sid, index, row = job
    out = QA / f'history-{sid}-{index}.jpg'
    if out.exists(): return sid, out.name
    try:
        data = fetch(row['imageUrl'])
        im = Image.open(io.BytesIO(data)).convert('RGB')
        w,h = im.size
        if min(w,h)<500 or max(w,h)<900: return sid, None
        im.thumbnail((1920,1920)); im.save(out, quality=94)
        row.update(candidate=out.name,originalWidth=w,originalHeight=h,width=im.width,height=im.height,
                   sha256=hashlib.sha256(data).hexdigest(),rights='原站图片；开放授权尚未核实',reviewed=False)
        out.with_suffix('.json').write_text(json.dumps(row,ensure_ascii=False,indent=2),encoding='utf8')
        print('OK',sid,index,w,h,flush=True)
        return sid,out.name
    except Exception: return sid,None

def rank(row):
    urls = row['sourceUrl']+' '+row['imageUrl']
    if any(d in urls for d in DENY): return -100
    if any(t in row['title'].lower() for t in ['ai绘','复原','演员','简笔画','漫画','邮票','银元','群英','全家','合影','雕塑厂家','石印','铜雕']): return -100
    score = 0
    if any(t in urls for t in ['gov.cn','chnmuseum','wikimedia','bjd.com','cnhubei','news.cn']): score+=50
    if 'http://baijiahao.baidu.com/s?id' == row['sourceUrl']: return -100
    if int(row.get('w',0))>=800 and int(row.get('h',0))>=1000: score+=10
    return score

if __name__ == '__main__':
    jobs=[]; names={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        details=dict(pool.map(site_data,SITES.items()))
    for sid, d in details.items():
        names[sid]=d.get('poiName',sid)
        for n,img in enumerate(d.get('imageInfo',{}).get('poiPhotoImageList',[])[:6]):
            jobs.append((sid,n,{'title':d['poiName'],'imageUrl':img['imageUrl'], 'sourceUrl':f'https://you.ctrip.com/sight/wuhan145/{SITES[sid]}.html'}))
    for p in (ROOT/'qa').glob('history-bing-*.json'):
        sid=p.stem.removeprefix('history-bing-'); names[sid]=sid
        rows=json.loads(p.read_text('utf8'))
        for n,row in sorted(enumerate(rows),key=lambda x:rank(x[1]),reverse=True)[:10]:
            if rank(row)<0 or min(row.get('w',0),row.get('h',0))<500 or max(row.get('w',0),row.get('h',0))<900:continue
            jobs.append((sid,n,row))
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(download,jobs))
    font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',14)
    for sid,name in names.items():
        files=list(QA.glob(f'history-{sid}-*.jpg'))
        sheet=Image.new('RGB',(1400,260*max(1,(len(files)+3)//4)),'#f4f4ed');draw=ImageDraw.Draw(sheet)
        for i,p in enumerate(files):
            im=Image.open(p);im.thumbnail((344,214));a=i%4*350;b=i//4*260
            sheet.paste(im,(a,b+20));draw.text((a,b),p.name,font=font,fill='#123c32')
            meta=json.loads(p.with_suffix('.json').read_text('utf8'));draw.text((a,b+237),meta['title'][:22],font=font,fill='#123c32')
        sheet.save(HISTORY/(sid+'-sheet.jpg'),quality=92)
        print('SHEET',sid,len(files),flush=True)
