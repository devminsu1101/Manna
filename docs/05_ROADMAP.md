# 개발 로드맵

> 상세 의사결정·실패 기록은 docs/07_HISTORY.md 참고.

## Phase 0: 기반 세팅
- [x] 프로젝트 구조
- [x] 기술 스택 설치
- [x] Docker Compose 설정 (apps/docker-compose.yml)
- [x] DB 스키마 / ERD (apps/init-db.sql, docs/06_ERD.md — 전 도메인 12테이블, 임시 PG 검증 완료)
- [x] 성경 데이터 적재 스크립트 (apps/frontend/scripts/build-bible-sql.mjs → data/bible-seed.sql, 검증 완료)

## Phase 1: 인증 + 성경 읽기 MVP
- [x] Spring Boot 프로젝트 생성 (Spring Boot 4 / Security 7, apps/manna-backend)
- [x] PostgreSQL 스키마 설계 (전 도메인, docs/06_ERD.md)
- [x] 성경 JSON 파싱 및 DB 저장 (build-bible-sql.mjs, 개역개정 66권)
- [x] GET /api/v1/bible/{book}/{chapter} 구현 (프론트 라우트 핸들러, 백엔드 전환은 대기)
- [x] Next.js 레이아웃 + 라우팅
- [x] 성경 읽기 UI 구현 (무한 스크롤·선택 시트·이어읽기)
- [x] 구절 선택 → 복사 (연속 절 묶음, 07_HISTORY 영역7)
- [x] 랜딩·로그인·메인 셸 페이지 (골격 MVP)
- [~] OAuth 로그인 (Google) — 백엔드 코드·로컬 검증 완료(`users`,`user_identities`, find-or-create).
      **프로덕션 미동작**: Spring 백엔드 미배포 + `BACKEND_ORIGIN` 미설정. Kakao/Naver는 후속.
- [ ] CSRF 재활성 (v1.1 쓰기 API 전 필수 — SecurityConfig TODO)

**남은 정리 (백엔드 없이 가능)**
- [x] `not-found.tsx` — 마스코트 + 홈/성경 두 갈래 (D-1601, D-1604).
      `/bible/gn/99`·오타 주소 둘 다 확인
- [x] 하단 네비 3칸 — `/community`, `/prayer`, `/sharings/new`에 "준비 중" 화면
      (`ComingSoonScreen`, D-1602). **404가 아니라 실제 화면을 준 이유**: 이 셋은 오타로
      들어오는 자리가 아니라 네비가 늘 가리켜 눌러서 들어오는 자리다. 상단바·하단 네비를
      그대로 둬서 막다른 곳이 되지 않는다

**의도적으로 미뤄 둔 것 (해당 도메인이 붙을 때 함께)**

> 지금 고쳐도 연결할 데이터가 없어 또 하드코딩이 된다. 두 번 고치지 않도록 자리만 잡아 둔다.
> 사용자 결정 — "실제 기능 생기면 그에 맞게 돌아가게 바꾸자."

- [ ] 성경 화면 헤더의 프로필 버튼 (`BibleHeader.tsx`) — 지금은 정적 아이콘.
      **인증이 프로덕션에서 살아난 뒤** `<ProfileButton />`으로. 지금 바꾸면 로그인 자체가
      안 되는 화면에 "로그인" 글자만 뜬다
- [ ] 상단 벨의 빨간 점 (`BibleHeader.tsx`, `MainTopBar.tsx`) — 항상 켜져 있다.
      **알림 도메인(Phase 3)** 에서 실데이터로. 두 파일 다 TODO 주석이 달려 있다

**성경 리더 실사용 QA (2026-08-10, 교회에서 써 보고 나온 5건)**

> "없는 기능 만들기 전에 있는 버그부터"(사용자 결정) — 스크롤 튐을 먼저 닫고 나머지를 순서대로.
> 결정 기록은 07_HISTORY 영역 11~.

- [x] **스크롤 튐** — 앵커를 뷰포트 좌표로 재던 것이 원인. 문서 좌표로 전환(D-1101~1105).
      실기기 검증 완료, 양방향 모두 사라짐
- [x] **선택 해제 버튼 + 복사 후 자동 해제** (D-1201~1206). 버튼 두 개 다 아이콘으로 단순화
- [x] **화면 꺼짐 방지** — `useWakeLock` 훅, `ReaderChrome`에서 호출(D-1301~1307).
      리더에 있는 동안 자동 ON, 토글 없음. **보안 컨텍스트 전용이라 LAN IP로는 검증 자체가
      불가**했고(D-704에 이어 두 번째 같은 함정), 배포본을 실기기(아이폰)에서 확인해
      **2026-08-25 검증 완료** — 성경 읽는 동안 화면이 꺼지지 않는다
- [x] **이전 말씀으로 돌아가기** — 좌하단/우하단 chevron 버튼, 뒤로+앞으로 양방향
      (D-1501~1511). 떠날 때 위치를 기억하는 sessionStorage 자취(사용자 제안).
      기록 지점은 선택 시트 한 곳, 저장 값은 라우트 파라미터가 아니라 "그때 보이던 장".
      **순수 스택에서 브라우저형 커서 모형으로 선회** — 스택은 뒤로 갈 때 값을 버려
      되짚어 온 자리로 다시 갈 수 없었다(D-1501). standalone PWA엔 브라우저 뒤로가기가
      없다는 게 애초 동기
- [x] **선택 시트가 현재 권/장부터 열리기** — 현재 권/장으로 스크롤 + 하이라이트(D-1401~1406).
      Radix 뷰포트 `scrollTop`을 rect 차분으로 직접 잡는다(시트 진입 애니메이션이 transform이라
      `scrollIntoView`는 못 쓴다). **주의: 마운트 직후엔 뷰포트가 `overflow:hidden`이라
      한 프레임 뒤 재시도가 필수**(D-1404)

## Phase 2: 공동체 + 기도 (핵심 루프)

> **2026-08-07 재배열(D-801).** 이 앱의 핵심 경험은 "공동체에서 기도제목을 나누고, 기도받은
> 수가 쌓여 매일 확인하는 것"이다. 기존 로드맵은 그것이 Phase 3에 있고 앞에 나눔·WebSocket이
> 있었다. 화면·범위 확정은 07_HISTORY 영역 8~10 참고.
>
> 리더의 "해당 구절 나눔하기" 자리 표시자는 제거됐다(D-701). 나눔 작성 진입점은 여기서 새로 만든다.

**선행 조건 (기능 아님)**
- [ ] Spring 백엔드 배포 + Vercel `BACKEND_ORIGIN` 설정 → 프로덕션 로그인 활성화
- [ ] CSRF 재활성 (D-404) — **첫 쓰기 API보다 먼저.** 나중에 켜면 모든 fetch를 되돌아가 고쳐야 한다
- [ ] 카카오 로그인 여부 결정 (D-1006 — 카톡 인앱 브라우저가 Google OAuth를 차단한다)

**공동체 (최소)**
- [ ] Community API — `communities`, `community_members` (생성 · 내 목록 · 상세)
- [ ] 초대 링크 가입 — `/invite/{code}`, `pending_invite` 쿠키 복귀 (D-1004, D-1005)
- [ ] 공동체 목록 화면 — 개수와 무관하게 항상 거친다. 이름 + 인원 수만 (D-1001, D-1002)
- [ ] 대문 화면 — 기도짝 · 나눔 자료실 · 멤버 목록(+초대) (D-1003). 공지·갤러리 제외

**기도**
- [ ] 기도제목 작성/조회 — `sharings(type='prayer')`, 최신 하나만 (별도 테이블 없음)
- [ ] 중보기도실 — 볼 수 있는 모든 사람의 카드 목록, 사람 단위로 합침 (D-904, D-905)
- [ ] "기도했어요" — `prayer_logs` (사람 기준, 하루 하나, 익명 D-902)
- [ ] 메인 최상단 "어제 N명이 당신을 위해 기도했어요" (어제 기준 D-901)
- [ ] 기도제목 없는 사람 카드 + 작성 유도 (D-903)

## Phase 3: 나눔 확장 + 알림
- [ ] Sharing 작성/조회 API — `sharings`, `sharing_communities` (타입 3종, 다대다 공유)
- [ ] 기도짝 자동 배정 스케줄러 — `prayer_partners` (공동체 내 주간)
- [ ] 알림 도메인 — `notifications` (+ 상단 벨의 하드코딩 배지를 실데이터로)
- [ ] PWA 푸시 알림
- [ ] 중보기도실 집중 모드 (오늘 기도 안 한 사람 순차) — Phase 2의 정렬 규칙을 한 명씩 보여주는 변형
- [ ] 익명 기도제목 — 중보기도실 맨 아래 별도 구역 (D-906)
- [ ] 다크 모드 — 토큰은 이미 있고 `.dark`를 붙이는 곳만 없다 (`globals.css:5-8`)
- [ ] WebSocket 실시간 하이라이트
- [ ] 공지사항 · 갤러리 (갤러리는 오브젝트 스토리지가 새로 필요)

## Phase 4: 배포
- [ ] GitHub Actions CI/CD
- [x] Vercel (Frontend) 배포 — manna-five-tau.vercel.app. **주의**: `apps/frontend/vercel.json`의
      `framework: nextjs`가 필수(프로젝트 설정 framework=null → 없으면 정적 빌더로 404, 07_HISTORY 영역6 참고).
- [ ] AWS/Railway (Backend) 배포 — 붙으면 Vercel 환경변수 `BACKEND_ORIGIN`을 그 주소로 설정 → 로그인 활성화