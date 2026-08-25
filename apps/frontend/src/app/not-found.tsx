import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * 404. `notFound()`를 부르는 모든 곳과, 존재하지 않는 주소가 여기로 온다.
 *
 * 실제로 도달하는 경로는 둘이다.
 *  1. 성경 리더 — 없는 권(`/bible/zz/1`)이나 범위 밖 장(`/bible/gn/99`)에서 `notFound()`
 *  2. 아직 만들지 않은 라우트 — 하단 네비의 `/community`·`/prayer`·`/sharings/new`
 * 2번은 곧 각자의 "준비 중" 화면으로 대체된다. 그때까지 여기가 받는다.
 *
 * 그래서 문구는 성경에 한정하지 않되, 두 번째 버튼은 성경으로 보낸다 — 1번이 유일하게
 * 의도적으로 404를 부르는 자리라 되돌려 보낼 곳이 분명하다.
 *
 * 서버 컴포넌트다. 하단 네비를 두지 않는 것도 그 때문이 아니라 의도다 — 길을 잃은 화면에서
 * 선택지를 넷 주는 것보다 갈 곳 둘을 크게 주는 편이 낫다.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-muted px-8 py-16">
      <Image
        src="/mascot/tears.png"
        alt="울고 있는 만나 마스코트"
        width={180}
        height={180}
        priority
        className="size-24 object-contain"
      />

      
      <p className="mt-3 text-center text-sm leading-relaxed text-foreground/60">
        찾으시는 페이지가 없거나
        <br />
        아직 준비 중인 곳이에요
      </p>

      {/* 로그인 화면과 같은 큰 CTA 리듬(h-14 · rounded-xl · text-base). 상단바 아이콘 버튼과
          섞이지 않도록 전면 화면의 주 동작은 이 크기로 통일한다. */}
      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        <Button asChild className="h-14 w-full rounded-xl text-base font-bold">
          <Link href="/">홈으로 가기</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-14 w-full rounded-xl border-2 border-secondary text-base font-bold text-secondary"
        >
          <Link href="/bible">성경 읽기</Link>
        </Button>
      </div>
    </main>
  );
}
