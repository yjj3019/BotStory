import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import {
  buildNarrationDelivery, checkDeliveryFiles, decodeUTF8, deliveryDir,
  packageDir, validateNarration, writeDeliveryFiles,
} from './export-narration.mjs';
import { expectedNarration, loadContent } from './sync-content.mjs';

const IDs = ['00-opening', ...Array.from({ length: 30 }, (_, index) => `${String(index + 1).padStart(2, '0')}-scene`), '31-ending'];
const digest = value => createHash('sha256').update(value).digest('hex');
const sourceBytes = readFileSync(resolve(packageDir, 'narration.json'));
const { source, manifest, files } = buildNarrationDelivery(sourceBytes);
assert.equal(files.size, 35, '32 TXT clips and three review/manifest/source files');
assert.equal(sourceBytes.toString('utf8'), JSON.stringify(expectedNarration(), null, 2) + '\n', 'Canonical JSON must be freshly synchronized from HTML');
assert.deepEqual(source.items.map(item => item.id), IDs, 'All 32 IDs must have the fixed presentation order');
assert.deepEqual(manifest.clips.map(clip => clip.id), IDs);
assert.equal(new Set(manifest.clips.map(clip => clip.sourceTXTpath)).size, 32);
assert.equal(new Set(manifest.clips.map(clip => clip.targetMP3filename)).size, 32);
assert.equal(manifest.sourceJSON, 'narration.json');
assert.ok(files.get(manifest.sourceJSON).equals(sourceBytes), 'Delivered JSON must be an exact byte copy');
assert.equal(manifest.sourceJSONSHA256, digest(sourceBytes));
assert.equal(manifest.renderingStatus, 'unrendered');
assert.equal(manifest.totalDurationSeconds, null);
assert.equal(manifest.language, source.language);
assert.match(manifest.hashConventions.textSHA256, /item\.text/);
assert.match(manifest.hashConventions.fileSHA256, /final LF/);
assert.match(manifest.hashConventions.meaning, /do not establish audio/);
assert.deepEqual(JSON.parse(files.get('rendering-manifest.json').toString('utf8')), manifest);

const { SCENES } = loadContent();
const html = readFileSync(resolve(packageDir, 'why-ai-bots.html'), 'utf8');
assert.ok(html.includes('id="opening-slide"'));
assert.ok(html.includes('id="closing"'));
assert.match(html, /sec\.id\s*=\s*'scene-'\s*\+\s*\(i\s*\+\s*1\)/, 'Runtime scene selectors must match manifest targets');
assert.equal(SCENES.length, 30);
assert.equal(manifest.presentationHTML, 'edu/why-ai-bots/why-ai-bots.html');

// The source is deliberately normalized for Korean narration, not transformed by
// this exporter. A newly introduced acronym or stage direction needs author review.
function assertSpokenOnly(text, id) {
  assert.doesNotMatch(text, /[A-Za-z]/u, `${id}: normalize Latin terms in canonical narration before export`);
  assert.doesNotMatch(text, /[\[\]{}<>\uFEFF\uFFFD\u0000]/u, `${id}: markup, stage cues or replacement characters are not spoken input`);
  assert.doesNotMatch(text, /(?:^|\n)\s*(?:#{1,6}\s|[-*>]\s|```|(?:화자|나레이터|해설|자막|연출)\s*:)/u, `${id}: no headings, bullets or speaker labels`);
  assert.doesNotMatch(text, /\((?:[^)]*(?:잠시\s*쉼|쉬어\s*가기|강조|효과음|배경음|음악|초\s*대기|장면\s*전환)[^)]*)\)/u, `${id}: no parenthesized stage directions`);
  assert.doesNotMatch(text, /\b\d{1,2}:\d{2}(?::\d{2})?\b/u, `${id}: no timing cues`);
}

source.items.forEach((item, index) => {
  const clip = manifest.clips[index];
  const name = `clips/${IDs[index]}.txt`;
  const bytes = files.get(name);
  const text = decodeUTF8(bytes, name);
  assert.equal(text, item.lines.join('\n') + '\n', `${name}: only the supplied lines and final LF`);
  assert.deepEqual(text.slice(0, -1).split('\n'), item.lines);
  assert.equal(item.lines.join(' '), item.text);
  assert.equal([...item.text].length, item.chars);
  assertSpokenOnly(text, item.id);
  assert.equal(clip.label, item.label);
  assert.equal(clip.order, index + 1);
  assert.equal(clip.playerIndex, index);
  assert.equal(clip.sourceTXTpath, name);
  assert.equal(clip.targetMP3filename, `${IDs[index]}.mp3`);
  assert.equal(clip.chars, item.chars);
  assert.equal(clip.language, 'ko');
  assert.equal(clip.textSHA256, digest(Buffer.from(item.text, 'utf8')));
  assert.equal(clip.fileSHA256, digest(bytes));
  assert.notEqual(clip.textSHA256, clip.fileSHA256, 'Canonical text and newline-terminated TXT are distinct byte inputs');
  assert.equal(clip.status, 'unrendered');
  assert.equal(clip.durationSeconds, null, 'Old recording durations must never be copied');
  assert.ok(!('audioSha256' in clip) && !('audioSHA256' in clip), 'No rendered-audio claim without new audio');
  if (index === 0 || index === 31) {
    assert.equal(clip.kind, index === 0 ? 'opening' : 'ending');
    assert.equal(clip.sceneNumber, null);
    assert.equal(clip.sceneIndex, null);
    assert.equal(clip.htmlTarget, index === 0 ? '#opening-slide' : '#closing');
  } else {
    assert.equal(clip.kind, 'scene');
    assert.equal(clip.sceneNumber, index);
    assert.equal(clip.sceneIndex, index - 1);
    assert.equal(clip.htmlTarget, `#scene-${index}`);
    assert.equal(clip.label, SCENES[index - 1].year);
  }
});

for (const [name, bytes] of files) {
  const decoded = decodeUTF8(bytes, name);
  assert.ok(Buffer.from(decoded, 'utf8').equals(bytes), `${name}: lossless UTF-8 without BOM`);
  assert.doesNotMatch(decoded, /\r/u, `${name}: use LF newlines`);
  assert.doesNotMatch(name, /\.(mp3|wav|m4a|ogg)$/i, 'Text exports must not contain audio');
}
const combined = decodeUTF8(files.get('read-through.md'));
assert.match(combined, /음성 합성 입력으로 사용하지 마세요/);
const sections = combined.split(/^## /m).slice(1);
assert.equal(sections.length, 32, 'Read-through must contain exactly one heading per clip');
sections.forEach((section, index) => {
  const item = source.items[index];
  const suffix = index === 31 ? '\n' : '\n\n';
  assert.equal(section, `${item.id} · ${item.label}\n\n${item.lines.join('\n\n')}${suffix}`);
});

// Exercise rejection and byte-level drift detection without modifying deliverables.
function expectInvalid(change, pattern) {
  const altered = structuredClone(source);
  change(altered);
  assert.throws(() => validateNarration(altered), pattern);
}
expectInvalid(value => value.items.pop(), /exactly 32/);
expectInvalid(value => value.items.reverse(), /expected 00-opening/);
expectInvalid(value => { value.items[1].id = '00-opening'; }, /expected 01-scene/);
expectInvalid(value => { value.items[1].label = ''; }, /invalid label/);
expectInvalid(value => { value.items[1].lines = []; }, /lines must/);
expectInvalid(value => { value.items[1].lines[0] += '\n'; }, /lines must/);
expectInvalid(value => { value.items[1].lines[0] = '   '; }, /lines must/);
expectInvalid(value => { value.items[1].text += ' '; }, /text must equal/);
expectInvalid(value => { value.items[1].chars++; }, /chars must count/);
assert.throws(() => buildNarrationDelivery(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), sourceBytes])), /BOM/);
assert.throws(() => decodeUTF8(Buffer.from([0xc3, 0x28])), /invalid UTF-8/);
for (const cue of ['[잠시 쉼]', '(강조)', '# 제목', '나레이터: 안녕하세요.', 'AI를 설명해요.', '00:05']) {
  assert.throws(() => assertSpokenOnly(cue, 'test-stage-cue'), /test-stage-cue/);
}
const variant = structuredClone(source);
variant.items[0].lines = ['첫 문장이에요.', '다음 문장이에요. 🌊'];
variant.items[0].text = variant.items[0].lines.join(' ');
variant.items[0].chars = [...variant.items[0].text].length;
const variantExport = buildNarrationDelivery(Buffer.from(JSON.stringify(variant) + '\n', 'utf8'));
assert.equal(variantExport.files.get('clips/00-opening.txt').toString('utf8'), '첫 문장이에요.\n다음 문장이에요. 🌊\n');
assert.equal(variantExport.manifest.clips[0].chars, [...variant.items[0].text].length);
assert.equal(variantExport.manifest.clips[0].textSHA256, digest(Buffer.from(variant.items[0].text)));

const temporary = mkdtempSync(resolve(tmpdir(), 'botstory-narration-'));
try {
  assert.equal(checkDeliveryFiles(files, temporary).length, 35, 'Check mode reports every missing managed file');
  writeDeliveryFiles(files, temporary);
  assert.deepEqual(checkDeliveryFiles(files, temporary), []);
  writeFileSync(resolve(temporary, 'README.md'), 'A separately authored handoff guide.\n');
  writeDeliveryFiles(files, temporary);
  assert.equal(readFileSync(resolve(temporary, 'README.md'), 'utf8'), 'A separately authored handoff guide.\n');
  assert.deepEqual(checkDeliveryFiles(files, temporary), [], 'Separate handoff files are preserved');
  const first = 'clips/00-opening.txt';
  writeFileSync(resolve(temporary, first), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), files.get(first)]));
  assert.ok(checkDeliveryFiles(files, temporary).includes(`different ${first}`), 'BOM introduction must fail exact compare');
  writeDeliveryFiles(files, temporary);
  writeFileSync(resolve(temporary, 'clips/obsolete.txt'), '오래된 원고예요.\n');
  writeFileSync(resolve(temporary, 'old-audio.mp3'), 'not real audio');
  const problems = checkDeliveryFiles(files, temporary);
  assert.ok(problems.includes('unexpected clip file clips/obsolete.txt'));
  assert.ok(problems.includes('audio/media is not part of text delivery: old-audio.mp3'));
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

const deliveryProblems = checkDeliveryFiles(files, deliveryDir);
assert.deepEqual(deliveryProblems, [], `Checked-in delivery differs: ${deliveryProblems.join('; ')}. Run node scripts/export-narration.mjs --write.`);
console.log('PASS: 32 ordered spoken-only UTF-8 clips, canonical JSON identity, HTML/audio filename mapping, exact hashes, 32 review sections, unrendered timing policy and drift/error checks.');
