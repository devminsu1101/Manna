import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * 서버 컴포넌트가 백엔드를 직접 부르는 길. 도메인별 api.ts(`features/{community,prayer}/api.ts`)가 쓴다.
 *
 * 브라우저를 거치지 않고 Next 서버가 백엔드로 요청하고, 브라우저가 보낸 쿠키(세션)를 그대로
 * 실어 준다 — app/api/v1/me/route.ts와 같은 방식. 쓰기는 여기가 아니라 브라우저의 `apiFetch`다.
 */

const BACKEND = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

/** 백엔드 GET. 401도 그대로 돌려준다 — 비로그인도 열리는 화면(초대 · 홈)이 쓴다. */
export async function backendFetch(path: string): Promise<Response> {
  return fetch(`${BACKEND}/api/v1${path}`, {
    headers: { cookie: (await cookies()).toString() },
    redirect: "manual",
    cache: "no-store",
  });
}

/** 백엔드 GET. 로그인이 안 돼 있으면(401) 로그인 화면으로 보낸다. */
export async function backendGet(path: string): Promise<Response> {
  const res = await backendFetch(path);
  // 그냥 두면 빈 목록("아직 속한 공동체가 없어요")이 떠서 로그인 안 된 걸 모른다.
  if (res.status === 401) redirect("/login");
  return res;
}
