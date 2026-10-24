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
 * - **하나씩 눌러야 읽음**(사용자 결정). 시트를 열기만 해서는 점이 사라지지 않는다.
 * - 줄을 누르면 읽음을 보내고(기다리지 않는다 — 실패해도 이동은 한다) 그 화면으로 간다.
 * - 점은 화면마다 상단바가 새로 그려질 때 다시 센다. 실시간은 아니다 — 푸시가 붙을 때 다시 본다.
 * - 미로그인(401)이면 점 없이 벨만, 시트에는 로그인 안내.
 */
export function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  // null = 아직 안 불러옴, "signed-out" = 401
  const [items, setItems] = useState<AppNotification[] | "signed-out" | null>(null);

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
    try {
      const res = await fetch("/api/v1/notifications", { credentials: "include" });
      if (res.status === 401) return setItems("signed-out");
      if (!res.ok) return setItems([]);
      const data: { notifications: AppNotification[] } = await res.json();
      setItems(data.notifications);
      setUnread(data.notifications.filter((n) => !n.read).length);
    } catch {
      setItems([]);
    }
  }

  function go(n: AppNotification) {
    if (!n.read) {
      apiFetch(`/api/v1/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
      setItems((prev) =>
        Array.isArray(prev) ? prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)) : prev,
      );
      setUnread((count) => Math.max(0, count - 1));
    }
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

        {items === null ? (
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
