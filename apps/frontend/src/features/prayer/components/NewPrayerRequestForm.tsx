"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CommunitySection } from "@/features/community/components/CommunitySection";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

/** `sharings.visibility`. 저장 값은 스키마 그대로고, 화면의 말만 공개/비공개다. */
type Visibility = "public" | "anonymous";

const OPTIONS: { value: Visibility; label: string; desc: string; icon: string }[] = [
  {
    value: "public",
    label: "공개",
    desc: "공동체 지체들에게 기도제목이 공개되고 그들이 함께 기도합니다",
    icon: "/mascot/together.png",
  },
  {
    value: "anonymous",
    label: "비공개",
    desc: "공동체 지체들에겐 공개되지 않고 익명의 기도자가 기도합니다",
    icon: "/mascot/tears.png",
  },
];

/**
 * 기도제목 작성 폼. 시안 `나눔2 - 기도제목*.png`.
 *
 * **공동체를 고르지 않는다** (D-2301). 기도제목은 내 카드 하나고, 정하는 것은 어느 방에
 * 걸지가 아니라 **그 카드를 남들에게 보일지 말지**다. 나눔은 여러 방에 들어가지만 기도제목은
 * 그렇지 않다. 중보기도실에 공동체 드릴다운이 없고(D-904) `prayer_logs`에 `community_id`가
 * 없는 것과 같은 방향이다 — 기도는 방 단위가 아니라 사람 단위다.
 *
 * 저장은 append-only라 **화면의 말은 "수정"이 아니라 "업데이트"다**(D-1706). 남들에게 보이는
 * 것은 언제나 최신 한 건이고, 이전 것들은 `/prayer/requests`에 이력으로 쌓인다.
 *
 * **비공개는 막아 뒀다**(D-3403). 익명 기도제목을 보여 주는 구역(중보기도실 맨 아래, D-906)이
 * Phase 3라, 지금 열면 아무도 못 보는 글이 된다. 선택지는 보여 주되 누르지 못하게 하고,
 * API도 visibility를 받지 않는다(항상 public). 그 구역이 생기는 날 둘을 함께 연다.
 *
 * 올리면 `/prayer/requests`로 간다 — 이력 맨 위에서 방금 올린 것을 눈으로 확인한다.
 */
export function NewPrayerRequestForm() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visibility: Visibility = "public";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/pray/requests/me", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "올리지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      router.push("/prayer/requests");
    } catch {
      setError("올리지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <CommunitySection icon="/mascot/tears.png" title="기도제목을 작성해 주세요" surface="love">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="요즘 어떤 기도가 필요하신가요"
          className="min-h-40 w-full resize-none rounded-xl border border-border bg-white p-4 leading-relaxed text-foreground outline-none placeholder:text-foreground/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </CommunitySection>

      <CommunitySection icon="/mascot/hi.png" title="기도제목을 공개할까요?" surface="love">
        <div className="grid grid-cols-2 gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={visibility === o.value}
              disabled={o.value !== "public"}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl px-3 py-5 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
                visibility === o.value ? "bg-accent text-accent-foreground" : "bg-white",
              )}
            >
              <Image src={o.icon} alt="" width={64} height={64} className="size-10 object-contain" />
              <span className="font-bold">{o.label}</span>
              <span
                className={cn(
                  "text-xs leading-relaxed",
                  visibility === o.value ? "text-accent-foreground/80" : "text-foreground/50",
                )}
              >
                {o.desc}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-foreground/50">비공개는 곧 열려요</p>
      </CommunitySection>

      <div>
        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/80"
          disabled={submitting || body.trim() === ""}
        >
          {submitting ? "올리는 중…" : "기도제목 올리기"}
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-center text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
