"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/**
 * "기도했어요". `POST /api/v1/pray/{userId}` → 204.
 *
 * 멱등이라 두 번 눌러도 하나고, 응답에 카운트가 없다 — 어제 기준이라 돌려줄 새 숫자가 없다.
 * 끝나면 서버 컴포넌트를 다시 그려 "오늘 이미 기도했어요"로 바뀐다. **로컬 상태로 눌린 척하지
 * 않는다** — 기도했다는 기록이 이 앱의 신뢰 그 자체라 거기서 거짓말을 하면 안 된다.
 */
export function PrayButton({ userId }: { userId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function pray() {
    setBusy(true);
    setFailed(false);
    try {
      const res = await apiFetch(`/api/v1/pray/${userId}`, { method: "POST" });
      if (res.status === 401) return router.push("/login");
      if (res.ok) return router.refresh();
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        className="mt-4 h-12 w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/80"
        disabled={busy}
        onClick={pray}
      >
        기도했어요
      </Button>
      {failed && (
        <p role="alert" className="mt-2 text-center text-sm text-destructive">
          기록하지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
    </>
  );
}
