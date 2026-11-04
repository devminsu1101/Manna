"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { currentSubscription, needsHomeScreen, pushSupported, registerSubscription, turnOffPush, urlBase64ToBytes } from "./push-client";

type Status = "loading" | "on" | "off" | "unsupported" | "install" | "denied";

export function PushSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function check() {
      if (needsHomeScreen()) return setStatus("install");
      if (!pushSupported()) return setStatus("unsupported");
      if (Notification.permission === "denied") return setStatus("denied");
      try {
        const subscription = await currentSubscription();
        if (alive) setStatus(subscription ? "on" : "off");
      } catch {
        if (alive) {
          setStatus("off");
          setError("알림 상태를 확인하지 못했어요. 다시 시도해 주세요.");
        }
      }
    }
    check();
    return () => { alive = false; };
  }, []);

  async function turnOn() {
    setError("");
    setBusy(true);
    try {
      // iPhone은 사용자의 탭에 직접 연결된 권한 요청만 허용한다.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const keyResponse = await fetch("/api/v1/notifications/push-key", { credentials: "include" });
      if (!keyResponse.ok) throw new Error("key");
      const { publicKey } = await keyResponse.json() as { publicKey: string };
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const ready = await navigator.serviceWorker.ready;
      const subscription = await ready.pushManager.getSubscription()
        ?? await ready.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToBytes(publicKey) });
      await registerSubscription(subscription);
      setStatus("on");
    } catch {
      setError("알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.");
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError("");
    try {
      await turnOffPush();
      setStatus("off");
    } catch {
      setError("알림을 끄지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const canToggle = status === "on" || status === "off";
  const on = status === "on";

  return (
    <section className="rounded-2xl bg-surface-warm p-4">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="이 기기에서 알림 받기"
        disabled={!canToggle || busy}
        onClick={on ? turnOff : turnOn}
        className="flex w-full items-center justify-between gap-3 rounded-xl text-left disabled:cursor-default"
      >
        <span>
          <span className="block font-bold text-foreground">이 기기에서 알림 받기</span>
          <span className="mt-1 block text-sm text-foreground/60">
            {busy ? "처리 중…" : on ? "이 기기에 알림을 보내고 있어요" : "기도 소식과 공동체 알림을 받을 수 있어요"}
          </span>
        </span>
        <span
          aria-hidden
          className={cn(
            "flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors",
            on ? "justify-end bg-primary" : "justify-start bg-foreground/20",
          )}
        >
          <span className="size-6 rounded-full bg-white shadow-sm" />
        </span>
      </button>
      {status === "install" && <p className="mt-3 text-sm text-foreground/70">iPhone Safari의 공유 버튼에서 ‘홈 화면에 추가’한 뒤, 홈 화면 아이콘으로 열어 주세요.</p>}
      {status === "unsupported" && <p className="mt-3 text-sm text-foreground/70">이 브라우저에서는 휴대폰 알림을 사용할 수 없어요.</p>}
      {status === "denied" && <p className="mt-3 text-sm text-foreground/70">iPhone 설정 → 알림 → 만나에서 알림을 허용해 주세요.</p>}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
