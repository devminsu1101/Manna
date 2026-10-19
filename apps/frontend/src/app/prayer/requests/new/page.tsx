import { redirect } from "next/navigation";

import { composeHref } from "@/features/compose/href";

/**
 * 옛 기도제목 작성 화면. + 화면으로 합쳤다(D-3610) — 기도제목이 먼저 골라진 채로 연다.
 * 이미 받은 링크 · 바로가기를 위해 경로는 남겨 둔다.
 */
export default function NewPrayerRequestPage() {
  redirect(composeHref({ kind: "prayer" }));
}
