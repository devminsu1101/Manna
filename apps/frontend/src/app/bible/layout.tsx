import type { Viewport } from "next";

import { SURFACE_COLOR, toneOf } from "@/lib/brand";

/**
 * 성경 탭의 상태바 색. 세그먼트 하나에 한 번만 적으면 아래 페이지가 전부 따라온다
 * (`/bible` 리다이렉트 · `/bible/{book}/{chapter}`).
 *
 * 값은 `toneOf`(lib/brand.ts)에서 가져온다 — 라우팅 규칙이 한 곳에만 적혀야 탭 이동 방식
 * (ToneNavigation)과 어긋나지 않는다. BibleHeader의 `bg-header`와 같은 값이어야 한다.
 */
export const viewport: Viewport = { themeColor: SURFACE_COLOR[toneOf("/bible")] };

// DOM을 더하지 않는다. 이 파일이 존재하는 이유는 위 한 줄뿐이다.
export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
