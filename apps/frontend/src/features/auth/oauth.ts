/**
 * OAuth 시작 경로. 로그인 버튼이 여기로 브라우저를 보낸다.
 *
 * 백엔드(Spring Security OAuth2)가 이 경로에서 provider 인증을 시작하고, 끝나면
 * 세션을 세운 뒤 앱으로 돌려보낸다. 백엔드가 서기 전까지는 이 URL이 404다 —
 * 로그인 버튼은 눌리지만 실제 인증은 백엔드 태스크에서 붙는다.
 *
 * base가 비어 있으면(현재) same-origin. 백엔드가 다른 호스트면 NEXT_PUBLIC_API_BASE_URL로 돌린다.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type OAuthProvider = "google" | "kakao" | "naver";

/** v1은 Google만 연결한다. 카카오·네이버는 디자인에 있으나 후속. */
export const ENABLED_PROVIDERS: readonly OAuthProvider[] = ["google"];

export function oauthStartUrl(provider: OAuthProvider): string {
  return `${API_BASE}/oauth2/authorization/${provider}`;
}
