import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getCommunity } from "@/features/community/api";
import { CommunitySection, EmptyRow } from "@/features/community/components/CommunitySection";
import { MainTopBar } from "@/features/home/MainTopBar";
import { listSharings } from "@/features/sharing/api";
import { SharingRow } from "@/features/sharing/components/SharingRow";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "나눔 자료실 | 만나" };

/**
 * 대문 "더보기"의 목적지 — 한 방의 나눔 전부, 최신순. 페이징은 없다(D-3505).
 * 들어갈 수 없는 방이면 대문과 같이 404다(D-1707).
 */
export default async function CommunitySharingsPage({ params }: PageProps) {
  const id = Number((await params).id);
  const [community, sharings] = await Promise.all([getCommunity(id), listSharings(id)]);
  if (!community || !sharings) notFound();

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/together.png" title={community.name} />}
      className="space-y-6"
    >
      <CommunitySection icon="/mascot/hi.png" title="나눔 자료실" surface="warm">
        {sharings.length === 0 ? (
          <EmptyRow>아직 올라온 나눔이 없어요</EmptyRow>
        ) : (
          sharings.map((s) => <SharingRow key={s.id} sharing={s} />)
        )}
      </CommunitySection>

      {/* standalone PWA엔 브라우저 뒤로가기가 없다(D-1505). */}
      <Button asChild variant="ghost" className="h-11 w-full">
        <Link href={`/communities/${id}`}>대문으로</Link>
      </Button>
    </AppShell>
  );
}
