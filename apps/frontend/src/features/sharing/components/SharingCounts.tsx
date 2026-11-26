"use client";

import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { sharingHref, type Sharing, type SharingReaction } from "../types";

/** 목록에서도 하트를 바로 선택·취소하고 댓글은 상세로 이동한다. */
export function SharingCounts({ sharing }: { sharing: Sharing }) {
  const router = useRouter();
  const [heart, setHeart] = useState({ count: sharing.reactionCount, mine: sharing.hearted });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);

  async function toggle() {
    if (locked.current || !sharing.canInteract || !sharing.communityId) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/sharings/${sharing.id}/reaction?communityId=${sharing.communityId}`, {
        method: heart.mine ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        ...(heart.mine ? {} : { body: JSON.stringify({ key: "heart" }) }),
      });
      if (!res.ok) throw new Error("하트를 변경하지 못했어요. 다시 시도해 주세요.");
      const reactions: SharingReaction[] = await res.json();
      setHeart(reactions[0]);
      router.refresh();
    } catch {
      setError("하트를 변경하지 못했어요. 다시 시도해 주세요.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 text-xs text-foreground/60">
        <button type="button" onClick={toggle} disabled={busy || !sharing.canInteract}
          aria-pressed={heart.mine} aria-label={`하트 ${heart.count}개, ${heart.mine ? "취소" : "남기기"}`}
          className={`inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 ${heart.mine ? "text-rose-500" : ""}`}>
          <Heart className="size-4" fill={heart.mine ? "currentColor" : "none"} aria-hidden="true" />{heart.count}
        </button>
        <Link href={`${sharingHref(sharing)}#comments`} aria-label={`댓글 ${sharing.commentCount}개 보기`}
          className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
          <MessageCircle className="size-4" aria-hidden="true" />{sharing.commentCount}
        </Link>
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
