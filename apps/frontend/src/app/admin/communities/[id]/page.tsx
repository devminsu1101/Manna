import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { getAdminCommunity } from "@/features/admin/api";
import { CommunitySection, EmptyRow, ROW_CLASS } from "@/features/community/components/CommunitySection";
import { MainTopBar } from "@/features/home/MainTopBar";

type Props = { params: Promise<{ id: string }> };

/** 관리자가 보는 한 방(D-3625). 멤버(대기 포함)와 그 방의 나눔 전부. */
export default async function AdminCommunityPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const c = await getAdminCommunity(id);

  return (
    <AppShell topBar={<MainTopBar title={c.name} />} className="space-y-6">
      <CommunitySection icon="/mascot/together.png" title={`멤버 ${c.members.length}`} surface="cool">
        {c.members.map((m) => (
          <Link key={m.userId} href={`/admin/users/${m.userId}`} className={ROW_CLASS}>
            <span className="flex min-w-0 items-center gap-2">
              <Image
                src={m.profileImageUrl ?? "/mascot/default.png"}
                alt=""
                width={32}
                height={32}
                className={`size-8 shrink-0 rounded-full ${m.profileImageUrl ? "object-cover" : "object-contain"}`}
              />
              <span className="truncate text-foreground">{m.name}</span>
            </span>
            <span className="shrink-0 text-xs text-foreground/60">
              {m.role === "leader" ? "리더" : m.status === "pending" ? "대기" : "멤버"}
            </span>
          </Link>
        ))}
      </CommunitySection>

      <CommunitySection icon="/mascot/warm.png" title={`나눔 ${c.sharings.length}`} surface="warm">
        {c.sharings.length === 0 ? (
          <EmptyRow>아직 나눔이 없어요</EmptyRow>
        ) : (
          c.sharings.map((s) => (
            <div key={s.id} className="rounded-xl bg-white px-4 py-3">
              <p className="text-xs text-foreground/50">
                {s.authorName} · {s.createdAt.slice(0, 10)}
              </p>
              <p className="mt-1 line-clamp-4 text-sm whitespace-pre-line text-foreground">{s.body}</p>
            </div>
          ))
        )}
      </CommunitySection>
    </AppShell>
  );
}
