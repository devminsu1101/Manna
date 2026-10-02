import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { getInvite } from "@/features/community/api";
import { JoinButton } from "@/features/community/components/JoinButton";
import { isInviteCode } from "@/features/community/invite";

export const metadata: Metadata = { title: "공동체 초대 | 만나" };

type PageProps = { params: Promise<{ code: string }> };

/**
 * 초대 링크의 도착지(F-2). 리더가 대문에서 복사해 카톡에 붙인 주소다(D-1804).
 *
 * **로그인 없이 방 이름부터** 보여 준다 — 어디 들어가는지 모른 채 로그인을 요구하면 이탈한다(D-1005).
 * 이미 멤버면 대문으로, 신청해 뒀으면 "승인 대기 중"을 보여 준다. 승인 전에는 방 이름 말고
 * 아무것도 보여 주지 않는다(D-1707).
 */
export default async function InvitePage({ params }: PageProps) {
  const { code } = await params;
  const invite = isInviteCode(code) ? await getInvite(code) : null;
  if (!invite) notFound();
  if (invite.myStatus === "active") redirect(`/communities/${invite.communityId}`);

  return (
    <AppShell className="flex flex-col items-center bg-muted px-8 pb-16 text-center">
      <div className="flex flex-1 flex-col items-center justify-center">
        <Image
          src="/mascot/together.png"
          alt=""
          width={180}
          height={180}
          priority
          className="size-44 object-contain"
        />
        <p className="mt-6 text-foreground/60">공동체에 초대받았어요</p>
        <h1 className="mt-1 text-2xl font-bold break-keep text-foreground">
          {invite.communityName}
        </h1>
      </div>

      {invite.myStatus === "pending" ? (
        <div className="w-full max-w-sm">
          <p className="font-bold text-foreground">가입을 신청했어요</p>
          <p className="mt-1 text-sm text-foreground/60">리더가 승인하면 들어갈 수 있어요</p>
          <Link
            href="/communities"
            className="mt-4 flex h-14 items-center justify-center rounded-xl bg-background font-medium text-foreground"
          >
            내 공동체 목록
          </Link>
        </div>
      ) : (
        <JoinButton code={code} />
      )}
    </AppShell>
  );
}
