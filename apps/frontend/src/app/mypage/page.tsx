import { ChevronRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMe } from "@/features/auth/api";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { ProfileHeader } from "@/features/auth/ProfileHeader";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getMyStats, getPraySummary } from "@/features/prayer/api";
import { PrayedForMe } from "@/features/prayer/components/PrayedForMe";
import { PushSettings } from "@/features/notification/PushSettings";
import { InstallGuideButton } from "@/features/install/InstallGuideButton";
import { UpdatesLink } from "@/features/updates/UpdatesLink";

export const metadata: Metadata = { title: "마이페이지 | 만나" };

const REVIEW_FORM_URL = "https://forms.gle/YfU2xP4xQodmVS7c6";

/**
 * 마이페이지 = **내 것 모아 보기**(D-3609). 하단 탭 "마이"와 상단바 프로필 이미지로 들어온다.
 *
 * 처음엔 로그아웃을 둘 곳으로 생겼다(사용자 결정, 2026-09-19). 지금은 위에서부터
 * 날 위한 기도(홈에서 옮김, 2026-10-24) · 프로필(사진 바꾸기 D-3618 · 이름 고치기 D-3608) ·
 * 숫자 두 개 · 알림 받기 · 업데이트 소식 · 설치 안내 · 이용후기(D-3623) · 로그아웃.
 *
 * - 숫자는 기간이 서로 다르다 — 기도는 **이번 주**(일요일부터 KST), 나눔은 **기간 없이 전부**.
 *   `/me/stats`가 기간 하나씩 받으므로 두 번 부른다. 명단은 두지 않는다.
 * - "홈으로 돌아가기"는 없다 — 하단 네비가 있어 막다른 곳이 아니다.
 *
 * 톤은 `warm`이다 — `toneOf()`의 폴백이라 세그먼트 layout의 themeColor를 따로 두지 않는다
 * (홈·공동체와 같은 색, D-2006).
 */
export default async function MyPage() {
  const me = await getMe();

  return (
    <AppShell topBar={<MainTopBar title="마이페이지" />} className="flex flex-col gap-6">
      {me ? <SignedIn me={me} /> : <><SignedOut /><UpdatesLink /></>}
    </AppShell>
  );
}

async function SignedIn({ me }: { me: NonNullable<Awaited<ReturnType<typeof getMe>>> }) {
  const [summary, week, all] = await Promise.all([
    getPraySummary(),
    getMyStats("week"),
    getMyStats("all"),
  ]);

  return (
    <>
      <PrayedForMe yesterdayCount={summary.yesterdayCount} />

      <section className="flex flex-col items-center gap-2 rounded-2xl p-6">
        <ProfileHeader name={me.name} photoUrl={me.profileImageUrl} />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat surface="love" label="이번 주 기도한 사람" value={week.prayedPeople} unit="명" />
        <Stat surface="warm" label="내가 올린 나눔" value={all.sharings} unit="개" />
      </div>

      <section aria-label="설정 및 소식" className="flex flex-col gap-2">
        <Separator className="mb-2 bg-border/60" />
        <PushSettings />
        <UpdatesLink />
        <InstallGuideButton />
        {me.isAdmin && (
          <Button asChild variant="ghost" size="block" className="min-h-13 justify-between rounded-none px-0 text-sm font-medium">
            <Link href="/admin">
              관리자
              <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" size="block" className="min-h-13 justify-between rounded-none px-0 text-sm font-medium">
          <a href={REVIEW_FORM_URL} target="_blank" rel="noreferrer">
            Manna 이용후기 남기기
            <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
          </a>
        </Button>
      </section>
      <div>
        <LogoutButton />
      </div>
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
      <Button asChild variant="warm" size="block" className="mt-4">
        <Link href="/login">로그인하러 가기</Link>
      </Button>
    </section>
  );
}
