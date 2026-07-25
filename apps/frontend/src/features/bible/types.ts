/**
 * 성경 도메인 타입.
 *
 * apps/init-db.sql의 books / chapters / verses 테이블을 그대로 따른다.
 * DB는 snake_case, 여기서는 camelCase — 변환은 경계(api.ts)에서 한 번만 한다.
 * 백엔드 API가 생기면 이 타입은 그대로 두고 api.ts만 바꾼다.
 */

/** 성경 권. books 테이블 대응. */
export type Book = {
  /** books.abbreviation — 라우트 키로도 쓴다. 예: "gn" */
  abbrev: string;
  /** books.name — 한글 권 이름. 예: "창세기" */
  name: string;
  /** 정경 순서 1~66. 권 목록 정렬용. */
  order: number;
  /** books.total_chapters */
  totalChapters: number;
};

/** 절. verses 테이블 대응. */
export type Verse = {
  /** verses.verse_num. 묶인 절이면 시작 번호 — 식별자도 이걸로 만든다. */
  verseNum: number;
  /**
   * 개역개정이 여러 절을 한 단락으로 묶은 곳의 끝 번호. 묶이지 않았으면 없다.
   * 예: 신 6:18-19 → verseNum 18, endVerseNum 19. 전체 31,077절 중 11곳뿐이다.
   */
  endVerseNum?: number;
  /** verses.text */
  text: string;
};

/** 장. chapters + verses 조인 결과. */
export type Chapter = {
  book: Book;
  /** chapters.chapter_num */
  chapterNum: number;
  verses: Verse[];
};
