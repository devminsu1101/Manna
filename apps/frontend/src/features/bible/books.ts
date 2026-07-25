import booksJson from "./data/books.json";
import type { Book } from "./types";

/**
 * 권 메타 66개. **의도적으로 server-only가 아니다** — 선택 시트가 클라이언트에서 쓴다.
 *
 * api.ts에서 이것만 떼어낸 이유: api.ts는 getChapter가 권별 본문을 동적 import하므로
 * 반드시 서버에 남아야 하고, 그래서 파일 전체가 "server-only"다. 그런데 시트는 권 목록과
 * 장 수가 필요하다. 메타만 여기로 내리면 본문은 서버에 그대로 둔 채 목록만 공유된다.
 *
 * 클라이언트 번들에 들어가도 66개 × 4필드 = ~4KB다. 본문(전체 4.5MB)과는 무게가 다르다.
 * totalChapters가 여기 있어서 장 그리드는 본문을 한 글자도 안 받고 그릴 수 있다.
 */
export const books: Book[] = booksJson;

/** abbrev로 권 메타를 찾는다. 없으면 null. */
export function getBook(abbrev: string): Book | null {
  return books.find((b) => b.abbrev === abbrev) ?? null;
}

/** 정경 순서상 구약의 마지막(말라기). 신·구약을 나눌 필드가 Book에 없어 order로 가른다. */
export const LAST_OLD_TESTAMENT_ORDER = 39;
