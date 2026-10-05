import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { buildNarrationDelivery, packageDir } from './export-narration.mjs';
import { durationMicroseconds, requireMinimumDuration, validateRenderManifest, validateReview, inspectRenderedAudio, probeMP3 } from './verify-rendered-audio.mjs';

assert.throws(() => requireMinimumDuration(['1799.999']), /at least 1800/);
assert.equal(requireMinimumDuration(['1800']), 1800);
assert.equal(requireMinimumDuration(Array(32).fill('56.25')), 1800);
assert.throws(() => requireMinimumDuration(['56.249', ...Array(31).fill('56.25')]), /1799.999/);
assert.equal(durationMicroseconds('1799.9999999'), 1799999999n);
for (const bad of ['NaN', 'Infinity', '-1', '0', 'unknown', '1e3']) assert.throws(() => durationMicroseconds(bad));
const canonicalBytes = readFileSync(resolve(packageDir, 'narration.json'));
const { manifest } = buildNarrationDelivery(canonicalBytes);
assert.equal(manifest.durationRequirement.minimumNarrationSeconds, 1800);
assert.equal(manifest.durationRequirement.acceptanceStatus, 'unrendered-not-certified');
assert.equal(manifest.totalDurationSeconds, null);
assert.equal(manifest.renderingStatus, 'unrendered');
validateRenderManifest(canonicalBytes, manifest);
let bad = structuredClone(manifest); bad.sourceJSONSHA256 = 'wrong';
assert.throws(() => validateRenderManifest(canonicalBytes, bad), /canonical/);
bad = structuredClone(manifest); bad.clips[0].textSHA256 = 'wrong';
assert.throws(() => validateRenderManifest(canonicalBytes, bad), /textSHA256/);
bad = structuredClone(manifest); bad.clips.reverse();
assert.throws(() => validateRenderManifest(canonicalBytes, bad), /incorrect id/);

// Plain marker bytes + injected probe, not real or synthesized audio.
const directory = mkdtempSync(resolve(tmpdir(), 'botstory-duration-test-'));
try {
  manifest.clips.forEach(c => writeFileSync(resolve(directory, c.targetMP3filename), `test-only-marker:${c.id}`));
  const input = { audioDir: directory, canonicalBytes, manifest, probe: () => '56.25' };
  const measured = inspectRenderedAudio(input);
  assert.equal(measured.totalDurationSeconds, 1800);
  assert.equal(measured.clips.length, 32);
  assert.throws(() => inspectRenderedAudio({ ...input, probe: () => '56' }), /at least 1800/);
  assert.throws(() => inspectRenderedAudio({ ...input, legacyHashes: [measured.clips[0].audioSHA256] }), /legacy recording/);
  assert.throws(() => probeMP3(resolve(directory, manifest.clips[0].targetMP3filename)), /ffprobe failed/);
  assert.throws(() => validateReview(null, measured.sourceJSONSHA256, measured.clips), /human speech-review/);
  const review = { sourceJSONSHA256: measured.sourceJSONSHA256, clips: measured.clips.map(c => ({ id: c.id, textSHA256: c.textSHA256, audioSHA256: c.audioSHA256, canonicalSpeechVerified: true, narrationOnly: true, noArtificialPadding: true })) };
  validateReview(review, measured.sourceJSONSHA256, measured.clips);
  for (const key of ['canonicalSpeechVerified', 'narrationOnly', 'noArtificialPadding']) {
    const invalid = structuredClone(review); invalid.clips[0][key] = false;
    assert.throws(() => validateReview(invalid, measured.sourceJSONSHA256, measured.clips), /human review/);
  }
  const invalid = structuredClone(review); invalid.clips[0].audioSHA256 = 'wrong';
  assert.throws(() => validateReview(invalid, measured.sourceJSONSHA256, measured.clips), /audioSHA256 mismatch/);
  writeFileSync(resolve(directory, 'credits-bgm.mp3'), 'not counted');
  assert.throws(() => inspectRenderedAudio(input), /exactly the 32/);
  rmSync(resolve(directory, 'credits-bgm.mp3'));
  rmSync(resolve(directory, manifest.clips[0].targetMP3filename));
  assert.throws(() => inspectRenderedAudio(input), /exactly the 32/);
} finally { rmSync(directory, { recursive: true, force: true }); }
console.log('PASS: new-audio acceptance gate, 1799.999s rejection, 1800s boundary, clip/hash/legacy checks and mandatory speech-review receipt. No real audio was generated.');
