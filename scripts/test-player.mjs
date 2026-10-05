#!/usr/bin/env node
// Deterministic runtime regression tests. No network, browser, audio output or npm install required.
// Optional real-browser smoke/layout captures: node scripts/test-player.mjs --browser
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'edu/why-ai-bots/why-ai-bots.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const mainScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const runtimeStart = mainScript.indexOf('function showScene(n) {');
const runtimeEnd = mainScript.indexOf('\nbuildPages();', runtimeStart);
assert(runtimeStart >= 0 && runtimeEnd > runtimeStart, 'Player runtime boundaries must exist');
const runtime = mainScript.slice(runtimeStart, runtimeEnd);
const sceneSource = mainScript.slice(mainScript.indexOf('const OPENING_TEXT'), mainScript.indexOf('const story ='));

class Element {
  constructor(id, tagName = 'DIV') {
    this.id = id; this.tagName = tagName; this.hidden = false; this.disabled = false;
    this.attributes = {}; this.handlers = {}; this.textContent = ''; this.clientHeight = 500; this.offsetWidth = 800;
    this.style = { setProperty(name, value) { this[name] = value; } };
    const classes = new Set();
    this.classList = { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)), contains: n => classes.has(n) };
  }
  append(...children) { this.children = [...(this.children || []), ...children]; }
  appendChild(child) { this.append(child); return child; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  addEventListener(name, callback) { (this.handlers[name] ||= []).push(callback); }
  emit(name, event = {}) { for (const fn of this.handlers[name] || []) fn({ target: this, ...event }); }
  click() { if (!this.disabled) this.emit('click'); }
  focus() { this.ownerDocument.activeElement = this; }
  closest(selectors) {
    if (selectors === '#player') return ['play', 'prev', 'next', 'study-open'].includes(this.id) ? this.ownerDocument.getElementById('player') : null;
    return selectors.split(',').some(raw => {
      const selector = raw.trim();
      return selector.toUpperCase() === this.tagName || selector === '.roll-view' && this.id === 'roll-view' || selector === '[contenteditable]' && this.editable;
    }) ? this : null;
  }
}

function fixture(options = {}) {
  let now = 0, nextTimer = 0;
  const timers = new Map();
  const setTimer = (fn, delay, interval = false) => { const id = ++nextTimer; timers.set(id, { fn, at: now + delay, delay, interval }); return id; };
  const elements = new Map();
  for (const id of ['story', 'closing', 'credits', 'opening-slide', 'player', 'meta', 'engine', 'intro', 'roll-view', 'roll-track', 'start', 'play', 'prev', 'next', 'rollReplay', 'study-open']) elements.set(id, new Element(id, ['start', 'play', 'prev', 'next', 'rollReplay', 'study-open'].includes(id) ? 'BUTTON' : 'DIV'));
  const pages = Array.from({ length: 30 }, (_, i) => { const p = new Element('scene-' + (i + 1)); elements.set(p.id, p); return p; });
  const body = new Element('body', 'BODY');
  const doc = {
    activeElement: body, body, handlers: {}, dialogOpen: false,
    createElement(tagName) { const el = new Element('', tagName.toUpperCase()); el.ownerDocument = this; return el; },
    getElementById: id => elements.get(id),
    querySelector(selector) { return selector === 'dialog[open]' ? this.dialogOpen ? {} : null : elements.get(selector === '#credits .roll-view' ? 'roll-view' : selector === '#credits .roll-track' ? 'roll-track' : selector.slice(1)); },
    querySelectorAll: selector => selector === '.page' ? pages : [],
    addEventListener(name, fn) { (this.handlers[name] ||= []).push(fn); }
  };
  for (const el of elements.values()) el.ownerDocument = doc;
  elements.get('player').hidden = true;
  const media = [];
  const requests = [];
  class AudioMock {
    constructor(src = '') {
      this.handlers = {}; this.paused = true; this.ended = false; this.currentTime = 0; this.volume = 1; this.playCount = 0; this.pauseCount = 0;
      this._src = src; this.isBgm = src.includes('credits-bgm'); this.pending = []; media.push(this);
    }
    set src(value) {
      this._src = value; requests.push(value);
      if (options.load === 'pending') return;
      queueMicrotask(() => this.emit(options.load === 'missing' || (options.load === 'wav' && value.endsWith('.mp3')) ? 'error' : 'canplay'));
    }
    get src() { return this._src; }
    addEventListener(name, fn) { (this.handlers[name] ||= new Set()).add(fn); }
    removeEventListener(name, fn) { this.handlers[name]?.delete(fn); }
    removeAttribute(name) { if (name === 'src') this._src = ''; }
    load() { this.loadCount = (this.loadCount || 0) + 1; }
    emit(name) {
      if (name === 'ended') { this.ended = true; this.paused = true; }
      for (const fn of [...(this.handlers[name] || [])]) fn({ target: this });
      this['on' + name]?.({ target: this });
    }
    play() {
      this.playCount++; this.paused = false;
      if (options.play === 'pending' || (this.isBgm && options.bgmPlay === 'pending')) return new Promise((resolve, reject) => this.pending.push({ resolve, reject }));
      if (options.play === 'reject' && !this.isBgm) return Promise.reject(new Error('Playback failed'));
      return Promise.resolve();
    }
    pause() { this.pauseCount++; this.paused = true; }
  }
  const context = vm.createContext({
    document: doc, Audio: AudioMock,
    window: { matchMedia: true },
    matchMedia: () => ({ matches: !!options.reducedMotion }),
    performance: { now: () => now },
    setTimeout: (fn, delay) => setTimer(fn, delay), clearTimeout: id => timers.delete(id),
    setInterval: (fn, delay) => setTimer(fn, delay, true), clearInterval: id => timers.delete(id), console
  });
  vm.runInContext(sceneSource + `
    const story = document.getElementById('story');
    const closing = document.getElementById('closing');
    const credits = document.getElementById('credits');
    const openingSlide = document.getElementById('opening-slide');
    const player = document.getElementById('player');
    const meta = document.getElementById('meta');
    const engineEl = document.getElementById('engine');
    let idx = 0, audio = null, speaking = false;
  ` + runtime, context, { filename: 'why-ai-bots-player.js' });
  const run = code => vm.runInContext(code, context);
  // Test-only opt-in: emulate future verified recordings for transport/race regressions.
  // Production-policy tests leave every pending guard untouched.
  if (options.verifiedRecordings) run('PENDING_RECORDING_CLIPS.clear()');
  const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  return {
    elements, media, requests, doc, run, flush, body, timers,
    get narration() { return media.filter(a => !a.isBgm).at(-1); },
    get bgm() { return media.find(a => a.isBgm); },
    async click(id) { elements.get(id).click(); await flush(); },
    async jump(idx) { run(`stopAudio(); player.hidden = false; idx = ${idx}; showScene(idx);`); await flush(); },
    async advance(ms) {
      const target = now + ms;
      while (true) {
        const next = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [id, timer] = next; now = timer.at;
        if (timer.interval) timer.at += timer.delay; else timers.delete(id);
        timer.fn(); await flush();
      }
      now = target; await flush();
    },
    key(key, target = body, extra = {}) {
      const event = { key, code: key === ' ' ? 'Space' : key, target, prevented: false, preventDefault() { this.prevented = true; }, ...extra };
      for (const fn of doc.handlers.keydown || []) fn(event);
      return event;
    }
  };
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
test('Start focuses playback and narrates opening; boundary controls are disabled', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.click('start');
  assert.equal(f.doc.activeElement.id, 'play'); assert.equal(f.run('idx'), 0);
  assert.equal(f.elements.get('prev').disabled, true); assert.equal(f.narration.playCount, 1);
  assert.equal(f.elements.get('play').getAttribute('aria-label'), '일시정지');
  f.narration.emit('ended'); await f.flush(); assert.equal(f.run('idx'), 1);
  assert.equal(f.requests.at(-1), 'audio/01-scene.mp3');
});
test('Recorded audio pauses and resumes the same clip and position', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.click('start'); const clip = f.narration; clip.currentTime = 23;
  await f.click('play'); assert.equal(clip.paused, true); assert.equal(f.elements.get('play').getAttribute('aria-label'), '이어 재생');
  await f.click('play'); assert.equal(f.narration, clip); assert.equal(clip.currentTime, 23); assert.equal(clip.playCount, 2); assert.equal(f.requests.length, 1);
});
test('Pause during loading prevents late autoplay and permits resume', async () => {
  const f = fixture({ verifiedRecordings: true, load: 'pending' }); await f.click('start'); await f.click('play');
  f.narration.emit('canplay'); await f.flush(); assert.equal(f.narration.playCount, 0);
  await f.click('play'); assert.equal(f.narration.playCount, 1);
});
test('Navigating cancels pending loading and ignores stale completion', async () => {
  const f = fixture({ verifiedRecordings: true, load: 'pending' }); await f.click('start'); const old = f.narration;
  await f.click('next'); old.emit('canplay'); await f.flush(); await f.advance(13000);
  assert.equal(f.run('idx'), 1); assert.equal(old.playCount, 0); assert.equal(old.src, '');
});
test('Navigation stops recorded audio; an old end event cannot advance', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.click('start'); const old = f.narration; const oldEnd = old.onended;
  await f.click('next'); oldEnd(); await f.flush(); assert.equal(f.run('idx'), 1); assert.equal(old.paused, true); assert.equal(f.run('speaking'), false);
});
test('A queued end event during pause is held until resume', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.click('start'); await f.click('play'); f.narration.emit('ended'); await f.flush();
  assert.equal(f.run('idx'), 0); await f.click('play'); assert.equal(f.run('idx'), 1);
});
test('Rapid pause/resume ignores an earlier rejected play promise', async () => {
  const f = fixture({ verifiedRecordings: true, play: 'pending' }); await f.click('start'); const clip = f.narration;
  await f.click('play'); await f.click('play'); clip.pending[0].reject(new Error('AbortError')); await f.flush();
  assert.equal(f.run('playback.kind'), 'audio');
  clip.pending[1].resolve(); await f.flush(); assert.equal(f.run('speaking'), true);
});
test('Missing MP3 tries recorded WAV before reporting failure', async () => {
  const f = fixture({ verifiedRecordings: true, load: 'wav' }); await f.click('start');
  assert.deepEqual(f.requests, ['audio/00-opening.mp3', 'audio/00-opening.wav']); assert.equal(f.narration.playCount, 1);
});
test('Missing recordings expose full narration and stop automatic progression', async () => {
  const f = fixture({ verifiedRecordings: true, load: 'missing' }); await f.click('start');
  assert.deepEqual(f.requests, ['audio/00-opening.mp3', 'audio/00-opening.wav']);
  assert.equal(f.run('speaking'), false); assert.equal(f.run('idx'), 0);
  assert.equal(f.elements.get('engine').textContent, '녹음 불러오기 실패 · 원고 표시');
  assert.equal(f.run('narrationFallback.hidden'), false); assert.equal(f.run('narrationFallbackText.textContent'), f.run('OPENING_TEXT'));
  await f.advance(13000); assert.equal(f.run('idx'), 0);
});
test('Loading timeout reports recording failure after12 seconds, not early', async () => {
  const f = fixture({ verifiedRecordings: true, load: 'pending' }); await f.click('start'); await f.advance(11999);
  assert.equal(f.run('speaking'), true); assert.equal(f.run('narrationFallback.hidden'), true);
  await f.advance(1); assert.equal(f.run('speaking'), false); assert.equal(f.run('narrationFallback.hidden'), false); assert.equal(f.run('idx'), 0);
});
test('A paused loading timeout shows transcript without synthesizing or advancing', async () => {
  const f = fixture({ verifiedRecordings: true, load: 'pending' }); await f.click('start'); await f.click('play'); await f.advance(12000);
  assert.equal(f.run('speaking'), false); assert.equal(f.run('playback'), null); assert.equal(f.run('narrationFallback.hidden'), false); assert.equal(f.run('idx'), 0);
});
test('Playback rejection stops and exposes the current narration', async () => {
  const f = fixture({ verifiedRecordings: true, play: 'reject' }); await f.click('start');
  assert.equal(f.run('speaking'), false); assert.equal(f.run('idx'), 0); assert.equal(f.narration.paused, true);
  assert.equal(f.run('narrationFallbackText.textContent'), f.run('OPENING_TEXT')); assert.equal(f.elements.get('engine').textContent, '녹음 재생 오류 · 원고 표시');
});
test('Mid-clip media error stops and shows full transcript', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.click('start'); const clip = f.narration; clip.emit('error'); await f.flush();
  assert.equal(f.run('speaking'), false); assert.equal(f.run('idx'), 0); assert.equal(clip.paused, true); assert.equal(f.run('narrationFallback.hidden'), false);
  assert.equal(f.run('narrationFallbackText.textContent'), f.run('OPENING_TEXT'));
});
test('All32 narration IDs are pending, including opening and ending', () => {
  const f = fixture();
  const expected = ['00-opening', ...Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0') + '-scene'), '31-ending'];
  assert.deepEqual([...f.run('Array.from(PENDING_RECORDING_CLIPS)')], expected);
});
test('Every pending recording is blocked with exact current text and no automatic advance', async () => {
  const f = fixture(); const ids = f.run('Array.from(PENDING_RECORDING_CLIPS)');
  assert.equal(ids.length, 32);
  for (const id of ids) {
    const idx = Number(id.slice(0, 2)); await f.jump(idx); await f.click('play');
    assert.equal(f.run('playback'), null); assert.equal(f.run('speaking'), false);
    assert.equal(f.elements.get('engine').textContent, '클라우드 녹음 갱신 대기');
    assert.equal(f.requests.length, 0, `Must not request any legacy narration, including ${id}`);
    const expectedText = idx === 0 ? f.run('OPENING_TEXT') : idx === 31 ? f.run('ENDING_TEXT') : f.run('(SCENES[idx - 1].lines || []).join(" ")');
    assert.equal(f.run('narrationFallbackText.textContent'), expectedText);
    assert.equal(f.run('narrationFallback.hidden'), false);
    await f.advance(20000); assert.equal(f.run('idx'), idx, `Pending ${id} must not advance`);
  }
  assert.equal(f.media.filter(a => !a.isBgm).length, 0);
  assert.equal(f.bgm.playCount, 0, 'Pending ending must not automatically start credits music');
});
test('Starting stays on the pending opening and keeps keyboard navigation usable', async () => {
  const f = fixture(); await f.click('start');
  assert.equal(f.doc.activeElement.id, 'play'); assert.equal(f.run('idx'), 0);
  assert.equal(f.elements.get('prev').disabled, true); assert.equal(f.elements.get('next').disabled, false);
  assert.equal(f.run('narrationFallbackText.textContent'), f.run('OPENING_TEXT'));
  assert.equal(f.run('speaking'), false); assert.equal(f.requests.length, 0);
  f.key('ArrowRight', f.doc.activeElement); await f.flush(); assert.equal(f.run('idx'), 1);
  await f.click('play'); assert.equal(f.run('narrationFallbackText.textContent'), f.run('SCENES[0].lines.join(" ")'));
  assert.equal(f.requests.length, 0);
});
test('Pending recording remains stopped on repeated play, while navigation stays usable', async () => {
  const f = fixture(); await f.jump(0); await f.click('play'); await f.click('play'); await f.advance(20000);
  assert.equal(f.run('idx'), 0); assert.equal(f.requests.length, 0); assert.equal(f.run('speaking'), false);
  await f.click('next'); assert.equal(f.run('idx'), 1); assert.equal(f.run('narrationFallback.hidden'), true);
});
test('A future verified opening stops at the next pending recording', async () => {
  const f = fixture(); f.run("PENDING_RECORDING_CLIPS.delete('00-opening')");
  await f.click('start'); f.narration.emit('ended'); await f.flush();
  assert.equal(f.run('idx'), 1); assert.equal(f.run('speaking'), false); assert.equal(f.run('narrationFallback.hidden'), false);
  assert.deepEqual(f.requests, ['audio/00-opening.mp3']);
  assert.equal(f.run('narrationFallbackText.textContent'), f.run('SCENES[0].lines.join(" ")'));
});
test('Pending ending cannot autoplay credits, but explicit next remains available', async () => {
  const f = fixture(); await f.jump(31); await f.click('play'); await f.advance(20000);
  assert.equal(f.run('idx'), 31); assert.equal(f.bgm.playCount, 0); assert.equal(f.requests.length, 0);
  assert.equal(f.run('narrationFallbackText.textContent'), f.run('ENDING_TEXT'));
  await f.click('next'); assert.equal(f.run('idx'), 32); assert.equal(f.bgm.playCount, 1); assert.equal(f.run('narrationFallback.hidden'), true);
});
test('Transcript closing returns keyboard focus and retry creates a new recording request', async () => {
  const f = fixture({ verifiedRecordings: true, load: 'missing' }); await f.click('start');
  f.run('narrationFallbackClose.click()'); assert.equal(f.run('narrationFallback.hidden'), true); assert.equal(f.doc.activeElement.id, 'play');
  const count = f.requests.length; await f.click('play'); assert.equal(f.requests.length, count + 2); assert.equal(f.run('idx'), 0);
});
test('Narration runtime contains no browser speech synthesis route', () => {
  assert.doesNotMatch(runtime, /speechSynthesis|SpeechSynthesisUtterance|browserTTS|startTTS|voiceschanged/);
  assert.match(runtime, /const PENDING_RECORDING_CLIPS = new Set/);
});
test('Ending wait is pausable and resumes its remaining delay', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.jump(31); await f.click('play'); f.narration.emit('ended'); await f.flush();
  assert.equal(f.run('playback.kind'), 'wait'); await f.advance(400); await f.click('play'); await f.advance(2000);
  assert.equal(f.run('idx'), 31); await f.click('play'); await f.advance(799); assert.equal(f.run('idx'), 31);
  await f.advance(1); assert.equal(f.run('idx'), 32); assert.equal(f.run('playback.kind'), 'credits');
});
test('Navigating away and back cancels the old ending timeout', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.jump(31); await f.click('play'); f.narration.emit('ended'); await f.flush();
  await f.click('prev'); await f.click('next'); await f.click('play'); await f.advance(2000);
  assert.equal(f.run('idx'), 31); assert.equal(f.run('playback.kind'), 'audio');
});
test('Stopping then replaying ending cannot be hijacked by its old timeout', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.jump(31); await f.click('play'); f.narration.emit('ended'); await f.flush();
  f.run('stopAudio(); playCurrent();'); await f.flush(); await f.advance(2000); assert.equal(f.run('idx'), 31);
});
test('Credits pause/resume controls music and scroll without resetting position', async () => {
  const f = fixture(); await f.jump(32); assert.equal(f.elements.get('next').disabled, true); f.bgm.currentTime = 11;
  await f.click('play'); assert.equal(f.bgm.paused, true); assert.equal(f.elements.get('credits').classList.contains('paused'), true);
  await f.click('play'); assert.equal(f.bgm.currentTime, 11); assert.equal(f.bgm.paused, false); assert.equal(f.elements.get('credits').classList.contains('paused'), false);
  await f.click('rollReplay'); assert.equal(f.bgm.currentTime, 0); assert.equal(f.elements.get('roll-view').scrollTop, 0);
});
test('Leaving credits stops BGM and fades immediately', async () => {
  const f = fixture(); await f.jump(32); await f.advance(500); await f.click('prev');
  assert.equal(f.bgm.paused, true); assert.equal(f.run('bgmFade'), null); assert.equal(f.run('idx'), 31);
  await f.advance(3000); assert.equal(f.bgm.paused, true);
});
test('Late credits play promise cannot restart BGM after navigation', async () => {
  const f = fixture({ bgmPlay: 'pending' }); await f.jump(32); await f.click('prev');
  f.bgm.paused = false; f.bgm.pending[0].resolve(); await f.flush(); assert.equal(f.bgm.paused, true); assert.equal(f.run('bgmFade'), null);
});
test('Old BGM promises do not stop a newly restarted credits session', async () => {
  const f = fixture({ bgmPlay: 'pending' }); await f.jump(32); await f.click('rollReplay');
  f.bgm.pending[0].resolve(); await f.flush(); assert.equal(f.bgm.paused, false);
  f.bgm.pending[1].resolve(); await f.flush(); await f.advance(4400); assert.equal(f.bgm.volume, .85); assert.equal(f.run('bgmFade'), null);
});
test('Credits completion stops playback; replay starts at the beginning', async () => {
  const f = fixture(); await f.jump(32); f.elements.get('roll-track').emit('animationend', { animationName: 'rollUp' });
  assert.equal(f.run('speaking'), false); assert.equal(f.bgm.paused, true); await f.click('play'); assert.equal(f.run('speaking'), true); assert.equal(f.bgm.currentTime, 0);
});
test('Reduced-motion credits stop on music end', async () => {
  const f = fixture({ reducedMotion: true }); await f.jump(32); f.bgm.emit('ended'); assert.equal(f.run('speaking'), false);
});
test('Keyboard shortcuts work on page, but not controls, editable content or modal dialogs', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.jump(1); assert.equal(f.key('ArrowRight').prevented, true); assert.equal(f.run('idx'), 2);
  assert.equal(f.key('ArrowRight', f.elements.get('rollReplay')).prevented, false); assert.equal(f.run('idx'), 2);
  assert.equal(f.key('ArrowRight', f.body, { ctrlKey: true }).prevented, false); assert.equal(f.run('idx'), 2);
  f.doc.dialogOpen = true; assert.equal(f.key('ArrowRight').prevented, false); assert.equal(f.run('idx'), 2); f.doc.dialogOpen = false;
  assert.equal(f.key(' ').prevented, true); await f.flush(); assert.equal(f.run('speaking'), true);
  f.key(' '); assert.equal(f.run('speaking'), false);
});
test('Arrow shortcuts work from focused toolbar while native Space remains a single click', async () => {
  const f = fixture({ verifiedRecordings: true }); await f.click('start'); assert.equal(f.doc.activeElement.id, 'play');
  assert.equal(f.key('ArrowRight', f.doc.activeElement).prevented, true); assert.equal(f.run('idx'), 1);
  assert.equal(f.key(' ', f.doc.activeElement).prevented, false); assert.equal(f.run('speaking'), false);
  await f.click('play'); assert.equal(f.run('speaking'), true);
});
test('Toolbar and credits expose names, live status, focus styles and study dialog access', () => {
  assert.match(html, /id="player" role="group" aria-label="발표 재생 제어"/);
  assert.match(html, /id="meta" role="status" aria-live="polite"/);
  assert.match(html, /id="study-open"[^>]*aria-haspopup="dialog"/);
  assert.match(html, /class="roll-view" tabindex="0" role="region"/);
  assert.match(html, /#player button:focus-visible/);
  assert.match(html, /#credits\.paused \.roll-track/);
});

let failed = 0;
for (const [name, fn] of tests) {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`\nPlayer regression: ${tests.length - failed}/${tests.length} passed (mock DOM/media; no listening claim).`);
if (failed) process.exitCode = 1;

if (process.argv.includes('--browser') && !failed) {
  // Run only where browser processes are permitted. Preserve all pending recording guards; never play legacy narration.
  const require = createRequire(import.meta.url);
  const { chromium } = require('playwright');
  const output = path.resolve(process.env.BOTSTORY_QA_DIR || '/tmp/botstory-browser-qa');
  fs.mkdirSync(output, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', err => errors.push(err.message));
    const base = process.env.BOTSTORY_QA_URL || pathToFileURL(htmlPath).href;
    const sceneCount = vm.runInNewContext(sceneSource + '\nSCENES.length');
    const layout = [];
    for (const [width, height] of [[1280, 720], [1920, 1080]]) {
      await page.setViewportSize({ width, height });
      for (let scene = 0; scene <= sceneCount + 2; scene++) {
        await page.goto(base + '?scene=' + scene);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: path.join(output, `${width}x${height}-scene-${String(scene).padStart(2, '0')}.png`) });
        const measured = await page.evaluate(() => ({
          viewport: { width: innerWidth, height: innerHeight },
          document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
          active: [...document.querySelectorAll('.page.active, #opening-slide.show, #closing.show, #credits.show')].map(el => el.id),
          toolbar: (() => { const r = document.getElementById('player').getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })()
        }));
        layout.push({ width, height, scene, ...measured });
        assert.equal(measured.active.length, 1, `Exactly one visible scene: ${scene}`);
        assert(measured.document.width <= width + 1, `No document horizontal overflow: ${width} scene ${scene}`);
        assert(measured.document.height <= height + 1, `No document vertical overflow: ${height} scene ${scene}`);
        assert(measured.toolbar.left >= 0 && measured.toolbar.right <= width + 1 && measured.toolbar.bottom <= height + 1, 'Toolbar remains within viewport');
      }
    }
    const narrationRequests = [];
    page.on('request', request => { if (/\/audio\/\d{2}-(?:opening|scene|ending)\.(?:mp3|wav)(?:$|\?)/.test(request.url())) narrationRequests.push(request.url()); });
    await page.goto(base); await page.locator('#start').click();
    await page.waitForFunction(() => !narrationFallback.hidden);
    const blocked = await page.evaluate(() => ({
      index: idx, audio: audio === null, speaking,
      pendingCount: PENDING_RECORDING_CLIPS.size,
      textMatches: narrationFallbackText.textContent === OPENING_TEXT,
      status: engineEl.textContent
    }));
    assert.deepEqual(blocked, { index: 0, audio: true, speaking: false, pendingCount: 32, textMatches: true, status: '클라우드 녹음 갱신 대기' });
    await page.locator('#next').click(); assert.equal(await page.evaluate(() => idx), 1);
    await page.locator('#play').click(); assert.equal(await page.evaluate(() => narrationFallbackText.textContent === SCENES[0].lines.join(' ')), true);
    assert.deepEqual(narrationRequests, []);
    await page.screenshot({ path: path.join(output, 'pending-recording-transcript.png') });
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ layout, blocked, narrationRequests, errors }, null, 2) + '\n');
    assert.deepEqual(errors, []); console.log(`PASS Browser smoke/layout checks; screenshots and results: ${output}`);
  } catch (error) {
    console.error(`Browser verification blocked or failed: ${error.message}`); process.exitCode = 1;
  } finally { await browser?.close(); }
}
