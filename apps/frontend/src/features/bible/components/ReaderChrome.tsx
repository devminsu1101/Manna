"use client";

import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { useWakeLock } from "@/hooks/useWakeLock";
import { cn } from "@/lib/utils";
import { CopyVerseButton } from "./CopyVerseButton";

/**
 * 읽는 동안 화면을 꽉 쓰도록 하단 크롬을 관리한다.
 *
 * nav은 서버 컴포넌트라 노드 슬롯으로 받는다 — 클라이언트 컴포넌트는 서버 컴포넌트에
 * 동적 prop을 넘길 수 없으므로, 움직이는 transform은 이쪽 래퍼가 소유해야 한다.
 *
 * 상단 헤더는 여기서 다루지 않는다. 숨지 않으므로 스크롤 상태를 알 필요가 없고,
 * 자기 sticky를 자기가 갖는다. 여기 있는 건 하단 크롬뿐이다.
 */
export function ReaderChrome({ nav }: { nav: React.ReactNode }) {
  const hidden = useHideOnScroll();

  // 크롬과 상관없는 관심사지만 여기가 맞는 자리다. 화면 꺼짐 방지는 "리더에 있는 동안"만
  // 유효해야 하는데, 리더와 생명주기가 정확히 같은 클라이언트 컴포넌트가 이것뿐이다.
  // 이것만을 위해 빈 컴포넌트를 하나 더 만들어 페이지에 꽂는 건 과하다.
  useWakeLock();

  return (
    <>
      <CopyVerseButton navHidden={hidden} />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 transition-transform duration-200",
          hidden && "translate-y-full",
        )}
      >
        {nav}
      </div>
    </>
  );
}
