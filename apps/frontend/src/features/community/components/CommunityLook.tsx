"use client";

import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { shrinkImage } from "@/lib/image";

import type { CommunityColor } from "../colors";
import { ColorSwatches } from "./ColorSwatches";
import { CommunityCard } from "./CommunityCard";
import { CommunitySection } from "./CommunitySection";

/** 카드 사진 칸이 4:3이라 같은 비율로 자른다. 화면에선 140px 남짓이라 넉넉하다. */
const COVER_W = 600;
const COVER_H = 450;

/**
 * 대문의 "카드 꾸미기"(D-3624, 리더에게만). 목록 카드와 같은 모양의 미리보기 + 색 6개 + 사진 바꾸기.
 *
 * - 색: 누르면 바로 `PATCH /communities/{id}`. 미리보기는 먼저 바뀌고, 실패하면 되돌린다.
 * - 사진: 브라우저에서 4:3 · 600px로 잘라 `POST /api/v1/community-cover`로 보낸다(Blob 업로드 + PATCH까지).
 *   끝나면 `router.refresh()`로 서버 값을 다시 읽는다.
 */
export function CommunityLook({
  communityId,
  name,
  memberCount,
  color,
  coverImageUrl,
}: {
  communityId: number;
  name: string;
  memberCount: number;
  color: CommunityColor;
  coverImageUrl: string | null;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState(color);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeColor(next: CommunityColor) {
    const before = picked;
    setPicked(next);
    setError(null);
    const res = await apiFetch(`/api/v1/communities/${communityId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ color: next }),
    }).catch(() => null);
    if (res?.ok) return router.refresh();
    setPicked(before);
    setError("색을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("communityId", String(communityId));
      form.append("photo", await shrinkImage(file, COVER_W, COVER_H), "cover.jpg");
      const res = await apiFetch("/api/v1/community-cover", { method: "POST", body: form });
      if (res.ok) return router.refresh();
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "사진을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
    } catch {
      setError("이 사진은 읽지 못했어요. 다른 사진으로 해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CommunitySection icon="/mascot/together.png" title="카드 꾸미기" surface="warm">
      <p className="text-sm text-foreground/60">공동체 목록에서 멤버들에게 이렇게 보여요</p>
      <div className={busy ? "opacity-50" : undefined}>
        <CommunityCard
          name={name}
          memberCount={memberCount}
          color={picked}
          coverImageUrl={coverImageUrl}
        />
      </div>

      <div className="rounded-xl bg-white px-4 py-3">
        <ColorSwatches value={picked} onChange={changeColor} disabled={busy} />
      </div>

      <Button
        variant="outline"
        size="block"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <ImagePlus className="size-5" />
        {busy ? "사진을 올리는 중…" : "사진 바꾸기"}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // 같은 사진을 다시 골라도 change가 오게
          if (file) upload(file);
        }}
      />

      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </CommunitySection>
  );
}
