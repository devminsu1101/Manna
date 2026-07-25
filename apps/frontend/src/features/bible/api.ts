import "server-only";

import { books, getBook } from "./books";
import type { Book, Chapter, Verse } from "./types";

/**
 * 성경 데이터 접근 계층.
 *
 * 지금은 로컬 JSON(scripts/build-bible.mjs 산출물)에서 읽는다.
 * 백엔드의 GET /api/v1/bible/{book}/{chapter}가 생기면 이 파일만 fetch로 바꾼다.
 * 호출부(page/컴포넌트)는 그대로 둔다.
 *
 * 권 **메타**(books/getBook)는 books.ts에 있고 여기서 재수출한다. 그쪽은 server-only가
 * 아니어서 선택 시트가 클라이언트에서 쓴다. 이 파일이 server-only인 건 getChapter가
 * 권별 본문을 동적 import하기 때문이다 — 그건 절대 클라이언트로 가면 안 된다.
 */
export { books, getBook };

/** 권별 JSON 파일의 형태. build-bible.mjs가 쓰는 구조. */
type BookFile = Book & {
  /**
   * chapters[장index] = 그 장의 절 목록.
   *
   * 절 번호를 배열 인덱스에서 유도하지 않고 절마다 들고 있다. 개역개정은 번호를 건너뛰기
   * 때문이다 — 행 24장은 6절 다음이 8절이고(6:하반~8:상반을 들어냈다), 신 6:18-19처럼
   * 여러 절을 한 단락으로 묶은 곳도 있다. index+1로 계산하면 그런 장의 번호가 전부 밀린다.
   */
  chapters: Verse[][];
};

/**
 * 정경 순서상 다음 권. 마지막 권(요한계시록)이면 null.
 *
 * 연속 스크롤은 책 경계를 넘지 않으므로, 마지막 장 끝이 막다른 길이 되지 않게
 * 다음 권으로 가는 링크를 제공하는 데 쓴다.
 */
export function getNextBook(abbrev: string): Book | null {
  const book = getBook(abbrev);
  if (!book) return null;
  return books.find((b) => b.order === book.order + 1) ?? null;
}

/**
 * 정경 순서상 이전 권. 첫 권(창세기)이면 null.
 *
 * getNextBook의 거울. 위로 거슬러 올라가는 스크롤도 책 경계를 넘지 않으므로,
 * 첫 장의 머리가 막다른 길이 되지 않게 이전 권으로 가는 링크에 쓴다.
 */
export function getPrevBook(abbrev: string): Book | null {
  const book = getBook(abbrev);
  if (!book) return null;
  return books.find((b) => b.order === book.order - 1) ?? null;
}

/**
 * 한 장을 읽어온다. 없는 권/장이면 null.
 *
 * 권별로 동적 import한다. 전체 성경은 4.5MB라 통째로 import하면 요청과 무관한
 * 65권까지 서버 번들에 들어간다.
 */
export async function getChapter(
  abbrev: string,
  chapterNum: number,
): Promise<Chapter | null> {
  const book = getBook(abbrev);
  if (!book) return null;
  if (!Number.isInteger(chapterNum) || chapterNum < 1 || chapterNum > book.totalChapters) {
    return null;
  }

  const file: BookFile = (await import(`./data/${abbrev}.json`)).default;
  const verses = file.chapters[chapterNum - 1];
  if (!verses) return null;

  return { book, chapterNum, verses };
}
