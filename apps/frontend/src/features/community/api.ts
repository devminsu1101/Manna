import "server-only";

import { backendFetch, backendGet } from "@/lib/backend";
import type {
  CommunityDetail,
  CommunityMember,
  CommunitySummary,
  MemberRole,
  MemberStatus,
} from "./types";

/**
 * 공동체 데이터 접근 계층. 백엔드 Community API(docs/03_API_SPEC.md)를 부른다.
 *
 * 호출부(page·컴포넌트)는 이 파일의 함수만 안다 — 목데이터에서 실제 API로 바뀔 때
 * 이 파일만 고친 이유다(D-1801). 명세 응답과 화면 타입이 다른 곳도 여기서 맞춘다.
 * 백엔드를 부르는 길(쿠키 전달 · 401 처리)은 `lib/backend.ts`다.
 */

// ── 명세 응답 모양 ───────────────────────────────────────────────────────

type ListResponse = {
  communities: {
    id: number;
    name: string;
    status: MemberStatus;
    memberCount?: number; // pending에는 없다
  }[];
};

type DetailResponse = {
  id: number;
  name: string;
  myRole: MemberRole;
  inviteCode?: string; // 리더에게만
  prayerPartner: { userId: number; name: string } | null;
  members: { userId: number; name: string; role: MemberRole }[];
  pendingMembers?: { userId: number; name: string }[]; // 리더에게만
};

// ── 공개 함수 ────────────────────────────────────────────────────────────

/** 내 공동체 목록. 승인 대기 중인 방도 함께 온다. */
export async function listMyCommunities(): Promise<CommunitySummary[]> {
  const res = await backendGet("/communities");
  if (!res.ok) throw new Error(`공동체 목록을 불러오지 못했습니다 (${res.status})`);

  const body: ListResponse = await res.json();
  return body.communities.map((c) => ({
    id: c.id,
    name: c.name,
    memberCount: c.memberCount,
    myStatus: c.status,
  }));
}

export type Invite = {
  communityName: string;
  /** 로그인했고 이미 그 방 사람일 때만 온다. */
  myStatus?: MemberStatus;
  /** `active`일 때만 온다 — 대문으로 보낼 주소. */
  communityId?: number;
};

/**
 * 초대 링크 미리보기. 비로그인도 부를 수 있어 `backendGet`(401 → /login)을 쓰지 않는다.
 * 없는 코드거나 재발급으로 무효가 된 코드면 null.
 */
export async function getInvite(code: string): Promise<Invite | null> {
  const res = await backendFetch(`/invites/${code}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`초대를 불러오지 못했습니다 (${res.status})`);
  return res.json();
}

/**
 * 대문에 필요한 것 전부. 없는 방, 멤버가 아님(403), **내가 아직 `pending`**(404)이면 null이다.
 *
 * `pending`에 403이 아니라 404를 주는 것은 백엔드가 정한다(D-1707) — 403은 "그 방이 있긴
 * 하다"를 알려 주는데, 승인 전에는 방의 존재 자체를 노출하지 않는다.
 */
export async function getCommunity(id: number): Promise<CommunityDetail | null> {
  if (!Number.isInteger(id)) return null;

  const res = await backendGet(`/communities/${id}`);
  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) throw new Error(`공동체를 불러오지 못했습니다 (${res.status})`);

  const d: DetailResponse = await res.json();

  // 화면(MemberList)은 멤버와 신청자를 한 배열에서 status로 가른다.
  const members: CommunityMember[] = [
    ...d.members.map((m) => ({ ...m, status: "active" as const })),
    ...(d.pendingMembers ?? []).map((m) => ({
      ...m,
      role: "member" as const,
      status: "pending" as const,
    })),
  ];

  return {
    id: d.id,
    name: d.name,
    inviteCode: d.inviteCode,
    myRole: d.myRole,
    // 배정 스케줄러가 Phase 3이라 지금은 항상 null이다. 값이 오기 시작하면 기도 도메인에서
    // 기도제목 유무를 함께 받아 hasRequest를 채운다 — 그 전까지는 "안 올렸다"로 둔다.
    prayerPartner: d.prayerPartner && { ...d.prayerPartner, hasRequest: false },
    // 나눔 도메인은 Phase 3. 자료실은 빈 상태로 보인다.
    sharings: [],
    members,
  };
}
