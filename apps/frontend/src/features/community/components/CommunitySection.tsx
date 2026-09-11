import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * 대문의 파스텔 카드 한 구역. 기도짝 · 나눔 자료실 · 멤버 목록이 같은 틀을 쓴다.
 *
 * 시안(`Community Page.png`)에서 세 구역은 배경색과 우측 버튼만 다르고 나머지가 같다 —
 * 마스코트 + 제목 + 우측 액션, 그 아래 흰 줄들. 그 공통 골격만 여기 둔다.
 *
 * 색은 홈과 같은 도메인 배분을 따른다
 * (globals.css: love=기도, warm=공동체·나눔, cool=말씀).
 */
export function CommunitySection({
  icon,
  title,
  surface,
  action,
  children,
}: {
  icon: string;
  title: string;
  surface: "love" | "warm" | "cool";
  /** 헤더 오른쪽 버튼. 없으면 제목만 놓인다. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl p-4",
        surface === "love" && "bg-surface-love",
        surface === "warm" && "bg-surface-warm",
        surface === "cool" && "bg-surface-cool",
      )}
    >
      <div className="flex items-center gap-2">
        <Image src={icon} alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
        {/* 대문의 h1은 상단바의 방 이름이다. 구역 제목은 그 아래 단계라 h2. */}
        <h2 className="min-w-0 flex-1 truncate text-lg font-bold text-foreground">{title}</h2>
        {action}
      </div>

      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

/** 파스텔 카드 위에 얹는 흰 줄. 구역마다 링크가 되기도 하고 안 되기도 해서 배경만 뗀다. */
export const ROW_CLASS = "flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3";

/** 아직 채울 것이 없는 구역에 넣는 한 줄. 홈의 `ComingSoon`과 같은 톤. */
export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-white/60 px-4 py-6 text-center text-sm text-foreground/50">
      {children}
    </p>
  );
}
