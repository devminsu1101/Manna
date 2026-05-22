import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Manna",
  description: "서로 사랑하는 공동체 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full`}>
      <body className="h-full bg-gray-100 flex justify-center">
        <div className="w-full max-w-[402px] min-h-full bg-white relative flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
