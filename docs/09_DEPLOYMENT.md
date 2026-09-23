# 배포 매뉴얼

> 로컬 개발은 `00_SETUP_GUIDE.md`. 이 문서는 **프로덕션이 어떻게 붙어 있고, 처음부터 다시
> 붙이려면 어디서 무엇을 하는가**다. 왜 그렇게 했는지는 07_HISTORY 영역 6(Vercel) · 29(Railway).
> 명령 블록에는 `#` 주석을 두지 않는다 — zsh가 인자로 넘긴다.

## 한눈에

```
브라우저 → https://manna-five-tau.vercel.app          (Vercel · Next)
              │  rewrite: /oauth2/*, /login/oauth2/*, /logout
              │  라우트 핸들러: /api/v1/me
              ▼
           https://manna-production-f54d.up.railway.app   (Railway · Spring · Dockerfile)
              ▼  postgres.railway.internal:5432 (내부망)
           Railway Postgres 18
```

- **브라우저는 Vercel만 상대한다.** 세션 쿠키가 Vercel 도메인에 붙어 first-party로 돈다.
- Google 로그인 한 바퀴: Vercel `/oauth2/authorization/google` → Railway → Google →
  Vercel `/login/oauth2/code/google` → Railway(세션 생성) → Vercel `/`.
- **배포는 push로 된다.** `main`에 push하면 Vercel(프론트)과 Railway(백엔드)가 각자 다시 빌드한다.

| | 어디서 | 무엇이 빌드하나 | 설정의 핵심 |
|---|---|---|---|
| 프론트 | Vercel | `@vercel/next` | `apps/frontend/vercel.json`의 `framework: nextjs` |
| 백엔드 | Railway | `apps/backend/Dockerfile` | Root Directory `apps/backend` |
| DB | Railway Postgres | — | 스키마는 손으로 한 번 |

## 환경변수 — 전체 목록

**Railway · 백엔드 서비스 → Variables**

| 이름 | 값 | 없으면 |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Web application 클라이언트 ID | 기동 실패(placeholder 해석 불가) |
| `GOOGLE_CLIENT_SECRET` | 같은 클라이언트의 secret | 기동 실패 |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` | `localhost:5432`로 붙으려다 기동 실패 |
| `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` | 인증 실패 |
| `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` | 인증 실패 |
| `FRONTEND_ORIGIN` | `https://manna-five-tau.vercel.app` (끝 `/` 없이) | ⚠️ **조용히 틀린다** — 로그인 후 `localhost:3000`으로 튄다 |

- `PORT`는 넣지 않는다. Railway가 주입하고 `server.port=${PORT:8080}`이 읽는다.
- `${{Postgres.*}}`는 Railway 참조 문법이다. DB 비밀번호를 재생성해도 따라간다.
  Postgres 서비스 이름이 `Postgres`가 아니면 그 이름으로.
- Spring은 `SPRING_DATASOURCE_URL` 같은 환경변수가 `application.properties`의 같은 키를 덮는다.
  그래서 코드는 로컬 값 그대로 두고 서버마다 값만 끼운다.

**Vercel · 프로젝트 → Settings → Environment Variables**

| 이름 | 값 | 비고 |
|---|---|---|
| `BACKEND_ORIGIN` | `https://manna-production-f54d.up.railway.app` (끝 `/` 없이) | ⚠️ **빌드 시점에 읽힌다** — 바꾸면 Redeploy |

**Google Cloud Console → APIs & Services → Credentials → OAuth client (Web application)**

Authorized redirect URIs:

```
http://localhost:3000/login/oauth2/code/google
https://manna-five-tau.vercel.app/login/oauth2/code/google
```

Authorized JavaScript origins는 비운다. 프론트 도메인이 바뀌면 여기와 `FRONTEND_ORIGIN`을 함께 바꾼다.

## 평소 배포

```
git push
```

- Vercel·Railway 각자 대시보드의 Deployments에서 진행을 본다.
- Railway **Deploy Logs**에 `Started MannaBackendApplication`이 떠야 진짜 성공이다.
  "Deployment Successful"은 컨테이너가 켜졌다는 뜻일 뿐, 스프링이 그 뒤에 죽어도 그렇게 보인다.
- 문서만 바꿔도 Railway는 다시 빌드한다(`apps/backend` 밖 변경은 무해하게 재빌드).

**배포 후 확인** — 어디서든

```
curl -s -o /dev/null -w "%{http_code}\n" https://manna-production-f54d.up.railway.app/api/v1/me
curl -s -o /dev/null -w "%{http_code}\n" https://manna-five-tau.vercel.app/api/v1/me
curl -s -o /dev/null -w "%{redirect_url}\n" https://manna-five-tau.vercel.app/oauth2/authorization/google
```

둘 다 401이고, 셋째 주소 안의 `redirect_uri=`가 **`https://manna-five-tau.vercel.app/...`** 이면 정상.
Railway 주소나 `localhost`가 나오면 아래 장애 표.

## 처음부터 다시 붙이기 (Railway)

프로젝트를 새로 만들거나 플랫폼을 옮길 때. 순서가 중요하다 — 스키마가 백엔드 기동보다 먼저다.

1. **프로젝트** — railway.com → New Project → Deploy from GitHub repo → Manna.
   첫 배포는 곧바로 실패한다("Railpack could not determine how to build"). 정상이다.
2. **Root Directory** — 백엔드 서비스 → Settings → Source → Root Directory `apps/backend`.
   입력 후 ✓ 저장, 그리고 화면 위 **Apply**. Railway는 설정을 모아 두었다가 Apply 때 배포한다.
   적용되면 빌드 로그가 Railpack이 아니라 Dockerfile(`FROM eclipse-temurin`)로 바뀐다.
3. **Postgres** — 캔버스에서 + Create → Database → PostgreSQL.
4. **환경변수** — 위 표의 6개를 백엔드 Variables → Raw Editor에 붙이고 Apply.
5. **스키마 적용** — 아래 절.
6. **도메인** — 백엔드 → Settings → Networking → Generate Domain (포트 `8080`).
7. **Vercel** `BACKEND_ORIGIN`을 새 도메인으로 → Redeploy.
8. **Google Console** redirect URI 확인.
9. 위 "배포 후 확인" 세 줄 → 실제 브라우저로 로그인.

## 스키마 적용 (프로덕션 DB)

Railway Postgres는 `init-db.sql`을 자동 실행하지 않는다(로컬 도커의 `docker-entrypoint-initdb.d`가 없다).
그리고 백엔드는 `ddl-auto=validate`라 테이블이 없으면 기동이 실패한다.

1. Postgres 서비스 → Settings → Networking → Public Networking → **TCP Proxy** 켜기 (포트 `5432`) → Apply.
   Variables에 `DATABASE_PUBLIC_URL`이 생긴다(`...@xxx.proxy.rlwy.net:NNNNN/railway`).
   `DATABASE_URL`의 `postgres.railway.internal`은 내부망 전용이라 맥에서 못 붙는다.
2. 맥에서 (저장소 루트 기준)

```
psql "DATABASE_PUBLIC_URL값" -v ON_ERROR_STOP=1 -f apps/init-db.sql
psql "DATABASE_PUBLIC_URL값" -c "\dt"
```

   테이블 12개면 끝(로컬과 같은 수).
3. **TCP Proxy를 다시 끈다** — 같은 자리의 휴지통 → Apply. `DATABASE_PUBLIC_URL`이 사라지면 꺼진 것.
   백엔드는 내부 주소로 붙으므로 영향이 없다.

이미 데이터가 있는 DB에 스키마 **변경**을 적용할 때는 `init-db.sql` 전체가 아니라 바뀐 부분의
`ALTER` 문만 같은 방법으로 넣는다. 프로덕션 DB를 들여다볼 때도 같은 방법(켜고 → 보고 → 끈다).

⚠️ 프로덕션은 **Postgres 18**, 로컬 도커는 15다. 지금은 차이가 드러나지 않았다.

## 장애 대응

| 증상 | 원인 | 해결 |
|---|---|---|
| Railway 빌드 로그 "Railpack could not determine how to build", 분석 대상이 `apps/`, `docs/` | Root Directory 비어 있음 | `apps/backend` 저장 + Apply |
| Deploy Logs에 `JdbcEnvironmentInitiator` 스택트레이스 | DB 환경변수 없음 → `localhost:5432` 시도 | `SPRING_DATASOURCE_*` 3개 |
| `Schema-validation: missing table` | 프로덕션 DB에 스키마 없음/옛 스키마 | 스키마 적용 절 |
| 로그인 후 `localhost:3000`으로 이동 | `FRONTEND_ORIGIN` 없음 | 백엔드 Variables에 추가 → Apply |
| `redirect_uri`가 Railway 주소 | 옛 코드(헤더 추측) 또는 `FRONTEND_ORIGIN` 오타 | 07_HISTORY D-2903 |
| Google `redirect_uri_mismatch` | Console에 Vercel 주소 미등록 / 클라이언트가 Desktop 타입 | Web application 타입 + URI 등록(반영 수 분~수 시간) |
| Vercel에서 로그인 버튼이 404·502 | `BACKEND_ORIGIN` 없음, 또는 설정 후 재배포 안 함 | 설정 → Redeploy |
| Vercel 전 라우트 404 | `framework: null` | `vercel.json`의 `framework: nextjs` (07_HISTORY 영역 6) |
| 로그인 화면에 "앱이 확인되지 않음"/테스트 사용자 아님 | Google 동의 화면이 Testing | Google Auth Platform → Audience → Publish, 또는 Test users에 추가 |

**원칙: 원격을 다시 찌르기 전에 로컬에서 재현한다.** 백엔드는 `00_SETUP_GUIDE.md` 5번(같은
Dockerfile로 로컬 컨테이너), 프론트는 `next build && next start` → `vercel build`.

## 공개돼 있는 것

- Swagger UI(`/swagger-ui.html`)가 프로덕션 백엔드에서도 열려 있다 — 사용자 결정(영역 29).
  쓰기 API가 늘면 `springdoc.swagger-ui.enabled=false` 여부를 다시 본다.
