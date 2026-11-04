"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function TestNotificationForm({ defaultUserId }: { defaultUserId: number }) {
  const [userId, setUserId] = useState(String(defaultUserId));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult("");
    try {
      const res = await apiFetch("/api/v1/admin/notifications/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), message: message.trim() }),
      });
      if (res.status === 202) {
        const data = await res.json() as { notificationId: number; subscriptionCount: number };
        setResult(`${data.subscriptionCount}개 기기로 발송을 요청했어요. 휴대폰에서 실제 수신을 확인해 주세요.`);
        setMessage("");
      } else if (res.status === 409) {
        setResult("대상 사용자가 알림을 켠 기기가 없어요.");
      } else if (res.status === 404) {
        setResult("해당 사용자 ID를 찾지 못했어요.");
      } else {
        setResult("발송 요청에 실패했어요. 입력값과 로그인 상태를 확인해 주세요.");
      }
    } catch {
      setResult("서버에 연결하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-surface-warm p-4">
      <h2 className="font-bold text-foreground">시험 알림 보내기</h2>
      <p className="mt-1 text-sm text-foreground/60">
        내 사용자 ID는 {defaultUserId}예요. 자신에게 보내 아이폰에서 수신을 확인할 수 있어요.
      </p>
      <p className="mt-1 text-xs text-foreground/50">잠금 화면에도 보이므로 민감한 내용은 입력하지 마세요.</p>
      <form onSubmit={send} className="mt-4 space-y-3">
        <label className="block text-sm font-medium">
          사용자 ID
          <input type="number" min="1" required value={userId} onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-foreground/20 bg-white px-3 py-2" />
        </label>
        <label className="block text-sm font-medium">
          알림 메시지
          <input type="text" maxLength={120} required value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="테스트 알림입니다" className="mt-1 w-full rounded-xl border border-foreground/20 bg-white px-3 py-2" />
        </label>
        <Button type="submit" variant="warm" size="block" disabled={busy || !message.trim()}>
          {busy ? "보내는 중…" : "시험 알림 보내기"}
        </Button>
      </form>
      {result && <p role="status" className="mt-3 text-sm text-foreground/70">{result}</p>}
    </section>
  );
}
