/**
 * 절의 전역 식별자.
 *
 * 여러 장이 한 화면에 이어 붙으므로 verseNum만으로는 3장 9절과 4장 9절이 충돌한다.
 * 객체 대신 문자열인 이유: Set은 객체를 참조 동일성으로 다루므로 객체를 키로 쓰려면
 * 어차피 파생 문자열이 필요하다. 그럴 바엔 처음부터 문자열로 둔다.
 */
export type VerseId = string;

/** 예: toVerseId("gn", 3, 9) → "gn:3:9" */
export function toVerseId(book: string, chapterNum: number, verseNum: number): VerseId {
  return `${book}:${chapterNum}:${verseNum}`;
}

export function parseVerseId(id: VerseId): {
  book: string;
  chapterNum: number;
  verseNum: number;
} {
  const [book, chapterNum, verseNum] = id.split(":");
  return { book, chapterNum: Number(chapterNum), verseNum: Number(verseNum) };
}

/** 선택한 절을 읽기 순서로 정렬한다. 나눔 텍스트("창세기 3:9-10")를 만들 때 쓴다. */
export function compareVerseIds(a: VerseId, b: VerseId): number {
  const left = parseVerseId(a);
  const right = parseVerseId(b);
  return left.chapterNum - right.chapterNum || left.verseNum - right.verseNum;
}
