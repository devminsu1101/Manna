import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileButton } from "@/features/auth/ProfileButton";

/**
 * 메인 화면 상단 바. 좌: 알림, 중앙: 앱 이름, 우: 프로필(로그인 상태).
 *
 * 서버 컴포넌트지만 우측 프로필만 클라이언트(ProfileButton)로 뗀다 — 세션 쿠키로 로그인
 * 상태를 판정해야 하기 때문. 알림 벨은 아직 데이터에 연결되지 않았다(알림 도메인 후속).
 */
export function MainTopBar() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
      <Button variant="ghost" size="icon-lg" className="relative" aria-label="알림">
        <Bell className="size-6" />
        {/* TODO(알림 도메인): 안 읽은 알림 여부를 실제 데이터에 연결. 지금은 항상 표시. */}
        <span
          className="absolute end-1.5 top-1.5 size-2 rounded-full bg-accent"
          aria-label="읽지 않은 알림 있음"
        />
      </Button>

      <h1 className="text-lg font-bold text-foreground">Manna</h1>

      <ProfileButton />
    </header>
  );
}
