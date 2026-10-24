import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CommunitySection } from "@/features/community/components/CommunitySection";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getMyPrayerRequests } from "@/features/prayer/api";
import { MyPrayerHistory } from "@/features/prayer/components/MyPrayerHistory";

export const metadata: Metadata = { title: "이전 기도제목 | 만나" };

/**
 * 마이페이지 이전 기도제목의 목록 버튼이 오는 곳 — 내 기도제목 전부, 최신순. 페이징은 없다.
 * 공동체 나눔 자료실(`/communities/[id]/sharings`)과 같은 모양이다.
 */
export default async function MyPrayersPage() {
  const requests = await getMyPrayerRequests();

  return (
    <AppShell topBar={<MainTopBar title="마이페이지" />} className="space-y-6">
      <CommunitySection icon="/mascot/tears.png" title="이전 기도제목" surface="love">
        <MyPrayerHistory requests={requests} />
      </CommunitySection>

      {/* standalone PWA엔 브라우저 뒤로가기가 없다(D-1505). */}
      <Button asChild variant="ghost" size="block">
        <Link href="/mypage">마이페이지로</Link>
      </Button>
    </AppShell>
  );
}
