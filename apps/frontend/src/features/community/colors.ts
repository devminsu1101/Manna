/**
 * 공동체 카드 색 프리셋(D-3624). 백엔드 `Community.COLORS` · DB CHECK와 같은 6개다.
 *
 * - `card`: 목록 카드 왼쪽 60%의 배경. 글자(#333)가 잘 읽히는 파스텔.
 * - `dot`: 고르는 동그라미와 사진이 없을 때 오른쪽 칸 배경.
 *
 * 테마 토큰(globals.css)이 아니라 여기 두는 이유: 화면 톤이 아니라 리더가 고르는 **방의 데이터**다.
 * 클래스 문자열을 통째로 적어야 Tailwind가 뽑아낸다 — 조립하면 안 된다.
 */
export const COMMUNITY_COLORS = {
  yellow: { label: "노랑", card: "bg-[#fff1b8]", dot: "bg-[#ffcc00]" },
  mint: { label: "민트", card: "bg-[#c9f3f4]", dot: "bg-[#00c4cc]" },
  pink: { label: "핑크", card: "bg-[#ffd6df]", dot: "bg-[#ff2d55]" },
  green: { label: "초록", card: "bg-[#d3f2dc]", dot: "bg-[#34c759]" },
  blue: { label: "파랑", card: "bg-[#d6e6ff]", dot: "bg-[#3b82f6]" },
  purple: { label: "보라", card: "bg-[#e6dbff]", dot: "bg-[#8b5cf6]" },
} as const;

export type CommunityColor = keyof typeof COMMUNITY_COLORS;

export const COLOR_KEYS = Object.keys(COMMUNITY_COLORS) as CommunityColor[];
