import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getSharing } from "@/features/sharing/api";
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

  const { author } = sharing;

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/together.png" title={TYPE_LABEL[sharing.type]} />}
      className="flex flex-col"
    >
      <section className="rounded-2xl bg-surface-warm p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
          <Image
            src={author.profileImageUrl ?? "/mascot/default.png"}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-full object-contain"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold text-foreground">{author.name}</span>
            <span className="block text-xs text-foreground/50">
              {sharing.createdAt.slice(0, 10)}
            </span>
          </span>
        </div>

        <p className="mt-2 whitespace-pre-line rounded-xl bg-white px-4 py-5 leading-relaxed text-foreground">
          {sharing.body}
        </p>
      </section>

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
