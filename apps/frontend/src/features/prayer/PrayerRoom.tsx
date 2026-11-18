import { AppShell } from "@/components/AppShell";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getMyPrayerRequests, getMyProfile, getPrayRoom } from "@/features/prayer/api";
import { FocusToggle } from "@/features/prayer/components/FocusToggle";
import { PrayerStories } from "@/features/prayer/components/PrayerStories";

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
export async function PrayerRoom({
  initialUserId,
  profile,
}: {
  initialUserId?: number;
  profile?: { name: string; profileImageUrl: string | null };
} = {}) {
  const [{ partners, members }, currentProfile, myRequests] = await Promise.all([
    getPrayRoom(),
    profile ?? getMyProfile(),
    getMyPrayerRequests(),
  ]);

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/warm.png" title="중보기도실" />}
      className="flex flex-col gap-6 overflow-hidden"
    >
      <FocusToggle on={false} />

      <PrayerStories
        me={{ ...currentProfile, request: myRequests[0] ?? null }}
        people={[...partners, ...members]}
        initialUserId={initialUserId}
      />

    </AppShell>
  );
}

/**
 * 집중 모드 화면. `topBar`가 없으면 `AppShell`이 하단 네비도 붙이지 않는다.
 * `focus`가 셸 자신에 `data-focus`를 달고, globals.css `[data-focus]`가 그 안의 토큰을 어둡게 바꾼다.
 */
export async function FocusRoom() {
  const { partners, members } = await getPrayRoom();

  return (
    <AppShell focus className="flex flex-col gap-6 overflow-hidden">
      <FocusToggle on />
      <PrayerStories people={[...partners, ...members]} />
    </AppShell>
  );
}

