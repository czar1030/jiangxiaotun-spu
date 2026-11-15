"""Microsoft neural speech transport; input is JSON on stdin, output is MP3."""
import asyncio
import json
import sys
import edge_tts

async def main():
    payload = json.loads(sys.stdin.buffer.read().decode('utf-8'))
    voice = payload['voice']
    if voice not in {'zh-CN-XiaoxiaoNeural', 'zh-CN-XiaoyiNeural', 'en-US-JennyNeural'}:
        raise ValueError('Unsupported voice')
    # Keep the approved timbre. The user asked for firmer, more spirited delivery
    # on 2026-11-12: remove the slow baseline and give quiet syllables more body.
    pitch = '-12Hz' if voice == 'zh-CN-XiaoyiNeural' else '-2Hz' if voice == 'zh-CN-XiaoxiaoNeural' else '+0Hz'
    speed = max(-18, min(20, int(payload.get('rate', 0)) * 8 + (4 if voice == 'zh-CN-XiaoyiNeural' else 0)))
    volume = '+12%' if voice == 'zh-CN-XiaoyiNeural' else '+0%'
    for attempt in range(2):
        try:
            audio = bytearray()
            speech = edge_tts.Communicate(payload['text'], voice, rate=f'{speed:+d}%', pitch=pitch, volume=volume)
            async for packet in speech.stream():
                if packet['type'] == 'audio':
                    audio.extend(packet['data'])
            if not audio:
                raise RuntimeError('Empty audio')
            break
        except Exception:
            if attempt:
                raise
    sys.stdout.buffer.write(audio)
    sys.stdout.buffer.flush()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception:
        sys.stderr.write('Neural speech unavailable.\n')
        sys.exit(1)
