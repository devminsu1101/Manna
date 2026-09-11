"use client";

import { CircleCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CommunitySection,
  EmptyRow,
  ROW_CLASS,
} from "@/features/community/components/CommunitySection";
import type { CommunitySummary } from "@/features/community/types";
import { cn } from "@/lib/utils";

/** `sharings.type` 중 이 화면이 쓰는 둘. `prayer`는 작성 화면이 따로다(D-2301). */
type SharingType = "daily" | "scripture";

const TYPES: { value: SharingType; label: string; icon: string }[] = [
  { value: "daily", label: "일상 나눔", icon: "/mascot/together.png" },
  { value: "scripture", label: "성경 나눔", icon: "/mascot/bible.png" },
];

/** `/communities/new`의 입력 필드와 같은 테두리·포커스. 프리미티브가 없어 클래스를 옮겨 쓴다. */
const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-white p-4 text-foreground outline-none placeholder:text-foreground/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * 나눔 작성 폼. 시안 `나눔1 - 일상.png` / `나눔1 - 일상Detail.png`.
 *
 * **타입을 고르기 전에는 구역이 하나뿐이다** — 시안 두 장이 정확히 그 전후다. 무엇을 쓸지
 * 정하지 않은 사람에게 빈 칸 셋을 먼저 보여 줄 이유가 없다.
 *
 * **성경 나눔이어도 구절을 고르지 않는다**(이번 범위 밖, 사용자 결정). `sharings`의 참조
 * 4컬럼은 "전부 있거나 전부 없어야 한다" CHECK라 전부 NULL이면 그대로 통과한다. 구절
 * 선택기는 리더의 권/장 시트를 끌어와야 하는 별도 작업이라 타입만 먼저 가른다.
 *
 * ⚠️ **제출은 막혀 있다.** `POST /sharings`는 쓰기 API고 CSRF 재활성(D-404)이 먼저다 —
 * `/communities/new`의 "만들기"와 같은 문턱이다. 모양은 두고 아직 안 열렸다고 말한다(D-1803).
 */
export function NewSharingForm({ communities }: { communities: CommunitySummary[] }) {
  const [type, setType] = useState<SharingType | null>(null);
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <>
      <CommunitySection
        icon="/mascot/together.png"
        title="어떤 나눔을 해 주시겠어요?"
        surface="warm"
      >
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={type === t.value}
              onClick={() => setType(t.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl px-4 py-5 font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                type === t.value ? "bg-primary text-primary-foreground" : "bg-white",
              )}
            >
              <Image src={t.icon} alt="" width={64} height={64} className="size-10 object-contain" />
              {t.label}
            </button>
          ))}
        </div>
      </CommunitySection>

      {/* 타입을 고르기 전에는 아래 두 구역이 없다(시안 1장 = 고르기 전). */}
      {type && (
        <>
          <CommunitySection
            icon="/mascot/warm.png"
            title="나눔 내용을 작성해 주세요"
            surface="warm"
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder={
                type === "daily"
                  ? "요즘 어떻게 지내시는지 들려주세요"
                  : "말씀을 읽으며 받은 은혜를 나눠 주세요"
              }
              className={cn(FIELD_CLASS, "min-h-40 resize-none leading-relaxed")}
            />
          </CommunitySection>

          <CommunitySection
            icon="/mascot/together.png"
            title="어떤 공동체에 나누고 싶어요?"
            surface="warm"
          >
            {communities.length === 0 ? (
              // 갈 곳이 실재하는 화면이라 링크를 놓아도 된다(D-1803).
              <EmptyRow>
                아직 속한 공동체가 없어요.{" "}
                <Link href="/communities" className="font-bold underline underline-offset-4">
                  공동체 보러 가기
                </Link>
              </EmptyRow>
            ) : (
              communities.map((c) => {
                const checked = selected.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={cn(
                      ROW_CLASS,
                      "cursor-pointer justify-start gap-3 transition-shadow",
                      checked && "ring-2 ring-primary",
                    )}
                  >
                    {/* 체크박스 프리미티브가 없다. 네이티브를 숨기고 아이콘으로 그린다 —
                        label 안이라 클릭·키보드·스크린리더는 그대로 동작한다. */}
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(c.id)}
                      className="peer sr-only"
                    />
                    <CircleCheck
                      className={cn(
                        "size-6 shrink-0",
                        checked ? "fill-primary text-white" : "text-primary",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate font-bold">{c.name}</span>
                  </label>
                );
              })
            )}
          </CommunitySection>
        </>
      )}

      {/* TODO(POST /sharings): CSRF 재활성(D-404) + 백엔드 배포 뒤에 잇는다. */}
      <div>
        <Button className="h-12 w-full rounded-xl" disabled>
          나눔 공유하기
        </Button>
        <p className="mt-2 text-center text-xs text-foreground/50">
          나눔 올리기는 백엔드가 연결되면 열립니다
        </p>
      </div>
    </>
  );
}
