/**
 * + 화면(`/sharings/new`)으로 가는 링크는 전부 여기서 만든다(D-3610).
 *
 * 어느 쪽이 먼저 골라져 있을지는 **들어온 곳이 정한다** — 하단 네비 +는 공동체 나눔, 대문 자료실 ＋는
 * 공동체 나눔 + 그 방, 중보기도실 '나'의 "새로 작성하기"는 기도제목. 서버가 알 필요 없는 화면 상태라
 * API가 아니라 주소의 쿼리로 넘긴다. 링크를 손으로 쓰면 진입점마다 쿼리 모양이 어긋난다.
 */

export type ComposeKind = "sharing" | "prayer";

export function composeHref({
  kind = "sharing",
  communityId,
}: { kind?: ComposeKind; communityId?: number } = {}): string {
  if (kind === "prayer") return "/sharings/new?kind=prayer";
  return communityId === undefined ? "/sharings/new" : `/sharings/new?communityId=${communityId}`;
}

/** 쿼리 → 처음 골라질 쪽. 모르는 값이면 기본(공동체 나눔). */
export function parseComposeKind(kind: string | undefined): ComposeKind {
  return kind === "prayer" ? "prayer" : "sharing";
}
