import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { listMyCommunities } from "@/features/community/api";
import { ComposeSwitcher } from "@/features/compose/ComposeSwitcher";
import { parseComposeKind } from "@/features/compose/href";
import { MainTopBar } from "@/features/home/MainTopBar";

export const metadata: Metadata = { title: "작성하기 | 만나" };

/**
 * + 화면 — **공동체 나눔 / 기도제목** 둘 중 하나를 골라 올린다(D-3610).
 *
 * 처음 골라질 쪽은 들어온 곳이 주소로 정한다(`features/compose/href.ts`):
 * 하단 네비 + → 공동체 나눔 · 대문 자료실 ＋(`?communityId=`) → 공동체 나눔 + 그 방 ·
 * 중보기도실 '나'의 "새로 작성하기"(`?kind=prayer`) → 기도제목.
 *
 * 톤은 warm이다 — `toneOf`의 폴백이라 이 세그먼트에는 layout이 필요 없다. 기도제목 폼은
 * 자기 구역을 love 카드로 그려 구분된다.
 */
export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; communityId?: string }>;
}) {
  const params = await searchParams;
  const kind = parseComposeKind(params.kind);
  // 승인 대기 중인 방에는 나눔을 올릴 수 없다 — pending은 방 내용을 하나도 못 본다(D-1707).
  const communities = (await listMyCommunities()).filter((c) => c.myStatus === "active");
  // 대문 자료실의 ＋로 왔으면 그 방을 미리 골라 둔다. 내 active 방이 아니면 무시한다.
  const from = Number(params.communityId);
  const preselected = communities.some((c) => c.id === from) ? [from] : [];

  // 취소는 들어온 곳으로 — standalone PWA에는 브라우저 뒤로가기가 없다(D-1505).
  const back =
    kind === "prayer" ? "/prayer" : preselected.length > 0 ? `/communities/${from}` : "/";

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/together.png" title="작성하기" />}
      className="flex flex-col space-y-6"
    >
      <ComposeSwitcher initial={kind} communities={communities} preselected={preselected} />

      <Button asChild variant="ghost" className="h-11 w-full">
        <Link href={back}>취소</Link>
      </Button>
    </AppShell>
  );
}
