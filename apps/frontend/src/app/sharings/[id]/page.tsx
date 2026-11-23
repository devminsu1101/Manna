import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getSharing } from "@/features/sharing/api";
import { SharingArticle } from "@/features/sharing/components/SharingArticle";
import { DeleteSharingButton } from "@/features/sharing/components/DeleteSharingButton";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "나눔 | 만나" };

const TYPE_LABEL = { daily: "일상 나눔", scripture: "성경 나눔" } as const;

/**
 * 나눔 상세. 댓글·좋아요가 생기면 이 화면 아래에 붙는다(D-3503).
 * 볼 수 없는 나눔이면 404다 — 존재를 알리지 않는다(D-1707과 같은 규칙).
 */
export default async function SharingPage({ params }: PageProps) {
  const sharing = await getSharing(Number((await params).id));
  if (!sharing) notFound();

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/together.png" title={TYPE_LABEL[sharing.type]} />}
      className="flex flex-col"
    >
      <div className="mx-4">
        <SharingArticle sharing={sharing} profileHref={`/prayer?u=${sharing.author.userId}`} />
      </div>

      {sharing.mine && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="h-11 rounded-xl">
            <Link href={`/sharings/${sharing.id}/edit`}>수정</Link>
          </Button>
          <DeleteSharingButton id={sharing.id} />
        </div>
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
