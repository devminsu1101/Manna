# 프로젝트 개요 — Manna

말씀과 기도로 함께하는 공동체 앱. 성경 읽기 + 나눔(공동체) + 중보기도를 한 앱에서.

## 구조 (모노레포)

```
Manna/
├─ apps/
│  ├─ frontend/        Next.js 16 (App Router) — 사용자 앱 · PWA
│  │  └─ vercel.json   ⚠️ framework:nextjs 필수 (07_HISTORY 영역6)
│  ├─ backend/         Spring Boot 4 / Security 7 — 인증 · (향후) 도메인 API
│  ├─ init-db.sql      전 도메인 PostgreSQL 스키마 (docker-entrypoint-initdb.d)
│  └─ docker-compose.yml  Postgres 15 + pgAdmin
└─ docs/               설계·규약·ERD·히스토리
```

## 아키텍처

- **프론트(Next :3000)가 얼굴**, **백엔드(Spring :8080)는 프록시 뒤.** 브라우저는 :3000만 상대 → 세션 쿠키가 first-party. 인증 경로(`/oauth2/*`, `/login/oauth2/*`, `/logout`)만 Next가 Spring으로 rewrite 프록시.
- **성경 데이터는 Next가 로컬 JSON으로 직접 서빙** (`/api/v1/bible/*` 라우트 핸들러). 백엔드 불필요. 개역개정 66권은 `build-bible.mjs`가 권별 JSON으로 빌드.
- **인증**: Google OAuth2(OIDC) + Spring 세션. `users`/`user_identities`에 find-or-create.
- **DB 스키마는 `init-db.sql`이 소유**, Hibernate는 `ddl-auto=validate`로 검증만.

## 현재 상태 (2026-09-19 · MVP 골격)

| 영역 | 상태 |
|---|---|
| 성경 읽기 (무한 스크롤·선택 시트·이어읽기·개역개정) | ✅ 완성·배포 |
| 구절 선택 → 복사 | ✅ 완성 (연속 절 묶어 `[권 장:범위]` 형식) |
| 홈·랜딩·로그인 화면 | ✅ 완성·배포 (메인은 기도·공동체 섹션 스텁) |
| Google OAuth 백엔드 | ✅ **로컬 실동작 확인(2026-09-19)** — 로그인 → 상단바 프로필 이미지까지. `/api/v1/me`가 500이던 것을 고쳤다(D-2402) / ❌ 프로덕션 미동작(백엔드 미배포) |
| 마이페이지 (`/mypage`) | ✅ 프로필 이미지·이름·로그아웃. 상단바에서 로그아웃을 내린 자리(D-2403) |
| 전 도메인 ERD·스키마 | ✅ 확정 (docs/06_ERD.md) |
| 공동체 (목록·대문·생성) | 🟡 **화면 완료(목데이터)** / 쓰기는 CSRF 대기 |
| 기도 (중보기도실·상세·기도제목 작성/이력) | 🟡 **화면 완료(목데이터)** / 쓰기는 CSRF 대기 |
| 나눔 작성 | 🟡 **화면 완료(목데이터)** / 조회 화면은 Phase 3 |
| 초대 링크 받는 화면 (`/invite/{code}`) | ❌ **없음** — 가입 경로가 끊겨 있다 (08_USER_FLOWS F-2) |
| Vercel 프론트 배포 | ✅ manna-five-tau.vercel.app |

> 위 🟡 셋의 **막힌 버튼이 전부 같은 하나에 묶여 있다** — CSRF 재활성(D-404). 켜는 순간
> 공동체 생성 · 기도제목 작성 · 나눔 작성 · 기도했어요 · 멤버 승인이 동시에 열린다.

## 문서 안내

- `03_API_SPEC.md` — API 계약
- `04_CONVENTIONS.md` — 커밋·네이밍·코드 스타일
- `05_ROADMAP.md` — Phase별 진행
- `06_ERD.md` — 데이터 모델 (Mermaid + 결정 근거)
- `07_HISTORY.md` — **의사결정·성공/실패 시도 기록 (append 전용)**
- `08_USER_FLOWS.md` — **사용자가 지나가는 순서.** 전이·빈 상태·막힌 곳·아직 안 정한 것(`❓`).
  시안 ↔ 라우트 대응표도 여기 있다
- `design/screens/` — 화면 시안 14종 (어느 장이 어느 라우트인지는 `08_USER_FLOWS.md`)
