import "server-only";

import { backendGet } from "@/lib/backend";
import type { Sharing } from "./types";

/**
 * 나눔 데이터 접근 계층. 백엔드 Sharing API(docs/03_API_SPEC.md)를 부른다.
 * 쓰기(올리기 · 고치기 · 지우기)는 브라우저의 `apiFetch`가 rewrite로 보낸다.
 */

/** 한 방의 나눔, 최신순. 방에 들어갈 수 없으면(403/404) null — 대문과 같은 규칙. */
export async function listSharings(communityId: number): Promise<Sharing[] | null> {
  if (!Number.isInteger(communityId)) return null;
  const res = await backendGet(`/sharings?communityId=${communityId}`);
  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) throw new Error(`나눔을 불러오지 못했습니다 (${res.status})`);
  const body: { sharings: Sharing[] } = await res.json();
  return body.sharings;
}

/** 나눔 하나. 볼 수 없으면 null이고, 화면은 그걸 404로 옮긴다(존재를 알리지 않는다). */
export async function getSharing(id: number): Promise<Sharing | null> {
  if (!Number.isInteger(id)) return null;
  const res = await backendGet(`/sharings/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`나눔을 불러오지 못했습니다 (${res.status})`);
  return res.json();
}
