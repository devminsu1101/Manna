"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/**
 * "기도했어요". `POST /api/v1/pray/{userId}` → 204.
 *
 * 멱등이라 두 번 눌러도 하나고, 응답에 카운트가 없다 — 어제 기준이라 돌려줄 새 숫자가 없다.
 * 저장이 성공한 뒤에만 완료 상태를 보이고 서버 컴포넌트를 다시 그린다.
 * 중보기도실 스토리 줄은 성공 콜백으로 다음 사람을 고른다. 상세 화면은 제자리에 머문다.
 *
 * 끝난 상태는 같은 모양의 연한 버튼이다(D-3617). 서버가 준 진짜 상태고, 하루 하나라
 * (`UNIQUE (prayed_for_user_id, pray_by, prayed_on)`) 더 눌러도 변하지 않으니 누를 수 없게 둔다.
 */
export function PrayButton({
  userId,
  prayedToday,
  onSuccess,
}: {
  userId: number;
  prayedToday: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const inFlight = useRef(false);
  const confirmedRef = useRef(false);

  async function pray() {
    if (inFlight.current || confirmedRef.current) return;
    inFlight.current = true;
    setBusy(true);
    setFailed(false);
    try {
      const res = await apiFetch(`/api/v1/pray/${userId}`, { method: "POST" });
      if (res.status === 401) return router.push("/login");
      if (res.ok) {
        confirmedRef.current = true;
        setConfirmed(true);
        onSuccess?.();
        return router.refresh();
      }
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  if (prayedToday || confirmed) {
    return (
      <Button
        variant="love"
        size="block"
        className="mt-4 bg-accent/20 font-bold text-foreground/60 disabled:opacity-100"
        disabled
      >
        오늘 이미 기도했어요
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="love"
        size="block"
        className="mt-4"
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
