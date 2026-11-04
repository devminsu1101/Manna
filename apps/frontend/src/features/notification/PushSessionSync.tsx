"use client";

import { useEffect } from "react";
import { currentSubscription, pushSupported, registerSubscription } from "./push-client";

/** 로그인 계정이 바뀌면 기존 기기 구독을 새 계정으로 옮긴다. */
export function PushSessionSync() {
  useEffect(() => {
    async function sync() {
      if (!pushSupported() || Notification.permission !== "granted") return;
      const subscription = await currentSubscription();
      if (!subscription) return;
      const res = await fetch("/api/v1/me", { credentials: "include" });
      if (res.ok) await registerSubscription(subscription);
    }
    sync().catch(() => {}); // 로그인하지 않았거나 오프라인이면 다음 문서 로드 때 다시 시도한다.
  }, []);
  return null;
}
