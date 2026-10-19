import { EmptyRow } from "@/features/community/components/CommunitySection";
import { cn } from "@/lib/utils";

import type { MyPrayerRequest } from "../types";

/**
 * 마이페이지의 이전 기도제목(D-3609). 옛 `/prayer/requests` 화면을 여기로 합쳤다.
 *
 * **고치지도 지우지도 않는다** — append-only라서다(D-1706). 새로 쓰면 그게 맨 위로 와서 "지금"이
 * 되고, 남들에게 보이는 것은 그 한 건뿐이다(조회 규칙이 최신 하나). 화면이 그 사실을 직접
 * 말해 주지 않으면 아래 것들도 보이는 줄 안다.
 *
 * 공개/비공개는 **태그로만** 보여 준다. 이력은 연대기 목록이라 "○일 전"보다 절대 날짜가 맞다 —
 * 서버가 `+09:00`으로 주므로 앞 10자가 곧 KST 날짜다(D-3402).
 */
export function MyPrayerHistory({ requests }: { requests: MyPrayerRequest[] }) {
  if (requests.length === 0) return <EmptyRow>아직 올린 기도제목이 없어요</EmptyRow>;

  return (
    <ul className="space-y-2">
      {requests.map((request, index) => (
        <li key={request.id} className="rounded-xl bg-white px-4 py-3">
          <div className="flex items-center gap-1.5">
            {index === 0 && <Tag className="bg-accent text-accent-foreground">지금</Tag>}
            <Tag className="bg-foreground/5 text-foreground/60">
              {request.visibility === "public" ? "공개" : "비공개"}
            </Tag>
            <span className="ml-auto text-xs text-foreground/40">{request.createdAt.slice(0, 10)}</span>
          </div>
          <p
            className={cn(
              "mt-2 whitespace-pre-line text-sm leading-relaxed",
              index === 0 ? "text-foreground" : "text-foreground/60",
            )}
          >
            {request.body}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", className)}>{children}</span>;
}
