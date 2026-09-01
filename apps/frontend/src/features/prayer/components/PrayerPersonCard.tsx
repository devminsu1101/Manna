import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { PrayPerson } from "../types";

/**
 * 중보기도실의 사람 카드 한 장. 눌러서 상세(`/prayer/{userId}`)로 간다.
 *
 * **기도제목을 카드에 보여주지 않는다** (D-1905, 사용자 결정). 사진 · 이름 · 공동체 · 체크가
 * 전부고, 본문도 "○일 전"도 "아직 기도제목이 없어요"도 없다 — 들어가야 보인다. 목록은
 * **누구를 위해 기도할지 고르는 자리**지 읽는 자리가 아니라는 판단이다.
 *
 * 그래서 카드가 `PrayPerson`에서 쓰는 것은 `request`를 **뺀 나머지**다. 타입에는 그대로
 * 남는다 — 상세가 같은 응답을 쓴다(API_SPEC: "목록의 항목 하나와 같은 모양").
 *
 * 머리줄은 **사진 · (이름+공동체) · 체크** 세 칸이다. 가운데 칸만 줄어들어(`min-w-0 flex-1`)
 * 이름이 길어져도 사진과 체크를 밀어내지 않는다.
 *
 * `MemberList`의 `MemberName`을 쓰지 않는 이유가 여기 있다 — 그건 사진과 이름을 **한 줄로
 * 붙여** 놓는 조각이라, 그걸 쓰면 사진이 "이름+공동체" 덩어리 안으로 들어가 버린다.
 * 두 화면이 사람을 다르게 그리므로 각자 그린다.
 *
 * 기도제목이 없는 사람도 카드는 그려지고 기도도 눌린다 (D-903) — 카드에 그 사실을 적지
 * 않을 뿐이다. D-1703 정렬("적게 받은 사람 먼저")이 그런 사람을 오히려 위로 올려보낸다.
 */
export function PrayerPersonCard({ person }: { person: PrayPerson }) {
  const { userId, name, profileImageUrl, communities, prayedByMeToday } = person;

  return (
    <Link
      href={`/prayer/${userId}`}
      className="block rounded-xl bg-white px-4 py-3 transition-colors hover:bg-white/60"
    >
      <span className="flex items-center gap-3">
        {/* 프로필 사진. `users.profile_image_url`이 채워지기 전까지 마스코트로 떨어진다. */}
        <Image
          src={profileImageUrl ?? "/mascot/default.png"}
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-full object-contain"
        />

        {/* 이름과 공동체를 한 덩어리로 묶는다. 여러 방에 걸친 사람도 카드는 하나고
            꼬리표만 늘어난다 (D-905). */}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-bold text-foreground">{name}</span>
          <span className="truncate text-xs text-foreground/50">
            {communities.map((c) => c.name).join(" · ")}
          </span>
        </span>

        {/* 오늘 이미 기도한 사람은 채워진 체크, 아직인 사람은 옅은 체크.
            누가 기도했는지는 어디에도 안 쓰지만(D-902), 내가 했는지는 나에게 보여야
            다음 사람으로 넘어갈 수 있다. */}
        {prayedByMeToday ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent/50 px-1 py-1 text-xs font-bold text-accent-foreground">
            <Check className="size-3.5" />
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1 rounded-full px-1 py-1 text-xs font-bold text-accent/50">
            <Check className="size-3.5" />
          </span>
        )}
      </span> 
    </Link>
  );
}
