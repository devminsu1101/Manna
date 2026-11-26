import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UpdatesLink() {
  return (
    <Button asChild variant="ghost" size="block" className="min-h-13 justify-between rounded-none px-0 text-sm font-medium">
      <Link href="/mypage/updates">
        업데이트 소식
        <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
      </Link>
    </Button>
  );
}
