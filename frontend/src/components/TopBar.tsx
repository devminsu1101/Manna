"use client";

import Link from "next/link";

interface TopBarProps {
  showNotification?: boolean;
}

export default function TopBar({ showNotification = true }: TopBarProps) {
  return (
    <header className="h-[64px] flex items-end px-6 pb-3 bg-white">
      <div className="flex-1 flex items-center justify-between">
        <div className="relative">
          <button className="text-xl">🔔</button>
          {showNotification && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#f44070] rounded-full" />
          )}
        </div>
        <span className="text-base font-bold text-[#1a1a1a]">Manna</span>
        <Link href="/profile">
          <div className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center text-sm">
            👤
          </div>
        </Link>
      </div>
    </header>
  );
}
