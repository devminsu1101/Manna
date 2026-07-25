"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { rebaseHideOnScroll } from "@/hooks/useHideOnScroll";
import { fetchChapter } from "../client";
import { rememberLastRead } from "../last-read";
import type { Book, Chapter } from "../types";
import { ChapterSection } from "./ChapterSection";
import { useCurrentChapterStore } from "./CurrentChapterProvider";

/**
 * **다음 장 전용.** 장이 끝나기 약 1.5화면 전에 당긴다. 더 키우면 플링 한 번에 안 읽을 장까지 받는다.
 *
 * 이전 장에 그대로 쓰면 안 된다 — 아래 prevRootMargin 참조. 뒤에 붙이는 건 공짜지만
 * 앞에 붙이는 건 스크롤 보정을 수반한다. 두 방향은 대칭이 아니다.
 */
const PREFETCH_MARGIN = "600px 0px";

/**
 * "지금 읽는 장"을 판정하는 띠의 아래 경계. 위 경계는 헤더 높이라 런타임에 잰다.
 *
 * 띠는 **헤더 바로 아래**에 있어야 한다. 한때 "0px 0px -90% 0px"(상단 10%)이었는데,
 * 상단 10% = 62.9px이고 헤더는 63px이다. 즉 판정 띠가 헤더에 완전히 가려진 영역과 겹쳐서,
 * 헤더가 "화면에 안 보이는 곳에 뭐가 있는지"를 보고했다. 시편 42편을 읽는데 헤더와 주소는
 * 41편이라고 우기던 게 이것이다. 헤더가 숨던 시절엔 그 띠가 장 제목 밴드와 같은 지점이라
 * 맞았지만, 헤더가 항상 뜨게 되면서 전제가 깨졌다.
 */
const CURRENT_CHAPTER_BAND_BOTTOM = "-80%";

/** 스크롤이 이만큼 조용하면 멎은 것으로 본다. iOS 모멘텀은 계속 scroll 이벤트를 쏜다. */
const SCROLL_SETTLE_MS = 120;

type Status = "idle" | "loading" | "error";

/**
 * 스크롤이 멎을 때까지 기다린다.
 *
 * 앞에 장을 붙이면 보정 스크롤이 따라붙는데, **모멘텀 중에는 그 보정이 관성과 싸운다.**
 * 우리가 아래로 되돌리면 관성이 다시 위로 끌어 센티넬이 또 걸리고, 또 붙고, 또 싸운다.
 * 시편 43편에서 40편까지 밀리던 연쇄가 바로 이것이었다 — 한 번 튕길 때마다 몇 장씩 붙었다.
 * 멎은 뒤에 붙이면 보정이 조용히 성공하고, 한 번에 한 장만 붙는다.
 */
function waitForScrollSettle(): Promise<void> {
  return new Promise((resolve) => {
    let timer = 0;
    const done = () => {
      window.removeEventListener("scroll", bump);
      resolve();
    };
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(done, SCROLL_SETTLE_MS);
    };
    timer = window.setTimeout(done, SCROLL_SETTLE_MS);
    window.addEventListener("scroll", bump, { passive: true });
  });
}

/**
 * 사용자 의도가 아닌 스크롤. 실제로 움직였을 때만 크롬에 리베이스를 알린다.
 *
 * scrollTo는 문서가 뷰포트보다 짧으면 조용히 클램프된다. 그때 미리 알려 두면 scroll
 * 이벤트가 오지 않아 플래그가 남고, 다음 진짜 사용자 스크롤이 삼켜진다. 그래서 먼저
 * 움직이고, 움직인 게 확인되면 알린다 — scrollY는 동기로 갱신되고 이벤트는 나중에 온다.
 *
 * @returns 목표 지점에 실제로 도달했는지. 문서가 짧아 클램프되면 false.
 */
function scrollWithoutIntent(to: number): boolean {
  const before = window.scrollY;
  window.scrollTo(0, to);
  const moved = window.scrollY !== before;
  if (moved) rebaseHideOnScroll();
  return Math.round(window.scrollY) >= Math.round(to);
}

/**
 * 장을 이어 붙이는 피드. 양방향이다.
 *
 * 첫 장은 서버에서 렌더돼 initialChapter로 들어온다. 이후 장만 클라이언트에서 부른다.
 * 첫 화면까지 클라이언트 fetch로 돌리면 LCP가 나빠지고 JS 없이는 본문이 안 보인다.
 *
 * 책 경계는 넘지 않는다. 그래서 book은 피드 내내 고정이다.
 */
export function ChapterFeed({
  initialChapter,
  nextBook,
  prevBook,
}: {
  initialChapter: Chapter;
  nextBook: Book | null;
  prevBook: Book | null;
}) {
  const [chapters, setChapters] = useState<Chapter[]>([initialChapter]);
  const [statusNext, setStatusNext] = useState<Status>("idle");
  const [statusPrev, setStatusPrev] = useState<Status>("idle");

  const book = initialChapter.book;

  const lastChapterNum = chapters[chapters.length - 1].chapterNum;
  const nextChapterNum = lastChapterNum + 1;
  const hasNext = nextChapterNum <= book.totalChapters;

  const firstChapterNum = chapters[0].chapterNum;
  const prevChapterNum = firstChapterNum - 1;
  const hasPrev = prevChapterNum >= 1;

  const nextSentinelRef = useRef<HTMLDivElement>(null);
  const prevSentinelRef = useRef<HTMLDivElement>(null);

  // state가 아니라 ref여야 한다. 이펙트가 재실행돼도 살아남아야 StrictMode 이중 호출을 막는다.
  // 방향마다 따로 두는 이유: 짧은 장에서는 양쪽 센티넬이 동시에 보일 수 있어, 하나를
  // 공유하면 한 방향이 다른 방향을 막는다.
  const inFlightNext = useRef(false);
  const inFlightPrev = useRef(false);

  /**
   * 직전 보정이 목표에 못 닿았는가. 그러면 더 당기지 않는다.
   *
   * 보정 실패는 자기강화한다: 실패하면 센티넬이 화면에 남고, loadPrev 정체성이 바뀌며
   * 옵저버가 재생성돼 초기 콜백을 쏘고, 또 당기고, 또 실패한다. /ps/44가 38편까지 밀린 게
   * 그 폭주다 — 단순 연쇄로는 42편에서 멈춰야 했다.
   *
   * 센티넬이 화면을 벗어나면 풀린다. 즉 "실패했으면 사용자가 맨 위를 떠났다 돌아올 때까지 쉰다".
   */
  const prevStalled = useRef(false);

  /** 진입 시 직전 장을 붙이는 일이 끝났는가(붙일 게 없으면 처음부터 true). 초기 스크롤이 이걸 기다린다. */
  const [entryReady, setEntryReady] = useState(initialChapter.chapterNum <= 1);

  const sectionRefs = useRef(new Map<number, HTMLElement>());

  const registerSection = useCallback((chapterNum: number, el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(chapterNum, el);
    else sectionRefs.current.delete(chapterNum);
  }, []);

  // ── 스크롤 보정 ───────────────────────────────────────────────
  // 앞에 뭔가 붙으면 뷰포트 위쪽 콘텐츠가 늘어난다. 브라우저는 scrollY를 유지하므로
  // 읽던 본문이 그만큼 아래로 튄다.
  //
  // 브라우저의 native scroll anchoring에 기댈 수 없다 — Safari는 아예 구현하지 않는다.
  // 그래서 직접 보정하고, Chrome이 이중 보정하지 않도록 main에 overflow-anchor:none을 건다.
  //
  // scrollHeight 차분이 아니라 앵커 기준인 이유: 위쪽에서 스켈레톤이 사라지고 장이 붙는
  // 식으로 여러 개가 한꺼번에 바뀌어도, "이 섹션을 제자리에 붙들라"는 규칙은 그대로 성립한다.
  const anchor = useRef<{ el: HTMLElement; top: number } | null>(null);

  /** 위쪽 높이를 바꾸는 setState 직전마다 부른다. 커밋 사이에 DOM이 바뀌므로 매번 다시 재야 한다. */
  const captureAnchor = useCallback((chapterNum: number) => {
    const el = sectionRefs.current.get(chapterNum);
    if (el) anchor.current = { el, top: el.getBoundingClientRect().top };
  }, []);

  // 페인트 전에 되돌려야 한다. useEffect면 한 프레임 튄 뒤 제자리를 찾는 게 보인다.
  useLayoutEffect(() => {
    const a = anchor.current;
    if (!a) return;
    anchor.current = null;

    const delta = a.el.getBoundingClientRect().top - a.top;
    if (delta === 0) return;

    // 반환값을 반드시 본다. 못 닿았으면 읽던 자리가 이미 밀린 것이고, 그 상태로 또 당기면
    // 폭주한다. 한때 이 값을 버렸고 그게 /ps/44 → 38편의 원인이었다.
    if (!scrollWithoutIntent(window.scrollY + delta)) prevStalled.current = true;
  }, [chapters, statusPrev]);

  // ── 진입 시 스크롤 위치 ───────────────────────────────────────
  // 책의 첫 장으로 들어오면 위에 BookStartNotice가 렌더된다. 그게 첫 화면을 차지하면
  // /ps/1로 들어왔는데 정작 시편 1장이 안 보인다. 안내는 위로 올렸을 때 나타나야 할
  // 것이지 처음부터 자리를 차지할 게 아니다. 그래서 진입한 장의 머리로 스크롤을 맞춘다.
  //
  // 밴드는 헤더에 가려 안 보이고 첫 절이 헤더 바로 아래에서 시작하는 지점을 고른다.
  // 섹션 top을 0에 맞추면 밴드(53px)가 헤더(61px)보다 짧아 첫 절 위가 잘린다.
  // 높이를 상수로 박지 않고 재는 이유: 폰트나 아이콘 크기가 바뀌면 같이 틀어진다.
  //
  // 한 번에 끝나지 않을 수 있다. 시편 1편은 6절이라 마운트 시점엔 문서가 뷰포트보다
  // 짧고, 그러면 scrollTo가 0으로 클램프된다. 다음 장이 붙어 문서가 자란 뒤 다시 시도해야
  // 해서 chapters를 구독한다. 창세기 1장(31절)은 처음부터 길어서 한 번에 끝난다.
  const initialScrollDone = useRef(false);
  useLayoutEffect(() => {
    if (initialScrollDone.current) return;
    // 직전 장이 앞에 붙기 전에 자리를 잡으면, 붙는 순간 그만큼 밀려 두 번 튄다.
    // 다 붙은 문서에서 한 번에 잡는다. 붙이기와 위치 잡기가 같은 커밋이라 페인트 전에 끝난다.
    if (!entryReady) return;

    const section = sectionRefs.current.get(initialChapter.chapterNum);
    const band = section?.firstElementChild;
    const header = document.querySelector("header");
    if (!section || !band || !header) return;

    const target =
      section.getBoundingClientRect().top +
      window.scrollY -
      header.getBoundingClientRect().height +
      band.getBoundingClientRect().height;

    // 위에 밀어낼 게 없는 장이면 할 일이 없다.
    //
    // scrollY로는 아무 판단도 하지 않는다. 한때 "scrollY > target이면 복원된 스크롤이니
    // 건드리지 말자"는 가드가 있었는데, 두 가지가 다 틀렸다.
    //  1. 클라이언트 라우팅(시트에서 장 선택)에서는 이 레이아웃 이펙트가 Next의 스크롤
    //     리셋보다 먼저 돈다. 그래서 여기 보이는 scrollY는 **이전 페이지의 값**이다.
    //     창세기에서 시편 43편을 고르면 scrollY=1937이 남아 가드가 걸리고, 초기 스크롤이
    //     통째로 건너뛰어져 43편 대신 42편에 도착했다.
    //  2. 지킬 것도 없었다. 이 리더는 replaceState로 URL을 갈아치우므로 뒤로가기가
    //     스크롤을 복원하지 못한다(실측: 5937 → 1773).
    // target은 `섹션의 문서상 위치 - 헤더 + 밴드`라 scrollY가 뭐든 같은 값이 나온다.
    if (target <= 0) {
      initialScrollDone.current = true;
      return;
    }

    if (scrollWithoutIntent(target)) initialScrollDone.current = true;
  }, [chapters, entryReady, initialChapter.chapterNum]);

  // ── 다음 장 ──────────────────────────────────────────────────
  const loadNext = useCallback(async () => {
    if (inFlightNext.current || !hasNext) return;
    inFlightNext.current = true;
    setStatusNext("loading");
    try {
      const chapter = await fetchChapter(book.abbrev, nextChapterNum);
      if (!chapter) {
        setStatusNext("error");
        return;
      }
      setChapters((prev) =>
        prev.some((c) => c.chapterNum === chapter.chapterNum) ? prev : [...prev, chapter],
      );
      setStatusNext("idle");
    } catch {
      setStatusNext("error");
    } finally {
      inFlightNext.current = false;
    }
  }, [book.abbrev, nextChapterNum, hasNext]);

  // ── 진입 시 직전 장 ───────────────────────────────────────────
  // 스크롤과 무관하게, 진입하면 무조건 한 장을 앞에 붙인다. 위로 조금만 올려도 바로 이어지도록.
  //
  // 여기서는 **앵커 보정을 하지 않는다**. 아직 초기 스크롤 전이라 잡아 둘 자리가 없다.
  // 대신 초기 스크롤이 entryReady를 기다렸다가, 다 붙은 문서에서 한 번에 위치를 잡는다.
  // 이 순서가 핵심이다 — 예전엔 "스크롤이 이전 장을 부르고 → 붙으면 보정"이라 보정이
  // iOS 관성과 싸웠다. 붙이고 나서 한 번 잡으면 싸울 상대가 없다.
  useEffect(() => {
    if (initialChapter.chapterNum <= 1) return;
    let alive = true;
    void (async () => {
      try {
        const chapter = await fetchChapter(book.abbrev, initialChapter.chapterNum - 1);
        if (alive && chapter) {
          setChapters((prev) =>
            prev.some((c) => c.chapterNum === chapter.chapterNum) ? prev : [chapter, ...prev],
          );
        }
      } catch {
        // 조용히 넘긴다. 위로 올리면 센티넬이 다시 시도한다.
      } finally {
        // 실패해도 열어 줘야 한다. 안 그러면 초기 스크롤이 영영 안 돈다.
        if (alive) setEntryReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [book.abbrev, initialChapter.chapterNum]);

  // ── 이전 장: 앞에 붙이기 ──────────────────────────────────────
  // 아래로 붙이는 쪽과 달리, 위쪽 높이를 바꾸는 갱신 앞마다 앵커를 잡아야 한다.
  //
  // 스켈레톤을 띄우지 않는다. 위쪽에 뜨면 그것도 스크롤을 밀고, 어차피 사용자 위쪽이라
  // 보이지도 않는다. 미리 받아 두므로 기다림도 거의 없다.
  const loadPrev = useCallback(async () => {
    if (inFlightPrev.current || !hasPrev || prevStalled.current) return;
    inFlightPrev.current = true;
    try {
      const chapter = await fetchChapter(book.abbrev, prevChapterNum);
      if (!chapter) {
        captureAnchor(firstChapterNum);
        setStatusPrev("error");
        return;
      }

      // 스크롤이 멎은 뒤에 붙인다. 모멘텀 중에 붙이면 보정이 관성과 싸워 연쇄로 밀린다.
      // 기다리는 동안 센티넬이 계속 걸려도 inFlightPrev가 막으므로 한 장만 붙는다.
      await waitForScrollSettle();

      captureAnchor(firstChapterNum);
      setChapters((prev) =>
        prev.some((c) => c.chapterNum === chapter.chapterNum) ? prev : [chapter, ...prev],
      );
      setStatusPrev("idle");
    } catch {
      captureAnchor(firstChapterNum);
      setStatusPrev("error");
    } finally {
      inFlightPrev.current = false;
    }
  }, [book.abbrev, prevChapterNum, hasPrev, firstChapterNum, captureAnchor]);

  // 다음 장: 센티넬이 보이면 당긴다. 장 번호가 바뀌면 loadNext 정체성이 바뀌어 이펙트가
  // 재실행된다. 빠르게 스크롤해 센티넬이 여전히 교차 중이면 연쇄로 부르는데, 그게 의도한
  // 동작이다 — 뒤에 붙이는 건 보정이 필요 없어 몇 장이 이어 붙든 읽던 자리가 안 움직인다.
  useEffect(() => {
    const el = nextSentinelRef.current;
    if (!el || !hasNext) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadNext();
      },
      { rootMargin: PREFETCH_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadNext, hasNext]);

  // 이전 장은 다음 장과 규칙이 다르다. 미리 당기지 않는다 — 사용자가 진짜 맨 위에 닿았을 때만.
  //
  // 앞에 붙이는 건 스크롤 보정을 수반하고, 그 보정이 가장 잘 실패하는 시점이 진입 직후다.
  // 예전엔 여기도 PREFETCH_MARGIN(600px)이라 /ps/43으로 들어가면 42편을 즉시 당기고,
  // 시편은 장이 짧아 41편까지 연쇄로 당겼다. 실기기에서 그 보정들이 레이스에 지면
  // 41·42편에 도착했고, URL 동기화가 그 위치를 그대로 주소로 썼다.
  //
  // 마진을 0px으로 줄이는 것으로는 부족하다. 초기 스크롤이 밴드를 헤더 밑에 넣으면
  // 센티넬은 y ≈ 헤더높이 - 밴드높이 ≈ 8에 앉는데, 헤더에 **가려 안 보일 뿐** 뷰포트와는
  // 여전히 교차한다. 그래서 윗변을 헤더 높이만큼 내려 "헤더에 가려 있으면 닿은 게 아니다"를
  // 성립시킨다. 맨 위(scrollY=0)로 올리면 센티넬이 헤더 아래로 내려와 그때 걸린다.
  useEffect(() => {
    const el = prevSentinelRef.current;
    if (!el || !hasPrev) return;

    const headerH = document.querySelector("header")?.getBoundingClientRect().height ?? 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 센티넬이 화면을 벗어났다 = 사용자가 맨 위에서 떠났다. 막아 둔 걸 푼다.
        if (!entry.isIntersecting) {
          prevStalled.current = false;
          return;
        }
        void loadPrev();
      },
      { rootMargin: `-${Math.ceil(headerH)}px 0px 0px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadPrev, hasPrev]);

  // 진입한 장도 기억한다. 아래 옵저버는 장이 **바뀔 때만** 발동하므로, 한 장을 열어
  // 읽기만 하고 나간 사람은 이게 없으면 아무것도 기억되지 않는다.
  useEffect(() => {
    rememberLastRead(book.abbrev, initialChapter.chapterNum);
  }, [book.abbrev, initialChapter.chapterNum]);

  // ── 현재 장 판정 → URL + 헤더 ─────────────────────────────────
  const visibleChapters = useRef(new Set<number>());
  const shownChapter = useRef(initialChapter.chapterNum);
  const currentChapterStore = useCurrentChapterStore();

  useEffect(() => {
    // 띠의 윗변을 헤더 아래로 내린다. 헤더에 가린 부분을 보고 판정하면, 읽고 있는 장이
    // 아니라 안 보이는 장이 헤더와 주소에 뜬다.
    const headerH = document.querySelector("header")?.getBoundingClientRect().height ?? 0;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const num = Number((entry.target as HTMLElement).dataset.chapter);
          if (entry.isIntersecting) visibleChapters.current.add(num);
          else visibleChapters.current.delete(num);
        }
        if (visibleChapters.current.size === 0) return;

        // 경계에서 두 섹션이 잠깐 겹칠 때 아래쪽(더 큰 번호)을 택한다.
        const current = Math.max(...visibleChapters.current);
        if (current === shownChapter.current) return;
        shownChapter.current = current;

        // 헤더의 장 숫자. 띠가 헤더 바로 아래라, 헤더에 뜨는 숫자와 그 밑에 실제로 보이는
        // 본문이 항상 같은 장이다.
        currentChapterStore.set(current);

        // router.replace가 아니라 replaceState인 이유: router.replace는 새 라우트의 RSC를
        // 요청하고 세그먼트를 리렌더해서, 누적된 chapters 상태가 재조정에 노출되고
        // 장 경계마다 네트워크 왕복이 생긴다. URL 문자열 하나 때문에 치를 비용이 아니다.
        // pushState가 아닌 이유: 47장을 스크롤하면 뒤로가기 항목이 47개 쌓인다.
        window.history.replaceState(null, "", `/bible/${book.abbrev}/${current}`);
        // generateMetadata가 건 제목은 진입한 장에 고정돼 있으므로 직접 갱신한다.
        document.title = `${book.name} ${current}장 | 만나`;

        // 마지막에 읽던 장. /bible이 이걸 읽어 이어읽기로 보낸다.
        // 여기가 맞는 자리인 이유: "지금 읽는 장이 바뀌었다"는 판정이 이미 여기서 끝난다.
        rememberLastRead(book.abbrev, current);
      },
      { rootMargin: `-${Math.ceil(headerH)}px 0px ${CURRENT_CHAPTER_BAND_BOTTOM} 0px` },
    );
    for (const el of sectionRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [chapters.length, book.abbrev, book.name, currentChapterStore]);

  return (
    <>
      {!hasPrev && <BookStartNotice bookName={book.name} prevBook={prevBook} />}
      {statusPrev === "error" && <RetryRow onRetry={loadPrev} />}
      {/* 이전 장에는 스켈레톤이 없다. 위쪽에 뜨면 그것도 스크롤을 밀고, 사용자 위쪽이라
          보이지도 않는다. 미리 받아 두므로 기다림도 거의 없다. */}
      {hasPrev && <div ref={prevSentinelRef} aria-hidden className="h-px" />}

      {chapters.map((chapter) => (
        <ChapterSection
          key={chapter.chapterNum}
          chapter={chapter}
          registerSection={registerSection}
        />
      ))}

      {hasNext && <div ref={nextSentinelRef} aria-hidden className="h-px" />}

      {statusNext === "loading" && <ChapterSkeleton label="다음 장을 불러오는 중" />}
      {statusNext === "error" && <RetryRow onRetry={loadNext} />}
      {!hasNext && <BookEndNotice bookName={book.name} nextBook={nextBook} />}
    </>
  );
}

function ChapterSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <span role="status" className="sr-only">
        {label}
      </span>
    </div>
  );
}

/**
 * 실패를 조용히 넘기지 않는다. 바닥에서 멈춘 상태는 "성경이 끝났다"와 구분이 안 되고,
 * 지하철에서 실제로 마주치는 실패다.
 */
function RetryRow({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8">
      <p className="text-sm text-muted-foreground">장을 불러오지 못했습니다.</p>
      <Button variant="ghost" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}

/** 책의 마지막 장 뒤. 연속 스크롤은 책 경계를 넘지 않으므로 일반 라우트 이동으로 연결한다. */
function BookEndNotice({ bookName, nextBook }: { bookName: string; nextBook: Book | null }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10">
      <p className="text-center text-sm text-muted-foreground">{bookName}의 마지막 장입니다.</p>
      {nextBook && (
        <Button asChild variant="secondary">
          <Link href={`/bible/${nextBook.abbrev}/1`}>{nextBook.name} 읽기 →</Link>
        </Button>
      )}
    </div>
  );
}

/** 책의 첫 장 앞. BookEndNotice의 거울. 거꾸로 읽는 흐름이므로 이전 권의 마지막 장으로 보낸다. */
function BookStartNotice({ bookName, prevBook }: { bookName: string; prevBook: Book | null }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-10">
      <p className="text-center text-sm text-muted-foreground">{bookName}의 첫 장입니다.</p>
      {prevBook && (
        <Button asChild variant="secondary">
          <Link href={`/bible/${prevBook.abbrev}/${prevBook.totalChapters}`}>
            ← {prevBook.name} 읽기
          </Link>
        </Button>
      )}
    </div>
  );
}
