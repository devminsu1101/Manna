"use client";

import { LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useMe } from "./useMe";

/**
 * 마이페이지 본문. 로그인 상태에 따라 셋으로 갈린다.
 *
 * 페이지가 아니라 이 조각만 클라이언트인 이유는 ProfileButton과 같다 — 세션 판정을
 * `/api/v1/me` fetch로 하고, 그 쿠키는 브라우저가 알아서 싣는다.
 *
 * 지금 여기 있는 것은 **로그아웃 하나뿐이다.** 상단바에서 옮겨 온 것이라 그렇다
 * (사용자 결정, 2026-09-19). 프로필 수정 · 알림 설정 · 내 기도제목 바로가기 같은 것은
 * 그 도메인이 붙을 때 이 아래로 줄을 늘리면 된다.
 */
export function MyPageContent() {
  const { me, loading } = useMe();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);

  /*
    로그아웃은 POST /logout(Spring 기본, Next rewrite 프록시 경유)이다. CSRF가 켜져 있어
    토큰이 필요하다(D-404).

    <form>이 아니라 fetch인 이유: csrf.spa()는 폼 파라미터 `_csrf`를 XOR 인코딩된 값으로
    해석해서, 쿠키 값을 hidden input에 넣으면 403이다. 헤더로 보내야 쿠키 원문과 비교된다.
    성공하면 Spring이 302를 주는데 fetch로 따라가 봐야 의미가 없으니 manual로 멈추고,
    직접 문서 이동을 한다 — 그래야 세션이 끊긴 상태로 화면이 새로 뜬다.
  */
  async function logout() {
    setLoggingOut(true);
    setLogoutFailed(false);
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
    setLogoutFailed(true);
  }

  // 판정 전. 글자를 먼저 그렸다가 바꾸면 "로그인 → 이름"으로 깜빡인다.
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8" aria-busy="true">
        <div className="size-20 animate-pulse rounded-full bg-foreground/10" />
        <div className="h-5 w-24 animate-pulse rounded bg-foreground/10" />
      </div>
    );
  }

  // 미로그인. 주소를 직접 쳐서 닿을 수 있는 자리라 막다른 곳이 되면 안 된다.
  if (!me) {
    return (
      <section className="rounded-2xl bg-surface-warm p-6 text-center">
        <p className="font-bold text-foreground">아직 로그인하지 않았어요</p>
        <p className="mt-1 text-sm text-foreground/60">
          로그인하면 기도제목을 올리고 공동체에 참여할 수 있어요
        </p>
        <Button asChild className="mt-4 h-12 w-full rounded-xl">
          <Link href="/login">로그인하러 가기</Link>
        </Button>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col items-center gap-3 rounded-2xl bg-surface-warm p-6">
        {me.profileImageUrl ? (
          <Image
            src={me.profileImageUrl}
            alt=""
            width={80}
            height={80}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-white">
            <User className="size-10 text-foreground/40" />
          </span>
        )}
        <p className="max-w-full truncate text-lg font-bold text-foreground">{me.name}</p>
      </section>

      <Button
        type="button"
        variant="ghost"
        onClick={logout}
        disabled={loggingOut}
        className="mt-4 h-12 w-full justify-center rounded-xl text-foreground/70"
      >
        <LogOut className="size-5" />
        로그아웃
      </Button>
      {logoutFailed && (
        <p className="mt-2 text-center text-sm text-destructive">
          로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요
        </p>
      )}
    </>
  );
}
