import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { NewCommunityForm } from "@/features/community/components/NewCommunityForm";
import { MainTopBar } from "@/features/home/MainTopBar";

export const metadata: Metadata = { title: "공동체 만들기 | 만나" };

/**
 * 공동체 생성. 목록에서만 들어온다 — 생성 진입점이 목록에 있다는 것이 자동 진입을
 * 반려한 근거 중 하나였다(D-1701).
 *
 * 입력이 이름 하나뿐인 이유: 만든 사람이 곧 리더가 되고(`communities.created_by`),
 * 초대 코드는 서버가 랜덤으로 만든다(D-1708). 사용자가 정할 것이 이름 말고 없다.
 */
export default function NewCommunityPage() {
  return (
    <AppShell topBar={<MainTopBar icon="/mascot/together.png" title="공동체 만들기" />}>
      <NewCommunityForm />

      {/* 이 화면은 탭이 아니라 목록에서만 들어온다. standalone PWA에는 브라우저
          뒤로가기가 없으므로(D-1505) 돌아갈 길을 화면 안에 둔다 — 대문과 다른 점이다.
          대문은 탭을 다시 누르면 목록이지만, 여기는 탭이 가리키는 곳이 아니다. */}
      <Button asChild variant="ghost" className="mt-4 h-11 w-full">
        <Link href="/communities">취소</Link>
      </Button>
    </AppShell>
  );
}
