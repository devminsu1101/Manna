"use client";

import { ChevronLeft, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

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
import type { Book } from "../types";
import { useCurrentChapterStore } from "./CurrentChapterProvider";

/**
 * 헤더의 "시편 43장"을 눌러 여는 권/장 선택 시트.
 *
 * 시트 전체(트리거 + 내용)를 여기서 소유한다. 트리거가 현재 장을 보여줘야 하는데 그건
 * 스토어에만 있고, 트리거와 내용은 같은 Sheet 안에 있어야 하기 때문이다. 그래서 헤더의
 * 스토어 구독이 이쪽으로 넘어왔다 — BibleHeader는 배치만 한다.
 *
 * 절은 고르지 않는다. 장까지만 고르고 라우팅한다.
 */
export function BiblePicker({ bookName }: { bookName: string }) {
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
          <ChapterStep book={picking} onBack={() => setPicking(null)} onPick={() => change(false)} />
        ) : (
          <BookStep onPick={setPicking} />
        )}
      </SheetContent>
    </Sheet>
  );
}

/** 1단계: 검색 + 66권 목록. */
function BookStep({ onPick }: { onPick: (book: Book) => void }) {
  const [query, setQuery] = useState("");
  // 66개뿐이라 디바운스도 메모도 필요 없다. 매 입력마다 훑어도 공짜다.
  const q = query.trim();
  const matched = q ? books.filter((b) => b.name.includes(q)) : books;

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
                <button
                  type="button"
                  onClick={() => onPick(book)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-start",
                    "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  )}
                >
                  <span className="text-base text-foreground">{book.name}</span>
                  <span className="text-xs text-muted-foreground">{book.totalChapters}장</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </>
  );
}

/** 2단계: 장 그리드. totalChapters가 books.json에 있어 본문 없이 그린다. */
function ChapterStep({
  book,
  onBack,
  onPick,
}: {
  book: Book;
  onBack: () => void;
  onPick: () => void;
}) {
  const router = useRouter();

  // Link가 아니라 router.push인 이유: 이동과 동시에 시트를 닫아야 한다. Link만 두면
  // 라우팅은 되는데 시트가 그대로 열려 있다.
  const go = (n: number) => {
    onPick();
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
            <Button key={n} variant="outline" onClick={() => go(n)} className="h-11 tabular-nums">
              {n}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}
