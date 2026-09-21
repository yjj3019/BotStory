# Why AI Bots — 교육 패키지 (AI Bot 시대)

Notion 대본 22클립을 **슬라이드(장표) 레이아웃** HTML + 나레이션으로 묶은 교육 자료입니다.

- **형식**: 설명 30분 · 질의 없음
- **날짜**: 2026-10-01 education material
- **경로**: `edu/why-ai-bots/` (ASCII; 한국어 제목은 본 README)

## 포함
- `why-ai-bots.html` — 오프닝 + 20장 + 엔딩 (SCENES), 뷰포트 장표 UI
- `narration.json` — extract 결과 22클립 (`lines[]` TTS 원문 유지)
- `diagrams/` — 03·05·08·16·17 PNG (+ dense twins)
- `assets/bg/` · `assets/cards/` — S-Core 밝은 장표 배경·카드 프레임
- `slide-visible-copy.md` — 보이는 층(message/bullets) 카피
- `README-assets.md` — 에셋 인덱스

> `narration-30min-draft.json` 및 agent dump(`notion-pass-script.txt`)는 저장소에 포함하지 않습니다. 납품 나레이션은 `narration.json`만 사용합니다.

## 미리보기
```bash
cd edu/why-ai-bots
python3 -m http.server 8765
```
브라우저: http://127.0.0.1:8765/why-ai-bots.html  
(고품질 오디오가 없어도 브라우저 TTS 폴백. 화면은 `bullets[]`, 음성은 전체 `lines[]`.)

## PASS guards
- **병행 세 경로** (자가호스팅 · 에이전트 소셜 · 클라우드) — 단일 경로 과장 금지
- **Auto Review ≠ Sentinel** — 용어 혼동 금지
- **Enterprise 2026-09-03 출시** — 출시일 표기 준수
- **로컬 Never** — 로컬 절대 경로/환경 가정 배제
- **과장/미확인 수치 배제**
- **인물 초상 없음** · 로고·제품 UI 스크린샷 없음

## 장표 레이아웃
- S-Core Primary Blue `#0156FC` · 밝은 배경 우선 (`20`/`22` light clean shells)
- `assets/bg`·`assets/cards`는 가이드 텍스트 없는 클린 셸 — HTML이 한국어 실문장 오버레이
- 장마다: 챕터 뱃지 + 결론형 제목 + 짧은 bullets + 비주얼 영역
- 다이어그램 장(03·05·08·16·17): PNG 크게 (dense twins 포함)
- 날짜 표시: **2026.10.01**

## TTS / 오디오
`*.mp3` `*.wav` `*.m4a` `*.ogg` 및 `audio/`는 루트 `.gitignore`로 제외합니다. 브라우저 TTS 폴백으로 미리보기 가능합니다.

## 동기화 이력
- 2026-09-19: Notion 대본 개정분 반영 · 다이어그램 PNG 삽입
- 2026-09-20: PPTX형 슬라이드 리디자인 + S-Core 에셋 · QA · 밀도(visible layer) 리디자인
- 2026-10-01: 교육 자료 일자 · BotStory `edu/why-ai-bots/` 납품
