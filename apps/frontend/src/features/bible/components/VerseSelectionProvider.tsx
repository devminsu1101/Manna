"use client";

import { createContext, useContext, useState } from "react";

import type { SelectedVerse } from "../copy-text";
import { compareVerseIds, type VerseId } from "../verse-id";

/**
 * 절 선택 상태를 외부 스토어로 들고 있다.
 *
 * Context에 값을 담지 않고 스토어 객체를 담는 이유: 값을 담으면 토글할 때마다 context
 * value의 정체성이 바뀌어 **마운트된 모든 절이 리렌더**된다. 한 장(≤176절)일 땐 안 보이지만
 * 여러 장이 이어 붙으면 탭 한 번에 수천 행이 리렌더된다.
 * 스토어 객체는 정체성이 절대 바뀌지 않고, 각 절은 useSyncExternalStore로 자기 boolean만
 * 구독한다. 원시값이라 React가 변화 없는 행의 리렌더를 건너뛴다 → 탭 비용이 O(1).
 */
export type SelectionStore = {
  subscribe: (onChange: () => void) => () => void;
  has: (id: VerseId) => boolean;
  size: () => number;
  /** 읽기 순서로 정렬된 선택 목록. */
  verses: () => readonly SelectedVerse[];
  /**
   * 본문까지 함께 받는 이유: 복사 버튼은 id만으로는 아무것도 못 만든다. 본문은 절이 이미
   * 들고 있으니 고를 때 같이 넘겨 두면, 버튼이 나중에 장 데이터를 다시 뒤질 필요가 없다.
   * 피드는 위아래로 이어 붙으므로 "선택한 절이 아직 마운트돼 있다"는 보장도 없다.
   */
  toggle: (id: VerseId, verse: Omit<SelectedVerse, "id">) => void;
  clear: () => void;
};

function createSelectionStore(): SelectionStore {
  const selected = new Map<VerseId, Omit<SelectedVerse, "id">>();
  const listeners = new Set<() => void>();

  // getSnapshot이 매번 새 배열을 만들면 useSyncExternalStore가 무한 루프에 빠진다.
  // 변경 시점에만 다시 만들어 캐시한다.
  let snapshot: readonly SelectedVerse[] = [];

  const emit = () => {
    snapshot = [...selected]
      .sort(([a], [b]) => compareVerseIds(a, b))
      .map(([id, verse]) => ({ id, ...verse }));
    for (const listener of listeners) listener();
  };

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    has: (id) => selected.has(id),
    size: () => selected.size,
    verses: () => snapshot,
    toggle(id, verse) {
      if (!selected.delete(id)) selected.set(id, verse);
      emit();
    },
    clear() {
      if (selected.size === 0) return;
      selected.clear();
      emit();
    },
  };
}

const VerseSelectionContext = createContext<SelectionStore | null>(null);

export function VerseSelectionProvider({ children }: { children: React.ReactNode }) {
  // 최초 렌더에 한 번만 만든다. 이후 정체성이 고정된다.
  const [store] = useState(createSelectionStore);
  return <VerseSelectionContext.Provider value={store}>{children}</VerseSelectionContext.Provider>;
}

export function useVerseSelectionStore(): SelectionStore {
  const store = useContext(VerseSelectionContext);
  if (!store) {
    throw new Error("useVerseSelectionStore는 VerseSelectionProvider 안에서만 쓸 수 있습니다.");
  }
  return store;
}
