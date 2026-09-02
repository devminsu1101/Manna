import type { Viewport } from "next";

import { SURFACE_COLOR, toneOf } from "@/lib/brand";

/**
 * 기도 탭의 상태바 색. 중보기도실 · 사람 상세 · 이전 기도제목이 전부 이걸 따른다.
 *
 * 값은 `toneOf`(lib/brand.ts)에서 가져온다. MainTopBar에 넘기는 `tone="love"`와 같아야 한다
 * (MainTopBar의 TONE 주석). 진한 --manna-third가 아니라 연한 쪽인 이유: 밝은 배경이라야
 * iOS가 상태바 글자를 검정으로 두어 시계와 배터리가 읽힌다.
 */
export const viewport: Viewport = { themeColor: SURFACE_COLOR[toneOf("/prayer")] };

// DOM을 더하지 않는다. 이 파일이 존재하는 이유는 위 한 줄뿐이다.
export default function PrayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
