/**
 * 나눔 도메인의 화면용 타입. 명세(docs/03_API_SPEC.md Sharing 절) 응답 그대로다.
 */

/** `sharings.type` 중 나눔이 쓰는 둘. `prayer`는 `/pray` 아래다(D-3401). */
export type SharingType = "daily" | "scripture";

/**
 * 홈 "지금 공동체에서는" 한 줄(D-3604). 글이 아니라 "누가 무엇을 했는지"다.
 * 나눔만 온다 — 기도제목은 사람마다 최신 하나라 소식으로 쌓이지 않는다.
 */
export type FeedItem = {
  /** 나눔 상세(`/sharings/{id}`)로 간다. */
  id: number;
  userId: number;
  name: string;
  firstLine: string;
  createdAt: string;
};

export type Sharing = {
  id: number;
  type: SharingType;
  body: string;
  author: { userId: number; name: string; profileImageUrl: string | null };
  /** +09:00(KST). 앞 10자가 날짜다. */
  createdAt: string;
  /** 내 글이면 수정·삭제를 보여 준다. */
  mine: boolean;
  /** 이 글이 걸린 방(D-3507: 글 하나 = 방 하나). 상세의 "공동체로"가 간다. 방이 지워졌으면 null. */
  communityId: number | null;
};
