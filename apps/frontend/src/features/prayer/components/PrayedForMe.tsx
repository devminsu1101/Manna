import { ChevronRight } from "lucide-react";
import Link from "next/link";

const ROW = "flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3";

/**
 * 마이페이지 맨 위 한 칸 — "날 위해 n명이 기도하고 있어요". 홈을 없애며 여기로 왔다(2026-10-24).
 * 숫자는 **어제 기준**이다(D-901, `PraySummary` 주석).
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
export function PrayedForMe({ yesterdayCount }: { yesterdayCount: number }) {
  return (
    <section className="rounded-2xl bg-surface-love p-4">
      {yesterdayCount > 0 ? (
        <Link href="/prayer" className={ROW}>
          <span>
            <span className="block font-bold text-foreground">
              날 위해 <span className="text-accent">{yesterdayCount}명</span>이 기도하고 있어요.
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
    </section>
  );
}
