import "server-only";

import { backendFetch, backendGet } from "@/lib/backend";
import type { MyPrayerRequest, PrayPerson, PrayRoom, PraySummary } from "./types";

/**
 * 기도 데이터 접근 계층. 백엔드 Pray API(docs/03_API_SPEC.md의 `/pray/*`)를 부른다.
 *
 * 호출부(page·컴포넌트)는 이 파일의 함수만 안다 — 목데이터에서 실제 API로 바뀔 때 이 파일만
 * 고쳤다(D-1801). 명세 응답이 곧 화면 타입이라 변환이 없다.
 *
 * 응답은 **계산이 끝난 모양**이다 — `request`는 최신 한 건, `prayedByMeToday`·`daysAgo`는
 * 서버가 KST로 센 값, 배열 순서는 D-1909 정렬 완료. 여기서 다시 만지지 않는다.
 * 쓰기(기도제목 올리기 · 기도했어요)는 브라우저의 `apiFetch`가 rewrite로 보낸다.
 */

/** 중보기도실 목록. 정렬은 서버가 끝내서 준다 — 여기서 다시 만지지 않는다. */
export async function getPrayRoom(): Promise<PrayRoom> {
  const res = await backendGet("/pray/room");
  if (!res.ok) throw new Error(`중보기도실을 불러오지 못했습니다 (${res.status})`);
  return res.json();
}

/**
 * 한 사람의 카드. **내가 볼 수 없는 사람이면 null**이고, 화면은 그걸 404로 옮긴다.
 *
 * 403이 아닌 이유는 공동체 대문과 같다 — 볼 수 없는 사람은 존재 자체를 노출하지 않는다.
 * 나 자신도 백엔드가 404를 준다.
 */
export async function getPrayPerson(userId: number): Promise<PrayPerson | null> {
  if (!Number.isInteger(userId)) return null;
  const res = await backendGet(`/pray/requests/${userId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`기도제목을 불러오지 못했습니다 (${res.status})`);
  return res.json();
}

/** 비로그인 홈에서 보일 값 — "어제" 줄 없이 기도 유도 줄만 남는다(D-1705). */
const SIGNED_OUT_SUMMARY: PraySummary = { yesterdayCount: 0, partner: null, partnerTotal: 0 };

/**
 * 홈 최상단 한 칸. 어제 받은 수 + 이번 주 기도짝.
 *
 * 홈은 비로그인도 열리므로 401에 로그인 화면으로 보내지 않는다(`backendGet`을 쓰지 않는 이유).
 */
export async function getPraySummary(): Promise<PraySummary> {
  const res = await backendFetch("/pray/summary");
  if (res.status === 401) return SIGNED_OUT_SUMMARY;
  if (!res.ok) throw new Error(`기도 요약을 불러오지 못했습니다 (${res.status})`);
  return res.json();
}

/** 내 기도제목 이력. 최신순. */
export async function getMyPrayerRequests(): Promise<MyPrayerRequest[]> {
  const res = await backendGet("/pray/requests/me");
  if (!res.ok) throw new Error(`기도제목 이력을 불러오지 못했습니다 (${res.status})`);
  const body: { requests: MyPrayerRequest[] } = await res.json();
  return body.requests;
}
