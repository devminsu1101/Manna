"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MyTab } from "@/features/auth/MyTab";

/**
 * 하단 탭 네비게이션. 기도 · 나눔(현재는 공동체 목록) · 성경 · 마이.
 * 아이콘은 기존 마스코트 그림을 쓴다. 마이는 내 프로필 사진이다(MyTab).
 *
 * 위치는 호출부가 정한다. 성경 리더에서는 스크롤에 따라 숨었다 나타나야 하는데,
 * 그 transform은 클라이언트 래퍼(ReaderChrome)가 소유해야 하기 때문이다.
 */
const TABS = [
  { href: "/prayer", label: "중보기도실", icon: "/mascot/warm.png" },
  { href: "/communities", label: "공동체", icon: "/mascot/together.png" },
  { href: "/bible", label: "성경", icon: "/mascot/bible.png" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    // 아래 여백이 위보다 두껍다. 화면 맨 아래 모서리는 엄지가 닿기 나쁜 자리라 탭 영역이
    // 거기서 끝나면 안 된다. env(safe-area-inset-bottom)은 쓰지 않는다 — viewport-fit=cover가
    // 없으면 그 값이 0이라 지금보다 나빠진다.
    <nav className="flex items-center justify-around border-t border-border bg-background px-2 pt-2 pb-6">
      {TABS.map((tab) => (
        <NavTab key={tab.href} {...tab} active={isActive(tab.href, pathname)} />
      ))}
      <MyTab active={pathname.startsWith("/mypage")} />
    </nav>
  );
}

function isActive(href: string, pathname: string) {
  if (href === "/prayer") return pathname === "/" || pathname.startsWith("/prayer");
  if (href === "/communities") return pathname.startsWith("/communities") || pathname.startsWith("/sharings");
  return pathname.startsWith(href);
}

function NavTab({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className="flex w-16 flex-col items-center gap-1">
      <Image src={icon} alt="" width={40} height={40} className={`size-8 object-contain ${active ? "" : "grayscale opacity-50"}`} />
      <span className={`text-xs font-medium ${active ? "text-foreground" : "text-foreground/50"}`}>{label}</span>
      <span aria-hidden className={`h-1 w-4 rounded-full ${active ? "bg-tone" : "bg-transparent"}`} />
    </Link>
  );
}
