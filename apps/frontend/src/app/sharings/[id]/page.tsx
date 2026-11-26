import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getDiscussion, getSharing } from "@/features/sharing/api";
import { SharingArticle } from "@/features/sharing/components/SharingArticle";
import { SharingDiscussion } from "@/features/sharing/components/SharingDiscussion";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ communityId?: string | string[] }> };

export const metadata: Metadata = { title: "나눔 | 만나" };

const TYPE_LABEL = { daily: "일상 나눔", scripture: "성경 나눔" } as const;

/**
 * 나눔 상세. 현재 공동체 멤버에게 본문 아래 반응·댓글을 보여 준다.
 * 볼 수 없는 나눔이면 404다 — 존재를 알리지 않는다(D-1707과 같은 규칙).
 */
export default async function SharingPage({ params, searchParams }: PageProps) {
  const requested = (await searchParams).communityId;
  const communityId = requested === undefined ? undefined : Number(requested);
  if (requested !== undefined && (Array.isArray(requested) || !Number.isInteger(communityId) || communityId! <= 0)) notFound();
  const sharing = await getSharing(Number((await params).id), communityId);
  if (!sharing) notFound();
  const discussion = sharing.canInteract && sharing.communityId
    ? await getDiscussion(sharing.id, sharing.communityId) : null;

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/together.png" title={TYPE_LABEL[sharing.type]} />}
      className="flex flex-col"
    >
      <div className="mx-4">
        <SharingArticle sharing={sharing} profileHref={`/prayer?u=${sharing.author.userId}`} />
      </div>

      {discussion && sharing.communityId && (
        <SharingDiscussion key={`${sharing.id}:${sharing.communityId}`} id={sharing.id} communityId={sharing.communityId} initial={discussion} />
      )}

      {/* 이 글이 걸린 방의 대문으로 간다(글 하나 = 방 하나, D-3507). 방이 지워졌으면 목록. D-1505 */}
      <Button asChild variant="ghost" size="block" className="mt-2">
        <Link href={sharing.communityId ? `/communities/${sharing.communityId}` : "/communities"}>
          공동체로
        </Link>
      </Button>
    </AppShell>
  );
}
