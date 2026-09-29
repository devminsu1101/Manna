"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/**
 * 공동체 생성 폼. `POST /api/v1/communities` — 이 앱의 첫 쓰기 API다.
 *
 * 브라우저에서 보내므로 `apiFetch`(CSRF 헤더 자동)를 쓰고, 경로는 next.config.ts의 rewrite로
 * 백엔드에 닿는다. 성공하면 만든 방의 대문으로 간다 — 방금 만든 사람이 곧 리더라
 * 거기서 바로 초대 링크를 복사할 수 있다.
 */
export function NewCommunityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/communities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error?.message ?? "만들지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      router.push(`/communities/${body.id}`);
    } catch {
      setError("만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-surface-warm p-4">
      <label htmlFor="community-name" className="block font-bold text-foreground">
        공동체 이름
      </label>
      <p className="mt-1 text-sm text-foreground/60">
        멤버들이 목록과 상단바에서 보게 될 이름이에요
      </p>

      <input
        id="community-name"
        name="name"
        type="text"
        maxLength={40}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="예) 2026-2기 수요 새가족반"
        className="mt-3 h-12 w-full rounded-xl border border-border bg-white px-4 text-foreground outline-none placeholder:text-foreground/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />

      <Button
        type="submit"
        className="mt-4 h-12 w-full rounded-xl"
        disabled={submitting || name.trim() === ""}
      >
        {submitting ? "만드는 중…" : "만들기"}
      </Button>

      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
