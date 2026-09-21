# SESSION_LOG.md

날짜별 누적 append 전용 로그. 기존 블록은 덮어쓰지 않는다. Notion MCP 재연결 시
아래 미동기화 블록을 Notion Work Space 프로젝트 페이지 `## 개발 이력`으로 옮기고
`[synced]` 표시만 남긴다(삭제하지 않음).

## 📅 세션 백업: 2026-09-21 (Notion MCP 미연결)

### ✅ 완료 작업
- 잘못 클론된 AIStory 템플릿(BotStory 폴더 오클론)을 실제 `yjj3019/BotStory` 저장소로 교체
- `edu/why-ai-bots/why-ai-bots.html`의 `<title>`/커버 킥커에 남아 있던 이전 템플릿 브랜딩 잔재 제거 → "BotStory · Education track"
- 22클립 나레이션을 4,266자 → 6,401자로 확장(사용자가 제공한 Notion 사실 원장 기반 30분 보강 대본 반영). `narration.json`과 HTML `SCENES[].lines`/`OPENING_TEXT`/`ENDING_TEXT` 동기화 — 텍스트 바이트 단위 일치 검증, `node --check`로 JS 문법 통과
- `edu/why-ai-bots/PROGRESS.md` 신설 — 상태/다음 우선순위/결정 사항 기록
- GitHub PR #1 (`worktree-botstory-content` 브랜치) 생성·커밋 2건 푸시: https://github.com/yjj3019/BotStory/pull/1

### 🚧 진행 중
- 실제 나레이션 합계(6,401자·약 22분 추정)가 사용자 제공 문서의 "8,027자" 표기와 불일치 — 원인 미확인, 사용자 확인 대기
- 사용자가 세 번째로 제공한 "위임형 agent의 두 갈래" 발표용 개정본(8섹션 리포트 형식) — 사실관계는 기존 콘텐츠와 전부 일치 확인, 저장소 반영 여부는 사용자 결정 대기

### ⏭️ 다음 세션 즉시 실행 항목
1. 나레이션 8,027자 vs 6,401자 불일치 사용자와 확인, 필요 시 추가 확장
2. TTS 오디오 렌더링 (콘텐츠 최종 확정 후에만)
3. 브라우저 실사용 검증 (스크롤·다이어그램·오디오 폴백)
4. Notion MCP 재연결 시: 이 블록을 Work Space 프로젝트 페이지에 동기화하고 사실 원장/교육본 Notion 문서에도 이번 변경 사항 반영

### 🧩 런타임 스냅샷
- Branch: `worktree-botstory-content` (worktree: `C:\AI-Codding\claude\BotStory\.claude\worktrees\botstory-content`)
- Path: `edu/why-ai-bots/`
- Last File: `edu/why-ai-bots/why-ai-bots.html`, `edu/why-ai-bots/narration.json`
- Active Errors: 없음 (JS 문법 통과, 텍스트 동기화 검증 통과)
- Last CMD: `git push` (커밋 `e77af00`)

### 💬 인계 메모
Notion MCP 커넥터(`plugin:engineering:notion`)가 이 세션 내내 연결 타임아웃 지속 — "사실 원장"·"교육본" Notion 문서 두 곳에는 이번 변경 사항이 반영되지 않았다. 사용자가 직접 반영하거나, 커넥터가 연결되는 세션에서 이 로그 기준으로 동기화 필요.

## 📅 세션 백업: 2026-09-21 (25장 구조 개편, Notion MCP 미연결)

### ✅ 완료 작업
- 화면 재구성 배치 1~5 완료: 본문 불릿 폐지, matrix/lanes/steps/cardrow 컴포넌트화, PNG 다이어그램·미사용 에셋 삭제, CC 사진 9장 적용(크레딧 표기)
- 신규 5장 삽입(5·6·7 배경, 21 연결 표준, 23 리스크 이름) + 기존 클립 8건 보정 + 재번호 → 25장·27클립, 나레이션 8,771자(약 30.6분, 287자/분 가정 추정)
- 사실 검증 결과를 로 정리, 문장 단위 검증 지적 반영(23장 ASI 낭독, 21장 ACP 책임 범위 등)
- 미사용 렌더러 삭제,  자동 재생성, README·PROGRESS 갱신

### 🚧 진행 중
- 없음 (나레이션 작성자용 문구 정리는 보류 항목으로 PROGRESS.md에 기록)

### ⏭️ 다음 세션 즉시 실행 항목
1. 나레이션 정리 트랙: 작성자용 문구·"이 주 무료"·"십월" 등(PROGRESS.md 목록)
2. TTS 오디오 전체 재합성(clip id 재번호) 후 ffprobe로 실측 시간 확인
3. 브라우저 최종 리허설
4. Notion 승인본 페이지 갱신은 수정 내용을 사용자에게 보여 준 뒤 확인받고 진행(MCP 재연결 시 이 블록도 동기화)

### 🧩 런타임 스냅샷
- Branch: `worktree-botstory-visuals` (worktree: `C:\AI-Codding\claude\BotStory\.claude\worktrees\botstory-visuals`)
- Path: `edu/why-ai-bots/`
- Last File: `edu/why-ai-bots/why-ai-bots.html`, `narration.json`, `SOURCES.md`, `slide-visible-copy.md`
- Active Errors: 없음 (27개 상태 캡처 금지어 0건, 문서 스크롤 0, node --check 통과)
- 푸시하지 않음 — 원격 반영은 사용자 확인 후
