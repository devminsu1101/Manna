"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiFetch } from "@/lib/api";

/** `communities.name VARCHAR(100)`. 서버도 같은 값으로 막는다. */
const NAME_MAX = 100;

/**
 * 공동체 대문 상단바의 방 이름(D-3626). 리더에게는 이름 옆에 연필이 붙는다 — 마이페이지 이름 고치기
 * (`EditableName`)와 같은 모양이다. 상단바는 좁아 그 자리에서 입력칸으로 바꾸지 않고 아래 시트를 연다.
 *
 * 저장은 `PATCH /api/v1/communities/{id}` `{ name }`. 끝나면 `router.refresh()`로 상단바 · 목록 카드가 다시 그려진다.
 */
export function CommunityTitle({
  communityId,
  name,
  leader,
}: {
  communityId: number;
  name: string;
  leader: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const ready = trimmed !== "" && trimmed !== name && trimmed.length <= NAME_MAX;

  if (!leader) return <h1 className="truncate text-lg font-bold text-foreground">{name}</h1>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/communities/${communityId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setValue(name);
          setError(null);
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-w-0 items-center gap-1.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-white/60"
        aria-label="공동체 이름 고치기"
      >
        <h1 className="truncate text-lg font-bold text-foreground">{name}</h1>
        <Pencil className="size-4 shrink-0 text-foreground/40" />
      </button>

      <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl px-4 pt-2 pb-8">
        <SheetHeader className="px-0">
          <SheetTitle>공동체 이름</SheetTitle>
        </SheetHeader>
        <form onSubmit={save} className="space-y-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={NAME_MAX}
            autoFocus
            aria-label="공동체 이름"
            className="h-11 w-full rounded-xl border border-border bg-white px-4 text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" className="h-11 rounded-xl" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" className="h-11 rounded-xl" disabled={!ready || saving}>
              {saving ? "저장하는 중…" : "저장"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
