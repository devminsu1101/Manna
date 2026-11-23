import { Settings, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { COMMUNITY_COLORS, type CommunityColor } from "../colors";

/**
 * 공동체 목록 카드(D-3624). 왼쪽 40%는 사진(4:3), 오른쪽 60%는 이름 · 인원 · 관리 아이콘.
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
}: {
  name: string;
  memberCount?: number;
  color: CommunityColor;
  coverImageUrl: string | null;
  href?: string;
}) {
  const look = COMMUNITY_COLORS[color];
  const body = (
    <>
      <span className={`flex min-w-0 w-3/5 flex-col justify-between gap-2 p-4 ${look.card}`}>
        <span className="line-clamp-2 font-bold break-keep text-foreground">{name}</span>
        <span className="flex items-center justify-between gap-2 text-sm text-foreground/60">
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
          {/* 배치 시안. 개별 동작 연결 시 카드 링크와 분리한다. */}
          {/* <span className="flex shrink-0 items-center gap-3" aria-hidden="true">
            <UserPlus className="size-4" />
            <Settings className="size-4" />
          </span> */}
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

  return href ? (
    <Link href={href} className="flex overflow-hidden rounded-2xl transition-opacity hover:opacity-90">
      {body}
    </Link>
  ) : (
    <div className="flex overflow-hidden rounded-2xl">{body}</div>
  );
}
