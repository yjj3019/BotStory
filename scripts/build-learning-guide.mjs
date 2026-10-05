import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packageDir } from './sync-content.mjs';
const require = createRequire(import.meta.url);
const { marked } = require('marked');
const source = readFileSync(resolve(packageDir, 'LEARNING-GUIDE.md'), 'utf8');
const body = marked.parse(source, { gfm: true });
const result = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AI 봇에게 일을 맡기기 전에 · BotStory</title>
<style>body{max-width:860px;margin:auto;padding:24px;color:#17243c;background:#fff;font:18px/1.75 system-ui,sans-serif;word-break:keep-all;overflow-wrap:anywhere}h1{font-size:2rem;line-height:1.3}h2{margin-top:2.2rem;font-size:1.45rem}h3{font-size:1.2rem}a{color:#0645ad}a:focus-visible{outline:3px solid #e78100;outline-offset:3px}blockquote{border-left:4px solid #315799;margin-left:0;padding:0 1rem}table{border-collapse:collapse;width:100%;font-size:.95rem}th,td{padding:.6rem;border:1px solid #b6c1d3;text-align:left;vertical-align:top}th{background:#eef3fa}li{margin:.35rem 0}nav{font-size:.95rem}footer{border-top:1px solid #b6c1d3;padding-top:1rem;margin-top:2rem;font-size:.9rem}@media(max-width:600px){body{padding:18px;font-size:17px}h1{font-size:1.7rem}table{font-size:.9rem}}</style></head>
<body><nav aria-label="자료 이동"><a href="why-ai-bots.html">장표로 돌아가기</a></nav><main>${body}</main><footer>이 페이지는 LEARNING-GUIDE.md에서 자동 생성합니다. 개정 원고32클립의 음성은 별도로 렌더링합니다. 기존 녹음을 자동으로 사용하지 않고 원고를 표시하며, 브라우저 음성으로 대체하지 않습니다. 녹음 파일 자체의 발화 내용은 이번 검토에서 청취·전사 검증하지 않았습니다.</footer></body></html>
`;
const output = resolve(packageDir, 'learning-guide.html');
if (process.argv.includes('--write')) writeFileSync(output, result);
else if (readFileSync(output, 'utf8') !== result) throw new Error('Learning guide drift. Run npm run sync.');
console.log('Learning guide HTML agrees with Markdown.');
