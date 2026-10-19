"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CommunitySection,
  EmptyRow,
  ROW_CLASS,
} from "@/features/community/components/CommunitySection";
import type { CommunitySummary } from "@/features/community/types";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

/** `/communities/new`의 입력 필드와 같은 테두리·포커스. 프리미티브가 없어 클래스를 옮겨 쓴다. */
export const FIELD_CLASS =
  "w-full rounded-xl border border-border bg-white p-4 text-foreground outline-none placeholder:text-foreground/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * 공동체 나눔 폼. + 화면(`ComposeSwitcher`)에서 "공동체 나눔"을 고르면 뜬다. 시안 `나눔1 - 일상Detail.png`.
 *
 * **일상 · 성경 구분이 없다**(D-3610) — 쓰는 사람에게 의미가 없었다. 저장 `type`은 `daily`로 고정하고
 * 성경 구절 참조도 비운다(4컬럼 전부 NULL이면 CHECK 통과). 스키마 · API는 그대로다.
 *
 * 제출은 `POST /api/v1/sharings`(apiFetch, NewCommunityForm과 같은 모양). 공동체를 하나도
 * 고르지 않으면 보낼 수 없다 — 나눔은 방에 거는 글이다(D-3501). 올리면 상세로 간다.
 */
export function NewSharingForm({
  communities,
  preselected,
}: {
  communities: CommunitySummary[];
  /** 대문 자료실의 +로 들어오면 그 방이 미리 골라져 있다. */
  preselected: number[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<number[]>(preselected);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const ready = body.trim() !== "" && selected.length > 0;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/sharings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "daily", body, communityIds: selected }),
      });
      if (res.status === 401) return router.push("/login");
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "올리지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      router.push(`/sharings/${json.id}`);
    } catch {
      setError("올리지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <CommunitySection icon="/mascot/warm.png" title="나눔 내용을 작성해 주세요" surface="warm">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="요즘 어떻게 지내시는지, 말씀에서 받은 은혜를 나눠 주세요"
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

      <div>
        <Button variant="warm" size="block" disabled={!ready || submitting} onClick={submit}>
          {submitting ? "올리는 중…" : "나눔 공유하기"}
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
