"""Build local, page-addressable knowledge from the competition source files."""
from pathlib import Path
import json
import re
import shutil
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from pypdf import PdfReader
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DESKTOP = Path('C:/Users/39620/Desktop')
SPECS = [
    ('wuhan-guide', '2026武汉旅游产品手册.pdf', 'travel'),
    ('saig', 'SAIG数命SPU国际AI大赛说明.docx', 'saig'),
    ('community', '数命SPU社区说明.docx', 'community'),
    ('spu', '数命SPU说明.docx', 'spu'),
    ('wuhan', '武汉概览.pdf', 'wuhan'),
]

def clean(text):
    text = unicodedata.normalize('NFKC', text)
    text = re.sub(r'(?<=[\u4e00-\u9fff])\s*\n\s*(?=[\u4e00-\u9fff])', '', text)
    return re.sub(r'[ \t]+', ' ', text).strip()

def xml_text(element):
    kind = element.tag.rsplit('}', 1)[-1]
    if kind in ('t',):
        return element.text or ''
    if kind == 'sSup':
        parts = {e.tag.rsplit('}', 1)[-1]: xml_text(e) for e in element}
        return parts.get('e', '') + '^' + parts.get('sup', '')
    return ''.join(xml_text(e) for e in element)

def main():
    data = ROOT / 'data'
    originals = ROOT / 'public' / 'materials'
    assets = ROOT / 'public' / 'assets'
    for directory in [data, originals, assets]:
        directory.mkdir(parents=True, exist_ok=True)
    docs = []
    for ident, name, topic in SPECS:
        path = DESKTOP / name
        shutil.copy2(path, originals / name)
        sections = []
        if path.suffix == '.pdf':
            reader = PdfReader(path)
            for index, page in enumerate(reader.pages):
                text = clean(page.extract_text() or '')
                if text:
                    sections.append({'page': index + 1, 'text': text})
            page_count = len(reader.pages)
        else:
            with zipfile.ZipFile(path) as archive:
                xml = ET.fromstring(archive.read('word/document.xml'))
                ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                paragraphs = [xml_text(p) for p in xml.findall('.//w:p', ns)]
                text = clean('\n'.join(p for p in paragraphs if p.strip()))
                sections = [{'page': None, 'text': text}]
            page_count = None
        document = {'id': ident, 'title': path.stem, 'file': name, 'topic': topic,
                    'pageCount': page_count, 'sections': sections}
        docs.append(document)
        (data / (ident + '.txt')).write_text('\n\n'.join(
            (f'【第{s["page"]}页】\n' if s['page'] else '') + s['text'] for s in sections), encoding='utf-8')
        print(json.dumps({'title': path.stem, 'pages': page_count,
                          'extractedPages': len(sections), 'characters': sum(len(s['text']) for s in sections)}, ensure_ascii=False))
    (data / 'knowledge.json').write_text(json.dumps(docs, ensure_ascii=False, indent=2), encoding='utf-8')
    mascot = Image.open('C:/Users/39620/AppData/Local/Temp/codex-clipboard-3262e492-ae35-48ac-9a93-458db36c205a.png').convert('RGB')
    mascot.crop((34, 273, 540, 826)).save(assets / 'mascot.webp', quality=94)
    mascot.save(assets / 'mascot-reference.webp', quality=90)
    with zipfile.ZipFile(DESKTOP / '数命SPU社区说明.docx') as archive:
        for name, target in [('word/media/image1.jpeg', 'community-concept.webp'),
                             ('word/media/image2.jpeg', 'community-photo.webp')]:
            import io
            image = Image.open(io.BytesIO(archive.read(name))).convert('RGB')
            image.thumbnail((1600, 1200))
            image.save(assets / target, quality=88)
    # Reuse an existing, supplied photograph; no generated or remote imagery.
    import fitz
    pdf = fitz.open(DESKTOP / '2026武汉旅游产品手册.pdf')
    page = pdf[148]
    photo = page.get_pixmap(matrix=fitz.Matrix(1.8, 1.8), clip=fitz.Rect(
        page.rect.width * .08, page.rect.height * .535,
        page.rect.width * .905, page.rect.height * .895))
    Image.frombytes('RGB', (photo.width, photo.height), photo.samples).save(assets / 'wuhan-river.webp', quality=90)

if __name__ == '__main__':
    main()
