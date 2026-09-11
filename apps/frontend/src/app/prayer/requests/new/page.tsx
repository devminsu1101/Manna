import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { NewPrayerRequestForm } from "@/features/prayer/components/NewPrayerRequestForm";

export const metadata: Metadata = { title: "기도제목 작성 | 만나" };

/**
 * 중보기도실 첫 구역 "기도를 요청하세요"가 도착하는 곳(D-903 · D-1901).
 *
 * `requests`가 정적 세그먼트라 `[userId]`보다 먼저 매칭된다 — `/prayer/requests`(이력)와
 * 같은 트리다(D-1902). 톤은 `app/prayer/layout.tsx`가 이미 love를 준다.
 *
 * **데이터를 하나도 읽지 않는다.** 공동체를 고르지 않기 때문이다(D-2301).
 */
export default function NewPrayerRequestPage() {
  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/tears.png" title="기도제목 작성" tone="love" />}
      className="flex flex-col space-y-6"
    >
      <NewPrayerRequestForm />

      {/* 탭에서 못 들어오는 화면이라 돌아가는 링크를 화면 안에 둔다(D-1505). 시안에도 있다. */}
      <Button asChild variant="ghost" className="h-11 w-full">
        <Link href="/prayer">취소하기</Link>
      </Button>
    </AppShell>
  );
}
