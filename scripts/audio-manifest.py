#!/usr/bin/env python3
"""Check audio identity, measured duration and script hashes; does not verify speech."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

BASE = Path(__file__).resolve().parents[1] / 'edu/why-ai-bots'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def build():
    items = json.loads((BASE / 'narration.json').read_text())['items']
    clips = []
    for item in items:
        path = BASE / 'audio' / (item['id'] + '.mp3')
        duration = float(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', str(path)], text=True))
        clips.append({'id': item['id'], 'durationSeconds': round(duration, 3),
                      'playback': 'legacy-recording-pending-user-render',
                      'audioSha256': sha(path.read_bytes()),
                      'scriptSha256': sha(item['text'].encode())})
    total = round(sum(c['durationSeconds'] for c in clips), 3)
    return {'schemaVersion': 1, 'audioStatus': 'legacy-only; not the rendered audio for current narration', 'legacyAudioSourceCommit': '8547c1bc6e804403aec6df94ab2f31474f5340be', 'measurement': 'ffprobe format.duration; narration only, excluding credits BGM and transition delay',
            'speechTextAlignment': 'not-listened-or-transcribed; hashes bind the reviewed files, not proof of spoken-text equivalence',
            'totalDurationSeconds': total, 'clips': clips}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true', help='Explicitly re-baseline file hashes after reviewing script/audio changes')
    args = parser.parse_args()
    data = build()
    path = BASE / 'audio-manifest.json'
    if args.write:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    elif not path.exists() or json.loads(path.read_text()) != data:
        raise SystemExit('Audio/script identity changed. Review alignment before explicit --write re-baseline.')
    total = round(data['totalDurationSeconds'])
    print(f'32 narration files: {total // 60}:{total % 60:02d} ({data["totalDurationSeconds"]} seconds). Speech alignment not verified.')

if __name__ == '__main__':
    main()
