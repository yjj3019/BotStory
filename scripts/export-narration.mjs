import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const packageDir = resolve(root, 'edu/why-ai-bots');
export const deliveryDir = resolve(packageDir, 'narration-delivery');
export const expectedIDs = Object.freeze([
  '00-opening',
  ...Array.from({ length: 30 }, (_, i) => `${String(i + 1).padStart(2, '0')}-scene`),
  '31-ending',
]);
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function decodeUTF8(bytes, name = 'input') {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new Error(`${name}: UTF-8 BOM is not allowed`);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${name}: invalid UTF-8`);
  }
}

export function validateNarration(source) {
  if (!source || source.language !== 'ko' || typeof source.title !== 'string' || !source.title.trim()) {
    throw new Error('Narration must have language ko and a nonempty title');
  }
  if (!Array.isArray(source.items) || source.items.length !== expectedIDs.length) {
    throw new Error('Narration must contain exactly 32 ordered clips');
  }
  source.items.forEach((item, index) => {
    if (item.id !== expectedIDs[index]) throw new Error(`Clip ${index}: expected ${expectedIDs[index]}`);
    if (typeof item.label !== 'string' || !item.label.trim() || /[\r\n]/.test(item.label)) {
      throw new Error(`${item.id}: invalid label`);
    }
    if (!Array.isArray(item.lines) || !item.lines.length || item.lines.some(line =>
      typeof line !== 'string' || !line.trim() || line !== line.trim() || /[\r\n\uFEFF\u0000]/u.test(line))) {
      throw new Error(`${item.id}: lines must contain nonempty, trimmed, single-line spoken paragraphs`);
    }
    if (item.text !== item.lines.join(' ')) throw new Error(`${item.id}: text must equal lines joined with one space`);
    if (item.chars !== [...item.text].length) throw new Error(`${item.id}: chars must count Unicode code points`);
  });
}

// The TXT is intentionally just the supplied spoken lines. No pronunciation
// substitutions, headings, instructions, timestamps or performance cues are added.
export function buildNarrationDelivery(sourceBytes) {
  const sourceText = decodeUTF8(sourceBytes, 'narration.json');
  const source = JSON.parse(sourceText);
  validateNarration(source);
  const files = new Map([['narration.json', Buffer.from(sourceBytes)]]);
  const clips = source.items.map((item, index) => {
    const sourceTXTpath = `clips/${item.id}.txt`;
    const clipBytes = Buffer.from(item.lines.join('\n') + '\n', 'utf8');
    files.set(sourceTXTpath, clipBytes);
    const sceneNumber = index > 0 && index < 31 ? index : null;
    return {
      id: item.id,
      label: item.label,
      order: index + 1,
      kind: index === 0 ? 'opening' : index === 31 ? 'ending' : 'scene',
      sceneNumber,
      sceneIndex: sceneNumber === null ? null : sceneNumber - 1,
      playerIndex: index,
      htmlTarget: index === 0 ? '#opening-slide' : index === 31 ? '#closing' : `#scene-${sceneNumber}`,
      sourceTXTpath,
      targetMP3filename: `${item.id}.mp3`,
      chars: item.chars,
      textSHA256: sha256(Buffer.from(item.text, 'utf8')),
      fileSHA256: sha256(clipBytes),
      language: source.language,
      status: 'unrendered',
      durationSeconds: null,
    };
  });
  const manifest = {
    schemaVersion: 1,
    title: source.title,
    language: source.language,
    sourceJSON: 'narration.json',
    sourceJSONSHA256: sha256(sourceBytes),
    presentationHTML: 'edu/why-ai-bots/why-ai-bots.html',
    pathConventions: {
      sourceJSON: 'Relative to this manifest; an exact byte copy of the canonical narration.json.',
      sourceTXTpath: 'Relative to this manifest; this is the spoken-only input for one audio clip.',
      presentationHTML: 'Repository-relative reference to the presentation; the presentation is not included in this text delivery.',
      htmlTarget: 'Selector in presentationHTML. Scene sections are created by the HTML player at runtime.',
      targetMP3filename: 'Required future output basename. The presentation loads it from its audio/ directory.',
      order: 'One-based recording order. playerIndex is zero-based, sceneNumber is one-based, and sceneIndex is zero-based or null.',
    },
    hashConventions: {
      algorithm: 'SHA-256, lowercase hexadecimal',
      textSHA256: 'UTF-8 bytes of the exact canonical item.text (item.lines joined with one U+0020 space); no added final newline.',
      fileSHA256: 'Exact UTF-8 bytes of sourceTXTpath (item.lines joined with LF, plus one final LF); no BOM.',
      sourceJSONSHA256: 'Exact bytes of the canonical source JSON, copied unchanged as narration.json.',
      meaning: 'Hashes establish script/file identity only. They do not establish audio transcription, pronunciation or timing alignment.',
    },
    renderingStatus: 'unrendered',
    totalDurationSeconds: null,
    durationPolicy: 'No audio is generated, measured or reused by this export. Every actual duration remains null until the matching new recordings are rendered and measured.',
    clips,
  };
  files.set('rendering-manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n', 'utf8'));
  const readThrough = `# ${source.title} — 나레이션 통합 검토본\n\n` +
    '이 파일은 사람이 읽고 검토하는 용도입니다. 제목과 클립 구분이 포함되어 있으므로 음성 합성 입력으로 사용하지 마세요. 녹음·음성 합성에는 clips/ 폴더의 클립별 TXT만 사용하세요.\n\n' +
    '아래 본문은 narration.json의 lines 순서를 그대로 유지합니다. 각 제목의 파일 이름은 rendering-manifest.json의 출력 파일 이름과 대응하며, 녹음 길이는 아직 측정하지 않았습니다.\n\n' +
    source.items.map(item => `## ${item.id} · ${item.label}\n\n${item.lines.join('\n\n')}\n`).join('\n');
  files.set('read-through.md', Buffer.from(readThrough, 'utf8'));
  return { source, manifest, files };
}

function walkFiles(directory, prefix = '') {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Delivery must not contain symbolic links: ${path}`);
    return entry.isDirectory() ? walkFiles(resolve(directory, entry.name), path) : [path];
  });
}

export function checkDeliveryFiles(files, directory) {
  const problems = [];
  for (const [name, expected] of files) {
    const destination = resolve(directory, name);
    if (!existsSync(destination)) problems.push(`missing ${name}`);
    else if (!readFileSync(destination).equals(expected)) problems.push(`different ${name}`);
  }
  for (const name of walkFiles(directory)) {
    if (name.startsWith('clips/') && !files.has(name)) problems.push(`unexpected clip file ${name}`);
    if (/\.(?:mp3|wav|m4a|aac|ogg|flac|aiff?|opus|webm|mp4)$/i.test(name)) problems.push(`audio/media is not part of text delivery: ${name}`);
  }
  return problems;
}

export function writeDeliveryFiles(files, directory) {
  // Other root-level files (for example the handoff guide) belong to their authors.
  // Unexpected files are reported by the check; they are never silently deleted.
  walkFiles(directory);
  for (const [name, bytes] of files) {
    const destination = resolve(directory, name);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, bytes);
  }
}

export function main(args = process.argv.slice(2)) {
  if (args.some(arg => arg !== '--write') || args.length > 1) throw new Error('Usage: node scripts/export-narration.mjs [--write]');
  const { files } = buildNarrationDelivery(readFileSync(resolve(packageDir, 'narration.json')));
  if (args.includes('--write')) writeDeliveryFiles(files, deliveryDir);
  const problems = checkDeliveryFiles(files, deliveryDir);
  if (problems.length) throw new Error(`Narration delivery drift:\n- ${problems.join('\n- ')}\nRun: node scripts/export-narration.mjs --write. Remove any reported stale clip/media files separately.`);
  console.log('Narration delivery: 32 spoken-only TXT clips, canonical JSON copy, review text and unrendered manifest agree byte-for-byte.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
