import { User } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getMe } from "@/features/auth/api";
import { EditableName } from "@/features/auth/EditableName";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { CommunitySection } from "@/features/community/components/CommunitySection";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getMyPrayerRequests, getMyStats } from "@/features/prayer/api";
import { MyPrayerHistory } from "@/features/prayer/components/MyPrayerHistory";

export const metadata: Metadata = { title: "마이페이지 | 만나" };

/**
 * 마이페이지 = **내 것 모아 보기**(D-3609). 상단바의 프로필 이미지로 들어온다.
 *
 * 처음엔 로그아웃을 둘 곳으로 생겼다(사용자 결정, 2026-09-19). 지금은 위에서부터
 * 프로필(이름 고치기, D-3608) · 숫자 두 개 · 이전 기도제목 · 로그아웃.
 *
 * - 숫자는 기간이 서로 다르다 — 기도는 **이번 주**(일요일부터 KST), 나눔은 **이번 달**. `/me/stats`가
 *   기간 하나씩 받으므로 두 번 부른다. 명단은 두지 않는다.
 * - "홈으로 돌아가기"는 없다 — 하단 네비가 있어 막다른 곳이 아니다.
 *
 * 톤은 `warm`이다 — `toneOf()`의 폴백이라 세그먼트 layout의 themeColor를 따로 두지 않는다
 * (홈·공동체와 같은 색, D-2006).
 */
export default async function MyPage() {
  const me = await getMe();

  return (
    <AppShell topBar={<MainTopBar title="마이페이지" />} className="flex flex-col space-y-6">
      {me ? <SignedIn me={me} /> : <SignedOut />}
    </AppShell>
  );
}

async function SignedIn({ me }: { me: NonNullable<Awaited<ReturnType<typeof getMe>>> }) {
  const [week, month, requests] = await Promise.all([
    getMyStats("week"),
    getMyStats("month"),
    getMyPrayerRequests(),
  ]);

  return (
    <>
      <section className="flex flex-col items-center gap-2 rounded-2xl bg-surface-warm p-6">
        {me.profileImageUrl ? (
          <Image
            src={me.profileImageUrl}
            alt=""
            width={80}
            height={80}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-white">
            <User className="size-10 text-foreground/40" />
          </span>
        )}
        <EditableName name={me.name} />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat surface="love" label="이번 주 기도한 사람" value={week.prayedPeople} unit="명" />
        <Stat surface="warm" label="이번 달 나눔" value={month.sharings} unit="개" />
      </div>

      <CommunitySection icon="/mascot/tears.png" title="이전 기도제목" surface="love">
        <MyPrayerHistory requests={requests} />
      </CommunitySection>

      <LogoutButton />
    </>
  );
}

function Stat({
  surface,
  label,
  value,
  unit,
}: {
  surface: "love" | "warm";
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className={surface === "love" ? "rounded-2xl bg-surface-love p-4" : "rounded-2xl bg-surface-warm p-4"}>
      <p className="text-xs text-foreground/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">
        {value}
        <span className="ml-0.5 text-sm font-bold text-foreground/60">{unit}</span>
      </p>
    </div>
  );
}

/** 미로그인. 주소를 직접 쳐서 닿을 수 있는 자리라 막다른 곳이 되면 안 된다. */
function SignedOut() {
  return (
    <section className="rounded-2xl bg-surface-warm p-6 text-center">
      <p className="font-bold text-foreground">아직 로그인하지 않았어요</p>
      <p className="mt-1 text-sm text-foreground/60">
        로그인하면 기도제목을 올리고 공동체에 참여할 수 있어요
      </p>
      <Button asChild className="mt-4 h-12 w-full rounded-xl">
        <Link href="/login">로그인하러 가기</Link>
      </Button>
    </section>
  );
}
