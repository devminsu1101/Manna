import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getMe } from "@/features/auth/api";
import { isInviteCode, PENDING_INVITE_COOKIE } from "@/features/community/invite";
import { PrayerRoom } from "@/features/prayer/PrayerRoom";
import { SURFACE_COLOR } from "@/lib/brand";

export const metadata: Metadata = { title: "중보기도실 | 만나" };
export const viewport: Viewport = { themeColor: SURFACE_COLOR.love };

/** 로그인 완료와 PWA 첫 실행의 도착지. 초대 복귀가 있으면 먼저 처리한다. */
export default async function RootPage() {
  const pendingInvite = (await cookies()).get(PENDING_INVITE_COOKIE)?.value;
  if (isInviteCode(pendingInvite)) redirect(`/invite/${pendingInvite}`);

  const me = await getMe();
  if (!me) redirect("/bible");

  return (
    <div data-tone="love" className="contents">
      <PrayerRoom profile={me} />
    </div>
  );
}
