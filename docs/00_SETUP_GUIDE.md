# 로컬 개발 가이드

> 프로덕션 배포는 `09_DEPLOYMENT.md`. 이 문서는 **내 맥에서 셋을 띄워 개발하는 법**이다.
> 명령 블록에는 `#` 주석을 두지 않는다 — zsh가 인자로 넘겨 명령이 깨진다. 설명은 블록 밖에 쓴다.

## 한눈에

```
브라우저 → http://localhost:3000 (Next dev, 맥에서 직접)
              │  /oauth2/*, /login/oauth2/*, /logout, /api/v1/me 만 넘긴다
              ▼
           http://localhost:8080 (Spring bootRun, 맥에서 직접)
              ▼
           localhost:5432 (Postgres 15, 도커 컨테이너)
```

- **도커로 띄우는 건 DB뿐이다.** 프론트·백은 맥에서 직접 돌린다 — 코드 한 줄마다 이미지를
  다시 빌드하면 느리다. 백엔드 이미지를 로컬에서 만드는 건 **배포 전 리허설**일 때만.
- 성경 데이터는 백엔드 없이 Next가 로컬 JSON으로 준다. 프론트만 띄워도 성경은 된다.

## 1. 처음 한 번 — 설치와 시크릿

필요한 것: JDK 17+, Node.js 18+, Docker Desktop.

**백엔드 시크릿** — `apps/backend/.env` (커밋되지 않는다, 루트 `.gitignore`의 `.env`)

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

값은 Google Cloud Console → APIs & Services → Credentials → **Web application** 타입 클라이언트.
⚠️ **Desktop 타입이면 로컬만 되고 프로덕션은 안 된다**(07_HISTORY D-2904). 그 클라이언트의
Authorized redirect URIs에 `http://localhost:3000/login/oauth2/code/google`이 있어야 한다.

**프론트 의존성** — `apps/frontend/`에서

```
npm install
```

프론트는 로컬에 `.env`가 필요 없다. `BACKEND_ORIGIN`이 없으면 `http://localhost:8080`을 쓴다.

## 2. 매일 — 켜는 순서

터미널 셋. **DB → 백 → 프론트** 순서다. DB 없이 백엔드를 켜면 연결 실패로 죽는다.

**① DB** — `apps/`에서

```
docker compose up -d
```

Postgres(5432)와 pgAdmin(5050)이 뜬다. 한 번 켜 두면 Docker Desktop이 살아 있는 동안 유지된다.

**② 백엔드** — `apps/backend/`에서

```
./run-local.sh
```

`.env`를 환경변수로 올리고 `./gradlew bootRun`. `Started MannaBackendApplication`이 보이면 떴다.
Gradle 진행 표시가 `80% EXECUTING`에서 멈춰 보이는 건 정상이다 — 서버가 도는 동안 작업이
끝나지 않을 뿐이다. 끄기는 `Ctrl+C`.

**③ 프론트** — `apps/frontend/`에서

```
npm run dev
```

**확인**: `http://localhost:3000/login` → Google 로그인 → 상단바에 프로필 이미지.
⚠️ 반드시 `localhost`로. LAN IP(`192.168.x.x`)로는 Google이 거부한다(D-405).

**끄기** — 프론트·백은 `Ctrl+C`, DB는 `apps/`에서

```
docker compose down
```

`down`은 컨테이너만 지운다. 데이터(볼륨 `postgres_data`)는 남는다.

## 3. DB 들여다보기

**pgAdmin (브라우저)** — http://localhost:5050, `admin@example.com` / `admin`.
Servers 우클릭 → Register → Server. Connection 탭의 Host는 **`manna_postgres`** 다
(`localhost` 아님 — pgAdmin도 컨테이너라 같은 도커 네트워크의 컨테이너 이름으로 찾는다).
Port `5432`, User `manna_user`, Password `manna_password`, DB `manna_db`.

**터미널 (컨테이너 안 psql)**

```
docker exec -it manna_postgres psql -U manna_user -d manna_db
```

안에서: `\dt` 테이블 목록 · `\d users` 구조 · `select * from users;` · `\q` 나가기.

**데스크톱 툴 (DBeaver·TablePlus 등)** — Host `localhost`, 나머지는 위와 같다.

## 4. 스키마를 바꿨을 때

`apps/init-db.sql`은 **볼륨이 처음 만들어질 때 한 번만** 실행된다. 파일을 고쳐도 떠 있는 DB는
그대로다. 데이터를 버려도 되면 볼륨째 다시 만든다 — `apps/`에서

```
docker compose down -v
docker compose up -d
```

`-v`가 볼륨을 지운다. **로컬 사용자·데이터가 전부 사라진다.** 지우기 싫으면 바뀐 부분만 psql로 적용한다.

프로덕션 DB에도 따로 적용해야 한다 — `09_DEPLOYMENT.md`의 "스키마 적용".

## 5. 배포 전 리허설 — 백엔드 이미지를 로컬에서 띄우기

Railway와 **같은 Dockerfile**로 빌드해 같은 방식으로 띄운다. 배포가 깨질 때 원격을 찌르기 전에
여기서 재현한다. `apps/backend/`에서

```
docker build -t manna-backend:local .
docker run --rm --name mbt --network apps_manna_network --env-file .env -e SPRING_DATASOURCE_URL=jdbc:postgresql://manna_postgres:5432/manna_db -e PORT=9090 -p 18080:9090 manna-backend:local
```

- `--network apps_manna_network` — docker compose가 만든 네트워크. 이래야 DB를 `manna_postgres`로 찾는다.
  컨테이너 안의 `localhost`는 컨테이너 자신이라 `localhost:5432`로는 DB에 못 닿는다.
- `PORT=9090` — Railway가 포트를 주입하는 것을 흉내 낸다. 로그에 `Tomcat started on port 9090`.
- `-p 18080:9090` — 맥의 18080 → 컨테이너 9090. `run-local.sh`가 8080을 쓰고 있어도 겹치지 않는다.
- 프로덕션 리다이렉트까지 보려면 `-e FRONTEND_ORIGIN=https://manna-five-tau.vercel.app`를 더한다.

다른 터미널에서

```
curl -s -o /dev/null -w "%{http_code}\n" localhost:18080/api/v1/me
curl -s -o /dev/null -w "%{redirect_url}\n" localhost:18080/oauth2/authorization/google
```

401, 그리고 `accounts.google.com`으로 가는 주소(안의 `redirect_uri`가 프론트 주소인지 본다).
`Ctrl+C`로 끄면 `--rm`이라 컨테이너도 지워진다.

## 6. 자주 겪는 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| 백엔드가 `database "manna_db" does not exist`로 죽음 | brew `postgresql@15`가 5432를 먼저 잡음 | `brew services stop postgresql@15` |
| 백엔드가 `Connection refused` / `JdbcEnvironmentInitiator`로 죽음 | DB 컨테이너가 안 떠 있음 | `apps/`에서 `docker compose up -d` |
| 백엔드가 `Schema-validation: missing table/column` | 엔티티와 `init-db.sql`이 다름, 또는 볼륨이 옛 스키마 | 4번 |
| 로그인 후 `redirect_uri_mismatch` | Google 클라이언트에 `http://localhost:3000/login/oauth2/code/google` 없음 | Console에 추가(반영에 수 분) |
| 로그인 버튼이 아무 반응 없음 / 502 | 백엔드가 안 떠 있음 | `./run-local.sh` |
| 폰에서 로그인 불가 | LAN IP는 Google이 거부 | 폰 검증은 배포본으로 |
| dev 서버가 이상하게 깨짐 | 떠 있는 dev 밑에서 `.next` 삭제·`npm run build` | dev를 내리고 한다(07_HISTORY) |
