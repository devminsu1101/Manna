import { ChevronRight } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { getChapter } from "@/features/bible/api";
import { LAST_READ_COOKIE, lastReadLocation } from "@/features/bible/last-read";
import { isInviteCode, PENDING_INVITE_COOKIE } from "@/features/community/invite";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getPraySummary } from "@/features/prayer/api";
import { PraySummaryRows } from "@/features/prayer/components/PraySummaryRows";

/**
 * 홈("만나!"). 여러 도메인을 모아 보여주는 대시보드다.
 *
 *  - 기도: Pray API의 요약(features/prayer/api.ts). 비로그인이면 유도 줄만 보인다
 *  - 오늘의 말씀: 우리 성경 데이터(개역개정)에서 직접
 *  - 최근 읽은 말씀: 쿠키(이미 구현)
 * 공동체(나눔) 섹션만 아직 "곧 제공" 스텁이다 — 나눔 도메인은 Phase 3다.
 */
export default async function MainPage() {
  const store = await cookies();

  // 초대 링크에서 로그인하러 갔다가 돌아온 길. 백엔드는 로그인 후 항상 여기로 보낸다(D-1005).
  const pendingInvite = store.get(PENDING_INVITE_COOKIE)?.value;
  if (isInviteCode(pendingInvite)) redirect(`/invite/${pendingInvite}`);

  const lastRead = lastReadLocation(store.get(LAST_READ_COOKIE)?.value);

  const praySummary = await getPraySummary();

  // 오늘의 말씀은 사 41:10. 하드코딩한 문자열이 아니라 우리 데이터에서 뽑아 번역본(개역개정)을 맞춘다.
  const isaiah = await getChapter("dt", 29);
  const todaysVerse = isaiah?.verses.find((v) => v.verseNum === 29);

  return (
    <AppShell topBar={<MainTopBar icon="/mascot/hi.png" />} className="space-y-6">
      {/* ── 사랑으로 나누세요 (기도) ── */}
      <section className="rounded-2xl bg-surface-love p-4">
        <SectionHeader icon="/mascot/warm.png" title="사랑으로 나누세요" />
        <PraySummaryRows summary={praySummary} />
      </section>

      {/* ── 지금 공동체에서는 (나눔) — 스텁 ── */}
      <section className="rounded-2xl bg-surface-warm p-4">
        <SectionHeader icon="/mascot/together.png" title="지금 공동체에서는" />
        <ComingSoon>공동체 나눔은 곧 제공됩니다</ComingSoon>
      </section>

      {/* ── 오늘의 말씀 (실데이터) ── */}
      <section className="rounded-2xl bg-surface-cool p-4">
        <SectionHeader icon="/mascot/bible.png" title="오늘의 말씀" />

        {todaysVerse && (
          <blockquote className="mt-3 rounded-xl bg-white/70 px-4 py-5 text-center">
            <p className="leading-relaxed text-foreground">{todaysVerse.text}</p>
            <cite className="mt-3 block text-sm text-foreground/60 not-italic">신명기 29:29</cite>
          </blockquote>
        )}

        {lastRead && (
          <Link
            href={lastRead.path}
            className="mt-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 transition-colors hover:bg-white/60"
          >
            <span>
              <span className="block font-bold text-foreground">최근 읽은 말씀 바로가기</span>
              <span className="block text-sm text-foreground/60">
                {lastRead.bookName} {lastRead.chapterNum}장
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-foreground/40" />
          </Link>
        )}
      </section>
    </AppShell>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Image src={icon} alt="" width={32} height={32} className="size-8 object-contain" />
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}

/** 아직 해당 도메인이 붙지 않은 섹션. 비어 보이지 않게 의도된 자리표시. */
function ComingSoon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-xl bg-white/60 px-4 py-6 text-center text-sm text-foreground/50">
      {children}
    </div>
  );
}
