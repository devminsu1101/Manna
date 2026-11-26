import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { listAdminUpdates } from "@/features/updates/api";

export const metadata: Metadata = { title: "업데이트 관리 | 만나" };
export default async function AdminUpdatesPage() {
  const posts = await listAdminUpdates();
  return <AppShell topBar={<MainTopBar title="업데이트 관리" />} className="space-y-6">
    <Button asChild size="block"><Link href="/admin/updates/new">새 소식 작성</Link></Button>
    {posts.length === 0 && <p className="text-center text-foreground/60">첫 업데이트 소식을 작성해 보세요.</p>}
    <ul className="divide-y divide-border">{posts.map((post) => <li key={post.id}>
      <Link href={`/admin/updates/${post.id}`} className="block space-y-1 py-4 focus-visible:outline-ring">
        <span className="text-xs text-foreground/60">{post.publishedAt ? "게시됨" : "임시저장"}</span>
        <span className="block break-words font-bold">{post.title}</span>
      </Link>
    </li>)}</ul>
    <Button asChild variant="ghost" size="block"><Link href="/admin">관리자로</Link></Button>
  </AppShell>;
}
