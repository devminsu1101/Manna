import { redirect } from "next/navigation";

/**
 * 옛 "이전 기도제목" 화면. 마이페이지로 합쳤다(D-3609) — 이미 받은 링크 · 홈 화면 바로가기를 위해
 * 경로는 남겨 두고 보낸다.
 *
 * `requests`가 정적 세그먼트라 `[userId]`보다 먼저 매칭된다 — 지우면 이 주소가 사용자 상세로 빠진다.
 */
export default function MyPrayerRequestsPage() {
  redirect("/mypage");
}
