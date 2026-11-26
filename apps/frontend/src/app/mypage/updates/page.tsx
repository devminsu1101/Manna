import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { listUpdates } from "@/features/updates/api";

export const metadata: Metadata = { title: "업데이트 소식 | 만나" };
export default async function UpdatesPage() {
  const updates = await listUpdates();
  return (
    <AppShell topBar={<MainTopBar title="업데이트 소식" />} className="space-y-6">
      <p className="text-sm text-foreground/60">만나가 조금씩 달라지는 소식을 전해요.</p>
      {updates.length === 0 && <p className="py-8 text-center text-foreground/60">아직 등록된 소식이 없어요.</p>}
      <ul className="divide-y divide-border">
        {updates.map((update) => (
          <li key={update.id}>
            <Link href={`/mypage/updates/${update.id}`} className="flex items-center gap-3 py-5 focus-visible:outline-2 focus-visible:outline-ring">
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-bold">{update.title}</h2>
                <time dateTime={update.publishedAt} className="mt-1 block text-sm text-foreground/60">
                  {new Date(update.publishedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                </time>
              </div>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
      <Button asChild variant="ghost" size="block"><Link href="/mypage">마이페이지로</Link></Button>
    </AppShell>
  );
}
