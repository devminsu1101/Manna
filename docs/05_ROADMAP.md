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
- [x] 랜딩·로그인·메인 셸 페이지 (골격 MVP)
- [~] OAuth 로그인 (Google) — 백엔드 코드·로컬 검증 완료(`users`,`user_identities`, find-or-create).
      **프로덕션 미동작**: Spring 백엔드 미배포 + `BACKEND_ORIGIN` 미설정. Kakao/Naver는 후속.
- [ ] CSRF 재활성 (v1.1 쓰기 API 전 필수 — SecurityConfig TODO)

## Phase 2: 공동체 + 나눔
- [ ] Community CRUD API — `communities`, `community_members`
- [ ] Sharing 작성/조회 API — `sharings`, `sharing_communities` (타입 3종, 다대다 공유)
- [ ] WebSocket 실시간 하이라이트
- [ ] 소그룹 UI 페이지

## Phase 3: 기도 + 알림
- [ ] Prayer 기도제목 API — `sharings(type='prayer')` (별도 테이블 없음)
- [ ] "기도했어요" — `prayer_logs` (사람 기준, 하루 하나)
- [ ] 기도짝 자동 배정 스케줄러 — `prayer_partners` (공동체 내 주간)
- [ ] PWA 푸시 알림 — `notifications`
- [ ] 중보기도실 집중 모드 (오늘 기도 안 한 사람 순차)

## Phase 4: 배포
- [ ] GitHub Actions CI/CD
- [x] Vercel (Frontend) 배포 — manna-five-tau.vercel.app. **주의**: `apps/frontend/vercel.json`의
      `framework: nextjs`가 필수(프로젝트 설정 framework=null → 없으면 정적 빌더로 404, 07_HISTORY 영역6 참고).
- [ ] AWS/Railway (Backend) 배포 — 붙으면 Vercel 환경변수 `BACKEND_ORIGIN`을 그 주소로 설정 → 로그인 활성화