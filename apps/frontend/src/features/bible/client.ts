import type { Chapter } from "./types";

/**
 * 브라우저에서 장을 불러온다. api.ts는 "server-only"라 클라이언트에서 쓸 수 없다.
 *
 * 비어 있으면 same-origin의 Next 라우트 핸들러를 쓴다.
 * 백엔드(Spring)가 준비되면 이 환경변수만 백엔드 주소로 바꾸면 된다. (CORS 헤더 필요)
 */
const BASE = process.env.NEXT_PUBLIC_BIBLE_API_BASE_URL ?? "";

/** 없는 권/장이면 null, 네트워크·서버 오류면 throw. */
export async function fetchChapter(book: string, chapterNum: number): Promise<Chapter | null> {
  // cache 옵션을 주지 않는다. 기본 모드가 응답의 Cache-Control을 존중하므로
  // 같은 세션에서 다시 읽는 장은 메모리 캐시에서 바로 나온다.
  const res = await fetch(`${BASE}/api/v1/bible/${book}/${chapterNum}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`장을 불러오지 못했습니다: ${res.status}`);
  return res.json();
}
