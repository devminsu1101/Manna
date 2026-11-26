"use client";

import { ChevronRight } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { INSTALL_GUIDE_OPEN, isStandalone } from "./install-guide";

function subscribe(onChange: () => void) {
  const mode = window.matchMedia("(display-mode: standalone)");
  mode.addEventListener("change", onChange);
  window.addEventListener("pageshow", onChange);
  return () => {
    mode.removeEventListener("change", onChange);
    window.removeEventListener("pageshow", onChange);
  };
}

// 서버에서는 실행 모드를 모르므로 판정 전에는 안내를 숨긴다.
const serverSnapshot = () => true;

export function InstallGuideButton() {
  const standalone = useSyncExternalStore(subscribe, isStandalone, serverSnapshot);
  if (standalone) return null;
  return <Button variant="ghost" size="block" className="min-h-13 justify-between rounded-none px-0 text-sm font-medium" onClick={() => window.dispatchEvent(new Event(INSTALL_GUIDE_OPEN))}>
      홈 화면에 추가하기
      <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
  </Button>;
}
