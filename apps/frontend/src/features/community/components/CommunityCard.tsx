import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { COMMUNITY_COLORS, type CommunityColor } from "../colors";

/**
 * 공동체 목록 카드(D-3624). 왼쪽 60%는 리더가 고른 색 위에 이름 · 인원, 오른쪽 40%는 리더가 올린 사진(4:3).
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
      <span className={`flex w-3/5 flex-col justify-between gap-2 p-4 ${look.card}`}>
        <span className="line-clamp-2 font-bold break-keep text-foreground">{name}</span>
        <span className="flex items-center text-sm text-foreground/60">
          {memberCount}명
          {href && <ChevronRight className="ml-0.5 size-4" />}
        </span>
      </span>
      <span className={`relative aspect-[4/3] w-2/5 ${look.dot}`}>
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
