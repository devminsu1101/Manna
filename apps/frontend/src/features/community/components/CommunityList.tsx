"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { CommunitySummary } from "../types";
import { CommunityCard } from "./CommunityCard";

export function CommunityList({ communities }: { communities: CommunitySummary[] }) {
  const [items, setItems] = useState(communities);
  const [pending, setPending] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 목록에 다시 들어왔을 때 서버의 읽음 상태를 확인한다. 열린 동안 자동 재정렬하지 않는다.
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/communities", { credentials: "include", cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItems(data.communities.map((c: CommunitySummary & { status: CommunitySummary["myStatus"] }) => ({ ...c, myStatus: c.status })));
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("최신 나눔 상태를 불러오지 못했어요. 다시 방문해 주세요.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [communities]);

  async function togglePin(community: CommunitySummary) {
    if (pending !== null) return;
    setPending(community.id);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/communities/${community.id}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !community.pinned }),
      });
      if (!res.ok) throw new Error();
      setItems((current) => current.map((c) => c.id === community.id ? { ...c, pinned: !community.pinned } : c));
    } catch {
      setError("고정을 저장하지 못했어요. 다시 눌러 주세요.");
    } finally {
      setPending(null);
    }
  }

  const sorted = [...items].sort((a, b) => {
    const rank = (c: CommunitySummary) => c.pinned ? 0 : c.unreadSharingAt ? 1 : 2;
    const difference = rank(a) - rank(b);
    if (difference) return difference;
    if (!a.pinned && a.unreadSharingAt && b.unreadSharingAt) {
      return Date.parse(b.unreadSharingAt) - Date.parse(a.unreadSharingAt);
    }
    return 0;
  });

  return <>
    {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
    <ul className="space-y-3">
      {sorted.map((community) => <li key={community.id}>
        {community.myStatus === "pending" ? (
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-4">
            <span className="min-w-0 truncate font-bold text-foreground/50">{community.name}</span>
            <span className="ml-3 shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-foreground/50">승인 대기 중</span>
          </div>
        ) : (
          <CommunityCard
            name={community.name} memberCount={community.memberCount}
            color={community.color ?? "yellow"} coverImageUrl={community.coverImageUrl ?? null}
            href={`/communities/${community.id}`} pinned={community.pinned}
            onPin={() => togglePin(community)} pinPending={loading || pending !== null}
          />
        )}
      </li>)}
    </ul>
  </>;
}
