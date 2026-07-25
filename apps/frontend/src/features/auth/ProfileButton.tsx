"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useMe } from "./useMe";

/**
 * 상단바 우측. 로그인 상태를 보여준다.
 *  - 로그인: 이름 + 로그아웃
 *  - 미로그인: "로그인" 링크(→ /login)
 *  - 판정 전(loading): 빈 프로필 아이콘
 *
 * 로그아웃은 form POST /logout(Spring 기본, 프록시 경유). CSRF는 MVP에서 꺼둔 상태라
 * 토큰 없이 동작한다(SecurityConfig의 TODO 참고).
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
    <div className="flex items-center gap-1">
      <span className="max-w-24 truncate text-sm font-medium text-foreground">{me.name}</span>
      <form action="/logout" method="post">
        <Button type="submit" variant="ghost" size="icon-lg" aria-label="로그아웃">
          <LogOut className="size-5" />
        </Button>
      </form>
    </div>
  );
}
