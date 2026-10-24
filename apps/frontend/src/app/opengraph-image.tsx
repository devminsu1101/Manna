import { mascotOgImage, OG_SIZE } from "@/lib/og-image";

// 앱 주소를 공유하면 뜨는 그림 — 인사하는 만나. 하위 페이지도 자기 것이 없으면 이걸 쓴다.
export const alt = "만나";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return mascotOgImage("hi.png");
}
