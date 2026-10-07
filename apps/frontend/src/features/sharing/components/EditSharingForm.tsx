"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CommunitySection } from "@/features/community/components/CommunitySection";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FIELD_CLASS } from "./NewSharingForm";

/** 나눔 고치기. 본문만이다 — 타입·공유한 방은 그대로(D-3504). */
export function EditSharingForm({ id, initialBody }: { id: number; initialBody: string }) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/sharings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) return router.push("/login");
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error?.message ?? "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      router.push(`/sharings/${id}`);
      router.refresh();
    } catch {
      setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <CommunitySection icon="/mascot/warm.png" title="나눔 내용을 고쳐 주세요" surface="warm">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={2000}
          className={cn(FIELD_CLASS, "min-h-40 resize-none leading-relaxed")}
        />
      </CommunitySection>

      <Button
        type="submit"
        className="h-12 w-full rounded-xl"
        disabled={submitting || body.trim() === ""}
      >
        {submitting ? "저장하는 중…" : "저장하기"}
      </Button>
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
