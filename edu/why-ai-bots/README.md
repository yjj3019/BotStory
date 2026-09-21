# Why AI Bots — 교육 패키지 (AI Bot 시대)

Notion 대본 22클립을 **슬라이드(장표) 레이아웃** HTML + 나레이션으로 묶은 교육 자료입니다.

- **형식**: 설명 30분 · 질의 없음
- **날짜**: 2026-10-01 education material
- **경로**: `edu/why-ai-bots/`

## 최소 구성 (기록 범위)
- `why-ai-bots.html` — 오프닝 + 20장 + 엔딩
- `narration.json` — 22클립 나레이션 (`lines[]` 유지)
- `slide-visible-copy.md` — 보이는 층 카피 (PASS)

실행에 필요한 `assets/bg`·`assets/cards`(클린 셸)는 HTML 배경용으로 함께 둡니다. 로고·인물 초상·제품 UI 스크린샷·미PASS 수치는 넣지 않습니다.

## 서사 잠금 (기획·작가)
1. **병행 세 경로** — 자가호스팅 · 에이전트 소셜 · 클라우드 (단일 발전사/필연 순서 금지). 05장 다이어그램 주비주얼.
2. **16장 4행 비교표** — 실행 환경 / 자동 통제 / 사람 승인 / 운영 주의 (+ Network Controls). Auto Review ≠ Sentinel.
3. **설정값 세 개 (20장)** — 네트워크 정책 · 로컬 Never · 오프보딩.

## 미리보기
```bash
cd edu/why-ai-bots
python3 -m http.server 8765
```
브라우저: http://127.0.0.1:8765/why-ai-bots.html

## PASS guards
- 병행 세 경로 (자가호스팅 · 에이전트 소셜 · 클라우드)
- Auto Review ≠ Sentinel
- Enterprise 2026-09-03 **출시** (웨이팅 아님)
- 로컬 실행 **Never** 권고
- 과장·미확인 수치 배제
- 인물 초상 없음 · 로고·앱 UI 스크린샷 없음

## TTS / 오디오
`*.mp3` `*.wav` `*.m4a` `*.ogg` 및 `audio/`는 저장소 `.gitignore`로 제외합니다.
