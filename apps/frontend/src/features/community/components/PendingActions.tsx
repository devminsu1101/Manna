"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/**
 * 승인 대기 한 줄의 승인·거절 (D-1707). 리더에게만 그려진다.
 *
 * 거절은 `DELETE .../members/{userId}` — 강퇴·나가기와 같은 엔드포인트다. 셋 다 그 행을
 * 지우는 일이라서(명세). 끝나면 서버 컴포넌트를 다시 그려 목록·인원 수를 맞춘다.
 */
export function PendingActions({ communityId, userId }: { communityId: number; userId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function act(path: string, method: "POST" | "DELETE") {
    setBusy(true);
    setFailed(false);
    try {
      const res = await apiFetch(`/api/v1/communities/${communityId}/members/${userId}${path}`, {
        method,
      });
      // 409(이미 처리됨)도 다시 그리면 맞는 상태가 보인다.
      if (res.ok || res.status === 409) return router.refresh();
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
      <Button size="sm" disabled={busy} onClick={() => act("/approve", "POST")}>
        승인
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => act("", "DELETE")}>
        거절
      </Button>
    </span>
  );
}
