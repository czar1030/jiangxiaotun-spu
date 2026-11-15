"""Research missing FAQ subjects; candidates still require visual review."""
import concurrent.futures, json, sys
from research_wuhan_media import ROOT, QA, research, contact_sheets

if __name__ == '__main__':
    subjects = json.loads((ROOT / 'data/common-subjects.json').read_text('utf8'))
    if len(sys.argv) > 1:
        subjects = [s for s in subjects if s['id'] in sys.argv[1:]]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        results = dict(pool.map(research, subjects))
    (QA / 'common-results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf8')
    # Separate filenames from the original research contact sheets.
    for start in range(0, len(subjects), 8):
        contact_sheets(results, subjects[start:start+8])
        (QA / 'contact-01.jpg').replace(QA / f'common-contact-{start//8+1:02}.jpg')
