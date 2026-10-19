import "server-only";

import { backendFetch } from "@/lib/backend";
import type { Me } from "./useMe";

/**
 * 서버 컴포넌트용 현재 사용자. 미로그인(401)이면 null — 마이페이지는 그 상태도 그린다.
 * 상단바처럼 클라이언트에서 판정하는 곳은 `useMe`를 쓴다.
 */
export async function getMe(): Promise<Me | null> {
  const res = await backendFetch("/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`내 정보를 불러오지 못했습니다 (${res.status})`);
  return res.json();
}
