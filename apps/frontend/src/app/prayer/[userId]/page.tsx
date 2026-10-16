import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getPrayPerson } from "@/features/prayer/api";
import { daysAgoLabel } from "@/features/prayer/days-ago";
import { PrayButton } from "@/features/prayer/components/PrayButton";

// Next 16에서 params는 Promise다. 반드시 await 해야 한다.
type PageProps = { params: Promise<{ userId: string }> };

async function resolvePerson({ params }: PageProps) {
  const { userId } = await params;
  return getPrayPerson(Number(userId));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const person = await resolvePerson(props);
  return { title: person ? `${person.name}님의 기도제목 | 만나` : "만나" };
}

/**
 * 한 사람의 기도제목과 "기도했어요" 버튼.
 *
 * 볼 수 없는 사람이면 404다. 403이 아닌 이유는 공동체 대문과 같다(D-1707) — 볼 수 없는
 * 대상은 존재 자체를 노출하지 않는다. **나 자신도 백엔드가 404**를 주는데, 그게 맞다.
 * 자기 기도는 `prayer_logs`의 CHECK 제약이 막는다(`prayed_for_user_id <> pray_by`). 카드는 보이는데 버튼만 안 눌리는 상태를 만들 이유가 없다.
 */
export default async function PrayerPersonPage(props: PageProps) {
  const person = await resolvePerson(props);
  if (!person) notFound();

  const { name, profileImageUrl, communities, request, prayedByMeToday } = person;

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/warm.png" title="중보기도실" />}
      className="flex flex-col"
    >
      <section className="rounded-2xl bg-surface-love p-4">
        {/* 누구를 위해 기도하는지가 이 화면의 전부라 이름을 크게 놓는다. */}
        <div className="flex flex-col items-center rounded-xl bg-white px-4 py-6 text-center">
          <Image
            src={profileImageUrl ?? "/mascot/default.png"}
            alt=""
            width={96}
            height={96}
            className="size-16 rounded-full object-contain"
          />
          <p className="mt-1 text-sm text-foreground/50">
            {communities.map((c) => c.name).join(" · ")}
          </p>
          <h2 className="text-xl font-bold text-foreground">{name}</h2>
        </div>

        <div className="mt-2 rounded-xl bg-white px-4 py-5">
          {request ? (
            <>
              {/* 목록과 달리 클램프하지 않는다. 전문을 읽으라고 들어온 화면이다. */}
              <p className="whitespace-pre-line leading-relaxed text-foreground">
                {request.body}
              </p>
              <p className="mt-3 text-right text-xs text-foreground/40">
                {daysAgoLabel(request.daysAgo)}
              </p>
            </>
          ) : (
            // D-903. 기도제목이 없어도 기도는 할 수 있다 — 기도의 단위가 제목이 아니라
            // 사람이라서다(`prayer_logs`에 `sharing_id`가 없다).
            <p className="text-center text-sm leading-relaxed text-foreground/60">
              아직 기도제목을 올리지 않았어요
              <br />
              그래도 함께 기도할 수 있어요
            </p>
          )}
        </div>
      </section>

      {prayedByMeToday ? (
        // 서버가 준 진짜 상태다. 하루 하나라
        // (`UNIQUE (prayed_for_user_id, pray_by, prayed_on)`) 더 눌러도 변하지 않는다.
        <p className="mt-4 rounded-xl bg-accent/20 px-4 py-4 text-center text-sm font-bold text-foreground/60">
          오늘 이미 기도했어요
        </p>
      ) : (
        <PrayButton userId={person.userId} />
      )}

      {/* 시안의 "취소하기". 되돌릴 기록이 없어 **그냥 뒤로 가기**다 — `POST /pray/{userId}`에
          대응하는 DELETE가 없다(API_SPEC). standalone PWA엔 브라우저 뒤로가기가 없어
          화면 안에 둔다(D-1505). */}
      <Button asChild variant="ghost" className="mt-2 h-11 w-full rounded-xl">
        <Link href="/prayer">돌아가기</Link>
      </Button>
    </AppShell>
  );
}
