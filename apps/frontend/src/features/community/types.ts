/**
 * 공동체 도메인의 화면용 타입.
 *
 * 필드 이름은 docs/03_API_SPEC.md의 camelCase 규약을 그대로 따른다 — 백엔드가 붙을 때
 * 이 타입은 손대지 않고 api.ts의 구현만 fetch로 바뀌게 하려는 것이다.
 */

import type { CommunityColor } from "./colors";

/** 승인 상태. `community_members.status` (D-1707). */
export type MemberStatus = "pending" | "active";

/** 방 안에서의 역할. `communities.created_by`가 자동으로 leader — 위임·복수 리더는 MVP 제외. */
export type MemberRole = "leader" | "member";

/**
 * 목록 한 줄. **이름 + 인원 수만**이다 (D-1002).
 *
 * "새 나눔 3건" 같은 지표를 얹지 않는 이유는 데이터가 쌓이기 전엔 전부 0이기 때문.
 * 자리는 남겨 두되 지금은 세지 않는다.
 */
export type CommunitySummary = {
  id: number;
  name: string;
  /** `pending`인 방에는 없다 — 인원 수도 방의 내용이다 (D-1707). */
  memberCount?: number;
  /** 카드 색 · 사진(D-3624). 이것도 `pending`에는 없다. */
  color?: CommunityColor;
  coverImageUrl?: string | null;
  /**
   * 내 상태. `pending`이면 목록에는 뜨지만 **누를 수 없다** — 승인 전에는 방 내용을
   * 하나도 보여주지 않는 것이 승인의 존재 이유다 (D-1707).
   */
  myStatus: MemberStatus;
};

/** 대문의 멤버 목록 한 줄. */
export type CommunityMember = {
  userId: number;
  name: string;
  /** 없으면 마스코트로 대신한다. */
  profileImageUrl: string | null;
  role: MemberRole;
  status: MemberStatus;
};

/**
 * 이주의 기도마니또 = 이 방에서 내가 맡은 사람(D-3601). 리더가 시작하기 전에는 null이다.
 *
 * 카드는 사진 · 이름이고 누르면 기도실에서 그 사람이 골라진 채로 열린다(D-3622).
 */
export type PrayerPartner = {
  userId: number;
  name: string;
  profileImageUrl: string | null;
};

/**
 * 대문 화면(D-1003). 기도마니또 · 나눔 자료실 · 멤버 목록 셋이다.
 * 시안의 공지사항·갤러리는 ERD에 테이블이 없어 제외됐다.
 * 나눔 자료실은 여기 없다 — 페이지가 `features/sharing/api.ts`로 따로 부른다.
 */
export type CommunityDetail = {
  id: number;
  name: string;
  /** 목록 카드 색 · 사진(D-3624). 리더가 대문의 "카드 꾸미기"에서 바꾼다. */
  color: CommunityColor;
  coverImageUrl: string | null;
  /** 나가기 버튼이 지울 내 행 — `DELETE .../members/{myUserId}`. */
  myUserId: number;
  /** 초대 링크에 쓰는 회전 가능한 코드. `id`와 별개 컬럼이다 (D-1708). 리더에게만 온다. */
  inviteCode?: string;
  myRole: MemberRole;
  prayerPartner: PrayerPartner | null;
  /** 리더가 기도마니또를 시작했는지. 시작했으면 "기도마니또 시작하기" 버튼이 없다(D-3602). */
  partnersStarted: boolean;
  /** 승인된 멤버와 `pending` 신청자가 함께 온다. 리더만 후자를 본다. */
  members: CommunityMember[];
};
