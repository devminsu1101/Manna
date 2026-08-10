"use client";

import { ChevronLeft, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { books, LAST_OLD_TESTAMENT_ORDER } from "../books";
import { pushJump } from "../jump-history";
import type { Book } from "../types";
import { useCurrentChapterStore } from "./CurrentChapterProvider";

/**
 * ScrollArea 안에서 el이 세로 가운데 오도록 스크롤한다. 열릴 때 한 번만 부른다.
 *
 * `scrollIntoView`를 쓰지 않는 이유가 둘이다.
 *  1. 시트 진입 애니메이션이 translate 키프레임이다. 움직이는 요소에 scrollIntoView를 걸면
 *     조상까지 스크롤시켜 **뒤에 있는 성경 본문이 딸려 움직인다.**
 *  2. 스크롤 노드는 Radix Viewport인데, 그 안의 컨텐츠 div가 `display:table`이라 offsetTop
 *     계산이 통상적으로 동작하지 않는다.
 *
 * 그래서 rect 차분으로 직접 잰다. 두 rect가 같은 translate를 받으므로 애니메이션 중에도
 * 차분은 정확하다. scrollTop은 브라우저가 알아서 클램프하므로 범위 검사도 필요 없다.
 *
 * 스크롤 노드를 **대상에서 위로 찾아 올라가** 잡는다. ScrollArea에 ref를 걸어 내려가는 길도
 * 있지만, 그건 우리 래퍼가 `{...props}`로 흘리는 ref가 Radix Root까지, 거기서 다시 DOM까지
 * 닿는다는 두 단계 가정 위에 선다. 어긋나면 예외 없이 **조용히 아무 일도 안 일어난다**.
 * closest는 대상이 뷰포트 안에 있다는 사실 하나만 쓴다.
 *
 * **두 번 시도하는 이유 — 마운트 직후엔 뷰포트가 아직 스크롤되지 않는다.**
 * Radix는 Viewport에 `overflowY: scrollbarYEnabled ? "scroll" : "hidden"`을 준다. 그리고
 * 그 플래그를 켜는 건 `ScrollAreaScrollbar`의 **passive `useEffect`** 다
 * (`@radix-ui/react-scroll-area` index.mjs:150). 순서가 이렇게 된다:
 *
 *   첫 렌더(overflow:hidden) → layout effect(여기) → passive effect(플래그 on) → 재렌더(overflow:scroll)
 *
 * 즉 layout effect 시점에는 아직 `overflow:hidden`이고, **스크롤 불가한 요소의 scrollTop은
 * 0으로 조용히 클램프된다.** 예외도 경고도 없이 "가운데 정렬만 안 되는" 상태가 된다.
 * 그래서 다음 프레임에 한 번 더 건다 — 그때는 재렌더가 끝나 있다.
 *
 * 보정이 **상대값**이라 두 번 불러도 안전하다. 첫 번째가 성공했으면 두 번째는 차분이 0이라
 * 아무것도 하지 않는다. 목록 맨 앞/뒤라 가운데로 못 가는 경우도 마찬가지로 클램프될 뿐이다.
 */
function centerInScrollArea(el: HTMLElement | null): () => void {
  const viewport = el?.closest<HTMLElement>("[data-radix-scroll-area-viewport]");
  if (!el || !viewport) return () => {};

  const apply = () => {
    const view = viewport.getBoundingClientRect();
    const target = el.getBoundingClientRect();
    viewport.scrollTop += target.top - view.top - (view.height - target.height) / 2;
  };

  apply();
  const raf = requestAnimationFrame(apply);
  return () => cancelAnimationFrame(raf);
}

/**
 * 헤더의 "시편 43장"을 눌러 여는 권/장 선택 시트.
 *
 * 시트 전체(트리거 + 내용)를 여기서 소유한다. 트리거가 현재 장을 보여줘야 하는데 그건
 * 스토어에만 있고, 트리거와 내용은 같은 Sheet 안에 있어야 하기 때문이다. 그래서 헤더의
 * 스토어 구독이 이쪽으로 넘어왔다 — BibleHeader는 배치만 한다.
 *
 * 절은 고르지 않는다. 장까지만 고르고 라우팅한다.
 *
 * bookAbbrev를 따로 받는 이유: 지금 읽는 권을 목록에서 짚어 주려면 라우트 키가 필요하다.
 * 이름으로 맞춰도 되지만(66개가 유일하다) 라우트에 쓰는 값과 다른 걸로 판정할 이유가 없다.
 */
export function BiblePicker({ bookName, bookAbbrev }: { bookName: string; bookAbbrev: string }) {
  const store = useCurrentChapterStore();
  const chapterNum = useSyncExternalStore(store.subscribe, store.get, store.get);

  const [open, setOpen] = useState(false);
  // 어느 권의 장을 고르는 중인가. null이면 권 목록 단계다.
  const [picking, setPicking] = useState<Book | null>(null);

  // 시트를 닫을 때 단계를 초기화한다. 열어 둔 채로 되돌리면 다음에 열었을 때
  // 엉뚱하게 장 그리드부터 보인다.
  const change = (next: boolean) => {
    setOpen(next);
    if (!next) setPicking(null);
  };

  /**
   * 장을 골라 떠나기 직전. **여기가 이동 기록의 유일한 지점이다.**
   *
   * 출발지로 넘기는 값은 라우트 파라미터가 아니라 스토어의 `chapterNum` — 그때 화면에
   * 보이던 장이다. /bible/ps/13으로 들어와 15장까지 읽었으면 돌아갈 곳은 13이 아니라 15다.
   */
  const pick = (destAbbrev: string, destChapter: number) => {
    // 제자리를 다시 고른 경우는 pushJump가 알아서 걸러낸다.
    pushJump(bookAbbrev, chapterNum, destAbbrev, destChapter);
    change(false);
  };

  return (
    <Sheet open={open} onOpenChange={change}>
      {/* 제목 구역 전체가 트리거다. h1을 유지하되 그 안을 버튼으로 채운다 —
          랜드마크(문서 제목)와 조작(시트 열기)이 둘 다 필요하다. */}
      <h1 className="min-w-0">
        <SheetTrigger asChild>
          <Button variant="ghost" className="h-auto gap-1.5 px-2 py-1" aria-label="다른 장 선택">
            <span aria-hidden>📖</span>
            <span className="truncate text-lg font-bold text-foreground">
              {bookName} {chapterNum}장
            </span>
            <Menu className="size-5 text-foreground" aria-hidden />
          </Button>
        </SheetTrigger>
      </h1>

      {/* 높이를 직접 준다. side="bottom"의 기본이 h-auto라, 안 주면 시트가 내용만큼 자란다 —
          시편 150장 그리드에서 1,646px이 되어 bottom-0에 붙은 채 헤더가 화면 위로 밀려났다.

          `data-[side=bottom]:` 접두사가 필수다. 그냥 h-[85dvh]로 주면 베이스의
          `data-[side=bottom]:h-auto`가 속성 선택자라 특이도에서 이기고, tailwind-merge도
          변형이 다르면 중복 제거를 못 해 조용히 무시된다.

          dvh인 이유: iOS Safari는 주소창이 접히며 vh가 실제 화면과 어긋난다. */}
      <SheetContent
        side="bottom"
        className="gap-0 p-0 data-[side=bottom]:h-[85dvh]"
        showCloseButton={false}
      >
        {picking ? (
          <ChapterStep
            book={picking}
            // 다른 권을 고르는 중이면 짚어 줄 "현재 장"이 없다.
            currentChapterNum={picking.abbrev === bookAbbrev ? chapterNum : undefined}
            onBack={() => setPicking(null)}
            onPick={pick}
          />
        ) : (
          <BookStep currentAbbrev={bookAbbrev} onPick={setPicking} />
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * 1단계: 검색 + 66권 목록.
 *
 * 열면 **지금 읽는 권**이 화면 가운데 온다. 늘 창세기부터 시작하면 예레미야를 보다가
 * 시트를 열 때마다 매번 검색을 쳐야 했다. 앞뒤 권으로 조금씩 옮겨 가는 것도 목록에서
 * 바로 된다.
 *
 * 검색 input은 손대지 않았다. autofocus가 없어서 누르기 전엔 키보드가 안 뜬다 —
 * "목록으로 훑다가 필요하면 검색"이라는 흐름이 이미 성립해 있었고, 빠졌던 건 시작 위치뿐이다.
 */
function BookStep({
  currentAbbrev,
  onPick,
}: {
  currentAbbrev: string;
  onPick: (book: Book) => void;
}) {
  const [query, setQuery] = useState("");
  // 66개뿐이라 디바운스도 메모도 필요 없다. 매 입력마다 훑어도 공짜다.
  const q = query.trim();
  const matched = q ? books.filter((b) => b.name.includes(q)) : books;

  const currentRef = useRef<HTMLButtonElement>(null);

  // 빈 deps로 마운트에 한 번만. 시트는 열 때마다 새로 마운트되므로(forceMount 없음) 이걸로
  // "열 때마다 현재 권으로"가 성립한다.
  //
  // q를 의존성에 넣으면 안 된다. 키를 칠 때마다 목록이 다시 걸러지고, 그때마다 스크롤을
  // 잡아채면 검색 결과를 훑을 수가 없다.
  useLayoutEffect(() => centerInScrollArea(currentRef.current), []);

  return (
    <>
      <SheetHeader className="border-b border-border">
        <SheetTitle>성경 선택</SheetTitle>
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="권 이름 검색"
            aria-label="권 이름 검색"
            className={cn(
              "h-10 w-full rounded-lg border border-border bg-background ps-9 pe-3 text-base",
              "placeholder:text-muted-foreground/60",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            )}
          />
        </div>
      </SheetHeader>

      <ScrollArea className="min-h-0 flex-1">
        {matched.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {q}에 해당하는 권이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col p-2">
            {matched.map((book, i) => (
              <li key={book.abbrev}>
                {/* 구약과 신약 사이에만 띠를 넣는다. Book에 신·구약 필드가 없어 order로 가른다.
                    검색 중이면 걸러진 목록이라 경계가 의미 없으므로 넣지 않는다. */}
                {!q &&
                  book.order === LAST_OLD_TESTAMENT_ORDER + 1 &&
                  matched[i - 1]?.order === LAST_OLD_TESTAMENT_ORDER && (
                    <p className="px-3 pt-4 pb-1 text-xs font-bold text-muted-foreground/70">
                      신약
                    </p>
                  )}
                {!q && book.order === 1 && (
                  <p className="px-3 pt-1 pb-1 text-xs font-bold text-muted-foreground/70">구약</p>
                )}
                {/* ref는 li가 아니라 button에 건다. li에는 구약/신약 머리글이 같이 들어 있어
                    rect가 그만큼 커지고, 가운데 정렬이 그만큼 어긋난다.

                    bg-highlight는 원래 "선택/hover된 절의 배경"이지만 값도 뜻도 여기 맞는다 —
                    지금 짚고 있는 항목이다. hover와 같은 bg-muted를 쓰면 둘이 구분되지 않는다. */}
                <button
                  ref={book.abbrev === currentAbbrev ? currentRef : undefined}
                  type="button"
                  onClick={() => onPick(book)}
                  aria-current={book.abbrev === currentAbbrev ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-start",
                    "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    book.abbrev === currentAbbrev && "bg-highlight",
                  )}
                >
                  <span
                    className={cn(
                      "text-base text-foreground",
                      book.abbrev === currentAbbrev && "font-bold",
                    )}
                  >
                    {book.name}
                  </span>
                  <span className="flex items-center gap-2">
                    {book.abbrev === currentAbbrev && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        읽는 중
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{book.totalChapters}장</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </>
  );
}

/**
 * 2단계: 장 그리드. totalChapters가 books.json에 있어 본문 없이 그린다.
 *
 * 지금 읽는 권을 골랐으면 현재 장을 가운데로 올리고 채워서 짚는다. 시편 150장 그리드에서
 * 지금 어디쯤인지 안 보이는 건 권 목록과 같은 문제였다.
 */
function ChapterStep({
  book,
  currentChapterNum,
  onBack,
  onPick,
}: {
  book: Book;
  /** 이 권이 지금 읽는 권일 때만 들어온다. */
  currentChapterNum?: number;
  onBack: () => void;
  /** 목적지를 넘긴다 — 부모가 시트를 닫으면서 점프를 기록해야 하는데, 그 판단에 목적지가 필요하다. */
  onPick: (abbrev: string, chapterNum: number) => void;
}) {
  const router = useRouter();

  const currentRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => centerInScrollArea(currentRef.current), []);

  // Link가 아니라 router.push인 이유: 이동과 동시에 시트를 닫아야 한다. Link만 두면
  // 라우팅은 되는데 시트가 그대로 열려 있다.
  const go = (n: number) => {
    onPick(book.abbrev, n);
    router.push(`/bible/${book.abbrev}/${n}`);
  };

  return (
    <>
      <SheetHeader className="flex-row items-center gap-1 border-b border-border">
        <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="권 목록으로">
          <ChevronLeft className="size-5" />
        </Button>
        <SheetTitle>{book.name}</SheetTitle>
      </SheetHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid grid-cols-5 gap-2 p-4">
          {Array.from({ length: book.totalChapters }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              ref={n === currentChapterNum ? currentRef : undefined}
              // 채운 청록. 리더의 복사 버튼과 같은 "지금 이것" 표시다.
              variant={n === currentChapterNum ? "secondary" : "outline"}
              aria-current={n === currentChapterNum ? "true" : undefined}
              onClick={() => go(n)}
              className="h-11 tabular-nums"
            >
              {n}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}
