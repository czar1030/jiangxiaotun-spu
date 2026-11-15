"""Research public photographs by subject; keep source URLs and review before use."""
from pathlib import Path
import concurrent.futures, hashlib, html, io, json, re, time, urllib.parse, urllib.request
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'qa' / 'media-research'
QA.mkdir(parents=True, exist_ok=True)
SUBJECTS = ROOT / 'data' / 'media-subjects.json'
UA = {'User-Agent': 'Mozilla/5.0'}

def fetch(url, timeout=14):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as response:
        return response.read(16_000_000)

def search(subject):
    query = subject.get('query', '武汉' + subject['name'])
    cache = QA / (subject['id'] + '-so-' + hashlib.sha1(query.encode()).hexdigest()[:6] + '-search.json')
    if cache.exists(): return json.loads(cache.read_text(encoding='utf-8'))
    url = 'https://image.so.com/j?' + urllib.parse.urlencode({'q': query, 'src': 'srp', 'pn': 50})
    response = json.loads(fetch(url, 20))
    found = [{'title': html.unescape(item.get('title', '')), 'imageUrl': item['img'], 'sourceUrl': item['link']}
             for item in response.get('list', []) if item.get('img') and item.get('link')]
    cache.write_text(json.dumps(found, ensure_ascii=False, indent=2), encoding='utf-8')
    return found

DENY = ['699pic.', 'nipic.', 'nximg.', 'vcg.', 'dreamstime.', 'alamy.', 'gettyimages.', 'shutterstock.', 'huaban.', 'baike.baidu.', 'exp-picture.', '51wendang.', 'vectorstock.', 'wallpapers.', 'dgaef.', '58pic.', '588ku.', '699pic', 'ibaotu.', 'pngtree.']
def rank(item, subject):
    url = item['imageUrl'] + ' ' + item['sourceUrl']
    if any(host in url for host in DENY): return -100
    score = 0
    if '.gov.cn' in url: score += 20
    if 'wikimedia' in url or 'flickr' in url: score += 40
    if 'youimg' in url or 'qunarzz' in url: score += 8
    if 'sinaimg' in url: score -= 10
    for name in [subject['name'], *subject.get('aliases', [])]:
        if name in item['title']: score += 35; break
    else: score -= 15
    if any(term in item['title'] for term in ['手绘', '插画', '海报', '矢量', '地图', '简笔画', '菜单', '做法']): score -= 30
    return score

def research(subject):
    try:
        found = sorted(search(subject), key=lambda x: rank(x, subject), reverse=True)
        results = []
        for i, item in enumerate(found[:12]):
            if rank(item, subject) < 0: continue
            query_hash = hashlib.sha1(subject['query'].encode()).hexdigest()[:6]
            path = QA / f"{subject['id']}-so-{query_hash}-{i}.jpg"
            metadata = path.with_suffix('.json')
            if metadata.exists():
                results.append(json.loads(metadata.read_text(encoding='utf-8')))
                if len(results) >= 3: break
                continue
            try:
                image_bytes = fetch(item['imageUrl'], 9)
                image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
                width, height = image.size
                if max(width, height) < 1000 or min(width, height) < 520: continue
                # Preserve the original frame: no cropping away watermarks.
                image.thumbnail((1920, 1920))
                image.save(path, quality=92)
                info = {**item, 'candidate': path.name, 'originalWidth': width, 'originalHeight': height,
                        'width': image.width, 'height': image.height, 'sha256': hashlib.sha256(image_bytes).hexdigest(),
                        'rights': '原站图片；开放授权尚未核实', 'reviewed': False}
                metadata.write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding='utf-8')
                results.append(info)
                if len(results) >= 3: break
            except Exception: continue
        print(json.dumps({'id': subject['id'], 'name': subject['name'], 'candidates': len(results)}, ensure_ascii=False), flush=True)
        return subject['id'], results
    except Exception as error:
        print(json.dumps({'id': subject['id'], 'error': type(error).__name__}, ensure_ascii=False), flush=True)
        return subject['id'], []

def contact_sheets(results, subjects):
    font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 16)
    small = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 12)
    rows = []
    for subject in subjects:
        candidates = results.get(subject['id'], [])
        row = Image.new('RGB', (1110, 225), '#f2f5ef')
        draw = ImageDraw.Draw(row)
        draw.text((10, 3), subject['id'] + ' · ' + subject['name'], font=font, fill='#213c32')
        for i, item in enumerate(candidates):
            im = Image.open(QA / item['candidate']); im.thumbnail((354, 166))
            row.paste(im, (i * 370 + 8, 31))
            draw.text((i * 370 + 8, 201), item['candidate'] + f" [{item['originalWidth']}×{item['originalHeight']}]", font=small, fill='#526454')
        rows.append(row)
    for start in range(0, len(rows), 8):
        sheet = Image.new('RGB', (1110, 225 * len(rows[start:start+8])), 'white')
        for i, row in enumerate(rows[start:start+8]): sheet.paste(row, (0, i * 225))
        sheet.save(QA / f'contact-{start//8+1:02}.jpg', quality=90)

if __name__ == '__main__':
    subjects = json.loads(SUBJECTS.read_text(encoding='utf-8'))
    import sys
    if len(sys.argv) > 1: subjects = [s for s in subjects if s['id'] in sys.argv[1:]]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        results = dict(pool.map(research, subjects))
    (QA / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    contact_sheets(results, subjects)
    print('Research and contact sheets ready.', flush=True)
