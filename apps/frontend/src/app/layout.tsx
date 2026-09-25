import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { ToneNavigation } from "@/components/ToneNavigation";
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

export const metadata: Metadata = {
  title: "만나",
  description: "말씀과 기도로 함께하는 공동체",
  // iOS Safari '홈 화면에 추가'가 /apple-touch-icon.png를 찾다 404를 낸다.
  // 이 링크를 주면 그걸 대신 쓴다 — 404도 없애고 홈 아이콘도 제대로 나온다.
  // 180px 전용 파일을 따로 둔다(iOS 홈 아이콘 규격). iOS는 투명을 검게 칠하므로 배경이 꽉 찬 그림이다.
  icons: { apple: "/icons/apple-touch-icon.png" },
};

/**
 * 기본 상단바 색. 홈 · 공동체 · /sharings/new · /login · /landing · 404가 전부 warm이라
 * 여기 한 줄이 그 전부를 덮는다. 성경·기도는 자기 세그먼트 layout에서 덮어쓴다.
 *
 * 매니페스트의 `theme_color`도 같은 warm이어야 한다(app/manifest.ts) — iOS standalone은
 * **앱을 켜는 순간**의 상태바 색을 매니페스트에서, 그 뒤로는 이 meta에서 가져온다.
 * start_url이 `/`라 둘이 같은 값이라야 켤 때 색이 튀지 않는다.
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
        {children}
      </body>
    </html>
  );
}
