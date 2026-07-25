import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { BRAND_COLOR } from "@/lib/brand";
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
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
