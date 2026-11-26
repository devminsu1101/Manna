import { SharingCounts } from "./SharingCounts";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { ROW_CLASS } from "@/features/community/components/CommunitySection";
import { sharingHref, type Sharing } from "../types";

/**
 * 나눔 목록 한 줄 — 대문 자료실과 `/communities/{id}/sharings`가 같이 쓴다.
 * 제목 컬럼이 없어(`sharings`에 title 없음) 본문 첫 줄을 제목처럼 쓴다.
 */
export function SharingRow({ sharing }: { sharing: Sharing }) {
  const firstLine = sharing.body.split("\n", 1)[0];

  return (
    <div className={ROW_CLASS}>
      <div className="min-w-0 flex-1">
        <Link href={sharingHref(sharing)} className="block">
          <span className="block truncate text-foreground">{firstLine}</span>
          <span className="block text-xs text-foreground/50">
            {sharing.author.name} · {sharing.createdAt.slice(0, 10)}
          </span>
        </Link>
        <SharingCounts key={`${sharing.reactionCount}:${sharing.hearted}`} sharing={sharing} />
      </div>
      <Link href={sharingHref(sharing)} aria-label="나눔 보기" className="flex min-h-11 min-w-11 items-center justify-center">
        <ChevronRight className="size-5 shrink-0 text-foreground/40" />
      </Link>
    </div>
  );
}
