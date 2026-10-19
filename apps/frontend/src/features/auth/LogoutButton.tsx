"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/**
 * 마이페이지 맨 아래 로그아웃. 상단바에서 옮겨 왔다(사용자 결정, 2026-09-19).
 *
 * 로그아웃은 POST /logout(Spring 기본, Next rewrite 프록시 경유)이다. CSRF가 켜져 있어
 * 토큰이 필요하다(D-404).
 *
 * <form>이 아니라 fetch인 이유: csrf.spa()는 폼 파라미터 `_csrf`를 XOR 인코딩된 값으로
 * 해석해서, 쿠키 값을 hidden input에 넣으면 403이다. 헤더로 보내야 쿠키 원문과 비교된다.
 * 성공하면 Spring이 302를 주는데 fetch로 따라가 봐야 의미가 없으니 manual로 멈추고,
 * 직접 문서 이동을 한다 — 그래야 세션이 끊긴 상태로 화면이 새로 뜬다.
 */
export function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logout() {
    setLoggingOut(true);
    setFailed(false);
    try {
      const res = await apiFetch("/logout", { method: "POST", redirect: "manual" });
      if (res.type === "opaqueredirect" || res.ok) {
        window.location.assign("/login");
        return;
      }
    } catch {
      // 네트워크 오류·토큰 발급 실패. 아래에서 알린다.
    }
    setLoggingOut(false);
    setFailed(true);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={logout}
        disabled={loggingOut}
        className="h-12 w-full justify-center rounded-xl text-foreground/70"
      >
        <LogOut className="size-5" />
        로그아웃
      </Button>
      {failed && (
        <p className="mt-2 text-center text-sm text-destructive">
          로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요
        </p>
      )}
    </>
  );
}
