"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/**
 * 방을 떠나는 버튼. 멤버는 **나가기**, 리더는 **공동체 삭제**다 — 리더에게는 나가기가 없다(D-3621).
 * 리더가 빠진 방은 승인할 사람이 없어 영영 잠기고, MVP에 리더 넘기기는 없다(D-1707).
 *
 * 성공하면 목록으로 간다. 잠금은 풀지 않는다 — 넘어가는 사이 다시 눌리지 않게.
 */
export function LeaveOrDeleteButton({
  communityId,
  communityName,
  myUserId,
  leader,
}: {
  communityId: number;
  communityName: string;
  myUserId: number;
  leader: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function go() {
    const question = leader
      ? `「${communityName}」을(를) 지울까요? 나눔과 기도마니또도 함께 사라지고 되돌릴 수 없어요.`
      : `「${communityName}」에서 나갈까요? 다시 들어오려면 초대 링크와 리더 승인이 필요해요.`;
    if (!confirm(question)) return;
    setBusy(true);
    setFailed(false);
    try {
      const path = leader
        ? `/api/v1/communities/${communityId}`
        : `/api/v1/communities/${communityId}/members/${myUserId}`;
      const res = await apiFetch(path, { method: "DELETE" });
      // 404는 이미 지워졌거나 나간 것 — 결과가 같다.
      if (res.ok || res.status === 404) {
        router.push("/communities");
        router.refresh();
        return;
      }
      setFailed(true);
      setBusy(false);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="mx-auto flex text-destructive"
      disabled={busy}
      onClick={go}
    >
      {failed ? "다시 시도" : leader ? "공동체 삭제" : "공동체 나가기"}
    </Button>
  );
}
