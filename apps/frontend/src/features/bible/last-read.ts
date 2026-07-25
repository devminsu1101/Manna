import { getBook } from "./books";

/**
 * 마지막에 읽던 장을 기억한다. "성경 읽기"를 누르면 창세기 1장이 아니라 거기로 간다.
 *
 * localStorage가 아니라 쿠키인 이유: 서버에서 읽어야 한다. 그래야 /bible이 서버에서
 * 리다이렉트를 끝내 깜빡임이 없고, BottomNav가 서버 컴포넌트로 남는다(클라이언트로
 * 내리면 ReaderChrome이 nav를 노드 슬롯으로 받는 구조가 흔들린다).
 * localStorage면 둘 다 잃는다.
 *
 * httpOnly가 아닌 이유: 쓰는 쪽이 클라이언트다(서버 컴포넌트는 쿠키를 못 쓴다).
 * 담기는 건 "gn/1" 같은 위치뿐이라 민감하지 않다.
 */
export const LAST_READ_COOKIE = "manna_last_read";

/** 1년. 성경 한 권 읽는 데 그만큼 걸리기도 한다. */
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * 지금 읽는 장을 기억한다. 클라이언트 전용 — 서버 컴포넌트는 쿠키를 쓸 수 없다.
 *
 * 진입할 때와 스크롤로 장이 넘어갈 때 **둘 다** 불러야 한다. 넘어갈 때만 부르면
 * 한 장을 열어 읽기만 하고 나간 사람은 아무것도 기억되지 않는다.
 */
export function rememberLastRead(abbrev: string, chapterNum: number): void {
  document.cookie = `${LAST_READ_COOKIE}=${abbrev}/${chapterNum}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

/**
 * 쿠키 값을 검증해 라우트 경로로 바꾼다. 못 믿을 값이면 null.
 *
 * **이 함수가 신뢰 경계다.** 쿠키는 사용자가 마음대로 고칠 수 있는 입력이고, 이 값이
 * redirect()의 경로로 들어간다. 검증 없이 흘리면 "//evil.com"이 오픈 리다이렉트가 되고
 * "../../x"가 경로를 빠져나간다. 그래서 형태만 보지 않고 **실재하는 권인지, 장이 그 권의
 * 범위 안인지**까지 확인한다. 통과한 값으로만 경로를 조립한다.
 */
export function lastReadPath(value: string | undefined): string | null {
  return lastReadLocation(value)?.path ?? null;
}

/**
 * 쿠키 값을 검증해 경로 + 표시 이름으로 바꾼다. 못 믿을 값이면 null.
 *
 * lastReadPath와 같은 신뢰 경계다(쿠키는 조작 가능한 입력 → 리다이렉트 경로로 들어간다).
 * 형태만 보지 않고 실재하는 권인지, 장이 범위 안인지까지 확인한다.
 * 메인 화면의 "최근 읽은 말씀"이 경로(링크)와 이름("마태복음 12장")을 둘 다 필요로 해서
 * path만 주던 lastReadPath를 이 함수로 감쌌다.
 */
export function lastReadLocation(
  value: string | undefined,
): { path: string; bookName: string; chapterNum: number } | null {
  if (!value) return null;

  const m = /^([a-z0-9]{1,4})\/([1-9][0-9]{0,2})$/.exec(value);
  if (!m) return null;

  const book = getBook(m[1]);
  if (!book) return null;

  const chapterNum = Number(m[2]);
  if (chapterNum > book.totalChapters) return null;

  return { path: `/bible/${book.abbrev}/${chapterNum}`, bookName: book.name, chapterNum };
}
