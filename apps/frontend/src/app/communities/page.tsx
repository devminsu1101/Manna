import type { Metadata } from "next";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { listMyCommunities } from "@/features/community/api";
import { CommunityList } from "@/features/community/components/CommunityList";
import { MainTopBar } from "@/features/home/MainTopBar";

export const metadata: Metadata = { title: "공동체 | 만나" };

/**
 * 공동체 목록. 하단 탭 "공동체"가 도착하는 곳이다.
 *
 * **개수와 무관하게 항상 여기를 거친다** (D-1001, D-1701에서 재확인). "1개면 바로 그 방으로"는
 * 두 번 반려됐다 — 개수가 1→2가 되는 순간 탭의 도착지가 말없이 바뀌고, 목록으로 돌아올 길을
 * 새로 만들어야 한다. 탭이 곧 목록이면 그 길이 애초에 필요 없다.
 *
 * 그래서 **대문에는 "목록으로" 버튼을 두지 않는다.** 탭을 다시 누르면 된다.
 */
export default async function CommunitiesPage() {
  const communities = await listMyCommunities();

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/together.png" title="공동체" />}
      className="flex flex-col"
    >
      {communities.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <CommunityList communities={communities} />

          {/* 생성 진입점이 목록에 있다는 것이 D-1701이 자동 진입을 반려한 근거 중 하나다.
              목록은 어차피 탭에서 한 번에 닿아야 한다. */}
          <Button asChild variant="outline" size="block" className="mt-4">
            <Link href="/communities/new">
              <Plus className="size-5" />
              공동체 만들기
            </Link>
          </Button>
        </>
      )}
    </AppShell>
  );
}

/**
 * 아직 아무 데도 속하지 않은 사람. 가입은 **초대 링크로만** 이뤄지므로(D-1004,
 * 공개 검색은 배제) 여기서 할 수 있는 일은 직접 만드는 것 하나뿐이다.
 * 그 사실을 숨기지 않고 적어 둔다 — 찾을 방법을 찾아 헤매지 않도록.
 */
function EmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-surface-warm px-6 py-16 text-center">
      <Image
        src="/mascot/together.png"
        alt=""
        width={160}
        height={160}
        className="size-24 object-contain"
      />

      <h2 className="mt-6 text-xl font-bold text-foreground">아직 속한 공동체가 없어요</h2>
      <p className="mt-3 text-sm leading-relaxed text-foreground/60">
        공동체를 만들어 초대하거나,
        <br />
        받은 초대 링크로 들어올 수 있어요
      </p>

      <Button asChild className="mt-6 h-11 rounded-xl px-5">
        <Link href="/communities/new">
          <Plus className="size-5" />
          공동체 만들기
        </Link>
      </Button>
    </section>
  );
}
