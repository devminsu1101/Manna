import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { ToneNavigation } from "@/components/ToneNavigation";
import { PushSessionSync } from "@/features/notification/PushSessionSync";
import { InstallGuide } from "@/features/install/InstallGuide";
import { SURFACE_COLOR } from "@/lib/brand";
import "./globals.css";

// Pretendard를 셀프 호스팅한다. CDN을 쓰면 크리티컬 패스에 서드파티 오리진이 붙고,
// 성경 본문처럼 텍스트가 꽉 찬 화면에서는 한글 폴백 플래시가 크게 눈에 띈다.
// TODO: 서브셋 없는 전체 variable 파일(2MB)이다. 한글 서브셋으로 줄일 것.
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--manna-font-sans",
  display: "swap",
  weight: "45 920",
});

const IOS_STARTUP_SIZES = [
  [375, 667, 2],
  [375, 812, 3],
  [390, 844, 3],
  [393, 852, 3],
  [402, 874, 3],
  [414, 896, 3],
  [428, 926, 3],
  [430, 932, 3],
  [440, 956, 3],
  [768, 1024, 2],
] as const;

export const metadata: Metadata = {
  // og:image(opengraph-image.tsx)는 절대 주소여야 카톡이 읽는다. Vercel이 운영 도메인을 넣어 준다.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: "만나",
  description: "말씀과 기도로 함께하는 공동체",
  appleWebApp: {
    capable: true,
    title: "만나",
    statusBarStyle: "default",
    startupImage: [
      "/startup/ios-430x932-3x.png",
      ...IOS_STARTUP_SIZES.map(([width, height, scale]) => ({
        url: `/startup/ios-${width}x${height}-${scale}x.png`,
        media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${scale})`,
      })),
    ],
  },
  // iOS Safari '홈 화면에 추가'가 /apple-touch-icon.png를 찾다 404를 낸다.
  // 이 링크를 주면 그걸 대신 쓴다 — 404도 없애고 홈 아이콘도 제대로 나온다.
  // 180px 전용 파일을 따로 둔다(iOS 홈 아이콘 규격). iOS는 투명을 검게 칠하므로 배경이 꽉 찬 그림이다.
  icons: { apple: "/icons/apple-touch-icon.png" },
};

/**
 * 기본 상단바 색. 공동체 · 나눔 · 로그인 · 404는 warm이다.
 * 성경·기도·첫 화면은 각 세그먼트에서 덮어쓴다.
 *
 * iOS standalone은 **앱을 켜는 순간** 매니페스트의 색을 쓰고, 이후 이 meta를 따른다.
 * 매니페스트는 노란 시작 화면, `/`의 viewport는 준비된 기도실의 love 색을 따른다.
 */
export const viewport: Viewport = {
  themeColor: SURFACE_COLOR.warm,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* 색이 바뀌는 이동만 문서 이동으로 돌린다 — iOS가 상태바 색을 다시 읽게. */}
        <ToneNavigation />
        <PushSessionSync />
        <InstallGuide />
        {children}
      </body>
    </html>
  );
}
