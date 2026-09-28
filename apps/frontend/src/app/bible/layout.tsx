import type { Viewport } from "next";

import { SURFACE_COLOR, toneOf } from "@/lib/brand";

/**
 * 성경 탭의 상태바 색. 세그먼트 하나에 한 번만 적으면 아래 페이지가 전부 따라온다
 * (`/bible` 리다이렉트 · `/bible/{book}/{chapter}`).
 *
 * 값은 `toneOf`(lib/brand.ts)에서 가져온다 — 라우팅 규칙이 한 곳에만 적혀야 탭 이동 방식
 * (ToneNavigation)과 어긋나지 않는다. globals.css의 cool `--tone-surface`와 같은 값이어야 한다.
 */
export const viewport: Viewport = { themeColor: SURFACE_COLOR[toneOf("/bible")] };

// data-tone 마커: globals.css의 :root:has([data-tone])가 --tone을 이 탭 색으로 바꾼다.
// contents라 박스를 만들지 않는다 — AppShell의 fixed, 성경 헤더의 sticky가 그대로 동작한다.
export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-tone={toneOf("/bible")} className="contents">
      {children}
    </div>
  );
}
