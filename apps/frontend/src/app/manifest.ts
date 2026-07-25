import type { MetadataRoute } from "next";

import { BACKGROUND_COLOR, BRAND_COLOR } from "@/lib/brand";

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
    theme_color: BRAND_COLOR,
    icons: [
      // TODO: 브랜드 색 단색 플레이스홀더. Figma에서 실제 아이콘을 export해 교체할 것.
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
