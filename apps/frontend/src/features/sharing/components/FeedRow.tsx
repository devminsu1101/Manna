import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { FeedItem } from "../types";

/**
 * 홈 "지금 공동체에서는" 한 줄(D-3604). 시안 `Main Page.png`의 "○○님이 나눔을 남겼어요".
 * 이름이 이 줄의 주어라 색을 입히고, 아래에 본문 첫 줄을 붙인다.
 */
export function FeedRow({ item }: { item: FeedItem }) {
  return (
    <Link
      href={`/sharings/${item.id}`}
      className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 transition-colors hover:bg-white/60"
    >
      <span className="min-w-0">
        <span className="block truncate font-bold text-foreground">
          <span className="text-secondary">{item.name}</span>님이 나눔을 남겼어요
        </span>
        <span className="block truncate text-sm text-foreground/60">{item.firstLine}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-foreground/40" />
    </Link>
  );
}
