"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/**
 * 멤버 한 줄의 내보내기(리더). `PendingActions`의 거절과 같은 `DELETE .../members/{userId}`다.
 * 그 사람이 이 방에 올린 나눔은 남는다(사용자 결정).
 */
export function MemberActions({
  communityId,
  userId,
  name,
}: {
  communityId: number;
  userId: number;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function kick() {
    if (!confirm(`${name}님을 내보낼까요? 올린 나눔은 남아요.`)) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await apiFetch(`/api/v1/communities/${communityId}/members/${userId}`, {
        method: "DELETE",
      });
      // 404는 이미 나간 것 — 다시 그리면 맞는 상태가 보인다.
      if (res.ok || res.status === 404) return router.refresh();
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      {failed && (
        <span role="alert" className="text-xs text-destructive">
          실패
        </span>
      )}
      <Button size="sm" variant="outline" disabled={busy} onClick={kick}>
        내보내기
      </Button>
    </span>
  );
}
