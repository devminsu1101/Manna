import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { listMyCommunities } from "@/features/community/api";
import { MainTopBar } from "@/features/home/MainTopBar";
import { NewSharingForm } from "@/features/sharing/components/NewSharingForm";

export const metadata: Metadata = { title: "나눔 작성 | 만나" };

/**
 * 하단 네비 가운데 + 버튼의 목적지. 시안 `나눔1 - 일상*.png`.
 *
 * 톤은 warm이다 — `toneOf`의 폴백이 warm이고 나눔이 거기 속한다(lib/brand.ts). 루트 기본값과
 * 같으므로 이 세그먼트에는 layout이 필요 없다.
 *
 * 목록은 `community/api.ts`를 그대로 쓴다. **`features/sharing/api.ts`를 두지 않은 이유**:
 * 쓰기 폼이라 읽어 올 것이 없다. `createSharing()`이 생기는 날(CSRF 이후) 그때 만든다.
 */
export default async function NewSharingPage() {
  // 승인 대기 중인 방에는 나눔을 올릴 수 없다 — pending은 방 내용을 하나도 못 본다(D-1707).
  const communities = (await listMyCommunities()).filter((c) => c.myStatus === "active");

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/together.png" title="나눔 작성" />}
      className="flex flex-col space-y-6"
    >
      <NewSharingForm communities={communities} />

      {/* 탭이 아니라 + 버튼으로 들어오는 화면이다. standalone PWA에는 브라우저 뒤로가기가
          없으므로(D-1505) 돌아갈 길을 화면 안에 둔다 — `/communities/new`와 같은 판단. */}
      <Button asChild variant="ghost" className="h-11 w-full">
        <Link href="/">취소</Link>
      </Button>
    </AppShell>
  );
}
