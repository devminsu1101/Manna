import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MainTopBar } from "@/features/home/MainTopBar";
import { getSharing } from "@/features/sharing/api";
import { EditSharingForm } from "@/features/sharing/components/EditSharingForm";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "나눔 수정 | 만나" };

/** 내 나눔만 고칠 수 있다(D-3504). 남의 글이면 주소를 찍어 들어와도 404로 둔다. */
export default async function EditSharingPage({ params }: PageProps) {
  const sharing = await getSharing(Number((await params).id));
  if (!sharing?.mine) notFound();

  return (
    <AppShell
      topBar={<MainTopBar icon="/mascot/together.png" title="나눔 수정" />}
      className="flex flex-col space-y-2"
    >
      <EditSharingForm id={sharing.id} initialBody={sharing.body} />
      <Button asChild variant="ghost" className="h-11 w-full">
        <Link href={`/sharings/${sharing.id}`}>취소</Link>
      </Button>
    </AppShell>
  );
}
