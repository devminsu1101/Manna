"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { toneOf } from "@/lib/brand";

/**
 * **화면의 색이 바뀌는 이동만 문서 이동으로 바꾼다.** 아무것도 그리지 않는다.
 *
 * 왜 필요한가: 상태바(시계·배터리 뒤)를 칠하는 수단은 `<meta name="theme-color">` 하나인데
 * (D-2002), **iOS standalone PWA는 그 값을 문서 로드 시점에만 읽는다.** Next는 라우트마다
 * meta를 올바르게 갱신하지만 탭 이동이 전부 client-side라 iOS가 그 변경을 못 본다. 성경
 * 화면에서 앱을 껐다 켜면 그 뒤로 홈·공동체·기도 어디를 가도 상태바만 민트로 남았다.
 *
 * 성경 탭만 멀쩡했던 것이 답이었다 — `/bible`은 `redirect()`라 문서 이동이 일어나고
 * (Next 문서: "insert a meta tag to emit the redirect on the client side"), 그때 iOS가
 * theme-color를 다시 읽는다. 그 동작을 색이 바뀌는 모든 이동으로 넓힌 것이 이 파일이다.
 *
 * **같은 톤끼리는 건드리지 않는다.** 홈↔공동체(둘 다 warm)와 탭 안에서의 이동
 * (`/prayer` → `/prayer/22`)은 그대로 client-side라 빠르다. 대가를 치르는 것은 실제로
 * 색이 바뀌어야 하는 이동뿐이다.
 *
 * 링크마다 손대지 않고 클릭을 한곳에서 가로채는 이유: 톤이 바뀌는 링크가 하단 네비 말고도
 * 흩어져 있다(홈의 "최근 읽은 말씀", `PraySummaryRows`, 기도 빈 화면의 "공동체 보러 가기",
 * 공동체 대문의 기도짝 카드, 404의 "성경 읽기"). 일곱 곳을 고치고 앞으로도 기억하느니
 * 한 곳에서 라우팅 규칙(`toneOf`)을 보는 편이 작다.
 *
 * **캡처 단계**여야 한다. React는 리스너를 루트 컨테이너에 위임하는데 그건 document의
 * 자손이라, 버블 단계에서는 Next의 `<Link>`가 이미 client-side 이동을 시작한 뒤다.
 * 캡처에서 `stopPropagation`하면 이벤트가 React에 아예 닿지 않는다.
 */
export function ToneNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // 새 탭·다운로드·수식키 조합은 브라우저에게 맡긴다. 가로채면 그 동작을 망친다.
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin) return;
      if (toneOf(url.pathname) === toneOf(pathname)) return;

      e.preventDefault();
      e.stopPropagation();
      location.assign(url.href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}
