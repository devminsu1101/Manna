import Link from "next/link";

import type { PrayerPartner } from "../types";
import { CommunitySection, EmptyRow, ROW_CLASS } from "./CommunitySection";

/**
 * 이주의 기도짝 (D-1003).
 *
 * 카드 하나가 하는 일은 두 가지뿐이다 — **누구인지 알려 주고, 그 사람 기도제목으로 보낸다.**
 * 시안의 `...`(관리) 버튼은 아직 걸 동작이 없어 두지 않았다.
 *
 * 배정은 주간 스케줄러(`prayer_partners`, Phase 3)의 몫이라 **배정 전 상태가 정상적으로
 * 존재한다.** 그때 빈 카드를 두면 "고장 났나" 싶으므로 왜 비어 있는지를 적는다.
 */
export function PrayerPartnerCard({ partner }: { partner: PrayerPartner | null }) {
  return (
    <CommunitySection icon="/mascot/warm.png" title="이주의 기도짝" surface="love">
      {partner === null ? (
        <EmptyRow>이번 주 기도짝은 아직 정해지지 않았어요</EmptyRow>
      ) : (
        <>
          {/* 이름은 제목 옆 배지가 아니라 줄 안에 둔다. 시안은 옆에 붙였지만 이름이 길어지면
              제목을 밀어낸다. 여기서는 이름이 곧 이 카드의 내용이라 자리를 넉넉히 준다. */}
          <div className={ROW_CLASS}>
            <span className="min-w-0 truncate font-bold text-foreground">{partner.name}</span>
            {/* <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
              이번 주
            </span> */}
          </div>

          {partner.hasRequest ? (
            // TODO(기도 도메인): 그 사람 기도제목 상세(`/prayer/{userId}`)로. 지금은 그
            // 라우트가 없어 404가 되므로 탭의 "준비 중" 화면으로 보낸다 — 여기서
            // 막다른 곳에 갇히지 않게 하는 것이 ComingSoonScreen을 둔 이유였다.
            <Link
              href="/prayer"
              className={`${ROW_CLASS} justify-center font-bold text-foreground/50 transition-colors hover:bg-white/60`}
            >
              기도제목 보기
            </Link>
          ) : (
            // 기도짝이 정해져도 그 사람이 아직 안 썼을 수 있다. 눌러서 빈 화면에
            // 떨어지느니 여기서 말해 주는 편이 낫다.
            <EmptyRow>{partner.name}님이 아직 기도제목을 올리지 않았어요</EmptyRow>
          )}
        </>
      )}
    </CommunitySection>
  );
}
