import type { MetadataRoute } from "next";

import { BACKGROUND_COLOR, SURFACE_COLOR } from "@/lib/brand";

// 서비스워커는 아직 없다(로드맵 Phase 3). 따라서 매니페스트는 감지되지만
// 설치 가능(installable) 판정은 나지 않는 것이 정상이다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "만나",
    short_name: "만나",
    description: "말씀과 기도로 함께하는 공동체",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: BACKGROUND_COLOR,
    // **실행 직후 상태바 색이 이 값이다.** iOS standalone은 앱을 켤 때 문서의 theme-color가
    // 아니라 여기를 본다 — 브랜드 노랑(#FFCC00)을 두었더니 켤 때마다 시계 뒤가 노랬다.
    // start_url이 `/`(홈)이므로 홈의 상단바 색과 같아야 한다.
    // ⚠️ iOS는 '홈 화면에 추가' 시점에 매니페스트를 캐시한다. 이 값을 바꿔도 이미 설치된
    //    앱에는 반영되지 않는다 — 지우고 다시 추가해야 보인다.
    theme_color: SURFACE_COLOR.warm,
    icons: [
      // 브랜드 노랑 위에 인사하는 마스코트(public/mascot/hi.png). 파비콘·apple-touch-icon과 같은 그림.
      // maskable은 안드로이드가 원·물방울 등으로 잘라 내므로 마스코트를 더 작게(안전 영역 80% 안) 뒀다.
      // ⚠️ 폰은 '홈 화면에 추가' 시점에 아이콘을 캐시한다 — 이미 추가한 앱은 지우고 다시 추가해야 바뀐다.
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
