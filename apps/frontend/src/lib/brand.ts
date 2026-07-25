/**
 * 브라우저 크롬(매니페스트, theme-color)에 넘길 브랜드 색.
 *
 * 여기가 코드에서 hex를 직접 쓰는 유일한 곳이다. 브라우저는 매니페스트를 CSS가 아닌
 * JSON으로 읽기 때문에 var(--manna-brand)를 해석하지 못한다. CSS로는 해결할 수 없는
 * 지점이라 값을 한 곳에 모아두고, globals.css의 primitive와 짝을 맞춘다.
 *
 * globals.css의 --manna-brand / --manna-white를 바꾸면 여기도 함께 바꿀 것.
 */
export const BRAND_COLOR = "#FFCC00"; // --manna-brand
export const BACKGROUND_COLOR = "#FFFFFF"; // --manna-white
