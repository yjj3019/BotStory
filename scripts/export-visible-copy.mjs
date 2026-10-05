import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packageDir, loadContent } from './sync-content.mjs';

// Extract semantic copy only. Presentation/style keys and alternative descriptions
// are deliberately excluded. This is a content export, not a layout audit.
const skip = new Set(['type', 'g', 'ic', 'aria', 'alt', 'position', 'look', 'tone', 'size', 'style', 'dir', 'kind', 'dtone', 'link', 'height']);
function strings(value, key = '') {
  if (skip.has(key)) return [];
  if (typeof value === 'string') {
    if (key === 'src' && value.startsWith('assets/')) return [];
    if (key === 'cols') return []; // CSS grid tracks, not comparison-column objects
    return [value];
  }
  if (Array.isArray(value)) return value.flatMap(x => strings(key === 'rows' && Array.isArray(x) ? x.slice(0, 2) : x, key));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => strings(v, k));
  return [];
}
const html = readFileSync(resolve(packageDir, 'why-ai-bots.html'), 'utf8');
function staticCopy(id, nextId) {
  const marker = html.indexOf(`id="${id}"`);
  const nextMarker = html.indexOf(`id="${nextId}"`, marker + 1);
  const start = html.indexOf('>', marker) + 1;
  const end = html.lastIndexOf('<', nextMarker);
  if (marker < 0 || nextMarker < 0) throw new Error(`Static screen boundary missing: ${id}`);
  const body = html.slice(start, end).replace(/<!--[\s\S]*?-->/g, '').replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/<[^>]*>/g, '\n');
  return body.split('\n').map(x => x.trim()).filter(x => x && !/^id=|^class=/.test(x)).map(x => x.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
}
const { SCENES } = loadContent();
const sections = [
  ['시작 화면', staticCopy('intro', 'opening-slide')],
  ['오프닝', staticCopy('opening-slide', 'story')],
  ...SCENES.map(s => [`${s.year} — ${s.title}`, [s.message || s.title, ...strings(s.visual), ...(s.foot ? [s.foot] : [])]]),
  ['엔딩', staticCopy('closing', 'credits')],
  ['크레딧', staticCopy('credits', 'player')],
];
const result = '# 장표 카피 — 화면에 보이는 층\n\n' +
  'HTML의 정적 화면과 SCENES 의미 텍스트에서 자동 생성합니다. 수정은 why-ai-bots.html에 하고 `npm run sync`를 실행하세요. 레이아웃·아이콘·대체 설명은 별도이며, 줄 순서는 시각적 읽기 순서와 다를 수 있습니다.\n\n' +
  sections.map(([label, lines]) => `## ${label}\n\n${lines.map(x => '- ' + x).join('\n')}\n`).join('\n');
const out = resolve(packageDir, 'slide-visible-copy.md');
if (process.argv.includes('--write')) writeFileSync(out, result);
else if (readFileSync(out, 'utf8') !== result) throw new Error('Visible copy drift. Run npm run sync.');
console.log(`Visible copy: ${sections.length} screens agree with source.`);
