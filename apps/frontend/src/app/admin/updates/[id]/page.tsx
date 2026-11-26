import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getUpdate } from "@/features/updates/api";
import { UpdateForm } from "@/features/updates/UpdateForm";

export const metadata: Metadata = { title: "업데이트 편집 | 만나" };
export default async function EditUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const post = await getUpdate((await params).id, true);
  return <AppShell topBar={<MainTopBar title="업데이트 편집" />} className="space-y-6">
    <UpdateForm post={post} />
    {post.publishedAt && <Button asChild variant="outline" size="block"><Link href={`/mypage/updates/${post.id}`}>게시된 소식 보기</Link></Button>}
    <Button asChild variant="ghost" size="block"><Link href="/admin/updates">관리 목록으로</Link></Button>
  </AppShell>;
}
