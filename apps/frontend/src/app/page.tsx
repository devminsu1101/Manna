import { ChevronRight } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";

import { BottomNav } from "@/components/BottomNav";
import { getChapter } from "@/features/bible/api";
import { LAST_READ_COOKIE, lastReadLocation } from "@/features/bible/last-read";
import { MainTopBar } from "@/features/home/MainTopBar";

/**
 * 홈("만나!"). 여러 도메인을 모아 보여주는 대시보드다.
 *
 * v1(골격 MVP)에서는 백엔드가 인증뿐이라, 데이터가 필요 없는 섹션만 실제로 채운다:
 *  - 오늘의 말씀: 우리 성경 데이터(개역개정)에서 직접
 *  - 최근 읽은 말씀: 쿠키(이미 구현)
 * 기도·공동체 섹션은 해당 도메인이 붙기 전까지 "곧 제공" 스텁이다.
 */
export default async function MainPage() {
  const store = await cookies();
  const lastRead = lastReadLocation(store.get(LAST_READ_COOKIE)?.value);

  // 오늘의 말씀은 사 41:10. 하드코딩한 문자열이 아니라 우리 데이터에서 뽑아 번역본(개역개정)을 맞춘다.
  const isaiah = await getChapter("is", 41);
  const todaysVerse = isaiah?.verses.find((v) => v.verseNum === 10);

  return (
    <>
      <MainTopBar />

      <main className="flex-1 space-y-6 px-4 py-5 pb-28">
        {/* ── 사랑으로 나누세요 (기도) — 스텁 ── */}
        <section className="rounded-2xl bg-surface-love p-4">
          <SectionHeader icon="/mascot/warm.png" title="사랑으로 나누세요" />
          <ComingSoon>기도짝과 중보기도는 곧 제공됩니다</ComingSoon>
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
              <cite className="mt-3 block text-sm text-foreground/60 not-italic">이사야 41:10</cite>
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
      </main>

      {/* 리더의 ReaderChrome과 달리 스크롤에 숨지 않는다. 홈은 몰입 화면이 아니다. */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <BottomNav />
      </div>
    </>
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
