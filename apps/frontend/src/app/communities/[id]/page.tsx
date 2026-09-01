import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BottomNav } from "@/components/BottomNav";
import { getCommunity } from "@/features/community/api";
import { MemberList } from "@/features/community/components/MemberList";
import { PrayerPartnerCard } from "@/features/community/components/PrayerPartnerCard";
import { SharingShelf } from "@/features/community/components/SharingShelf";
import { MainTopBar } from "@/features/home/MainTopBar";

// Next 16에서 params는 Promise다. 반드시 await 해야 한다.
type PageProps = { params: Promise<{ id: string }> };

async function resolveCommunity({ params }: PageProps) {
  const { id } = await params;
  return getCommunity(Number(id));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const community = await resolveCommunity(props);
  return { title: community ? `${community.name} | 만나` : "만나" };
}

/**
 * 공동체 대문 (D-1003). 기도짝 · 나눔 자료실 · 멤버 목록 셋이다.
 * 시안(`Community Page.png`)의 공지사항·갤러리는 ERD에 테이블이 없어 제외됐다.
 *
 * **목록으로 나가는 버튼을 두지 않는다** (D-1701). 탭을 다시 누르면 목록이고, 그러라고
 * 탭의 도착지를 목록으로 둔 것이다. standalone PWA에 브라우저 뒤로가기가 없다는 제약
 * (D-1505)이 여기서는 문제가 되지 않는 이유가 그것이다.
 *
 * 승인 전(`pending`)이면 404다. 403이 아닌 이유: 403은 "그 방이 있긴 하다"를 알려 주는데,
 * 승인 전에는 방의 존재 자체를 노출하지 않는 것이 D-1707의 취지다. `id`가 순차 정수로
 * 노출돼도 괜찮은 것도 이 때문 — 주소를 찍어 봐도 아무것도 보이지 않는다.
 */
export default async function CommunityPage(props: PageProps) {
  const community = await resolveCommunity(props);
  if (!community) notFound();

  return (
    <>
      <MainTopBar icon="/mascot/together.png" title={community.name} />

      {/* pb-28은 고정 하단 네비(+홈 인디케이터)만큼 본문을 비워 두는 값. 홈과 같다. */}
      <main className="flex-1 space-y-6 px-4 py-5 pb-28">
        <PrayerPartnerCard partner={community.prayerPartner} />
        <SharingShelf sharings={community.sharings} />
        <MemberList
          members={community.members}
          myRole={community.myRole}
          inviteCode={community.inviteCode}
        />
      </main>

      {/* 홈과 같이 스크롤에 숨지 않는다. 몰입 화면은 리더뿐이다. */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <BottomNav />
      </div>
    </>
  );
}
