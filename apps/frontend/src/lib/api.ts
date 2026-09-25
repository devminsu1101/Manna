/**
 * Spring 백엔드로 가는 요청의 단일 창구. **쓰기 요청(POST/PUT/PATCH/DELETE)은 전부 여기로 보낸다.**
 *
 * CSRF(D-404): 세션 쿠키는 다른 사이트가 보낸 요청에도 실리므로, Spring은 쓰기 요청에
 * `XSRF-TOKEN` 쿠키와 같은 값의 `X-XSRF-TOKEN` 헤더를 요구한다. 다른 사이트는 우리 쿠키를
 * 읽지 못하니 이 헤더를 만들 수 없다. 여기서 쿠키를 읽어 헤더로 옮긴다.
 *
 * 쿠키가 없으면(첫 방문, 또는 로그인 직후 — Spring이 로그인 시 토큰을 지운다)
 * `GET /api/v1/csrf`로 먼저 받아 온다. 그 경로는 Next rewrite로 넘어가서 Set-Cookie가
 * 프론트 도메인에 그대로 붙는다.
 *
 * ⚠️ 토큰은 반드시 **헤더**로 보낸다. `csrf.spa()`는 헤더 값은 쿠키 원문으로, 폼 파라미터
 * (`_csrf`)는 XOR 인코딩된 값으로 해석한다. 쿠키 값을 hidden input에 넣으면 403이다.
 */

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
  }
  return null;
}

async function csrfToken(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) return existing;

  const res = await fetch("/api/v1/csrf", { credentials: "include" });
  const token = readCookie(CSRF_COOKIE);
  if (!res.ok || !token) {
    throw new Error(`CSRF 토큰을 받지 못했습니다 (${res.status})`);
  }
  return token;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!SAFE_METHODS.has(method)) {
    headers.set(CSRF_HEADER, await csrfToken());
  }
  return fetch(input, { ...init, method, headers, credentials: "include" });
}
