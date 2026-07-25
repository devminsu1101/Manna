import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LAST_READ_COOKIE, lastReadPath } from "@/features/bible/last-read";

/**
 * /bible — 마지막에 읽던 장으로 보낸다. 처음이면 창세기 1장.
 *
 * 화면이 없는 라우트다. BottomNav의 "성경 읽기"와 홈이 여기를 가리키고, 실제 목적지는
 * 매번 달라진다. 이 한 겹 덕분에 BottomNav가 정적인 href를 갖는 서버 컴포넌트로 남는다.
 *
 * Next 16에서 cookies()는 async다. 반드시 await.
 * 서버 컴포넌트에서 쿠키는 **읽기만** 된다 — 쓰기는 ChapterFeed가 클라이언트에서 한다.
 */
export default async function BibleIndexPage() {
  const value = (await cookies()).get(LAST_READ_COOKIE)?.value;
  // lastReadPath가 신뢰 경계다. 조작된 쿠키는 여기서 null이 되어 창세기 1장으로 떨어진다.
  redirect(lastReadPath(value) ?? "/bible/gn/1");
}
