"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/** 내 나눔 지우기(작성자만, D-3506). 되돌릴 수 없어 한 번 묻는다. */
export function DeleteSharingButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    // 방마다 따로 올라간 글이라(D-3507) 이 공동체의 글만 지워진다.
    if (!confirm("이 공동체에서 이 나눔을 지울까요?")) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await apiFetch(`/api/v1/sharings/${id}`, { method: "DELETE" });
      // 404는 이미 지워진 것 — 결과가 같다.
      if (res.ok || res.status === 404) return router.push("/communities");
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="h-11 rounded-xl text-destructive"
      disabled={busy}
      onClick={remove}
    >
      {failed ? "다시 시도" : "삭제"}
    </Button>
  );
}
