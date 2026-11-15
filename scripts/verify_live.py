"""Small, sequential real-provider acceptance run. No keys are printed."""
from pathlib import Path
import json
import time
import urllib.request

OUT = Path(__file__).resolve().parents[1] / 'qa'
OUT.mkdir(exist_ok=True)

def call(name, question, mode, history=None):
    messages = (history or []) + [{'role': 'user', 'content': question}]
    req = urllib.request.Request('http://127.0.0.1:3210/api/chat',
        data=json.dumps({'messages': messages, 'mode': mode}).encode(),
        headers={'Content-Type': 'application/json'})
    start = time.time()
    with urllib.request.urlopen(req, timeout=115) as response:
        result = json.load(response)
    (OUT / f'live-{name}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'case': name, 'seconds': round(time.time() - start, 1),
                      'mode': result.get('meta', {}).get('mode'),
                      'reason': result.get('meta', {}).get('reason'),
                      'sources': len(result.get('sources', [])),
                      'days': len((result.get('itinerary') or {}).get('days', [])),
                      'answerPreview': result.get('answer', '')[:180]}, ensure_ascii=False), flush=True)
    return messages + [{'role': 'assistant', 'content': result.get('answer', '') +
                        ('\n行程：' + json.dumps(result['itinerary'], ensure_ascii=False) if result.get('itinerary') else '')}], result

if __name__ == '__main__':
    call('wuhan', '武汉三镇指什么？第一次来武汉，有哪些城市特色？', 'wuhan')
    call('community', '我不会编程，可以参与数命SPU社区吗？哪些地方已布局，哪些设施仍在规划？', 'community')
    call('saig', 'SAIG报名需要提交什么？截止时间、个人参赛规则和最终成绩怎么算？', 'saig')
    history, first = call('travel', '我和父母来武汉两天，住江汉路，预算每人600元，不含住宿和往返武汉交通。不想走太多路，喜欢美食，直接安排。', 'travel')
    _, second = call('rain-followup', '第二天下雨了，帮我修改；保留住江汉路、带父母、少走路和每人600元的条件。', 'travel', history)
    for name in ['wuhan', 'community', 'saig', 'travel', 'rain-followup']:
        data = json.loads((OUT / f'live-{name}.json').read_text(encoding='utf-8'))
        if data.get('meta', {}).get('mode') != 'ai':
            raise SystemExit(f'LIVE ACCEPTANCE FAILED: {name} used local fallback')
    if not first.get('itinerary') or not second.get('itinerary'):
        raise SystemExit('LIVE ACCEPTANCE FAILED: structured itinerary missing')
    print('LIVE ACCEPTANCE PASSED: all five cases returned actual AI answers.', flush=True)
