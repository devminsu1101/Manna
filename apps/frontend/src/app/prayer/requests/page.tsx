import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyRow } from "@/features/community/components/CommunitySection";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getMyPrayerRequests } from "@/features/prayer/api";
import type { MyPrayerRequest } from "@/features/prayer/types";
import { Check } from "lucide-react";

export const metadata: Metadata = { title: "이전 기도제목 | 만나" };

/**
 * 내가 올린 기도제목 이력. 중보기도실 첫 구역의 "이전 기도제목"이 오는 곳이다.
 *
 * **이 화면이 존재할 수 있는 이유가 append-only다** (D-1706). 기도제목을 사용자와 1:1로 두고
 * UPDATE했다면 지나간 것은 영구히 사라진다. 새 행을 쌓기로 했기에 이력이 공짜로 남았고,
 * D-1706이 "나중에 화면만 붙인다"고 한 그 화면이 이것이다.
 *
 * 라우팅: `requests`는 정적 세그먼트라 `[userId]`보다 먼저 매칭된다. API_SPEC이
 * `room`/`summary`/`requests`를 `{userId}` 자리의 예약어로 정해 둔 것과 같은 구조가
 * 프론트에서도 성립한다 — 그래서 `/prayer/requests`가 사용자 21번을 찾으러 가지 않는다.
 *
 * 탭에서 못 들어오는 화면이라 돌아가는 링크를 화면 안에 둔다(`/communities/new`와 같은 판단).
 * standalone PWA에는 브라우저 뒤로가기가 없다(D-1505).
 */
export default async function MyPrayerRequestsPage() {
  const requests = await getMyPrayerRequests();

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/tears.png" title="이전 기도제목" tone="love" />}
      className="flex flex-col"
    >
      {requests.length === 0 ? (
        <EmptyRow>아직 올린 기도제목이 없어요</EmptyRow>
      ) : (
        <ul className="space-y-3">
          {requests.map((request, index) => (
            <li key={request.id}>
              {/* 맨 위 한 건만 남들에게 보인다 — 조회 규칙이 `LIMIT 1`이기 때문(D-1706).
                  화면이 그 사실을 직접 말해 주지 않으면 아래 것들도 보이는 줄 안다. */}
              <RequestCard request={request} isCurrent={index === 0} />
            </li>
          ))}
        </ul>
      )}

      <Button asChild variant="ghost" className="mt-4 h-11 w-full rounded-xl">
        <Link href="/prayer">중보기도실로 돌아가기</Link>
      </Button>
    </AppShell>
  );
}

function RequestCard({ request, isCurrent }: { request: MyPrayerRequest; isCurrent: boolean }) {
  return (
    <article className="rounded-xl bg-surface-cool p-4">
      <div className="flex items-center gap-3">
        {/* 이력은 연대기 목록이라 "○일 전"보다 절대 날짜가 맞다. 그래서 서버가 daysAgo를
            안 주는 유일한 응답이기도 하다. 앞 10자만 잘라 쓴다 — 파싱하지 않는다. */}
        {isCurrent ? (
          <span className="shrink-0 rounded-full bg-secondary px-1 py-1 text-xs font-bold text-secondary-foreground">
            <Check className="size-3.5" />
          </span>
        ) : (
          <span className="shrink-0 rounded-full px-1 py-1 text-xs font-bold text-secondary-foreground">
            <Check className="size-3.5 text-secondary" />
          </span>
        )}
        <span className="text-sm text-foreground/50">{request.createdAt.slice(0, 10)}</span>
      </div>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
        {request.body}
      </p>

      <p className="mt-3 truncate text-xs text-foreground/50">
        {request.communities.map((c) => c.name).join(" · ")}
      </p>
    </article>
  );
}
