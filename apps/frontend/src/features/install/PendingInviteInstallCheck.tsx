"use client";

import { useEffect } from "react";
import { INSTALL_GUIDE_RECHECK } from "./install-guide";

/** 가입 신청 후 서버 화면이 pending으로 바뀐 다음 안내 자격을 다시 확인한다. */
export function PendingInviteInstallCheck() {
  useEffect(() => {
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event(INSTALL_GUIDE_RECHECK)));
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}
