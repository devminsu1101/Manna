import { Bell } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ProfileButton } from "@/features/auth/ProfileButton";
import { DocsButton } from "@/features/devdocs/DocsButton";
import { cn } from "@/lib/utils";

/**
 * 화면의 도메인 색. globals.css의 배분을 그대로 따른다 — warm=공동체·홈, cool=말씀, love=기도.
 *
 * ⚠️ **라우트 세그먼트의 `themeColor`와 반드시 짝이어야 한다**(lib/brand.ts의 SURFACE_COLOR,
 * app/prayer/layout.tsx 등). 상태바(시계·배터리 뒤)는 CSS가 아니라 그 meta가 칠하므로,
 * 한쪽만 바꾸면 상단바와 상태바 사이에 색 경계선이 생긴다.
 */
const TONE = {
  warm: "bg-surface-warm",
  cool: "bg-surface-cool",
  love: "bg-surface-love",
} as const;

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
  /** 화면의 도메인 색. 라우트의 themeColor와 같은 값이라야 한다(TONE 주석 참고). */
  tone = "warm",
}: {
  title?: string;
  icon?: string;
  tone?: keyof typeof TONE;
} = {}) {
  return (
    // sticky가 없다. 이 바는 AppShell의 스크롤러 **바깥**에 있어서 처음부터 움직이지 않는다
    // — sticky가 하던 일을 셸이 구조로 한다. iOS 고무줄에 같이 끌려 내려가지 않는 것도
    // 그래서다(sticky로는 그게 안 됐다).
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3",
        TONE[tone],
      )}
    >
      {/* 벨 옆 문서 아이콘은 개발자 계정에만 뜬다(DocsButton). 아니면 자리도 없다. */}
      <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon-lg" className="relative shrink-0" aria-label="알림">
          <Bell className="size-6" />
          {/* TODO(알림 도메인): 안 읽은 알림 여부를 실제 데이터에 연결. 지금은 항상 표시. */}
          <span
            className="absolute end-1.5 top-1.5 size-2 rounded-full bg-accent"
            aria-label="읽지 않은 알림 있음"
          />
        </Button>
        <DocsButton />
      </div>

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
