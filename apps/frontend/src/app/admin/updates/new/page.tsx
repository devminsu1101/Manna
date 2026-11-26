import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { getMe } from "@/features/auth/api";
import { MainTopBar } from "@/features/home/MainTopBar";
import { UpdateForm } from "@/features/updates/UpdateForm";

export const metadata: Metadata = { title: "업데이트 작성 | 만나" };
export default async function NewUpdatePage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.isAdmin) notFound();
  return <AppShell topBar={<MainTopBar title="업데이트 작성" />} className="space-y-6">
    <UpdateForm />
    <Button asChild variant="ghost" size="block"><Link href="/admin/updates">관리 목록으로</Link></Button>
  </AppShell>;
}
