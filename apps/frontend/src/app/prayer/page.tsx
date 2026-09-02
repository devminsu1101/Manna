import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CommunitySection } from "@/features/community/components/CommunitySection";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getPrayRoom } from "@/features/prayer/api";
import { PrayerPersonCard } from "@/features/prayer/components/PrayerPersonCard";

export const metadata: Metadata = { title: "중보기도실 | 만나" };

/**
 * 중보기도실. 하단 탭 "기도하기"가 도착하는 곳이다.
 *
 * **공동체를 고르는 단계가 없다** (D-904). 매일 반복하는 행위라 단계가 하나만 늘어도 안 하게
 * 되고, `prayer_logs`에 `community_id`가 없는 것과도 대응한다 — 기도는 방 단위가 아니라
 * 사람 단위다. 시안(`Pray Page.png`)의 세 번째 구역(공동체별 목록)이 그래서 사라졌다.
 *
 * 시안의 나머지 두 구역은 그대로다. 순서도 그대로 두는데, **맨 위가 이 화면에서 유일하게
 * "내가 주어"인 자리**이기 때문이다 — 아래는 전부 남을 위한 것이다.
 */
export default async function PrayerPage() {
  const { partners, members } = await getPrayRoom();

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/warm.png" title="중보기도실" tone="love" />}
      className="flex flex-col space-y-6"
    >
      <RequestSection />

      {/* 배정 스케줄러가 Phase 3라 지금은 늘 빈 배열이다. 그때 제목만 덩그러니 남지 않도록
          **구획을 통째로 렌더하지 않는다.** */}
      {partners.length > 0 && (
        <CommunitySection icon="/mascot/warm.png" title="이번주 기도짝" surface="love">
          {partners.map((person) => (
            <PrayerPersonCard key={person.userId} person={person} />
          ))}
        </CommunitySection>
      )}

      {members.length > 0 ? (
        <CommunitySection icon="/mascot/together.png" title="함께 기도해요" surface="love">
          {members.map((person) => (
            <PrayerPersonCard key={person.userId} person={person} />
          ))}
        </CommunitySection>
      ) : (
        partners.length === 0 && <EmptyState />
      )}
    </AppShell>
  );
}

/**
 * 시안의 첫 구역 "기도를 요청하세요". D-903이 말한 작성 유도의 자리가 여기다.
 *
 * 작성은 `POST /pray/requests/me`라 `/communities/new`의 "만들기"와 **같은 문턱**
 * (백엔드 배포 + CSRF, D-404) 뒤에 있다. 모양은 두고 아직 안 열렸다고 말한다 — 이 화면의
 * 주 동작 중 하나라 빼면 화면이 반쪽이 된다(D-1803).
 *
 * ⚠️ 시안의 `...`(메뉴) 대신 텍스트 링크를 뒀다. 지금 걸 항목이 "이전 기도제목" 하나뿐이고
 * `components/ui/`에 dropdown-menu가 없어 radix 드롭다운을 새로 깔아야 한다. 항목 하나에
 * 메뉴 한 겹은 탭 수만 늘린다. 둘 이상이 되면 그때 드롭다운으로 승격한다.
 */
function RequestSection() {
  return (
    <CommunitySection
      icon="/mascot/tears.png"
      title="기도를 요청하세요"
      surface="cool"
      action={
        <Link
          href="/prayer/requests"
          className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-foreground/50 transition-colors hover:text-foreground"
        >
          이전 기도제목
          <ChevronRight className="size-4" />
        </Link>
      }
    >
      {/* TODO(POST /pray/requests/me): CSRF 재활성(D-404) 후 작성 화면으로 연결.
          말은 "수정"이 아니라 "업데이트"다 — 저장이 append-only라 이력이 쌓인다(D-1706). */}
      <Button variant="secondary" className="h-12 w-full rounded-xl" disabled>
        기도제목 작성하기
      </Button>
      <p className="px-1 text-center text-xs text-foreground/50">
        기도제목 쓰기는 백엔드가 연결되면 열립니다
      </p>
    </CommunitySection>
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
