import "server-only";

import type { CommunityDetail, CommunitySummary } from "./types";

/**
 * 공동체 데이터 접근 계층.
 *
 * ⚠️ **지금은 목데이터다.** 백엔드의 Community API(docs/03_API_SPEC.md)가 붙으면
 * **이 파일만** fetch로 바꾼다. 호출부(page·컴포넌트)는 그대로 둔다 —
 * bible/api.ts가 로컬 JSON을 감춰 두고 쓰는 것과 같은 구조다.
 *
 * 목데이터를 컴포넌트 안에 흩뿌리지 않고 여기 한곳에 모으는 이유가 그것이다.
 * 지울 때 한 파일만 보면 된다.
 */

const MOCK_COMMUNITIES: CommunitySummary[] = [
  { id: 1, name: "2026-2기 수요 새가족반", memberCount: 12, myStatus: "active" },
  { id: 2, name: "청년부 3목장", memberCount: 8, myStatus: "active" },
  // 승인 대기 중인 방. 목록에는 뜨지만 눌러서 들어갈 수 없다(D-1707).
  { id: 3, name: "토요 새벽기도 모임", memberCount: 5, myStatus: "pending" },
];

const MOCK_DETAILS: Record<number, CommunityDetail> = {
  1: {
    id: 1,
    name: "2026-2기 수요 새가족반",
    inviteCode: "a7Kd92MfQx",
    myRole: "leader",
    prayerPartner: { userId: 21, name: "김민수", hasRequest: true },
    sharings: [
      { id: 101, title: "260507 매일묵상 [삼하4:1-12]" },
      { id: 102, title: "삼위일체 하나님의 내면생활은 완전히 다르다" },
      { id: 103, title: "이번주 설교 나눔을 짧게 해보려고 합니다" },
    ],
    members: [
      { userId: 1, name: "나", role: "leader", status: "active" },
      { userId: 21, name: "김민수", role: "member", status: "active" },
      { userId: 22, name: "박지영", role: "member", status: "active" },
      { userId: 23, name: "이현우", role: "member", status: "active" },
      { userId: 24, name: "정수빈", role: "member", status: "active" },
      { userId: 31, name: "최다은", role: "member", status: "pending" },
      { userId: 32, name: "한재민", role: "member", status: "pending" },
    ],
  },
  2: {
    id: 2,
    name: "청년부 3목장",
    inviteCode: "Zb31pLw8Rt",
    myRole: "member",
    // 기도짝 배정 스케줄러는 Phase 3다. 배정 전 상태를 화면이 감당하는지 보려고 null로 둔다.
    prayerPartner: null,
    sharings: [],
    members: [
      { userId: 41, name: "오세훈", role: "leader", status: "active" },
      { userId: 1, name: "나", role: "member", status: "active" },
      { userId: 42, name: "윤가은", role: "member", status: "active" },
    ],
  },
};

/** 내 공동체 목록. 승인 대기 중인 방도 함께 온다. */
export async function listMyCommunities(): Promise<CommunitySummary[]> {
  return MOCK_COMMUNITIES;
}

/**
 * 대문에 필요한 것 전부. 없는 방이거나 **내가 아직 `pending`이면 null**이다.
 *
 * `pending`에 403이 아니라 "없음"을 주는 것이 D-1707의 취지다 — 403은 "그 방이 있긴
 * 하다"를 알려 주는데, 승인 전에는 방의 존재 자체를 노출하지 않는다.
 */
export async function getCommunity(id: number): Promise<CommunityDetail | null> {
  if (!Number.isInteger(id)) return null;

  const summary = MOCK_COMMUNITIES.find((c) => c.id === id);
  if (!summary || summary.myStatus === "pending") return null;

  return MOCK_DETAILS[id] ?? null;
}
