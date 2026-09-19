import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MyPageContent } from "@/features/auth/MyPageContent";
import { MainTopBar } from "@/features/home/MainTopBar";

export const metadata: Metadata = { title: "마이페이지 | 만나" };

/**
 * 마이페이지. 상단바의 프로필 이미지로만 들어온다.
 *
 * 생긴 이유는 **로그아웃을 둘 곳이 필요해서**다(사용자 결정, 2026-09-19). 그전까지
 * 로그아웃은 상단바 우측에 이름과 나란히 있었는데, 늘 한 번 누르면 닿는 자리라 위험하고
 * 방 이름이 긴 대문에서는 가운데 제목을 밀어냈다. 상단바는 이미지 하나만 남기고 여기로 옮겼다.
 *
 * 톤은 `warm`이다 — `toneOf()`의 폴백이라 세그먼트 layout의 themeColor를 따로 두지 않는다
 * (홈·공동체와 같은 색, D-2006).
 */
export default function MyPage() {
  return (
    <AppShell topBar={<MainTopBar title="마이페이지" />}>
      <MyPageContent />

      {/* 탭이 아니라 상단바에서 들어오는 화면이라 돌아갈 길을 화면 안에 둔다
          — standalone PWA에는 브라우저 뒤로가기가 없다(D-1505). `/communities/new`의
          "취소"와 같은 자리·같은 모양이고, 가는 곳만 홈이다(들어온 곳이 홈의 상단바라서). */}
      <Button asChild variant="ghost" className="mt-4 h-11 w-full">
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </AppShell>
  );
}
