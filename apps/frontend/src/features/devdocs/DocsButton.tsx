"use client";

import { FileText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useMe } from "@/features/auth/useMe";

/**
 * 개발 문서(`/dev/docs`)로 가는 상단바 아이콘. **개발자 계정에게만** 보인다.
 *
 * 개발자 판정은 `NEXT_PUBLIC_DEV_USER_IDS`(쉼표로 구분한 `users.id`)다. 로컬 DB와 프로덕션 DB의
 * id가 다를 수 있어 코드에 박지 않는다 — 로컬은 `.env.local`, 배포는 Vercel 환경변수.
 * `NEXT_PUBLIC_`이라 **빌드 때 값이 박힌다**: Vercel에서 바꾸면 재배포해야 먹는다.
 *
 * ⚠️ 접근 통제가 아니라 **버튼 숨기기**다. `/dev/docs` 자체는 누구나 열 수 있고, 그래도 되는
 * 이유는 같은 내용이 공개 저장소에 이미 있어서다. 실사용자 화면에 개발자 버튼이 섞이지
 * 않게 하는 것이 목적이다. 판정 전·비개발자면 자리도 차지하지 않는다.
 */
const DEV_USER_IDS = new Set(
  (process.env.NEXT_PUBLIC_DEV_USER_IDS ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0),
);

export function DocsButton() {
  const { me } = useMe();
  if (!me || !DEV_USER_IDS.has(me.id)) return null;

  return (
    <Button asChild variant="ghost" size="icon-lg" aria-label="개발 문서" className="shrink-0">
      <Link href="/dev/docs">
        <FileText className="size-6" />
      </Link>
    </Button>
  );
}
