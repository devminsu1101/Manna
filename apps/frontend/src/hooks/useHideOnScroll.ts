"use client";

import { useEffect, useState } from "react";

/** 이보다 작은 스크롤 변화는 흔들림으로 본다. */
const DELTA = 8;
/** 문서 최상단 근처에서는 항상 보인다. */
const TOP_ZONE = 24;

/**
 * 다음 스크롤 판정에서 방향을 읽지 말고 기준점만 옮기라고 알린다.
 *
 * ChapterFeed가 이전 장을 앞에 붙인 뒤 scrollBy로 위치를 되돌리는데, 그 보정도 scroll
 * 이벤트를 쏜다. 델타가 크고 아래쪽이라 "빠르게 아래로 스크롤"로 오독돼, 사용자가 위로
 * 올리는 중인데 크롬이 닫혀 버린다. 보정은 사용자의 의도가 아니므로 판정에서 뺀다.
 *
 * 모듈 스코프인 이유: 신호를 보내는 쪽(ChapterFeed)과 받는 쪽(ReaderChrome)이 서로의
 * 조상이 아니라 prop으로 이을 수 없고, 이 하나를 위해 context를 세우는 건 과하다.
 * 리더는 한 번에 하나만 떠 있으므로 인스턴스 충돌은 없다.
 *
 * 반드시 **실제로 위치가 바뀐 뒤에만** 부를 것. 스크롤이 안 일어나면 scroll 이벤트도 안 와서
 * 플래그가 소비되지 않고 남아, 다음 진짜 사용자 스크롤 한 번을 삼킨다. scrollTo/scrollBy는
 * 문서가 짧으면 조용히 클램프되므로 "부탁했으니 움직였겠지"는 틀린 가정이다.
 */
let rebaseRequested = false;

export function rebaseHideOnScroll(): void {
  rebaseRequested = true;
}

/**
 * 아래로 스크롤하면 true(숨김), 위로 올리면 false(등장).
 *
 * 네 가지 방어가 모두 하중을 받는다:
 *  1. 고무줄 게이트 — iOS는 바운스 구간에서 신뢰할 수 없는 델타를 준다. 없으면 네비가 떤다.
 *  2. 데드존에서 lastY를 갱신하지 않는다 — 느린 드래그가 누적돼야지, 매번 삼켜지면
 *     천천히 스크롤할 때 영영 반응하지 않는다.
 *  3. 리베이스 — 위 참조. 프로그램적 보정을 사용자 의도로 오독하지 않는다.
 *  4. rAF 스로틀 + passive 리스너 — 스크롤 성능.
 */
export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;

      // 어느 가지로 빠지든 플래그는 여기서 한 번에 비운다. 아래 가지들이 제각기 일찍
      // return하기 때문에, 각자 비우게 두면 하나를 빠뜨렸을 때 조용히 다음 스크롤을 삼킨다.
      const rebasing = rebaseRequested;
      rebaseRequested = false;

      // 고무줄 구간의 델타는 버린다.
      if (y <= 0 || y >= max) {
        lastY = y;
        setHidden(false);
        return;
      }

      // 보정 스크롤. 기준만 옮기고 표시 상태는 건드리지 않는다.
      if (rebasing) {
        lastY = y;
        return;
      }

      const dy = y - lastY;
      if (Math.abs(dy) < DELTA) return; // lastY를 그대로 두어 변화를 누적시킨다
      lastY = y;
      setHidden(y > TOP_ZONE && dy > 0);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}
