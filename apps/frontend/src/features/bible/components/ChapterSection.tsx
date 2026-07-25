"use client";

import type { Chapter } from "../types";
import { VerseList } from "./VerseList";

/**
 * 장 하나. 제목 밴드가 sticky다.
 *
 * 밴드가 section의 직계 자식이고 section이 절 목록까지 감싸는 게 핵심이다.
 * sticky는 부모 박스 안에 갇히므로, 밴드가 그 장 내내 상단에 붙어 있다가
 * 다음 섹션의 밴드에 밀려 나간다. JS 없이 시안의 동작이 그대로 나온다.
 *
 * z-20은 상단 헤더(z-30)보다 낮아야 한다. 밴드는 헤더 밑으로 미끄러져 들어가 가려지고,
 * 바로 그 시점에 헤더의 장 숫자가 다음 장으로 넘어간다. 배경(bg-header)이 서로 같아서
 * 이어지듯 보인다. 이 컴포넌트는 헤더의 존재를 몰라도 되고, top은 영원히 0이다.
 *
 * 헤더가 항상 떠 있으므로 밴드가 top-0에 붙어 있는 동안은 늘 헤더에 가려 안 보인다.
 * 즉 sticky의 시각적 효과는 지금 없다 — 밴드는 사실상 스쳐 지나가는 제목이다.
 * 그래도 남겨 둔 이유는 헤더보다 밴드가 커지는 순간(더 긴 제목, 더 작은 헤더) 다시
 * 살아나는 안전판이고, 지우면 이 장치를 되살릴 때 아래 주의사항을 다시 발견해야 하기 때문이다.
 *
 * 주의: section과 문서 루트 사이의 어떤 조상도 overflow(hidden/auto/scroll)나
 * transform을 가지면 안 된다. 전자는 sticky를 조용히 죽이고 후자는 containing block을
 * 만들어 기준을 바꾼다. 그래서 이 화면은 ScrollArea를 쓰지 않고 문서 자체가 스크롤한다.
 */
export function ChapterSection({
  chapter,
  registerSection,
}: {
  chapter: Chapter;
  registerSection: (chapterNum: number, el: HTMLElement | null) => void;
}) {
  const headingId = `chapter-${chapter.chapterNum}`;

  return (
    <section
      // ref 콜백은 블록 본문이어야 한다. React 19는 반환값을 cleanup 함수로 취급한다.
      ref={(el) => {
        registerSection(chapter.chapterNum, el);
      }}
      data-chapter={chapter.chapterNum}
      aria-labelledby={headingId}
    >
      <h2
        id={headingId}
        className="sticky top-0 z-20 border-b border-border bg-header px-4 py-3 text-center text-lg font-bold text-foreground"
      >
        {chapter.book.name} {chapter.chapterNum}장
      </h2>
      <VerseList
        book={chapter.book.abbrev}
        chapterNum={chapter.chapterNum}
        verses={chapter.verses}
      />
    </section>
  );
}
