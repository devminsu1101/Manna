/**
 * 브라우저 크롬(매니페스트, theme-color)에 넘길 브랜드 색.
 *
 * 여기가 코드에서 hex를 직접 쓰는 유일한 곳이다. 브라우저는 매니페스트를 CSS가 아닌
 * JSON으로 읽기 때문에 var(--manna-brand)를 해석하지 못한다. CSS로는 해결할 수 없는
 * 지점이라 값을 한 곳에 모아두고, globals.css의 primitive와 짝을 맞춘다.
 *
 * globals.css의 --manna-brand / --manna-white를 바꾸면 여기도 함께 바꿀 것.
 */
export const BACKGROUND_COLOR = "#FFFFFF"; // --manna-white — 매니페스트의 스플래시 배경

/**
 * 화면별 상단바 색 = **그 화면의 status bar 색**. globals.css의 --surface-* 와 같은 값이다.
 *
 * 상태바(시계·배터리 뒤)를 칠하는 수단은 문서의 theme-color 하나뿐이다 — iOS 15+ standalone
 * PWA가 상단 safe area를, Android Chrome이 시스템 상태바를 이 값으로 칠한다. 라우트 세그먼트의
 * `viewport` export로 덮어쓴다(app/bible/layout.tsx, app/prayer/layout.tsx).
 *
 * ⚠️ **MainTopBar의 tone과 반드시 짝이어야 한다.** 한쪽만 바꾸면 상태바와 상단바 사이에
 * 색 경계선이 생긴다 — 고치려던 것이 바로 그것이다.
 *
 * `viewport-fit=cover` + `black-translucent`로 직접 칠하는 길은 반려했다. 그 모드는 상태바
 * 글자를 흰색으로 강제하는데 아래 셋이 전부 밝은 파스텔이라 시계가 안 보이게 된다.
 */
export const SURFACE_COLOR = {
  warm: "#FDFCF0", // --manna-brand-light — 홈 · 공동체 · 로그인/랜딩/404
  cool: "#F0FFFE", // --manna-second-light — 성경
  love: "#FFEFF2", // --manna-third-light — 기도
} as const;

export type Tone = keyof typeof SURFACE_COLOR;

/**
 * 경로 → 화면 톤. **앱의 색 구분이 실제로 적힌 유일한 표다.**
 *
 * 세그먼트 layout의 `themeColor`와 `MainTopBar`의 `tone`이 이것과 어긋나면 상태바와
 * 상단바 사이에 색 경계선이 생긴다(D-2006). 늘어나는 화면은 여기 한 줄만 보면 된다.
 *
 * 폴백이 `warm`인 이유: 홈·공동체·나눔·로그인·랜딩·404가 전부 warm이라 그것이 앱의
 * 기본 톤이다. 예외 둘만 적으면 된다.
 *
 * 한 가지 어긋나는 자리 — `/bible/zz/1` 같은 **없는 성경 주소의 404**는 여기서 `cool`로
 * 읽히지만 404 화면은 크림이다. 주소를 손으로 쳐야 닿는 자리라 그대로 둔다.
 */
export function toneOf(pathname: string): Tone {
  if (pathname.startsWith("/bible")) return "cool";
  if (pathname.startsWith("/prayer")) return "love";
  return "warm";
}
