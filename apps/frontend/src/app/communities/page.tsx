import type { Metadata } from "next";
import { ChevronRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { listMyCommunities } from "@/features/community/api";
import type { CommunitySummary } from "@/features/community/types";
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
          <ul className="space-y-2">
            {communities.map((community) => (
              <li key={community.id}>
                <CommunityRow community={community} />
              </li>
            ))}
          </ul>

          {/* 생성 진입점이 목록에 있다는 것이 D-1701이 자동 진입을 반려한 근거 중 하나다.
              목록은 어차피 탭에서 한 번에 닿아야 한다. */}
          <Button asChild variant="outline" className="mt-4 h-12 w-full rounded-xl">
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
 * 한 줄에 담는 것은 **이름과 인원 수뿐**이다 (D-1002).
 * "새 나눔 3건" 같은 지표는 데이터가 쌓이기 전엔 전부 0이라 지금 붙이면 거짓말이 된다.
 */
function CommunityRow({ community }: { community: CommunitySummary }) {
  const { name, memberCount, myStatus } = community;

  // 승인 대기 중인 방은 **누를 수 없다.** 절반이라도 보여 주면 승인이 아무것도 막지
  // 못한다(D-1707). 그래도 목록에는 남긴다 — 신청한 사실 자체는 본인이 알아야 한다.
  if (myStatus === "pending") {
    return (
      <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-4">
        <span className="min-w-0">
          <span className="block truncate font-bold text-foreground/50">{name}</span>
          <span className="block text-sm text-foreground/40">{memberCount}명</span>
        </span>
        <span className="ml-3 shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-foreground/50">
          승인 대기 중
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/communities/${community.id}`}
      className="flex items-center justify-between rounded-xl bg-surface-warm px-4 py-4 transition-colors hover:bg-surface-warm/60"
    >
      <span className="min-w-0">
        <span className="block truncate font-bold text-foreground">{name}</span>
        <span className="block text-sm text-foreground/60">{memberCount}명</span>
      </span>
      <ChevronRight className="ml-3 size-5 shrink-0 text-foreground/40" />
    </Link>
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
