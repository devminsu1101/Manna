"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/**
 * 기도마니또 시작하기 (리더, D-3602). 방을 만들고 멤버를 다 받은 뒤 한꺼번에 시작한다.
 * 누르면 그 주 토요일까지가 첫 주이고, 이후 매주 일요일에 새로 섞인다.
 *
 * 시작하면 버튼이 사라지고 안내 문구도 두지 않는다 — 대문 맨 위 "이주의 기도마니또" 카드가
 * 채워지는 것이 곧 시작됐다는 표시다.
 */
export function StartPartnersButton({ communityId }: { communityId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    if (!confirm("지금 멤버들로 기도마니또를 시작할까요? 매주 일요일에 새로 정해져요.")) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await apiFetch(`/api/v1/communities/${communityId}/partners`, { method: "POST" });
      // 409(이미 시작함)도 다시 그리면 맞는 상태가 보인다.
      if (res.ok || res.status === 409) return router.refresh();
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button className="h-11 w-full rounded-xl" disabled={busy} onClick={start}>
      {failed ? "다시 시도" : "기도마니또 시작하기"}
    </Button>
  );
}
