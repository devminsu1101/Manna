"use client";

import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useMe } from "./useMe";

/**
 * 하단 탭 "마이". 다른 탭은 마스코트인데 이것만 **내 프로필 사진**이다(사용자 결정, 2026-10-24).
 * 로그인 상태를 세션으로 판정해야 해서 클라이언트로 뗐다(`useMe`).
 * 사진이 없거나 판정 전이거나 미로그인이면 빈 사람 아이콘. 미로그인도 `/mypage`가 로그인으로 안내한다.
 */
export function MyTab() {
  const { me } = useMe();

  return (
    <Link href="/mypage" className="flex w-16 flex-col items-center gap-1">
      {me?.profileImageUrl ? (
        <Image
          src={me.profileImageUrl}
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full bg-foreground/5">
          <User className="size-5 text-foreground/60" />
        </span>
      )}
      <span className="text-xs font-medium text-foreground">마이</span>
    </Link>
  );
}
