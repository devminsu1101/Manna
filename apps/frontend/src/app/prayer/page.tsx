import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CommunitySection } from "@/features/community/components/CommunitySection";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getMyPrayerRequests, getMyProfile, getPrayRoom } from "@/features/prayer/api";
import { PrayerPersonCard } from "@/features/prayer/components/PrayerPersonCard";
import { FocusToggle } from "@/features/prayer/components/FocusToggle";
import { PrayerStories } from "@/features/prayer/components/PrayerStories";
import { FOCUS_COLOR, SURFACE_COLOR } from "@/lib/brand";

export const metadata: Metadata = { title: "중보기도실 | 만나" };

type Props = { searchParams: Promise<{ focus?: string }> };

const isFocus = async (searchParams: Props["searchParams"]) => (await searchParams).focus === "1";

/**
 * 집중 모드면 상태바까지 어둡게(D-3611). 세그먼트 layout의 `viewport`(love)를 이 페이지에서 덮는다.
 * iOS standalone은 문서를 새로 뜰 때만 읽으므로 토글이 문서 이동을 한다(`FocusToggle`).
 */
export async function generateViewport({ searchParams }: Props): Promise<Viewport> {
  return { themeColor: (await isFocus(searchParams)) ? FOCUS_COLOR : SURFACE_COLOR.love };
}

/**
 * 중보기도실. 하단 탭 "기도하기"가 도착하는 곳이다.
 *
 * **공동체를 고르는 단계가 없다** (D-904). 매일 반복하는 행위라 단계가 하나만 늘어도 안 하게
 * 되고, `prayer_logs`에 `community_id`가 없는 것과도 대응한다 — 기도는 방 단위가 아니라
 * 사람 단위다. 시안(`Pray Page.png`)의 세 번째 구역(공동체별 목록)이 그래서 사라졌다.
 *
 * 맨 위는 **인스타 스토리 같은 가로 줄**이다(사용자 결정, 2026-10-16) — 맨 왼쪽이 나(내 기도제목 ·
 * 새로 작성, 시안의 "기도를 요청하세요" 자리), 그 옆이 기도마니또 → 나머지 순서의 사람들이다.
 * 누르면 줄 바로 아래에 기도제목과 "기도했어요"가 뜬다. 아래 카드 목록은 그대로 둔다.
 *
 * **집중 모드**(`?focus=1`, D-3611)는 기능을 더하는 게 아니라 **빼는** 모드다 — 기도회 · 새벽에 밝은 화면이
 * 옆 사람에게 민폐가 되지 않게 화면 전체를 어둡게 하고, 스토리 줄 · 그 아래 칸 · "기도했어요"와 끄는
 * 스위치만 남긴다. 상단바 · 하단 네비 · 내 칸은 숨긴다. 새 쿼리도 새 데이터도 없다(D-1704).
 */
export default async function PrayerPage({ searchParams }: Props) {
  if (await isFocus(searchParams)) return <FocusRoom />;

  const [{ partners, members }, profile, myRequests] = await Promise.all([
    getPrayRoom(),
    getMyProfile(),
    getMyPrayerRequests(),
  ]);

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/warm.png" title="중보기도실" />}
      className="flex flex-col gap-6 overflow-hidden"
    >
      <FocusToggle on={false} />

      <PrayerStories
        me={{ ...profile, request: myRequests[0] ?? null }}
        people={[...partners, ...members]}
      />

      {/* 리더가 기도마니또를 시작하기 전(D-3602)에는 빈 배열이다. 제목만 덩그러니 남지 않도록
          **구획을 통째로 렌더하지 않는다.** */}
      {/* {partners.length > 0 && (
        <CommunitySection icon="/mascot/warm.png" title="이번주 기도마니또" surface="love">
          {partners.map((person) => (
            <PrayerPersonCard key={person.userId} person={person} />
          ))}
        </CommunitySection>
      )} */}

      {/* 짝만 있고 members가 0명이면(둘뿐인 방) "함께 기도해요"는 통째로 빠진다. 의도한 것이다 —
          볼 사람이 이미 위 구획에 다 있다. */}
      {/* {members.length > 0 ? (
        <CommunitySection icon="/mascot/together.png" title="함께 기도해요" surface="love">
          {members.map((person) => (
            <PrayerPersonCard key={person.userId} person={person} />
          ))}
        </CommunitySection>
      ) : (
        partners.length === 0 && <EmptyState />
      )} */}
    </AppShell>
  );
}

/**
 * 집중 모드 화면. `topBar`가 없으면 `AppShell`이 하단 네비도 붙이지 않는다.
 * `focus`가 셸 자신에 `data-focus`를 달고, globals.css `[data-focus]`가 그 안의 토큰을 어둡게 바꾼다.
 */
async function FocusRoom() {
  const { partners, members } = await getPrayRoom();

  return (
    <AppShell focus className="flex flex-col gap-6 overflow-hidden">
      <FocusToggle on />
      <PrayerStories people={[...partners, ...members]} />
    </AppShell>
  );
}

/**
 * 아직 함께 기도할 사람이 없는 상태. 공동체에 아무 데도 속하지 않았거나, 속한 방에
 * 승인된 멤버가 나뿐일 때다. 둘 다 정상적으로 존재하는 상태다.
 *
 * 갈 곳을 하나 준다 — `/communities`는 실재하는 화면이라 D-1803에 걸리지 않는다.
 */
function EmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-surface-love px-6 py-16 text-center">
      <Image
        src="/mascot/warm.png"
        alt=""
        width={160}
        height={160}
        className="size-24 object-contain"
      />

      <h2 className="mt-6 text-xl font-bold text-foreground">아직 함께 기도할 사람이 없어요</h2>
      <p className="mt-3 text-sm leading-relaxed text-foreground/60">
        공동체에 참여하면
        <br />
        멤버들의 기도제목이 보여요
      </p>

      <Button asChild variant="outline" className="mt-6 h-11 rounded-xl px-5">
        <Link href="/communities">공동체 보러 가기</Link>
      </Button>
    </section>
  );
}
