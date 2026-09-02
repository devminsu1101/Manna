"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

/**
 * 화면 셸. 뷰포트에 고정된 flex 컬럼이고 **스크롤은 가운데 `<main>`만 갖는다.**
 *
 * 왜 문서가 아니라 본문이 스크롤하나: iOS 고무줄 스크롤은 `sticky`든 `fixed`든 상단바를
 * 같이 끌고 내려간다. 그러면 상단바가 상태바에서 떨어지고 그 사이로 `<body>` 배경(흰색)이
 * 드러난다. 색을 맞춰도 소용없다 — **문서가 안 움직이면 문서가 튕길 것도 없고**, 튕김은
 * 여기 `<main>` 안에서 일어난다. 문서 잠금은 globals.css의 `:has([data-app-shell])`이 한다.
 *
 * **성경 리더는 이 셸을 쓰지 않는다.** ChapterFeed와 useHideOnScroll이 window.scrollY /
 * window.scrollTo / 뷰포트 루트 IntersectionObserver로 짜여 있고, D-1101~1105로 겨우 잡은
 * 스크롤 튐이 거기 걸려 있다. 리더의 고무줄 틈은 BibleHeader의 `header-bleed`가 색으로 덮는다.
 *
 * 서버 컴포넌트를 노드 슬롯(`topBar`·`children`)으로 받는다 — ReaderChrome이 `nav`를 받는
 * 것과 같은 이유다. 클라이언트 컴포넌트는 서버 컴포넌트를 동적 prop으로 만들 수는 없지만,
 * 이미 만들어진 노드는 받을 수 있다.
 */
export function AppShell({
  /** 상단바. 이게 있으면 하단 네비도 함께 붙는다(아래 주석 참고). */
  topBar,
  /** `<main>`에 얹을 클래스. cn(tailwind-merge)을 거치므로 기본 여백도 덮어쓸 수 있다. */
  className,
  children,
}: {
  topBar?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // 리렌더를 만들지 않으려고 onScroll이 ref만 갱신한다. 언마운트 때 el.scrollTop을 직접
  // 읽지 않는 이유이기도 하다 — cleanup 시점에는 엘리먼트가 이미 DOM에서 빠졌을 수 있다.
  const last = useRef(0);

  // Next의 스크롤 복원은 window에만 걸려서 내부 스크롤러는 뒤로가기에 맨 위로 리셋된다.
  // 중보기도실이 "들어가서 기도하고 나오기"를 반복하는 화면이라 그대로 두면 매일 거슬린다.
  // 도구는 jump-history.ts와 같은 sessionStorage다.
  useEffect(() => {
    const el = ref.current;
    const key = `manna:scroll:${pathname}`;

    const saved = Number(sessionStorage.getItem(key));
    if (el && saved > 0) el.scrollTop = saved;

    // ponytail: 탭을 다시 눌러 같은 경로로 들어와도 복원된다. "뒤로가기일 때만"을 가르려면
    // 내비게이션 타입이 필요한데 App Router가 주지 않는다. 같은 탭을 다시 누르는 일이
    // 드물어 지금은 그대로 둔다 — 거슬리면 popstate 플래그를 하나 두면 된다.
    return () => sessionStorage.setItem(key, String(last.current));
  }, [pathname]);

  return (
    // fixed inset-0이라 :has()를 모르는 구형 Safari에서도 레이아웃은 정상이다(거기서는
    // 문서 잠금만 안 걸려 오늘처럼 튕긴다). h-full로 두면 :has()가 안 먹는 순간 셸이 무너진다.
    <div data-app-shell className="fixed inset-0 flex flex-col">
      {topBar}

      {/* min-h-0이 핵심이다. flex 컬럼에서 이게 없으면 flex-1 자식이 콘텐츠 높이만큼
          부풀어 스크롤러가 아예 안 생긴다. */}
      <main
        ref={ref}
        onScroll={(e) => {
          last.current = e.currentTarget.scrollTop;
        }}
        className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-5", className)}
      >
        {children}
      </main>

      {/* 하단 네비는 topBar 유무로 갈린다. 지금 존재하는 모든 화면이 "탭이 가리키는 곳 =
          상단바 + 네비", "갇히면 안 되는 곳(로그인·랜딩·404) = 둘 다 없음"으로 정확히
          갈려서, prop을 하나 더 두면 항상 같은 값을 두 번 적게 된다. 예외가 생기면 그때. */}
      {topBar && <BottomNav />}
    </div>
  );
}
