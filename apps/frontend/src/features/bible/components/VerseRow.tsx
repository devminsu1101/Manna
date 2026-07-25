"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";
import type { VerseId } from "../verse-id";
import { useVerseSelectionStore } from "./VerseSelectionProvider";

/** 절 한 줄. 탭하면 선택/해제된다. 선택된 절은 배경이 깔리고 번호가 굵어진다. */
export function VerseRow({ verseId, label, text }: { verseId: VerseId; label: string; text: string }) {
  const store = useVerseSelectionStore();
  const isSelected = useSyncExternalStore(
    store.subscribe,
    () => store.has(verseId),
    () => false, // 서버 렌더에서는 항상 미선택
  );

  return (
    <li>
      <button
        type="button"
        onClick={() => store.toggle(verseId)}
        aria-pressed={isSelected}
        className={cn(
          // 하이라이트가 화면 좌우 끝까지 닿아야 해서 여백을 main이 아니라 여기서 준다.
          "flex w-full gap-3 px-4 py-1 text-left transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          // hover와 선택이 같은 색이다. 모바일엔 hover가 없으니 어포던스를 선택으로 승격시킨다.
          // 색을 다르게 두면 hover의 특이도가 더 높아 선택된 행에 hover할 때 되돌아간다.
          "hover:bg-highlight",
          isSelected && "bg-highlight",
        )}
      >
        {/* 시편 119편처럼 절 번호가 세 자리인 장에서 넘치지 않도록 본문보다 작게 둔다.
            w-6이 아니라 min-w-6인 이유: 세 자리까지는 24px에 들어가므로 모든 절의 본문이
            같은 x에서 시작한다. 신 6:18-19처럼 묶인 절만 그만큼 넓어진다. */}
        <span
          className={cn(
            "min-w-6 shrink-0 pt-1 text-xs tabular-nums text-foreground",
            isSelected && "font-bold",
          )}
        >
          {label}
        </span>
        <span className="flex-1 text-foreground">{text}</span>
      </button>
    </li>
  );
}
