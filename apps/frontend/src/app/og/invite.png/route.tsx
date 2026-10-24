import { mascotOgImage } from "@/lib/og-image";

/**
 * 초대 링크 미리보기 그림 — 화면과 같은 "함께하는 만나". `invite/[code]` 페이지 metadata가 가리킨다.
 *
 * `invite/[code]/opengraph-image`로 두지 않는 이유: 동적 세그먼트 안이라 요청마다 그리게 되고,
 * 그때 `public/` 파일을 읽는 것이 서버 함수에 실린다는 보장이 없다. 여기는 빌드할 때 한 번 그린다.
 */
export const dynamic = "force-static";

export function GET() {
  return mascotOgImage("together.png");
}
