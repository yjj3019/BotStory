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
