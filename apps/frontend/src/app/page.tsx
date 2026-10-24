import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getMe } from "@/features/auth/api";
import { isInviteCode, PENDING_INVITE_COOKIE } from "@/features/community/invite";

/**
 * `/`는 화면이 없다 — 홈("만나!")을 없앴다(사용자 결정, 2026-10-24). 모아 보여 주던 것은 제자리로 갔다.
 * 기도 숫자는 마이페이지 맨 위, 기도마니또는 중보기도실 맨 앞, 공동체 소식은 알림(예정)으로.
 *
 * 주소는 남는다. 로그인 후 백엔드가 늘 여기로 보내고(D-1005), 매니페스트 start_url도 여기다.
 *  - 로그인했으면 공동체 — 하단 탭 맨 왼쪽
 *  - 아니면 성경 — 로그인 없이도 쓸 수 있는 화면
 */
export default async function RootPage() {
  // 초대 링크에서 로그인하러 갔다가 돌아온 길.
  const pendingInvite = (await cookies()).get(PENDING_INVITE_COOKIE)?.value;
  if (isInviteCode(pendingInvite)) redirect(`/invite/${pendingInvite}`);

  redirect((await getMe()) ? "/communities" : "/bible");
}
