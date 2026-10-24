"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiFetch } from "@/lib/api";

/**
 * 멤버 한 줄의 ⋯ (리더). 누르면 아래 시트에 **리더 넘기기 · 내보내기**가 뜬다(D-3626).
 *
 * - 리더 넘기기: `POST .../leader`. 넘기면 나는 멤버가 된다 — 다시 그리면 초대 · 승인 · 꾸미기가 사라진다.
 * - 내보내기: `PendingActions`의 거절과 같은 `DELETE .../members/{userId}`다.
 *   그 사람이 이 방에 올린 나눔은 남는다(사용자 결정).
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function run(question: string, path: string, init: RequestInit) {
    if (!confirm(question)) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await apiFetch(`/api/v1/communities/${communityId}${path}`, init);
      // 404는 이미 나간 사람 — 다시 그리면 맞는 상태가 보인다.
      if (res.ok || res.status === 404) {
        setOpen(false);
        return router.refresh();
      }
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const handOver = () =>
    run(`${name}님에게 리더를 넘길까요? 나는 멤버가 돼요.`, "/leader", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });

  const kick = () =>
    run(`${name}님을 내보낼까요? 올린 나눔은 남아요.`, `/members/${userId}`, { method: "DELETE" });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFailed(false);
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label={`${name}님 관리`}
        onClick={() => setOpen(true)}
      >
        <MoreHorizontal className="size-5 text-foreground/60" />
      </Button>

      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl px-4 pt-2 pb-8">
        <SheetHeader className="px-0">
          <SheetTitle>{name}님</SheetTitle>
        </SheetHeader>
        <div className="space-y-2">
          <Button variant="outline" size="block" disabled={busy} onClick={handOver}>
            리더 넘기기
          </Button>
          <Button
            variant="outline"
            size="block"
            className="text-destructive"
            disabled={busy}
            onClick={kick}
          >
            내보내기
          </Button>
          <Button variant="ghost" size="block" onClick={() => setOpen(false)}>
            취소
          </Button>
          {failed && (
            <p role="alert" className="text-center text-sm text-destructive">
              하지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
