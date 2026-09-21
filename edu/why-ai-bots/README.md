# Why AI Bots — 교육 패키지 (AI Bot 시대)

Notion 대본 27클립을 **슬라이드(장표) 레이아웃** HTML + 나레이션으로 묶은 교육 자료입니다.

- **형식**: 설명 30분 · 질의 없음
- **날짜**: 2026-10-01 education material
- **경로**: `edu/why-ai-bots/`

## 최소 구성 (기록 범위)
- `why-ai-bots.html` — 오프닝 + 25장 + 엔딩
- `narration.json` — 27클립 나레이션 (`lines[]` 유지)
- `slide-visible-copy.md` — 화면에 보이는 층 카피 (SCENES에서 자동 생성)
- `SOURCES.md` — 신규 배경·연결 표준·리스크 이름 장의 1차 출처와 미사용 항목

실행에 필요한 `assets/bg`(배경 1종)와 `assets/photos`(CC 사진 9장, 크레딧은 `assets/photos/CREDITS.md`)를 함께 둡니다. 로고·인물 초상·제품 UI 스크린샷·미PASS 수치는 넣지 않습니다.

## 장 구성
1~4장 표지·질문·용어·시작점 → 5~7장 배경 → 8장 병행 세 경로 → 9~12장 열광 네 축 → 13~15장 Grok Bot → 16~18장 Muse → 19장 비교 → 20장 공통 뼈대 → 21장 연결 표준 → 22장 리스크 → 23장 리스크 이름(OWASP ASI 대조, 해석 표기) → 24장 전망 → 25장 그래서 우리는.

## 서사 잠금 (기획·작가)
1. **병행 세 경로** — 자가호스팅 · 에이전트 소셜 · 클라우드 (단일 발전사/필연 순서 금지). 8장 다이어그램.
2. **19장 4행 비교표** — 실행 환경 / 자동 통제 / 사람 승인 / 운영 주의 (+ Network Controls). Auto Review ≠ Sentinel.
3. **설정값 세 개 (25장)** — 네트워크 정책 · 로컬 Never · 오프보딩.

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
`*.mp3` `*.wav` `*.m4a` `*.ogg` 및 `audio/`는 저장소 `.gitignore`로 제외합니다. 클립 파일명은 `clipName()` 규칙(`00-opening`, `NN-scene`, `26-ending`)을 따르므로, 장 번호가 바뀐 뒤에는 전체 재합성이 필요합니다.
