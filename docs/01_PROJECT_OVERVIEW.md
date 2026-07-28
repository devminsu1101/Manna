# 프로젝트 개요 — Manna

말씀과 기도로 함께하는 공동체 앱. 성경 읽기 + 나눔(공동체) + 중보기도를 한 앱에서.

## 구조 (모노레포)

```
Manna/
├─ apps/
│  ├─ frontend/        Next.js 16 (App Router) — 사용자 앱 · PWA
│  │  └─ vercel.json   ⚠️ framework:nextjs 필수 (07_HISTORY 영역6)
│  ├─ manna-backend/   Spring Boot 4 / Security 7 — 인증 · (향후) 도메인 API
│  ├─ init-db.sql      전 도메인 PostgreSQL 스키마 (docker-entrypoint-initdb.d)
│  └─ docker-compose.yml  Postgres 15 + pgAdmin
└─ docs/               설계·규약·ERD·히스토리
```

## 아키텍처

- **프론트(Next :3000)가 얼굴**, **백엔드(Spring :8080)는 프록시 뒤.** 브라우저는 :3000만 상대 → 세션 쿠키가 first-party. 인증 경로(`/oauth2/*`, `/login/oauth2/*`, `/logout`)만 Next가 Spring으로 rewrite 프록시.
- **성경 데이터는 Next가 로컬 JSON으로 직접 서빙** (`/api/v1/bible/*` 라우트 핸들러). 백엔드 불필요. 개역개정 66권은 `build-bible.mjs`가 권별 JSON으로 빌드.
- **인증**: Google OAuth2(OIDC) + Spring 세션. `users`/`user_identities`에 find-or-create.
- **DB 스키마는 `init-db.sql`이 소유**, Hibernate는 `ddl-auto=validate`로 검증만.

## 현재 상태 (2026-07-28 · MVP 골격)

| 영역 | 상태 |
|---|---|
| 성경 읽기 (무한 스크롤·선택 시트·이어읽기·개역개정) | ✅ 완성·배포 |
| 홈·랜딩·로그인 화면 | ✅ 완성·배포 (메인은 기도·공동체 섹션 스텁) |
| Google OAuth 백엔드 | ✅ 코드·로컬 검증 완료 / ❌ 프로덕션 미동작(백엔드 미배포) |
| 전 도메인 ERD·스키마 | ✅ 확정 (docs/06_ERD.md) |
| 나눔·공동체·기도 | ⏳ v1.1 (스키마만 존재, 기능 미착수) |
| Vercel 프론트 배포 | ✅ manna-five-tau.vercel.app |

## 문서 안내

- `03_API_SPEC.md` — API 계약
- `04_CONVENTIONS.md` — 커밋·네이밍·코드 스타일
- `05_ROADMAP.md` — Phase별 진행
- `06_ERD.md` — 데이터 모델 (Mermaid + 결정 근거)
- `07_HISTORY.md` — **의사결정·성공/실패 시도 기록 (append 전용)**
- `design/screens/` — 화면 시안 14종
