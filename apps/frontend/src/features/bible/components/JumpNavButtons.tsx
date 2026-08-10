"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  goBack,
  goForward,
  type JumpTarget,
  jumpNav,
  NO_JUMP_NAV,
  subscribeJumps,
} from "../jump-history";
import { useVerseSelectionStore } from "./VerseSelectionProvider";

/**
 * 좌하단 "← 시편 15장" / 우하단 "마태복음 19장 →".
 * 시트로 다른 장에 건너간 적이 있을 때, 그 방향으로 갈 곳이 있을 때만 각각 뜬다.
 *
 * `router.back()`/`forward()`가 아니다. 리더는 스크롤할 때마다 `replaceState`로 주소를
 * 갈아치우므로 히스토리 항목이 곧 "읽던 자리"가 아니고, 무엇보다 **히스토리는 읽을 수가 없어**
 * 라벨에 목적지를 쓸 수도, 갈 곳이 있는지 판단할 수도 없다. 홈 화면에 추가해 쓰면(standalone)
 * 브라우저 뒤로가기 버튼 자체가 없다는 게 이 버튼들이 필요한 애초 이유이기도 하다.
 *
 * 스크롤 위치는 복원하지 않는다. 무한 피드 한가운데로 되돌리는 건 방금 닫은 스크롤 튐
 * (D-1101~1105)과 같은 지뢰밭이고, 장 머리로 보내는 것만으로 "시편 15장으로 갔다"는 목적은
 * 충족된다.
 */
export function JumpNavButtons({ navHidden }: { navHidden: boolean }) {
  const router = useRouter();
  // 서버에서는 그리지 않는다 — sessionStorage는 클라이언트에만 있다.
  const nav = useSyncExternalStore(subscribeJumps, jumpNav, () => NO_JUMP_NAV);

  // 절을 고르는 중에는 둘 다 숨는다. 좁은 화면에서 가운데 복사 버튼과 가로로 부딪히고,
  // 무엇보다 고르는 중은 이동하는 중이 아니다.
  const selection = useVerseSelectionStore();
  const selectedCount = useSyncExternalStore(selection.subscribe, selection.size, () => 0);
  if (selectedCount > 0) return null;

  const move = (step: () => JumpTarget | null) => () => {
    const to = step();
    if (to) router.push(to.path);
  };

  return (
    <>
      {nav.back && (
        <JumpButton
          target={nav.back}
          direction="back"
          navHidden={navHidden}
          onClick={move(goBack)}
        />
      )}
      {nav.forward && (
        <JumpButton
          target={nav.forward}
          direction="forward"
          navHidden={navHidden}
          onClick={move(goForward)}
        />
      )}
    </>
  );
}

function JumpButton({
  target,
  direction,
  navHidden,
  onClick,
}: {
  target: JumpTarget;
  direction: "back" | "forward";
  navHidden: boolean;
  onClick: () => void;
}) {
  const back = direction === "back";
  const Chevron = back ? ChevronLeft : ChevronRight;
  const label = `${target.bookName} ${target.chapterNum}장`;

  return (
    // 복사 버튼과 같은 리듬으로 움직인다. bottom-4(16px) + -translate-y-16(64px) = 80px —
    // 네비가 보일 때의 위치. 따로 놀면 하단이 어수선해진다.
    <div
      className={cn(
        "fixed bottom-4 z-40 transition-transform duration-200",
        back ? "start-4" : "end-4",
        !navHidden && "-translate-y-16",
      )}
    >
      {/* 흰 배경 + 청록 테두리. 복사 버튼(채운 청록)이 주 동작이고 이건 보조라,
          선택 해제 버튼과 같은 단계로 뺀다. 두 버튼은 방향만 다르고 생김새는 같다. */}
      <Button
        variant="outline"
        onClick={onClick}
        aria-label={`${label}${back ? "으로 돌아가기" : "으로 다시 가기"}`}
        className={cn(
          "h-10 gap-1 rounded-full ps-3 pe-4 shadow-lg",
          "border-1 border-secondary text-secondary",
          "hover:bg-secondary hover:text-white",
        )}
      >
        {back && <Chevron className="size-4" />}
        <span className="text-sm font-bold">{label}</span>
        {!back && <Chevron className="size-4" />}
      </Button>
    </div>
  );
}
