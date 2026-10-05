import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const packageDir = resolve(root, 'edu/why-ai-bots');
export function loadContent() {
  const html = readFileSync(resolve(packageDir, 'why-ai-bots.html'), 'utf8');
  const start = html.indexOf('const OPENING_TEXT =');
  const end = html.indexOf("const AUDIO_DIR =", start);
  if (start < 0 || end < 0) throw new Error('Cannot find narration data boundaries');
  // Only evaluate the checked-in data declarations, never page event handlers.
  return vm.runInNewContext(html.slice(start, end) + '\n({ OPENING_TEXT, ENDING_TEXT, SCENES })', {}, { timeout: 1000 });
}
export function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g).map(line => line.trim());
}
export function expectedNarration() {
  const { OPENING_TEXT, ENDING_TEXT, SCENES } = loadContent();
  const entries = [
    { id: '00-opening', label: '오프닝', lines: splitSentences(OPENING_TEXT) },
    ...SCENES.map((s, i) => ({ id: `${String(i + 1).padStart(2, '0')}-scene`, label: s.year, lines: s.lines })),
    { id: `${String(SCENES.length + 1).padStart(2, '0')}-ending`, label: '엔딩', lines: splitSentences(ENDING_TEXT) },
  ];
  return { language: 'ko', title: 'AI 대항해 시대, 사람들은 왜 AI Bot에 열광하는가', items: entries.map(e => {
    if (!Array.isArray(e.lines) || !e.lines.length || e.lines.some(x => typeof x !== 'string')) throw new Error(`Invalid lines: ${e.id}`);
    const text = e.lines.join(' ');
    return { ...e, text, chars: [...text].length };
  }) };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const expected = JSON.stringify(expectedNarration(), null, 2) + '\n';
  const destination = resolve(packageDir, 'narration.json');
  if (process.argv.includes('--write')) writeFileSync(destination, expected);
  else if (!existsSync(destination) || readFileSync(destination, 'utf8') !== expected) {
    console.error('Narration drift. Run: node scripts/sync-content.mjs --write');
    process.exitCode = 1;
  }
  if (!process.exitCode) console.log('Narration: 32 clips; HTML, lines, text, chars agree.');
}
