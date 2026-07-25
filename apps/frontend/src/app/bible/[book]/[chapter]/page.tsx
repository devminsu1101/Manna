import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BottomNav } from "@/components/BottomNav";
import { getChapter, getNextBook, getPrevBook } from "@/features/bible/api";
import { BibleHeader } from "@/features/bible/components/BibleHeader";
import { ChapterFeed } from "@/features/bible/components/ChapterFeed";
import { CurrentChapterProvider } from "@/features/bible/components/CurrentChapterProvider";
import { ReaderChrome } from "@/features/bible/components/ReaderChrome";
import { VerseSelectionProvider } from "@/features/bible/components/VerseSelectionProvider";

// Next 16에서 params는 Promise다. 반드시 await 해야 한다.
type PageProps = { params: Promise<{ book: string; chapter: string }> };

async function resolveChapter({ params }: PageProps) {
  const { book, chapter } = await params;
  return getChapter(book, Number(chapter));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const chapter = await resolveChapter(props);
  if (!chapter) return { title: "만나" };
  // 스크롤로 장이 넘어가면 ChapterFeed가 document.title을 갱신한다.
  return { title: `${chapter.book.name} ${chapter.chapterNum}장 | 만나` };
}

export default async function BibleChapterPage(props: PageProps) {
  const chapter = await resolveChapter(props);
  if (!chapter) notFound();

  const nextBook = getNextBook(chapter.book.abbrev);
  const prevBook = getPrevBook(chapter.book.abbrev);

  return (
    <VerseSelectionProvider>
      {/* 헤더가 장 숫자를 읽고 ChapterFeed가 그걸 쓴다. 둘 다 감싸야 한다. */}
      <CurrentChapterProvider initialChapterNum={chapter.chapterNum}>
        {/* sticky라 흐름에 남으므로 main보다 앞, 흐름상 최상단에 와야 한다.
            책 경계를 넘지 않으므로 권 이름은 피드 내내 고정이고, 장 숫자만 스크롤에 따라 바뀐다. */}
        <BibleHeader bookName={chapter.book.name} />

        {/* px-4를 주지 않는다 — 선택 하이라이트가 화면 끝까지 닿아야 한다. 여백은 절이 갖는다.
            pb-32는 고정된 네비와 나눔 버튼에 가리지 않기 위한 것.
            overflow-anchor:none — 이전 장을 앞에 붙일 때 ChapterFeed가 직접 스크롤을
            보정한다. Chrome의 native scroll anchoring을 끄지 않으면 둘이 겹쳐 튄다. */}
        <main className="flex-1 pb-32 [overflow-anchor:none]">
          <ChapterFeed initialChapter={chapter} nextBook={nextBook} prevBook={prevBook} />
        </main>

        <ReaderChrome nav={<BottomNav />} />
      </CurrentChapterProvider>
    </VerseSelectionProvider>
  );
}
