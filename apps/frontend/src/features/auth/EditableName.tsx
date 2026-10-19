"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/** `users.name VARCHAR(50)`. 서버도 같은 값으로 막는다. */
const NAME_MAX = 50;

/**
 * 마이페이지 이름 + 연필 버튼(D-3608). 누르면 그 자리에서 입력칸으로 바뀐다.
 *
 * 저장은 `PATCH /api/v1/me` — 이 경로는 라우트 핸들러가 중계한다(`app/api/v1/me/route.ts`).
 * 저장 뒤 `router.refresh()`로 서버 컴포넌트를 다시 그린다. 상단바 프로필(`useMe`)은
 * 다음 화면 이동 때 새 이름을 읽는다.
 *
 * `trailing`은 연필 오른쪽에 붙는 버튼 자리다 — 사진 바꾸기 카메라(ProfileHeader). 고치는 중엔 숨긴다.
 */
export function EditableName({ name, trailing }: { name: string; trailing?: React.ReactNode }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const ready = trimmed !== "" && trimmed !== name && trimmed.length <= NAME_MAX;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/api/v1/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.status === 401) return router.push("/login");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex max-w-full items-center">
        <button
          type="button"
          onClick={() => {
            setValue(name);
            setEditing(true);
          }}
          className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-white/60"
          aria-label="이름 고치기"
        >
          <span className="truncate text-lg font-bold text-foreground">{name}</span>
          <Pencil className="size-4 shrink-0 text-foreground/40" />
        </button>
        {trailing}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="w-full space-y-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={NAME_MAX}
        autoFocus
        aria-label="이름"
        className="h-11 w-full rounded-xl border border-border bg-white px-4 text-center text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-xl"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
        >
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
  );
}
