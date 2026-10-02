/**
 * 로그인 후 초대 화면으로 돌아오는 길(D-1005). 서버(app/page.tsx)와 클라이언트(JoinButton)가 같이 쓴다.
 *
 * 백엔드는 로그인이 끝나면 항상 `/`로 보낸다. 그래서 로그인하러 가기 전에 코드를 쿠키에 심고,
 * 홈이 그걸 보고 `/invite/{code}`로 되돌린다.
 *
 * ⚠️ 쿠키에는 **경로가 아니라 코드만** 담고, 읽을 때 형식을 검사한다. 경로를 담아 그대로
 * 리다이렉트하면 오픈 리다이렉트가 열린다 — 이어읽기 쿠키(D-103)와 같은 신뢰 경계 규칙.
 */
export const PENDING_INVITE_COOKIE = "manna_pending_invite";

/** 백엔드가 만드는 코드 모양(CommunityService.newInviteCode — 영숫자 10자). */
export function isInviteCode(value: string | undefined): value is string {
  return value !== undefined && /^[A-Za-z0-9]{10}$/.test(value);
}
