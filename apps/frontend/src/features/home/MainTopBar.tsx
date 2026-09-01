import { Bell } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ProfileButton } from "@/features/auth/ProfileButton";

/**
 * 메인 화면 상단 바. 좌: 알림, 중앙: 앱 이름, 우: 프로필(로그인 상태).
 *
 * 서버 컴포넌트지만 우측 프로필만 클라이언트(ProfileButton)로 뗀다 — 세션 쿠키로 로그인
 * 상태를 판정해야 하기 때문. 알림 벨은 아직 데이터에 연결되지 않았다(알림 도메인 후속).
 *
 * 가운데 글자를 바꿀 수 있게 열어 둔 이유: 공동체 대문(`Community Page.png`)은 같은 바에
 * 앱 이름 대신 **방 이름**을 놓는다. 벨과 프로필이 똑같은 자리에 똑같이 있으므로,
 * 두 줄만 다른 컴포넌트를 하나 더 만들면 알림 배지를 실데이터로 바꿀 때 두 곳을 고치게 된다.
 */
export function MainTopBar({
  /** 가운데 제목. 이 바가 있는 화면의 h1이다. */
  title = "Manna",
  /** 제목 왼쪽 마스코트. 홈에는 없고 대문에만 있다. */
  icon,
}: {
  title?: string;
  icon?: string;
} = {}) {
  return (
    <header className="flex items-center justify-between gap-2 border-b border-border bg-muted px-4 py-3">
      <Button variant="ghost" size="icon-lg" className="relative shrink-0" aria-label="알림">
        <Bell className="size-6" />
        {/* TODO(알림 도메인): 안 읽은 알림 여부를 실제 데이터에 연결. 지금은 항상 표시. */}
        <span
          className="absolute end-1.5 top-1.5 size-2 rounded-full bg-accent"
          aria-label="읽지 않은 알림 있음"
        />
      </Button>

      {/* 방 이름은 길어질 수 있다. 벨·프로필을 밀어내지 않도록 이 가운데 칸만 줄어든다. */}
      <div className="flex min-w-0 items-center gap-2">
        {icon && (
          <Image src={icon} alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
        )}
        <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
      </div>

      <ProfileButton />
    </header>
  );
}
