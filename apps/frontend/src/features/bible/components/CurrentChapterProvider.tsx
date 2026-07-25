"use client";

import { createContext, useContext, useState } from "react";

/**
 * 지금 읽고 있는 장 번호를 외부 스토어로 들고 있다.
 *
 * 쓰는 쪽은 ChapterFeed(스크롤 관찰), 읽는 쪽은 BibleHeader뿐이다. 그런데도 스토어인
 * 이유는 VerseSelectionProvider와 같다: 이 값을 useState로 공통 조상에 두면 장이 바뀔
 * 때마다 ChapterFeed가 리렌더되고, 그러면 **이어 붙인 모든 장의 모든 절**이 함께 리렌더된다.
 * 헤더의 숫자 하나 때문에 수천 행을 다시 그릴 일이 아니다.
 * 스토어 객체는 정체성이 고정이고, 헤더만 useSyncExternalStore로 숫자를 구독한다.
 */
export type CurrentChapterStore = {
  subscribe: (onChange: () => void) => () => void;
  get: () => number;
  set: (chapterNum: number) => void;
};

function createCurrentChapterStore(initial: number): CurrentChapterStore {
  let current = initial;
  const listeners = new Set<() => void>();

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    get: () => current,
    set(chapterNum) {
      if (chapterNum === current) return;
      current = chapterNum;
      for (const listener of listeners) listener();
    },
  };
}

const CurrentChapterContext = createContext<CurrentChapterStore | null>(null);

export function CurrentChapterProvider({
  initialChapterNum,
  children,
}: {
  initialChapterNum: number;
  children: React.ReactNode;
}) {
  // 최초 렌더에 한 번만 만든다. 이후 정체성이 고정된다.
  // initialChapterNum이 서버 스냅샷 역할도 한다 — 진입한 장으로 SSR되므로 하이드레이션이 맞는다.
  const [store] = useState(() => createCurrentChapterStore(initialChapterNum));
  return <CurrentChapterContext.Provider value={store}>{children}</CurrentChapterContext.Provider>;
}

export function useCurrentChapterStore(): CurrentChapterStore {
  const store = useContext(CurrentChapterContext);
  if (!store) {
    throw new Error("useCurrentChapterStore는 CurrentChapterProvider 안에서만 쓸 수 있습니다.");
  }
  return store;
}
