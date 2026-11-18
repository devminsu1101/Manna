import type { Metadata, Viewport } from "next";

import { FocusRoom, PrayerRoom } from "@/features/prayer/PrayerRoom";
import { FOCUS_COLOR, SURFACE_COLOR } from "@/lib/brand";

export const metadata: Metadata = { title: "중보기도실 | 만나" };

/** 기존 사람 선택·집중 모드 주소는 그대로 유지한다. */
type Props = { searchParams: Promise<{ focus?: string; u?: string }> };

export async function generateViewport({ searchParams }: Props): Promise<Viewport> {
  return { themeColor: (await searchParams).focus === "1" ? FOCUS_COLOR : SURFACE_COLOR.love };
}

export default async function PrayerPage({ searchParams }: Props) {
  const { focus, u } = await searchParams;
  if (focus === "1") return <FocusRoom />;
  return <PrayerRoom initialUserId={u ? Number(u) : undefined} />;
}
