import { getBook } from "./books";
import { parseVerseId, type VerseId } from "./verse-id";

/** 선택된 절 하나. id에 권·장·절이 들어 있으므로 나머지 정보만 들고 다닌다. */
export type SelectedVerse = {
  id: VerseId;
  text: string;
  /** 개역개정이 여러 절을 한 단락으로 묶은 곳의 끝 번호. 묶이지 않았으면 없다. */
  endVerseNum?: number;
};

/** 붙어 있는 절들을 한 덩어리로 묶은 것. 머리말 한 줄 + 본문 한 줄이 된다. */
type Passage = {
  book: string;
  chapterNum: number;
  start: number;
  end: number;
  texts: string[];
};

/**
 * 선택한 절을 붙여넣기 좋은 텍스트로 만든다.
 *
 * 연속한 절은 한 덩어리로 묶고 끊기면 새 덩어리를 연다. 고전 13:10,11,13을 고르면
 *
 *   [고린도전서 13:10-11]
 *   온전한 것이 올 때에는 ... 어린 아이의 일을 버렸노라
 *
 *   [고린도전서 13:13]
 *   그런즉 믿음, 소망, 사랑 ...
 *
 * 절 번호를 본문에 섞지 않는다. 카톡에 붙이면 한 문단으로 읽혀야 하고, 번호는 머리말이
 * 이미 말해 준다. 장이 달라지면 번호가 이어져도(13:31 → 14:1) 덩어리를 나눈다 —
 * "13:31-14:1" 같은 표기는 머리말 한 줄에 담기지 않는다.
 *
 * @param verses 읽기 순서로 정렬된 선택 목록.
 */
export function buildCopyText(verses: readonly SelectedVerse[]): string {
  const passages: Passage[] = [];

  for (const verse of verses) {
    const { book, chapterNum, verseNum } = parseVerseId(verse.id);
    const end = verse.endVerseNum ?? verseNum;
    const last = passages[passages.length - 1];

    // 묶인 절(신 6:18-19) 다음에 붙는 건 20절이다. verseNum이 아니라 end를 기준으로 본다.
    const continues =
      last && last.book === book && last.chapterNum === chapterNum && last.end + 1 === verseNum;

    if (continues) {
      last.end = end;
      last.texts.push(verse.text);
    } else {
      passages.push({ book, chapterNum, start: verseNum, end, texts: [verse.text] });
    }
  }

  return passages.map(formatPassage).join("\n\n");
}

function formatPassage(passage: Passage): string {
  // 권 메타를 못 찾으면 약어라도 남긴다. 본문을 통째로 버리는 것보단 낫다.
  const bookName = getBook(passage.book)?.name ?? passage.book;
  const range =
    passage.start === passage.end ? `${passage.start}` : `${passage.start}-${passage.end}`;
  return `[${bookName} ${passage.chapterNum}:${range}]\n${passage.texts.join(" ")}`;
}
