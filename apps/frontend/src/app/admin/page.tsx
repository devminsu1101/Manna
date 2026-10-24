import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { listAllCommunities, listAllUsers } from "@/features/admin/api";
import { COMMUNITY_COLORS } from "@/features/community/colors";
import { CommunitySection, ROW_CLASS } from "@/features/community/components/CommunitySection";
import { MainTopBar } from "@/features/home/MainTopBar";

export const metadata: Metadata = { title: "관리자 | 만나" };

/**
 * 읽기 전용 관리자(D-3625). 모든 공동체 · 모든 사람을 한 화면에. 방에 속하지 않아도 본다.
 * 쓰기(강퇴 · 삭제)는 없다 — 보기만 한다. 관리자가 아니면 404(`features/admin/api.ts`).
 */
export default async function AdminPage() {
  const [communities, users] = await Promise.all([listAllCommunities(), listAllUsers()]);

  return (
    <AppShell topBar={<MainTopBar title="관리자" />} className="space-y-6">
      <CommunitySection icon="/mascot/together.png" title={`공동체 ${communities.length}`} surface="warm">
        {communities.map((c) => (
          <Link key={c.id} href={`/admin/communities/${c.id}`} className={ROW_CLASS}>
            <span className="flex min-w-0 items-center gap-3">
              <span className={`size-3 shrink-0 rounded-full ${COMMUNITY_COLORS[c.color].dot}`} />
              <span className="min-w-0">
                <span className="block truncate font-bold text-foreground">{c.name}</span>
                <span className="block text-xs text-foreground/60">
                  리더 {c.leaderName ?? "-"} · {c.memberCount}명
                  {c.pendingCount > 0 && ` · 대기 ${c.pendingCount}`} · {c.createdAt.slice(0, 10)}
                </span>
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-foreground/40" />
          </Link>
        ))}
      </CommunitySection>

      <CommunitySection icon="/mascot/warm.png" title={`사람 ${users.length}`} surface="love">
        {users.map((u) => (
          <Link key={u.id} href={`/admin/users/${u.id}`} className={ROW_CLASS}>
            <span className="flex min-w-0 items-center gap-3">
              <Image
                src={u.profileImageUrl ?? "/mascot/default.png"}
                alt=""
                width={36}
                height={36}
                className={`size-9 shrink-0 rounded-full ${u.profileImageUrl ? "object-cover" : "object-contain"}`}
              />
              <span className="min-w-0">
                <span className="block truncate font-bold text-foreground">{u.name}</span>
                <span className="block truncate text-xs text-foreground/60">
                  {u.communities.join(" · ") || "공동체 없음"}
                </span>
                {u.latestRequest && (
                  <span className="block truncate text-xs text-foreground/50">
                    🙏 {u.latestRequest}
                  </span>
                )}
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-foreground/40" />
          </Link>
        ))}
      </CommunitySection>
    </AppShell>
  );
}
