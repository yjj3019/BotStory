# 낭독 표기와 읽기 기준

본문은 한국어 음성 합성에 바로 넣을 수 있도록 영문 이름과 약어를 한글로 적었습니다. 아래 표는 이 원고에서 통일한 읽기이며, 모든 인물·제품의 공식 발음을 인증한 표가 아닙니다. 실제 생성 음성의 독음은 렌더링 후 확인해야 합니다.

## 제품·기관·인물

| 화면·공식 표기 | 원고의 읽기 |
|---|---|
| AI / OpenAI / ChatGPT | 에이아이 / 오픈에이아이 / 챗지피티 |
| Grok Bot / SuperGrok / Cursor | 그록 봇 / 슈퍼그록 / 커서 |
| SpaceXAI | 스페이스엑스에이아이 |
| Muse / Muse Spark / Meta | 뮤즈 / 뮤즈 스파크 / 메타 |
| Dots / dot | 닷츠 / 닷 |
| GPT-6 Astra / GPT-6.1 Astra | 지피티 식스 아스트라 / 지피티 식스 포인트 원 아스트라 |
| Anthropic / Claude / Claude Code | 앤스로픽 / 클로드 / 클로드 코드 |
| Google / Gemini | 구글 / 제미나이 |
| OpenClaw / NanoClaw / Moltbook | 오픈클로 / 나노클로 / 몰트북 |
| Hermes / Nous Research / Rakazo | 헤르메스 / 누스 리서치 / 라카조 |
| AutoGPT / BabyAGI | 오토지피티 / 베이비 에이지아이 |
| Peter Steinberger / Roman | 피터 슈타인베르거 / 로먼 |
| ELIZA / PARRY / DOCTOR | 엘리자 / 패리 / 닥터 |
| Weizenbaum / Turing | 바이첸바움 / 튜링 |
| Stripe / Link / Power / Maximum | 스트라이프 / 링크 / 파워 / 맥시멈 |
| iOS / WhatsApp / GitHub | 아이오에스 / 왓츠앱 / 깃허브 |

인물 이름의 실제 선호 발음은 별도 확인하지 않았습니다. 합성 엔진에서 발음 사전을 지원하더라도 본문에 이미 들어간 한글 표기와 중복 적용하지 마세요.

## 기술 용어

| 화면·공식 표기 | 원고의 읽기 |
|---|---|
| API / SDK / PC | 에이피아이 / 에스디케이 / 피씨 |
| Transformer / ReAct | 트랜스포머 / 리액트 |
| Attention Is All You Need | 어텐션 이즈 올 유 니드 |
| computer use | 컴퓨터 유즈 |
| Secure VM / Confidential VM | 시큐어 브이엠 / 컨피덴셜 브이엠 |
| Sentinel / Auto Review | 센티널 / 오토 리뷰 |
| Network Controls / egress | 네트워크 컨트롤스 / 이그레스 |
| MCP / A2A / AG-UI / ACP / AP2 | 엠시피 / 에이투에이 / 에이지유아이 / 에이씨피 / 에이피투 |
| RLS / RFC 439 / ARPANET / BBN | 알엘에스 / 아르에프씨 사백삼십구 / 아르파넷 / 비비엔 |
| OWASP / GenAI Security Project | 오와스프 / 젠에이아이 시큐리티 프로젝트 |
| personal superintelligence | 퍼스널 슈퍼인텔리전스 |

## 문장과 숫자

- 해요체를 유지합니다. 클립별로 말투를 바꾸지 않습니다.
- 날짜·금액·버전·퍼센트는 본문에 적힌 한국어 읽기를 그대로 사용합니다. 예를 들어 2026-10-05는 “이천이십육년 시월 오일”, $20은 “이십 달러”입니다.
- 문장별 줄바꿈은 읽기와 검토를 돕는 구분입니다. 엔진의 기본 문장 쉼을 먼저 확인하고, 모든 줄에 긴 무음을 일괄 삽입하지 마세요.
- `clips/*.txt`에는 실제로 읽을 말만 있습니다. 이 발음표와 검토용 전체 읽기본의 제목·설명은 음성으로 읽지 않습니다.
- 같은 클립에서 특정 고유명사가 잘못 읽히면 해당 표기를 확인한 뒤 다시 렌더링합니다. 원고를 바꾸면 JSON·TXT·매핑 해시도 함께 갱신해야 합니다.
