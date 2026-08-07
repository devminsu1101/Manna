import type { Verse } from "../types";
import { toVerseId } from "../verse-id";
import { VerseRow } from "./VerseRow";

/** 절 목록. 서버 컴포넌트 — 목록을 그리는 코드는 클라이언트로 보내지 않는다. */
export function VerseList({
  book,
  chapterNum,
  verses,
}: {
  book: string;
  chapterNum: number;
  verses: Verse[];
}) {
  return (
    <ul className="flex flex-col gap-1 text-base leading-relaxed">
      {verses.map((verse) => (
        <VerseRow
          key={verse.verseNum}
          verseId={toVerseId(book, chapterNum, verse.verseNum)}
          // 묶인 절은 "18-19"로 보여준다. 그냥 18만 찍으면 다음이 20이라 절이 빠진 것처럼 읽힌다.
          label={verse.endVerseNum ? `${verse.verseNum}-${verse.endVerseNum}` : `${verse.verseNum}`}
          text={verse.text}
          endVerseNum={verse.endVerseNum}
        />
      ))}
    </ul>
  );
}
