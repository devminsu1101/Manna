import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { PraySummary } from "../types";

const ROW = "mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3";

/**
 * 홈 첫 섹션("사랑으로 나누세요") 안의 두 줄. 각각 독립이고, 둘 다 사라질 수 있다.
 *
 * ⚠️ **"0명이 기도했어요"를 절대 쓰지 않는다** (D-1705). 어제 기준이라 가입 첫날은 반드시
 * 0인데, 0은 틀린 숫자가 아니라 "어제의 기도로 오늘을 산다"가 아직 성립하지 않는 상태다.
 * 게다가 이 앱을 쓰는 사람들의 기도만 세는 숫자라 0이 "아무도 기도하지 않았다"를 뜻하지도
 * 않는다. 없는 문장을 0으로 우겨 넣으면 따뜻하지 않고 상처가 된다.
 *
 * 그래서 0인 날은 **주는 쪽으로 방향을 돌린다.** 받은 것이 없을 때 그게 0을 깨는 유일한
 * 경로이기도 하다. 랜덤 문구는 반려됐다 — 매일 여는 같은 자리의 문구가 매번 바뀌면 숫자가
 * 뜰 때 그 자리가 쌓아 둔 신뢰가 깎인다.
 */
export function PraySummaryRows({ summary }: { summary: PraySummary }) {
  const { yesterdayCount, partner, partnerTotal } = summary;

  return (
    <>
      {yesterdayCount > 0 ? (
        <Link href="/prayer" className={ROW}>
          <span>
            <span className="block font-bold text-foreground">
              날 위해 <span className="text-accent">{yesterdayCount}명</span>이 기도했어요
            </span>
            {/* 누가 기도했는지는 보여주지 않는다(D-902). 실명이 더 따뜻하지만 동시에
                "나는 저 사람을 위해 기도 안 했는데"라는 부채감을 만든다. */}
            <span className="block text-sm text-foreground/60">나의 기도가 필요한 곳이 있어요</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-foreground/40" />
        </Link>
      ) : (
        <Link href="/prayer" className={ROW}>
          <span className="font-bold text-foreground">나의 기도가 필요한 곳이 있어요</span>
          <ChevronRight className="size-5 shrink-0 text-foreground/40" />
        </Link>
      )}

      {/* `partnerTotal === 0`은 **기도짝이 아예 없는 것**이다 — 배정 스케줄러가 Phase 3라
          지금은 늘 이 경로고, 줄을 통째로 숨긴다.
          `partner === null`인데 total이 있으면 **짝 모두를 위해 이미 기도한 것**이다.
          둘은 다른 상태라 한 필드로 합치면 안 된다. */}
      {partnerTotal > 0 &&
        (partner ? (
          <Link href="/prayer" className={ROW}>
            <span>
              <span className="block font-bold text-foreground">
                이번주 기도짝은 <span className="text-secondary">{partner.name}</span>님이에요
              </span>
              <span className="block text-sm text-foreground/60">{partner.communityName}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-foreground/40" />
          </Link>
        ) : (
          <p className={`${ROW} justify-center text-sm text-foreground/60`}>
            이번주 기도짝 모두를 위해 기도했어요
          </p>
        ))}
    </>
  );
}
