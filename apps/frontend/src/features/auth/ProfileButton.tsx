"use client";

import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useMe } from "./useMe";

/**
 * 상단바 우측. 로그인 상태를 보여준다.
 *  - 로그인: 프로필 이미지만. 누르면 마이페이지(`/mypage`)
 *  - 미로그인: "로그인" 링크(→ /login)
 *  - 판정 전(loading): 빈 프로필 아이콘
 *
 * **이름과 로그아웃을 여기서 뺐다**(사용자 결정, 2026-09-19). 상단바 한 칸에 이름·로그아웃이
 * 같이 있으면 방 이름이 긴 대문에서 가운데 제목을 밀어내고, 로그아웃이 늘 한 번 누르면
 * 닿는 자리에 있는 것도 위험하다. 둘 다 마이페이지로 옮겼다 — 그래서 이 버튼은 상태를
 * *보여주는* 일과 거기로 *데려가는* 일만 한다.
 *
 * 이미지가 없을 수 있다(`profileImageUrl`은 nullable). Google은 늘 주지만 provider가 늘면
 * (카카오 D-1702) 빈 경우가 생기므로 기본 아이콘으로 떨어진다.
 */
export function ProfileButton() {
  const { me, loading } = useMe();

  if (loading) {
    return (
      <Button variant="ghost" size="icon-lg" aria-label="내 프로필" disabled>
        <User className="size-6" />
      </Button>
    );
  }

  if (!me) {
    return (
      <Button asChild variant="ghost" className="font-medium">
        <Link href="/login">로그인</Link>
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" size="icon-lg" aria-label="마이페이지" className="shrink-0">
      <Link href="/mypage">
        {me.profileImageUrl ? (
          // alt가 빈 문자열인 이유: 옆의 aria-label이 이미 이 버튼을 설명한다. 이름을 넣으면
          // 스크린리더가 "만수 마이페이지"처럼 두 번 읽는다.
          <Image
            src={me.profileImageUrl}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <User className="size-6" />
        )}
      </Link>
    </Button>
  );
}
