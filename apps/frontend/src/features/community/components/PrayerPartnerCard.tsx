import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { PrayerPartner } from "../types";
import { CommunitySection, EmptyRow, ROW_CLASS } from "./CommunitySection";

/**
 * 이주의 기도마니또 (D-1003).
 *
 * 카드 하나가 하는 일은 두 가지뿐이다 — **누구인지 알려 주고, 그 사람에게 기도하러 보낸다.**
 * 마이페이지 프로필처럼 사진 · 이름 한 줄이고, 누르면 중보기도실에서 그 사람이 골라진 채로 열린다(D-3622).
 * 기도제목이 없어도 보낸다 — 기도실에서 기도는 할 수 있다(D-903).
 *
 * 이 방에서 내가 맡은 사람이다(D-3601). 리더가 시작하기 전(D-3602)에는
 * **배정 전 상태가 정상적으로 존재한다.** 그때 빈 카드를 두면 "고장 났나" 싶으므로 왜 비어 있는지를 적는다.
 */
export function PrayerPartnerCard({ partner }: { partner: PrayerPartner | null }) {
  return (
    <CommunitySection icon="/mascot/warm.png" title="이주의 기도마니또" surface="love">
      {partner === null ? (
        <EmptyRow>이번 주 기도마니또는 아직 정해지지 않았어요</EmptyRow>
      ) : (
        <Link
          href={`/prayer?u=${partner.userId}`}
          className={`${ROW_CLASS} transition-colors hover:bg-white/60`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <Image
              src={partner.profileImageUrl ?? "/mascot/default.png"}
              alt=""
              width={48}
              height={48}
              className={`size-12 shrink-0 rounded-full ring-2 ring-partner ${partner.profileImageUrl ? "object-cover" : "object-contain"}`}
            />
            <span className="truncate font-bold text-foreground">{partner.name}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-foreground/40" />
        </Link>
      )}
    </CommunitySection>
  );
}
