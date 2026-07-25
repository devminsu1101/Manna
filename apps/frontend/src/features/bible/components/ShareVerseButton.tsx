"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVerseSelectionStore } from "./VerseSelectionProvider";

/**
 * 절을 하나 이상 선택했을 때만 뜨는 나눔 버튼.
 *
 * 네비가 숨으면 함께 내려온다. 방금 절을 골랐으니 계속 보여야 한다.
 * bottom-4(16px) + -translate-y-16(64px) = 80px — 네비가 보일 때의 위치.
 */
export function ShareVerseButton({ navHidden }: { navHidden: boolean }) {
  const store = useVerseSelectionStore();
  const count = useSyncExternalStore(
    store.subscribe,
    () => store.size(),
    () => 0,
  );

  if (count === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4",
        "transition-transform duration-200",
        !navHidden && "-translate-y-16",
      )}
    >
      <Button
        variant="secondary"
        size="lg"
        // TODO: 나눔 작성 화면으로 연결 (로드맵 Phase 2)
        className="pointer-events-auto h-12 rounded-full px-8 text-base font-bold shadow-lg"
      >
        해당 구절 나눔하기
      </Button>
    </div>
  );
}
