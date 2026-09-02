import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";

export const metadata: Metadata = { title: "공동체 만들기 | 만나" };

/**
 * 공동체 생성. 목록에서만 들어온다 — 생성 진입점이 목록에 있다는 것이 자동 진입을
 * 반려한 근거 중 하나였다(D-1701).
 *
 * 입력이 이름 하나뿐인 이유: 만든 사람이 곧 리더가 되고(`communities.created_by`),
 * 초대 코드는 서버가 랜덤으로 만든다(D-1708). 사용자가 정할 것이 이름 말고 없다.
 *
 * ⚠️ **제출은 아직 막혀 있다.** `POST /api/v1/communities`가 이 앱의 첫 쓰기 API이고,
 * 그보다 먼저 CSRF를 켜야 한다(D-404) — 나중에 켜면 모든 fetch를 되돌아가 고쳐야 하기
 * 때문이다. 화면만 먼저 세워 두고 그 두 가지가 붙을 때 폼을 잇는다.
 */
export default function NewCommunityPage() {
  return (
    <AppShell topBar={<MainTopBar icon="/mascot/together.png" title="공동체 만들기" />}>
      <section className="rounded-2xl bg-surface-warm p-4">
        <label htmlFor="community-name" className="block font-bold text-foreground">
          공동체 이름
        </label>
        <p className="mt-1 text-sm text-foreground/60">
          멤버들이 목록과 상단바에서 보게 될 이름이에요
        </p>

        <input
          id="community-name"
          name="name"
          type="text"
          maxLength={40}
          placeholder="예) 2026-2기 수요 새가족반"
          className="mt-3 h-12 w-full rounded-xl border border-border bg-white px-4 text-foreground outline-none placeholder:text-foreground/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        <Button className="mt-4 h-12 w-full rounded-xl" disabled>
          만들기
        </Button>

        <p className="mt-2 text-center text-xs text-foreground/50">
          공동체 만들기는 백엔드가 연결되면 열립니다
        </p>
      </section>

      {/* 이 화면은 탭이 아니라 목록에서만 들어온다. standalone PWA에는 브라우저
          뒤로가기가 없으므로(D-1505) 돌아갈 길을 화면 안에 둔다 — 대문과 다른 점이다.
          대문은 탭을 다시 누르면 목록이지만, 여기는 탭이 가리키는 곳이 아니다. */}
      <Button asChild variant="ghost" className="mt-4 h-11 w-full">
        <Link href="/communities">취소</Link>
      </Button>
    </AppShell>
  );
}
