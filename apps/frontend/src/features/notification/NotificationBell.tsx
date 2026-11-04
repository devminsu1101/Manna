"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

import { timeAgo } from "./time-ago";
import type { AppNotification } from "./types";

/**
 * 상단바 오른쪽 벨(D-3627). 안 읽은 알림이 있으면 빨간 점, 누르면 아래 시트에 최근 30일 목록.
 *
 * - 시트를 열면 보관 기간·목록 개수와 무관하게 모든 미읽음 알림을 읽는다.
 * - 줄을 누르면 해당 화면으로 이동한다.
 * - 점은 화면마다 상단바가 새로 그려질 때 다시 센다. 실시간은 아니다 — 푸시가 붙을 때 다시 본다.
 * - 미로그인(401)이면 점 없이 벨만, 시트에는 로그인 안내.
 */
export function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  // null = 아직 안 불러옴, "signed-out" = 401
  const [items, setItems] = useState<AppNotification[] | "signed-out" | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/notifications/unread-count", { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<{ count: number }>) : null))
      .then((data) => alive && data && setUnread(data.count))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function load() {
    setItems(null);
    setLoadError(false);
    try {
      const res = await apiFetch("/api/v1/notifications/read-all", { method: "POST" });
      if (res.status === 401) return setItems("signed-out");
      if (!res.ok) throw new Error(`읽음 처리 실패 (${res.status})`);
      const data: { notifications: AppNotification[] } = await res.json();
      setItems(data.notifications);
      setUnread(0);
    } catch {
      setLoadError(true);
    }
  }

  function go(n: AppNotification) {
    setOpen(false);
    if (n.linkPath) router.push(n.linkPath);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-lg"
        className="relative shrink-0"
        aria-label={unread > 0 ? `알림, 안 읽은 알림 ${unread}개` : "알림"}
        onClick={() => {
          setOpen(true);
          load();
        }}
      >
        <Bell className="size-6" />
        {unread > 0 && <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-accent" />}
      </Button>

      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[70dvh] gap-2 rounded-t-2xl px-4 pt-2 pb-8"
      >
        <SheetHeader className="px-0">
          <SheetTitle>알림</SheetTitle>
        </SheetHeader>

        {loadError ? (
          <div className="py-8 text-center">
            <p role="alert" className="text-sm text-destructive">알림을 불러오지 못했어요. 다시 시도해 주세요.</p>
            <Button variant="outline" className="mt-3" onClick={load}>다시 시도</Button>
          </div>
        ) : items === null ? (
          <p className="py-10 text-center text-sm text-foreground/50">불러오는 중…</p>
        ) : items === "signed-out" ? (
          <div className="py-6 text-center">
            <p className="text-sm text-foreground/60">로그인하면 알림을 받을 수 있어요</p>
            <Button asChild variant="warm" size="block" className="mt-4">
              <Link href="/login" onClick={() => setOpen(false)}>
                로그인하러 가기
              </Link>
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/50">아직 알림이 없어요</p>
        ) : (
          <ul className="min-h-0 space-y-1 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => go(n)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                    n.read ? "hover:bg-foreground/5" : "bg-surface-love",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm leading-relaxed",
                      n.read ? "text-foreground/60" : "font-bold text-foreground",
                    )}
                  >
                    {n.body}
                  </span>
                  <span className="shrink-0 pt-0.5 text-xs text-foreground/40">{timeAgo(n.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
