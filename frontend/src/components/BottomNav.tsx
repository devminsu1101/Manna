"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home", label: "홈", icon: "🏠" },
  { href: "/bible", label: "성경", icon: "📖" },
  { href: "/share", label: "나눔", icon: "🌸", center: true },
  { href: "/community", label: "공동체", icon: "👥" },
  { href: "/pray", label: "기도", icon: "🙏" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 bg-white border-t border-[#eeeeee] flex items-center justify-around h-[72px] px-2 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        if (item.center) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 -mt-5"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-colors ${
                  isActive ? "bg-[#f44070]" : "bg-[#f44070]"
                }`}
              >
                {item.icon}
              </div>
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 flex-1"
          >
            <span className={`text-xl ${isActive ? "opacity-100" : "opacity-40"}`}>
              {item.icon}
            </span>
            <span
              className={`text-[10px] font-medium ${
                isActive ? "text-[#f44070]" : "text-[#aaaaaa]"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
