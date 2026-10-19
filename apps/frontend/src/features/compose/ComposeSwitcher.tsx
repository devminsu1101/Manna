"use client";

import Image from "next/image";
import { useState } from "react";

import { CommunitySection } from "@/features/community/components/CommunitySection";
import type { CommunitySummary } from "@/features/community/types";
import { NewPrayerRequestForm } from "@/features/prayer/components/NewPrayerRequestForm";
import { NewSharingForm } from "@/features/sharing/components/NewSharingForm";
import { cn } from "@/lib/utils";

import type { ComposeKind } from "./href";

const KINDS: { value: ComposeKind; label: string; icon: string }[] = [
  { value: "sharing", label: "공동체 나눔", icon: "/mascot/together.png" },
  { value: "prayer", label: "기도제목", icon: "/mascot/tears.png" },
];

/**
 * + 화면 맨 위의 2지선다(D-3610). 고르면 아래 폼이 바뀐다 — 공동체 나눔(본문 + 방) / 기도제목(본문 + 공개).
 *
 * 일상 · 성경 구분은 쓰는 사람에게 의미가 없어 없앴다. 처음 골라진 쪽은 들어온 곳이 정하고
 * (`composeHref`), 여기서는 언제든 바꿀 수 있다. 바꿔도 주소는 그대로 둔다 — 새로고침하면 들어온 곳의
 * 기본값으로 돌아가는 게 자연스럽다. 폼 둘은 원래 있던 것을 그대로 쓴다.
 */
export function ComposeSwitcher({
  initial,
  communities,
  preselected,
}: {
  initial: ComposeKind;
  communities: CommunitySummary[];
  preselected: number[];
}) {
  const [kind, setKind] = useState<ComposeKind>(initial);

  return (
    <>
      <CommunitySection icon="/mascot/hi.png" title="무엇을 올릴까요?" surface="warm">
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              aria-pressed={kind === k.value}
              onClick={() => setKind(k.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl px-4 py-5 font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                kind !== k.value && "bg-white",
                kind === k.value && k.value === "sharing" && "bg-primary text-primary-foreground",
                kind === k.value && k.value === "prayer" && "bg-accent text-accent-foreground",
              )}
            >
              <Image src={k.icon} alt="" width={64} height={64} className="size-10 object-contain" />
              {k.label}
            </button>
          ))}
        </div>
      </CommunitySection>

      {kind === "sharing" ? (
        <NewSharingForm communities={communities} preselected={preselected} />
      ) : (
        <NewPrayerRequestForm />
      )}
    </>
  );
}
