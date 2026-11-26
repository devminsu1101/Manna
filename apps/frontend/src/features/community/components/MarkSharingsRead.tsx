"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

/** 프리패치로는 읽음 처리하지 않고 실제 화면이 열린 뒤, 받은 목록까지만 확인한다. */
export function MarkSharingsRead({ communityId, through }: { communityId: number; through?: string }) {
  useEffect(() => {
    if (!through) return;
    const mark = () => {
      if (document.visibilityState !== "visible") return;
      void apiFetch(`/api/v1/communities/${communityId}/sharings/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ through }),
        keepalive: true,
      }).catch(() => {});
    };
    mark();
    document.addEventListener("visibilitychange", mark);
    return () => document.removeEventListener("visibilitychange", mark);
  }, [communityId, through]);
  return null;
}
