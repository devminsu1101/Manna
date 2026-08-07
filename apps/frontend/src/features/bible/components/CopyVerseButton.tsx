"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { buildCopyText, type SelectedVerse } from "../copy-text";
import { useVerseSelectionStore } from "./VerseSelectionProvider";

/** 복사 결과를 버튼에 띄워 두는 시간. 이보다 짧으면 눈으로 못 잡는다. */
const FEEDBACK_MS = 1500;

/** 서버 렌더용 빈 스냅샷. 매번 새 배열을 만들면 useSyncExternalStore가 무한 루프에 빠진다. */
const NO_VERSES: readonly SelectedVerse[] = [];

type Status = "idle" | "copied" | "failed";

const LABEL: Record<Status, string> = {
  idle: "복사하기",
  copied: "복사했어요",
  failed: "복사하지 못했어요",
};

/**
 * 절을 하나 이상 선택했을 때만 뜨는 복사 버튼.
 *
 * 네비가 숨으면 함께 내려온다. 방금 절을 골랐으니 계속 보여야 한다.
 * bottom-4(16px) + -translate-y-16(64px) = 80px — 네비가 보일 때의 위치.
 */
export function CopyVerseButton({ navHidden }: { navHidden: boolean }) {
  const store = useVerseSelectionStore();
  const verses = useSyncExternalStore(store.subscribe, store.verses, () => NO_VERSES);

  /**
   * 복사 결과와, 그게 어느 선택에 대한 말인지.
   *
   * 스토어 스냅샷은 선택이 바뀔 때만 새로 만들어지므로 참조가 곧 "그때 그 선택"의 신분증이다.
   * 이걸 같이 들고 있으면 선택이 바뀐 순간 표시가 저절로 만료된다 — 이펙트로 상태를
   * 되돌릴 필요가 없다.
   */
  const [result, setResult] = useState<{ status: Status; of: readonly SelectedVerse[] } | null>(
    null,
  );
  const status = result?.of === verses ? result.status : "idle";

  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (verses.length === 0) return null;

  // 클립보드 호출까지 await를 끼우지 않는다. iOS Safari는 사용자 제스처가 끊기면 거부한다.
  const handleCopy = async () => {
    const text = buildCopyText(verses);
    if (!text) return;

    const copied = await copyToClipboard(text);
    setResult({ status: copied ? "copied" : "failed", of: verses });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setResult(null), FEEDBACK_MS);
  };

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
        onClick={handleCopy}
        className="pointer-events-auto h-12 rounded-full px-8 text-base font-bold shadow-lg"
      >
        {LABEL[status]}
      </Button>
      {/* 라벨이 바뀌는 것만으로는 스크린 리더에 결과가 전달되지 않는다. */}
      <span role="status" aria-live="polite" className="sr-only">
        {status === "idle" ? "" : LABEL[status]}
      </span>
    </div>
  );
}
