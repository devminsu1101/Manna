/**
 * 공동체 도메인의 화면용 타입.
 *
 * 필드 이름은 docs/03_API_SPEC.md의 camelCase 규약을 그대로 따른다 — 백엔드가 붙을 때
 * 이 타입은 손대지 않고 api.ts의 구현만 fetch로 바뀌게 하려는 것이다.
 */

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
  memberCount: number;
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
  role: MemberRole;
  status: MemberStatus;
};

/**
 * 이주의 기도짝. 아직 배정 스케줄러가 없어(Phase 3) 배정 전에는 null이 온다.
 *
 * `hasRequest`가 필요한 이유: 기도짝이 정해져도 그 사람이 기도제목을 아직 안 썼을 수
 * 있다. 그때 "기도제목 보기"를 누르면 빈 화면으로 떨어진다.
 */
export type PrayerPartner = {
  userId: number;
  name: string;
  hasRequest: boolean;
};

/** 나눔 자료실 한 줄. 목록에서는 제목만 쓴다. */
export type SharingSummary = {
  id: number;
  title: string;
};

/**
 * 대문 화면(D-1003). 기도짝 · 나눔 자료실 · 멤버 목록 셋이다.
 * 시안의 공지사항·갤러리는 ERD에 테이블이 없어 제외됐다.
 */
export type CommunityDetail = {
  id: number;
  name: string;
  /** 초대 링크에 쓰는 회전 가능한 코드. `id`와 별개 컬럼이다 (D-1708). */
  inviteCode: string;
  myRole: MemberRole;
  prayerPartner: PrayerPartner | null;
  sharings: SharingSummary[];
  /** 승인된 멤버와 `pending` 신청자가 함께 온다. 리더만 후자를 본다. */
  members: CommunityMember[];
};
