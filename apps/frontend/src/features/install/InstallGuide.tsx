"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { InstallGuideSheet } from "./InstallGuideSheet";
import {
  detectInstallPlatform, INSTALL_GUIDE_OPEN, INSTALL_GUIDE_RECHECK,
  isInstallGuideRoute, isStandalone, markInstalled, mayAutoOpen, snoozeToday,
  type InstallPlatform,
} from "./install-guide";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** 브라우저 전역의 설치 이벤트를 보관하고, 공동체 가입자에게 하루 한 번 안내한다. */
export function InstallGuide() {
  const pathname = usePathname();
  const promptEvent = useRef<DeferredInstallPrompt | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname && isInstallGuideRoute(pathname);
  const platform: InstallPlatform = typeof navigator === "undefined" ? "other" : detectInstallPlatform();

  useEffect(() => {
    function beforeInstall(event: Event) {
      event.preventDefault();
      promptEvent.current = event as DeferredInstallPrompt;
      setCanPrompt(true);
    }
    function installed() {
      markInstalled();
      promptEvent.current = null;
      setCanPrompt(false);
      setOpenPath(null);
    }
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const checkEligibility = useCallback(async () => {
    if (!isInstallGuideRoute(pathname) || detectInstallPlatform() === "other" || !mayAutoOpen()) return;
    try {
      const me = await fetch("/api/v1/me", { credentials: "include" });
      if (!me.ok) return;
      const res = await fetch("/api/v1/communities", { credentials: "include" });
      if (!res.ok) return;
      const body: { communities?: { status: string }[] } = await res.json();
      if (body.communities?.some((c) => c.status === "pending" || c.status === "active")
        && isInstallGuideRoute(window.location.pathname) && mayAutoOpen()) setOpenPath(window.location.pathname);
    } catch { /* 오프라인·서버 오류일 때는 다음 화면에서 다시 확인한다. */ }
  }, [pathname]);

  useEffect(() => {
    if (!isInstallGuideRoute(pathname)) return;
    const frame = requestAnimationFrame(() => void checkEligibility());
    window.addEventListener(INSTALL_GUIDE_RECHECK, checkEligibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(INSTALL_GUIDE_RECHECK, checkEligibility);
    };
  }, [pathname, checkEligibility]);

  useEffect(() => {
    function openManually() {
      setOpenPath(window.location.pathname);
    }
    window.addEventListener(INSTALL_GUIDE_OPEN, openManually);
    return () => window.removeEventListener(INSTALL_GUIDE_OPEN, openManually);
  }, []);

  function close() {
    snoozeToday();
    setOpenPath(null);
  }

  async function promptInstall() {
    const event = promptEvent.current;
    if (!event) return;
    promptEvent.current = null;
    setCanPrompt(false);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") markInstalled();
    } catch { /* 설치 요청이 소멸한 경우 수동 안내를 유지한다. */ }
    close();
  }

  return <InstallGuideSheet open={open} platform={platform} canPrompt={canPrompt && !isStandalone()}
    onClose={close} onInstalled={() => { markInstalled(); setOpenPath(null); }} onPrompt={promptInstall} />;
}
