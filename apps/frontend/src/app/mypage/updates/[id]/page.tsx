import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getUpdate } from "@/features/updates/api";

export const metadata: Metadata = { title: "업데이트 소식 | 만나" };
export default async function UpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const post = await getUpdate((await params).id);
  return (
    <AppShell topBar={<MainTopBar title="업데이트 소식" />} className="space-y-6">
      <article className="space-y-4">
        <h2 className="text-xl font-bold break-words">{post.title}</h2>
        <time dateTime={post.publishedAt!} className="block text-sm text-foreground/60">
          {new Date(post.publishedAt!).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
        </time>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.body}</p>
        {post.photoUrl && <Image src={post.photoUrl} alt={`${post.title} 첨부 사진`} width={1200} height={900} unoptimized className="h-auto w-full rounded-xl" />}
      </article>
      <Button asChild variant="ghost" size="block"><Link href="/mypage/updates">소식 목록으로</Link></Button>
    </AppShell>
  );
}
