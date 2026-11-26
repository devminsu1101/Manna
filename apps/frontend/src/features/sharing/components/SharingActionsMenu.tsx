"use client";

import { useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/** 내 나눔의 수정·삭제 메뉴. 목록과 상세의 프로필 줄에서 함께 사용한다. */
export function SharingActionsMenu({ id, communityId, preview }: {
  id: number;
  communityId: number | null;
  preview: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);

  async function remove() {
    if (locked.current || !window.confirm("이 공동체에서 이 나눔을 지울까요?")) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/sharings/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error();
      if (!preview) router.replace(communityId ? `/communities/${communityId}` : "/communities");
      router.refresh();
    } catch {
      setError("나눔을 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  const itemClass = "flex min-h-11 cursor-pointer items-center rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted";
  return (
    <div className="relative shrink-0">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon" className="size-11" disabled={busy} aria-label="나눔 메뉴">
            <MoreHorizontal className="size-5" aria-hidden="true" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={4}
            className="z-50 min-w-32 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md">
            <DropdownMenu.Item asChild className={itemClass}>
              <Link href={`/sharings/${id}/edit`}>수정하기</Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item className={`${itemClass} text-destructive`} onSelect={() => { void remove(); }}>
              삭제하기
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {error && <p role="alert" className="absolute right-0 top-full z-10 w-60 rounded-lg border bg-background p-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
