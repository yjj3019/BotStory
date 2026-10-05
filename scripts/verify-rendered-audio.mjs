#!/usr/bin/env node
// Read-only acceptance gate for NEW recordings. No synthesis, edits, playback or unlocks.
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildNarrationDelivery, expectedIDs, sha256, packageDir } from './export-narration.mjs';

export const MINIMUM_NARRATION_SECONDS = 1800;
export function durationMicroseconds(value) {
  const match = String(value).trim().match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) throw new Error(`Invalid ffprobe duration: ${value}`);
  // Truncate sub-microsecond fractions conservatively; never round up to the minimum.
  const result = BigInt(match[1]) * 1000000n + BigInt((match[2] || '').padEnd(6, '0').slice(0, 6));
  if (result <= 0n) throw new Error('Every recording must have a positive measured duration');
  return result;
}
export function requireMinimumDuration(durations) {
  const total = durations.reduce((sum, value) => sum + durationMicroseconds(value), 0n);
  if (total < BigInt(MINIMUM_NARRATION_SECONDS) * 1000000n) {
    throw new Error(`Narration is ${Number(total) / 1e6} seconds; at least 1800 seconds (30 minutes) is required. Do not pad with silence or music.`);
  }
  return Number(total) / 1e6;
}
export function validateRenderManifest(canonicalBytes, manifest) {
  const expected = buildNarrationDelivery(canonicalBytes).manifest;
  if (manifest.sourceJSONSHA256 !== expected.sourceJSONSHA256) throw new Error('Manifest does not match canonical narration JSON SHA-256');
  if (!Array.isArray(manifest.clips) || manifest.clips.length !== 32) throw new Error('Manifest must contain exactly 32 clips');
  expected.clips.forEach((clip, i) => {
    for (const key of ['id', 'textSHA256', 'fileSHA256', 'targetMP3filename']) {
      if (manifest.clips[i][key] !== clip[key]) throw new Error(`Manifest clip ${i} has an incorrect ${key}`);
    }
  });
  return expected;
}
export function validateReview(review, sourceHash, measured) {
  if (!review || review.sourceJSONSHA256 !== sourceHash || !Array.isArray(review.clips) || review.clips.length !== 32) {
    throw new Error('A complete human speech-review receipt bound to the canonical JSON and 32 audio files is required');
  }
  measured.forEach((clip, i) => {
    const item = review.clips[i];
    for (const key of ['id', 'textSHA256', 'audioSHA256']) {
      if (item[key] !== clip[key]) throw new Error(`${clip.id}: review receipt ${key} mismatch`);
    }
    for (const key of ['canonicalSpeechVerified', 'narrationOnly', 'noArtificialPadding']) {
      if (item[key] !== true) throw new Error(`${clip.id}: human review must confirm ${key}`);
    }
  });
}
export function probeMP3(path) {
  const result = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name', '-of', 'json', path], { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(`ffprobe failed for ${path}: ${result.error?.message || result.stderr}`);
  const data = JSON.parse(result.stdout);
  if (!data.streams?.some(s => s.codec_type === 'audio' && s.codec_name === 'mp3')) throw new Error(`Not an MP3 audio stream: ${path}`);
  durationMicroseconds(data.format?.duration);
  return data.format.duration;
}
export function inspectRenderedAudio({ audioDir, canonicalBytes, manifest, legacyHashes = [], probe = probeMP3 }) {
  const expected = validateRenderManifest(canonicalBytes, manifest);
  const required = expectedIDs.map(id => `${id}.mp3`);
  const found = readdirSync(audioDir).filter(name => /\.(?:mp3|wav|m4a|aac|ogg|flac|opus)$/i.test(name)).sort();
  if (JSON.stringify(found) !== JSON.stringify([...required].sort())) throw new Error('Audio directory must contain exactly the 32 named MP3 clips; no missing clips, credits music or other audio');
  const legacy = new Set(legacyHashes);
  const clips = expected.clips.map(clip => {
    const path = resolve(audioDir, clip.targetMP3filename);
    if (!lstatSync(path).isFile()) throw new Error(`Audio must be a regular file, not a symlink: ${clip.id}`);
    const audioSHA256 = sha256(readFileSync(path));
    if (legacy.has(audioSHA256)) throw new Error(`${clip.id}: legacy recording cannot certify the revised script`);
    const duration = probe(path);
    return { id: clip.id, textSHA256: clip.textSHA256, audioSHA256, durationSeconds: Number(durationMicroseconds(duration)) / 1e6, durationExact: String(duration) };
  });
  return {
    sourceJSONSHA256: expected.sourceJSONSHA256,
    minimumNarrationSeconds: MINIMUM_NARRATION_SECONDS,
    totalDurationSeconds: requireMinimumDuration(clips.map(c => c.durationExact)),
    measurement: 'ffprobe format.duration, exact microsecond sum of the 32 narration MP3s only',
    excludedFromFileSum: ['credits BGM files', 'transition waits', 'other audio files'],
    humanReviewMustRuleOut: ['artificial silence padding inside clips', 'music inside clips', 'speech mismatch'],
    speechReview: 'required; duration and hashes alone do not prove speech content or absence of padding',
    clips,
  };
}
export function main(args = process.argv.slice(2)) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--audio-dir', '--review'].includes(args[i]) || !args[i + 1] || options[args[i]]) throw new Error('Usage: node scripts/verify-rendered-audio.mjs --audio-dir NEW_MP3_DIRECTORY --review SPEECH_REVIEW.json');
    options[args[i]] = args[i + 1];
  }
  if (!options['--audio-dir']) throw new Error('--audio-dir is required; legacy audio is never selected automatically');
  const manifest = JSON.parse(readFileSync(resolve(packageDir, 'narration-delivery/rendering-manifest.json')));
  const legacy = JSON.parse(readFileSync(resolve(packageDir, 'audio-manifest.json')));
  const result = inspectRenderedAudio({ audioDir: resolve(options['--audio-dir']), canonicalBytes: readFileSync(resolve(packageDir, 'narration.json')), manifest, legacyHashes: legacy.clips.map(c => c.audioSha256) });
  if (!options['--review']) {
    console.log(JSON.stringify({ ...result, acceptanceStatus: 'NOT_CERTIFIED_SPEECH_REVIEW_REQUIRED' }, null, 2));
    throw new Error('Duration threshold met, but acceptance requires a human speech-review receipt; nothing has been certified or enabled');
  }
  validateReview(JSON.parse(readFileSync(resolve(options['--review']))), result.sourceJSONSHA256, result.clips);
  console.log(JSON.stringify({ ...result, speechReview: 'supplied human review receipt matches exact audio and script hashes; tool did not listen or transcribe', acceptanceStatus: 'MEASURED_MINIMUM_MET_WITH_SUPPLIED_HUMAN_REVIEW' }, null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
