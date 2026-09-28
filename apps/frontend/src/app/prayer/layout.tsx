import type { Viewport } from "next";

import { SURFACE_COLOR, toneOf } from "@/lib/brand";

/**
 * 기도 탭의 상태바 색. 중보기도실 · 사람 상세 · 이전 기도제목이 전부 이걸 따른다.
 *
 * 값은 `toneOf`(lib/brand.ts)에서 가져온다. globals.css의 love `--tone-surface`와 같아야 한다
 * (globals.css의 :root:has 주석). 진한 --manna-third가 아니라 연한 쪽인 이유: 밝은 배경이라야
 * iOS가 상태바 글자를 검정으로 두어 시계와 배터리가 읽힌다.
 */
export const viewport: Viewport = { themeColor: SURFACE_COLOR[toneOf("/prayer")] };

// data-tone 마커: globals.css의 :root:has([data-tone])가 --tone을 이 탭 색으로 바꾼다.
// contents라 박스를 만들지 않는다 — AppShell의 fixed, 성경 헤더의 sticky가 그대로 동작한다.
export default function PrayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-tone={toneOf("/prayer")} className="contents">
      {children}
    </div>
  );
}
