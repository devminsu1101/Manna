/**
 * 나눔 도메인의 화면용 타입. 명세(docs/03_API_SPEC.md Sharing 절) 응답 그대로다.
 */

/** `sharings.type` 중 나눔이 쓰는 둘. `prayer`는 `/pray` 아래다(D-3401). */
export type SharingType = "daily" | "scripture";

export type Sharing = {
  id: number;
  type: SharingType;
  body: string;
  author: { userId: number; name: string; profileImageUrl: string | null };
  /** +09:00(KST). 앞 10자가 날짜다. */
  createdAt: string;
  /** 내 글이면 수정·삭제를 보여 준다. */
  mine: boolean;
};
