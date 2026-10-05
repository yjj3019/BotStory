import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { packageDir, expectedNarration, loadContent } from './sync-content.mjs';
const html = readFileSync(resolve(packageDir, 'why-ai-bots.html'), 'utf8');
for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
const narration = expectedNarration();
assert.equal(narration.items.length, 32);
assert.equal(new Set(narration.items.map(x => x.id)).size, 32);
for (const item of narration.items) {
  assert.equal(item.lines.join(' '), item.text);
  assert.equal([...item.text].length, item.chars);
  assert.ok(existsSync(resolve(packageDir, 'audio', item.id + '.mp3')));
}
function checkAssets(value) {
  if (typeof value === 'string' && value.startsWith('assets/')) assert.ok(existsSync(resolve(packageDir, value)), value);
  else if (Array.isArray(value)) value.forEach(checkAssets);
  else if (value && typeof value === 'object') Object.values(value).forEach(checkAssets);
}
checkAssets(loadContent().SCENES);
for (const match of html.matchAll(/(?:src|href)=["']((?:assets|audio)\/[^"']+)["']/g)) assert.ok(existsSync(resolve(packageDir, match[1])), match[1]);
const revisedMatch = html.match(/const PENDING_RECORDING_CLIPS = new Set\((\[[\s\S]*?\])\)/);
assert.ok(revisedMatch, 'Revised clips must have an explicit playback policy');
const revised = vm.runInNewContext(revisedMatch[1]);
const manifest = JSON.parse(readFileSync(resolve(packageDir, 'audio-manifest.json'), 'utf8'));
assert.deepEqual([...revised].sort(), manifest.clips.filter(x => x.playback === 'legacy-recording-pending-user-render').map(x => x.id).sort());
assert.equal(manifest.clips.length, narration.items.length);
const scenes = loadContent().SCENES;
assert.ok(scenes[2].lines.join(' ').includes('작업 성공을 보장하지는'));
assert.ok(scenes[8].lines.join(' ').includes('실행 승인 기능'));
assert.ok(scenes[21].lines.join(' ').includes('사용자가 직접 처리'));
assert.ok(scenes[25].lines.join(' ').includes('알엘에스'));
assert.ok(!html.includes('격리 = 내 서버'));
assert.ok(!html.includes('speechSynthesis'), 'Browser speech synthesis must not be used');
console.log('PASS: script syntax, 32 clip IDs/fields, local assets, revised-audio policy and core corrections.');

const dgRootSource = html.match(/function dgRoot\(v, cls\) \{[\s\S]*?\n\}/)[0];
const dgContext = vm.createContext({ el: () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = String(v); } }) });
vm.runInContext(dgRootSource, dgContext);
assert.equal(vm.runInContext("dgRoot({}, 'test').attrs['aria-label']", dgContext), undefined);
assert.equal(vm.runInContext("dgRoot({aria: '설명'}, 'test').attrs['aria-label']", dgContext), '설명');
assert.ok(scenes[27].lines.join(' ').includes('로컬 실행 자체가 곧 사고라는 뜻은 아니에요.'));
console.log('PASS: absent diagram aria labels and local-execution risk distinction.');

// Dense comparison slides keep readable sizes without removing narration detail.
const dotsControl = scenes.find(s => s.year.startsWith('21장'));
const productComparison = scenes.find(s => s.year.startsWith('22장'));
for (const scene of [dotsControl, productComparison]) {
  assert.equal(scene.visual.parts[0].readable, true);
  assert.equal(scene.visual.parts[0].rows.length, 4);
  assert.ok(!scene.visual.parts.some(p => p.type === 'gloss'), 'Move secondary definitions to the guide');
}
assert.ok(html.includes('minmax(min-content, '), 'Readable grids must retain intrinsic content height');
assert.ok(html.includes('w.tabIndex = 0'), 'Scrollable comparison must be keyboard focusable');
assert.ok(html.includes('.roll-view, .dg-readable,'), 'Arrow keys in comparison must stay native for scrolling');
assert.ok(html.includes('font-size: max(18px, 2.5vh)'));
assert.ok(html.includes('scrollbar-gutter: stable'));
const guide = readFileSync(resolve(packageDir, 'LEARNING-GUIDE.md'), 'utf8');
for (const detail of ['백그라운드 에이전트', '클라우드 브라우저 로그인', '안전 문제', 'Enterprise 워크스페이스', 'Custom Rules', '명시 동의']) assert.ok(guide.includes(detail), detail);
console.log('PASS: four-group comparison structure, readable sizing, keyboard scroll and preserved guide detail.');

// Actual 720p QA regressions: intrinsic agent box and reserved ending footer.
assert.ok(html.includes('#closing .shell-foot { position: static; flex: 0 0 auto;'));
assert.ok(html.includes('#story [data-sk="12"] .dg-frame > .dg-box:only-of-type { flex: 0 0 auto; min-height: min-content; }'));
assert.ok(html.includes('class="end-body dg-scrollable" tabindex="0" role="region"'));
assert.ok(html.includes("runtime.classList.add('dg-scrollable')"));
console.log('PASS: agent intrinsic height and separate ending-footer space.');

// Contrast on the actual pale surfaces, rather than white alone.
const rgb = hex => hex.match(/[a-f0-9]{2}/gi).map(x => parseInt(x, 16));
const luminance = channels => channels.map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
const muted = rgb(html.match(/--muted: (#[a-f0-9]{6})/i)[1]);
const pale = ['#FFFFFF', '#E8F0FF', '#F3F7FF', '#E9EEF8', '#FFF5F5'].map(rgb);
pale.push(muted.map(x => x * .08 + 255 * .92));
for (const background of pale) assert.ok(contrast(muted, background) >= 4.5, 'Muted text must contrast against pale cards');
const deepBlue = rgb(html.match(/--s-blue-deep: (#[a-f0-9]{6})/i)[1]);
assert.ok(contrast(rgb('#FFFFFF'), deepBlue) >= 4.5);
assert.match(html, /\.slide-head \.chap \{[^}]*background: var\(--s-blue-deep\)/);
assert.ok(html.includes('Narrow-screen reading layout. Desktop slide geometry stays unchanged.'));
assert.ok(html.includes('body { overflow: auto; }'));
assert.ok(html.includes('#intro h1 .nb { white-space: normal; }'));
assert.ok(html.includes('grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: auto !important; height: auto;'));
assert.ok(html.includes('region.tabIndex = 0;'));
assert.ok(html.includes('#credits.in .roll-track { animation: none; transform: none; padding-top: 0; }'));
console.log('PASS: chapter/muted contrast >=4.5:1 on pale surfaces and narrow-screen reading fallback guards.');
