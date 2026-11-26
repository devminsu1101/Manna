import { Bookmark, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { COMMUNITY_COLORS, type CommunityColor } from "../colors";

/**
 * 공동체 목록 카드(D-3624). 왼쪽 60%는 이름 · 인원 · 고정 아이콘, 오른쪽 40%는 사진(4:3).
 * 높이는 사진 칸의 비율이 정한다. 사진이 없으면 그 색 위에 마스코트.
 *
 * `href`가 없으면 누를 수 없는 카드다 — 대문의 "카드 꾸미기" 미리보기가 그렇게 쓴다.
 */
export function CommunityCard({
  name,
  memberCount,
  color,
  coverImageUrl,
  href,
  pinned = false,
  unread = false,
  onPin,
  pinPending = false,
}: {
  name: string;
  memberCount?: number;
  color: CommunityColor;
  coverImageUrl: string | null;
  href?: string;
  pinned?: boolean;
  unread?: boolean;
  onPin?: () => void;
  pinPending?: boolean;
}) {
  const look = COMMUNITY_COLORS[color];
  const body = (
    <>
      <span className={`flex min-w-0 w-3/5 flex-col justify-between gap-2 p-4 ${look.card}`}>
        <span className="flex items-center gap-1.5">
          <span className="line-clamp-2 font-bold break-keep text-foreground">{name}</span>
          {unread && <span className="size-2 shrink-0 rounded-full bg-red-500" role="img" aria-label="새 나눔" />}
        </span>
        <span className="flex min-h-5 items-center justify-between gap-2 text-sm text-foreground/60">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            {memberCount !== undefined && (
              <>
                <Users className="size-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">멤버 </span>
                {memberCount}
                <span className="sr-only">명</span>
              </>
            )}
          </span>

        </span>
      </span>
      <span className={`relative aspect-[4/3] w-2/5 shrink-0 ${look.dot}`}>
        <Image
          src={coverImageUrl ?? "/mascot/together.png"}
          alt=""
          fill
          sizes="40vw"
          className={coverImageUrl ? "object-cover" : "object-contain p-3"}
        />
      </span>
    </>
  );

  return (
    <div className="relative">
      {href ? (
        <Link href={href} prefetch={false} className="flex overflow-hidden rounded-2xl transition-opacity hover:opacity-90">
          {body}
        </Link>
      ) : (
        <div className="flex overflow-hidden rounded-2xl">{body}</div>
      )}
      {onPin && (
        <button
          type="button"
          onClick={onPin}
          disabled={pinPending}
          aria-pressed={pinned}
          aria-label={`${name} ${pinned ? "고정 해제" : "상단 고정"}`}
          title={pinned ? "고정 해제" : "상단 고정"}
          className={`absolute right-1 top-1 flex size-11 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${pinned ? "text-[#ffcc00]" : "text-foreground/40 hover:text-foreground"}`}
        >
          <Bookmark className={`size-5 ${pinned ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
