import type { NextRequest } from "next/server";

import { getChapter } from "@/features/bible/api";

/**
 * GET /api/v1/bible/{book}/{chapter} — docs/03_API_SPEC.md 계약.
 *
 * 백엔드(Spring)가 같은 경로를 구현하면 이 파일은 지우고 클라이언트의
 * NEXT_PUBLIC_BIBLE_API_BASE_URL만 백엔드로 돌리면 된다.
 *
 * Server Action이 아니라 GET인 이유: Server Action은 POST RPC라 어떤 CDN도 캐시하지 못하고,
 * 백엔드가 낼 REST 계약과도 어긋난다. 성경 본문은 읽기 전용이라 GET이 맞다.
 */

// next.config.ts가 비어 있어 클래식 캐시 모델이 살아 있다. 응답을 풀 라우트 캐시에 넣는다.
export const dynamic = "force-static";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/v1/bible/[book]/[chapter]">) {
  const { book, chapter } = await ctx.params;
  const data = await getChapter(book, Number(chapter));

  if (!data) {
    return Response.json(
      { error: { code: "NOT_FOUND", message: "없는 권 또는 장입니다." } },
      { status: 404 },
    );
  }

  return Response.json(data, {
    headers: {
      // immutable을 쓰지 않는다. 불변인 건 성경 본문이지 우리 데이터가 아니다.
      // (실제로 원본을 통째로 갈아엎었다 — 이전 소스는 155절이 없고 욥기 장 번호가 밀려 있었다.)
      // URL은 배포마다 같으므로 immutable이면 이미 읽은 클라이언트에 수정본이 1년간
      // 도달하지 못한다. SWR은 성능은 그대로면서 24시간 내에 자가 치유된다.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=31536000",
    },
  });
}
