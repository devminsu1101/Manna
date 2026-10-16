import "server-only";

import { backendFetch, backendGet } from "@/lib/backend";
import type { FeedItem, Sharing } from "./types";

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

/**
 * 홈 "지금 공동체에서는"(D-3604). 내 방 사람들의 최근 나눔 · 기도제목, 내 것은 빠진다.
 * 홈은 비로그인도 열리므로 401은 빈 목록이다(`getPraySummary`와 같은 이유).
 */
export async function getFeed(): Promise<FeedItem[]> {
  const res = await backendFetch("/sharings/feed");
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`공동체 소식을 불러오지 못했습니다 (${res.status})`);
  const body: { items: FeedItem[] } = await res.json();
  return body.items;
}

/** 나눔 하나. 볼 수 없으면 null이고, 화면은 그걸 404로 옮긴다(존재를 알리지 않는다). */
export async function getSharing(id: number): Promise<Sharing | null> {
  if (!Number.isInteger(id)) return null;
  const res = await backendGet(`/sharings/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`나눔을 불러오지 못했습니다 (${res.status})`);
  return res.json();
}
