import { notFound } from "next/navigation";
import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { getAdminUser } from "@/features/admin/api";
import { CommunitySection, EmptyRow } from "@/features/community/components/CommunitySection";
import { MainTopBar } from "@/features/home/MainTopBar";

type Props = { params: Promise<{ id: string }> };

/** 관리자가 보는 한 사람(D-3625). 속한 방과 기도제목 전체 기록 — 익명도 표시해서 보여 준다. */
export default async function AdminUserPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { user, communities, requests } = await getAdminUser(id);

  return (
    <AppShell topBar={<MainTopBar title={user.name} />} className="space-y-6">
      <section className="flex flex-col items-center gap-2 p-4">
        <Image
          src={user.profileImageUrl ?? "/mascot/default.png"}
          alt=""
          width={80}
          height={80}
          className={`size-20 rounded-full ${user.profileImageUrl ? "object-cover" : "object-contain"}`}
        />
        <p className="text-lg font-bold text-foreground">{user.name}</p>
        <p className="text-center text-sm text-foreground/60">
          {communities.join(" · ") || "공동체 없음"}
        </p>
      </section>

      <CommunitySection icon="/mascot/tears.png" title={`기도제목 ${requests.length}`} surface="love">
        {requests.length === 0 ? (
          <EmptyRow>아직 올린 기도제목이 없어요</EmptyRow>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="rounded-xl bg-white px-4 py-3">
              <p className="text-xs text-foreground/50">
                {r.createdAt.slice(0, 10)}
                {r.visibility === "anonymous" && " · 익명"}
              </p>
              <p className="mt-1 text-sm whitespace-pre-line text-foreground">{r.body}</p>
            </div>
          ))
        )}
      </CommunitySection>
    </AppShell>
  );
}
