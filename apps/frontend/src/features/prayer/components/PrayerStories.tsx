"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { composeHref } from "@/features/compose/href";

import { daysAgoLabel } from "../days-ago";
import type { MyPrayerRequest, PrayPerson } from "../types";
import { PrayButton } from "./PrayButton";

type Me = { name: string; profileImageUrl: string | null; request: MyPrayerRequest | null };

const ME = "me";

/**
 * 중보기도실 맨 위 스토리 줄 — 인스타 스토리처럼 가로 한 줄이다(사용자 결정, 2026-10-16).
 *
 * - **맨 왼쪽은 나.** 누르면 아래 칸에 내 지금 기도제목 + 새로 작성 · 이전 기도제목.
 * - 그 옆은 볼 수 있는 사람들. 순서는 서버 그대로 — 기도마니또 먼저, 그다음 D-1909 정렬.
 * - 링: 오늘 아직 기도 안 함 = 핑크, 기도함 = 회색. 기도는 하루 단위라 매일 0시(KST)에 다시 핑크.
 * - 누르면 **이 줄 바로 아래 칸**에 그 사람 기도제목과 "기도했어요"가 뜬다. 기도하면 `PrayButton`이
 *   서버를 다시 그려 링이 회색이 된다 — 로컬 상태로 눌린 척하지 않는다. 그냥 다른 사람을 누르면 그대로다.
 * - 집중 모드(D-3611)에서는 `me`를 넘기지 않는다 — 내 칸은 숨기고 다른 사람들만 남는다.
 *
 * D-3622(실사용 피드백):
 * - 고른 사람의 원이 크다 — 지금 누구 기도제목인지 줄만 봐도 안다. 고르면 그 원이 줄 가운데로 온다.
 * - 아래 칸을 좌우로 밀면 이전 · 다음 사람. 끝에서는 멈춘다.
 *   ponytail: 끝에서 익명 기도제목 구역(D-906)으로 넘어가는 건 그 구역이 생길 때 붙인다.
 * - 이번 주 기도마니또는 초록 링 — 핑크인 다른 사람과 구분된다. 기도하면 다른 사람처럼 회색.
 * - `initialUserId`(`/prayer?u=`)가 있으면 그 사람을 먼저 고른다. 공동체 대문의 기도마니또 카드가 보낸다.
 */
export function PrayerStories({
  me,
  people,
  initialUserId,
}: {
  me?: Me;
  people: PrayPerson[];
  initialUserId?: number;
}) {
  // 처음엔 링크로 고른 사람, 없으면 아직 기도 안 한 첫 사람. 다 했으면 첫 사람, 아무도 없으면 나.
  const first =
    people.find((p) => p.userId === initialUserId) ??
    people.find((p) => !p.prayedByMeToday) ??
    people[0];
  const [selected, setSelected] = useState<number | typeof ME>(first?.userId ?? ME);
  const person = selected === ME ? null : people.find((p) => p.userId === selected);

  const order: (number | typeof ME)[] = people.map((p) => p.userId);
  if (me) order.unshift(ME);
  const row = useRef<HTMLUListElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    row.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    // 세로 스크롤과 헷갈리지 않게 가로로 충분히, 세로보다 많이 밀었을 때만.
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    const next = order[order.indexOf(selected) + (dx < 0 ? 1 : -1)];
    if (next !== undefined) setSelected(next);
  }

  if (!me && people.length === 0) {
    return (
      <p className="rounded-2xl bg-surface-love px-4 py-10 text-center text-sm text-foreground/60">
        아직 함께 기도할 사람이 없어요
      </p>
    );
  }

  return (
    <section className="rounded-2xl bg-surface-love p-4">
      <ul
        ref={row}
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {me && (
          <Story
            name="내 기도제목"
            image={me.profileImageUrl}
            ring="none"
            active={selected === ME}
            onClick={() => setSelected(ME)}
          />
        )}
        {people.map((p) => (
          <Story
            key={p.userId}
            name={p.name}
            image={p.profileImageUrl}
            ring={p.prayedByMeToday ? "done" : p.partnerIn ? "partner" : "todo"}
            active={selected === p.userId}
            onClick={() => setSelected(p.userId)}
          />
        ))}
      </ul>

      <div
        className="mt-3 rounded-xl bg-white px-4 py-5"
        onTouchStart={(e) =>
          (touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })
        }
        onTouchEnd={onTouchEnd}
      >
        {person ? <PersonPanel person={person} /> : me && <MyPanel request={me.request} />}
      </div>
    </section>
  );
}

function Story({
  name,
  image,
  ring,
  active,
  onClick,
}: {
  name: string;
  image: string | null;
  ring: "todo" | "done" | "partner" | "none";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li className="shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="flex w-16 flex-col items-center gap-1"
      >
        {/* 원 크기가 바뀌어도 이름 줄이 흔들리지 않게 칸 높이는 큰 원 기준으로 고정한다. */}
        <span className="flex h-15 items-center">
          <span
            className={cn(
              "rounded-full p-0.5",
              ring === "todo" && "bg-accent",
              ring === "done" && "bg-foreground/20",
              ring === "partner" && "bg-partner",
              ring === "none" && "bg-white",
            )}
          >
            <Image
              src={image ?? "/mascot/default.png"}
              alt=""
              width={56}
              height={56}
              className={cn(
                "rounded-full border-2 border-white bg-white object-contain transition-all",
                active ? "size-14" : "size-12",
              )}
            />
          </span>
        </span>
        <span
          className={cn(
            "w-full truncate text-center text-xs",
            active ? "font-bold text-foreground" : "text-foreground/60",
          )}
        >
          {name}
        </span>
      </button>
    </li>
  );
}

function PersonPanel({ person }: { person: PrayPerson }) {
  const { name, communities, request, prayedByMeToday, partnerIn } = person;

  return (
    <>
      <p className="text-xs text-foreground/50">
        {partnerIn ? "이번주 기도마니또 · " : ""}
        {communities.map((c) => c.name).join(" · ")}
      </p>
      <h2 className="text-lg font-bold text-foreground">{name}</h2>

      {request ? (
        <>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground">{request.body}</p>
          <p className="mt-3 text-right text-xs text-foreground/40">{daysAgoLabel(request.daysAgo)}</p>
        </>
      ) : (
        // D-903. 기도제목이 없어도 기도는 할 수 있다 — 기도의 단위가 사람이라서다.
        <p className="mt-3 text-sm leading-relaxed text-foreground/60">
          아직 기도제목을 올리지 않았어요. 그래도 함께 기도할 수 있어요
        </p>
      )}

      <PrayButton userId={person.userId} prayedToday={prayedByMeToday} />
    </>
  );
}

/** 내 칸. 기도제목은 고치지 않고 쌓는다(D-1706) — 새로 쓰면 그게 지금 것이 된다. */
function MyPanel({ request }: { request: MyPrayerRequest | null }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">내 기도제목</h2>
        <Link
          href="/mypage"
          className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-foreground/50 transition-colors hover:text-foreground"
        >
          이전 기도제목
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {request ? (
        <>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground">{request.body}</p>
          <p className="mt-3 text-right text-xs text-foreground/40">{request.createdAt.slice(0, 10)}</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-foreground/60">아직 올린 기도제목이 없어요</p>
      )}

      <Button asChild variant="love" size="block" className="mt-4">
        <Link href={composeHref({ kind: "prayer" })}>{request ? "새로 작성하기" : "기도제목 작성하기"}</Link>
      </Button>
    </>
  );
}
