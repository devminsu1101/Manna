"use client";

import { Check, CircleAlert, Copy, X } from "lucide-react";
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

/**
 * 아이콘만 남기면서 라벨은 aria-label과 라이브 리전으로만 남았다. 지우지 말 것 —
 * 아이콘 버튼은 이름이 없으면 스크린 리더에 "버튼"으로만 읽힌다.
 */
const LABEL: Record<Status, string> = {
  idle: "복사하기",
  copied: "복사했어요",
  failed: "복사하지 못했어요",
};

/**
 * 결과를 아이콘으로 말한다. 글자가 없어졌으므로 이 전환이 유일한 시각적 피드백이다.
 *
 * 실패가 특히 얇아졌다. 한때 "복사하지 못했어요"라는 문장이었고, 그건 실제로 마주치는
 * 실패다 — 보안 컨텍스트가 아닌 곳(폰에서 http://192.168.x.x)에서는 클립보드 API가 아예
 * 없다(D-704). 그래서 실패만 색을 바꿔 아이콘 하나에 기대지 않게 한다.
 */
const ICON: Record<Status, React.ElementType> = {
  idle: Copy,
  copied: Check,
  failed: CircleAlert,
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
    timer.current = window.setTimeout(() => {
      setResult(null);
      // 성공했으면 선택을 놓아 준다. 복사는 곧 "이 절들로 할 일이 끝났다"이고, 그대로 두면
      // 다음 절을 고를 때 아까 것이 딸려 온다.
      //
      // **여기서 풀어야 한다.** 복사 직후에 풀면 선택이 0이 되어 이 컴포넌트가 곧바로
      // null을 반환하고, "복사했어요"가 뜨자마자 사라진다. 피드백을 다 보여준 뒤에 푼다.
      // 실패는 풀지 않는다 — 다시 시도할 선택이 남아 있어야 한다.
      //
      // 스냅샷 참조를 비교하는 이유: 이 1.5초 사이에 사용자가 절을 더 고를 수 있다.
      // 그러면 그건 새 작업이므로 지우면 안 된다. 스냅샷은 선택이 바뀔 때만 새로 만들어져
      // 참조가 곧 "그때 그 선택"의 신분증이다 — 위 status 판정이 쓰는 것과 같은 장치다.
      if (copied && store.verses() === verses) store.clear();
    }, FEEDBACK_MS);
  };

  // 대문자 변수여야 JSX가 컴포넌트로 알아본다.
  const Icon = ICON[status];

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center gap-2 px-4",
        "transition-transform duration-200",
        !navHidden && "-translate-y-16",
      )}
    >
      {/* 해제가 복사 왼쪽인 이유: 복사가 주 동작이라 엄지가 닿는 오른쪽에 둔다.
          글자가 사라져 위계를 색으로만 줘야 하므로 같은 청록 하나로 가른다 —
          복사는 채우고(secondary), 해제는 흰 배경에 테두리와 아이콘만 그 색으로 뺀다.
          primary(브랜드 노랑 #ffcc00)를 쓰지 않는 이유: 흰 배경 위에서 대비가 약하고,
          옆의 청록과 남남인 색이 하나 더 늘어난다.

          "흰 원 + 청록 테두리"는 BottomNav 가운데 FAB에 이미 있는 모양이다. 다만 그쪽은
          border-2고 여기는 border-1이다 — 저건 화면의 주 동작이라 굵고, 이건 복사 옆에서
          물러나 있어야 한다.

          hover를 덮는 이유: outline 기본값이 bg-muted(크림색) + text-foreground라
          청록 옆에서 튀고 아이콘 색도 잃는다. */}
      <Button
        variant="outline"
        size="icon-lg"
        onClick={store.clear}
        aria-label="선택 해제"
        className={cn(
          "pointer-events-auto size-12 rounded-full shadow-lg",
          "border-1 border-secondary text-secondary",
          "hover:bg-secondary/10 hover:text-secondary",
        )}
      >
        <X className="size-5" />
      </Button>

      <Button
        variant={status === "failed" ? "destructive" : "secondary"}
        size="icon-lg"
        onClick={handleCopy}
        aria-label={LABEL[status]}
        className="pointer-events-auto size-12 rounded-full shadow-lg"
      >
        <Icon className="size-5" /> 
      </Button>

      {/* 라벨이 바뀌는 것만으로는 스크린 리더에 결과가 전달되지 않는다. */}
      <span role="status" aria-live="polite" className="sr-only">
        {status === "idle" ? "" : LABEL[status]}
      </span>
    </div>
  );
}
