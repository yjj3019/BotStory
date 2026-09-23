# SESSION_LOG.md

날짜별 누적 append 전용 로그. 기존 블록은 덮어쓰지 않는다. Notion MCP 재연결 시
아래 미동기화 블록을 Notion Work Space 프로젝트 페이지 `## 개발 이력`으로 옮기고
`[synced]` 표시만 남긴다(삭제하지 않음).

## 📅 세션 백업: 2026-09-21 (Notion MCP 미연결)

### ✅ 완료 작업
- 잘못 클론된 다른 템플릿 저장소를 실제 `yjj3019/BotStory` 저장소로 교체
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
- Branch: `worktree-botstory-content` (작업용 git worktree)
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
- 사실 검증 결과를 `SOURCES.md`로 정리, 문장 단위 검증 지적 반영(23장 ASI 낭독, 21장 ACP 책임 범위 등)
- 미사용 렌더러 삭제, `slide-visible-copy.md` 재생성, README·PROGRESS 갱신

### 🚧 진행 중
- 없음 (나레이션 작성자용 문구 정리는 보류 항목으로 PROGRESS.md에 기록)

### ⏭️ 다음 세션 즉시 실행 항목
1. 나레이션 정리 트랙: 작성자용 문구·"이 주 무료"·"십월" 등(PROGRESS.md 목록)
2. TTS 오디오 전체 재합성(clip id 재번호) 후 ffprobe로 실측 시간 확인
3. 브라우저 최종 리허설
4. Notion 승인본 페이지 갱신은 수정 내용을 사용자에게 보여 준 뒤 확인받고 진행(MCP 재연결 시 이 블록도 동기화)

### 🧩 런타임 스냅샷
- Branch: `worktree-botstory-visuals` (작업용 git worktree)
- Path: `edu/why-ai-bots/`
- Last File: `edu/why-ai-bots/why-ai-bots.html`, `narration.json`, `SOURCES.md`, `slide-visible-copy.md`
- Active Errors: 없음 (27개 상태 캡처 금지어 0건, 문서 스크롤 0, node --check 통과)
- 푸시하지 않음 — 원격 반영은 사용자 확인 후

## 📅 세션 백업: 2026-09-21 (최종 비판 검토 반영)

### ✅ 완료 작업
- Opus·Codex 두 검토자의 최종 콘텐츠 비판 결과를 병렬 초안 → 패치 검증 → 일괄 적용 방식으로 반영. 나레이션 26클립 수정, 총 8,943자(약 31.2분, 287자/분 가정 추정)
- 화면·음성 불일치 정정: 13장 "이 주 무료"→"2주 무료 체험", 13장 베타 공개일 "팔월 십일"→"십일일"(Notion 원장 2026-08-11 기준), 16장 요금 "지역과 계정에 따라 다릅니다" 복원
- 잠금 서사 정리: 작성자용 지시문 전부 제거, 17장 Sentinel 정정(승인 UI 아님), 07장 화면 단계형→병렬 카드형, "Meta Muse"→"Muse", 자가호스팅 명칭 통일
- TTS 준비: 영문 약어 한글 독음, 100자 초과 문장 분할
- `assets/photos/CREDITS.md` 장 번호 정정, `SOURCES.md`에 13~25장 출처 추적 부록 추가(1차 URL 없는 항목 명시)

### 🚧 진행 중
- 없음. 렌더 검증(격리 헤드리스 Chrome, 27개 상태·세 뷰포트·창 크기 왕복) 통과: Critical/Major 0, Minor 4(표지 1920 하단 구분선 접촉, 12~13px 소형 라벨, 19장 ≠ 원 간격, 7장 카드 하단 여백) — 오디오 실재생은 미확인

### ⏭️ 다음 세션 즉시 실행 항목
1. 사용자 결정: "열광 근거" 방향(수치 1건 편입 / 현재 프레이밍 유지)
2. TTS 목소리 결정 후 전체 재합성, `ffprobe` 실측
3. Grok Bot 베타 공개일·15장 90%/100% 인용·SpaceXAI 표기를 x.ai 발표문으로 직접 대조
4. Notion 승인본 콜아웃의 글자 수(8,771자·약 30.6분)를 최신 값으로 갱신(사용자 확인 후)

### 🧩 런타임 스냅샷
- Branch: `worktree-botstory-visuals`
- Path: `edu/why-ai-bots/`
- Last File: `narration.json`, `why-ai-bots.html`, `slide-visible-copy.md`, `SOURCES.md`, `assets/photos/CREDITS.md`, `PROGRESS.md`
- Active Errors: 없음(narration↔html 정합·금지어·문장 길이 점검 통과)

## 📅 세션 백업: 2026-09-22~23 (4개 첨부 문서 검토, 30분 목표 보강)

### ✅ 완료 작업
- 사용자가 전달한 4개 첨부 문서(20장·5막 재편 제안 3건 + 유머 톤 별도 대본 1건)를 병렬 서브에이전트(사실 검증·구조 타당성)로 검토. **전면 재편은 기각**(9일 일정 위험, 재편안 자체 시간 계산 신뢰 불가·검증 자산 소실 위험) — 상세 근거는 `SOURCES.md`
- 정당한 지적 3건만 부분 반영: 14장 전환구, 01장·엔딩 질문 콜백, 8장 OpenClaw 공식 자기평가 인용
- Moltbook 사실 재검증: Meta의 2026-03-10 인수(CNBC·Axios·TechCrunch 일치), 2026-01~02 보안 사고(단일 사건, Wiz 발견 — API 토큰·계정 150만·실소유자 1.7만). 8장(인수)·22장(사고 구체 사례)에 반영
- "SpaceXAI" 표기: 5개 보조 페이지엔 없어 "xAI"로 고쳤다가, 사용자가 제공한 최초 발표문 원문("How the SpaceXAI team is using Grok Bot" 4회 자칭)으로 재확인해 "SpaceXAI" 최종 확정. 15장 인용 화자 "Roman Ugarte"→"Roman"(원문에 성 없음) 정정
- "30분 목표 최대한 유지" 결정에 따라, 사용자가 제공한 Grok Bot/Cursor·Muse 공식 원문(총 6개 페이지)에서 검증된 미사용 소재를 채굴해 9·10·11·14·15·16·17·18장에 반영(루틴 한도, Firecracker microVM, "손 넘겨받기", 팀 규칙, 그룹 채팅, 시연 학습, Muse Spark 모델명, Stripe Link 결제, Confidential VM 목적, 감사 기록 등)
- **17장 Sentinel 정정**: 이전 검토에서 "승인 화면 아님·사람 승인은 완전히 별개"로 단순화했던 것이, Muse 원문("Sentinel... asks the person for permission when needed")과 어긋나 있어 정정 — Sentinel도 낯선 목적지로 나갈 땐 사람에게 묻되, 메일·구매 같은 민감 행동 확인은 Muse 쪽 별도임을 나레이션·화면 aria 양쪽에 반영
- 나레이션 8,943 → **10,383자**. 실측 레이트(edge-tts ko-KR-SunHiNeural, -10%, 382자/분) 기준 약 **27.2분** — 30분 목표와 약 2.8분 차이로 좁혀짐(이전 6~7분)

### 🚧 진행 중
- 30분 잔여 간극(약 2.8분) — 다음 후보 원문 제시함: Muse "How We Built Safety Into Muse"/"How We Designed Muse", Cursor "grok-bot/security"·"security-faq", OpenClaw 공식 배경(도메인 차단으로 직접 열람 불가, 사용자 붙여넣기 대기)

### ⏭️ 다음 세션 즉시 실행 항목
1. 30분 잔여 간극: 추가 원문 확보해 마저 채우거나, 현재 27.2분을 최종치로 받아들일지 결정
2. TTS 목소리 결정은 `.html` 콘텐츠 완전 확정 후 진행(사용자 지시로 보류 중) — 현재 로컬 오디오(`audio/`, gitignore)는 구버전 텍스트 기준이라 최종 콘텐츠 확정 후 전량 재합성 필요
3. 브라우저 최종 리허설(스크롤·오디오 폴백·1280x720/1920x1080)
4. 발표 전 재확인 목록은 `SOURCES.md` 체크리스트 참고
5. Notion 승인본 페이지 갱신 필요(구조 개정 콜아웃의 글자 수·분량을 10,383자·약 27.2분으로 갱신)

### 🧩 런타임 스냅샷
- Branch: `worktree-botstory-visuals`
- Path: `edu/why-ai-bots/`
- Last File: `narration.json`, `why-ai-bots.html`, `SOURCES.md`, `PROGRESS.md`
- Last commit: `93fcfae` (원격과 동일, 작업 폴더 깨끗함)
- PR #2(초안): https://github.com/yjj3019/BotStory/pull/2
- Active Errors: 없음(narration↔html 정합 27건 전량 일치, 금지어 0, 렌더 검증 통과)
