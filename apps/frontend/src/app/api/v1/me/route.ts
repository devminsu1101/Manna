import type { NextRequest } from "next/server";

/**
 * GET /api/v1/me — 현재 로그인 사용자. 백엔드 Spring으로 포워딩한다.
 *
 * rewrite 프록시가 아니라 라우트 핸들러인 이유: 백엔드가 꺼져 있을 때 조용히 401을 준다.
 * rewrite면 백엔드가 죽었을 때 Next가 ECONNREFUSED를 매 요청 로그로 도배한다 — 프론트만
 * 개발할 때(백엔드 미기동)가 흔하므로 그 소음을 없앤다. 미로그인이든 백엔드 다운이든
 * 결과는 같다(로그인 안 됨 = 401), 프론트는 그대로 "로그인" 상태를 보여준다.
 *
 * 쿠키를 그대로 실어 보낸다 — 세션 판정은 백엔드가 한다. GET이라 Set-Cookie는 안 온다.
 */
const BACKEND = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND}/api/v1/me`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      redirect: "manual", // 원 상태코드를 그대로 본다
      cache: "no-store",
    });
    return new Response(res.body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    // 백엔드 다운. 미로그인과 동일하게 취급하고 조용히 넘어간다.
    return new Response(null, { status: 401 });
  }
}
