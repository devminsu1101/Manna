"use client";

import Image from "next/image";
import { Heart, MessageCircle, Pencil, Trash2, Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { SharingComment, SharingDiscussion as Discussion, SharingReaction } from "../types";



export function SharingDiscussion({ id, communityId, initial }: { id: number; communityId: number; initial: Discussion }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const requestId = useRef<string | null>(null);
  const base = `/api/v1/sharings/${id}`;
  const query = `?communityId=${communityId}`;

  async function perform(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : "요청을 처리하지 못했어요. 다시 시도해 주세요.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function checked(url: string, init?: RequestInit) {
    const res = await apiFetch(url, init);
    if (!res.ok) throw new Error(res.status === 403 || res.status === 404
      ? "이 공동체의 댓글에 접근할 수 없어요. 공동체 가입 상태를 확인해 주세요."
      : "요청을 처리하지 못했어요. 다시 시도해 주세요.");
    return res;
  }
  function react(reaction: SharingReaction) {
    void perform(async () => {
      const res = await checked(`${base}/reaction${query}`, {
        method: reaction.mine ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        ...(reaction.mine ? {} : { body: JSON.stringify({ key: reaction.key }) }),
      });
      const reactions: SharingReaction[] = await res.json();
      setData((old) => ({ ...old, reactions }));
      router.refresh();
    });
  }
  function submit() {
    if (!body.trim()) return;
    void perform(async () => {
      requestId.current ??= crypto.randomUUID();
      const res = await checked(`${base}/comments${query}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), requestId: requestId.current }),
      });
      const comment: SharingComment = await res.json();
      setData((old) => old.comments.some((item) => item.id === comment.id) ? old : {
        ...old, comments: [...old.comments, comment], commentCount: old.commentCount + 1,
      });
      setBody("");
      requestId.current = null;
      router.refresh();
    });
  }
  function saveEdit(comment: SharingComment) {
    if (!editBody.trim()) return;
    void perform(async () => {
      const res = await checked(`${base}/comments/${comment.id}${query}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody.trim() }),
      });
      const updated: SharingComment = await res.json();
      setData((old) => ({ ...old, comments: old.comments.map((item) => item.id === updated.id ? updated : item) }));
      setEditingId(null);
      router.refresh();
    });
  }
  function remove(comment: SharingComment) {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    void perform(async () => {
      await checked(`${base}/comments/${comment.id}${query}`, { method: "DELETE" });
      setData((old) => ({ ...old, comments: old.comments.filter((item) => item.id !== comment.id), commentCount: Math.max(0, old.commentCount - 1) }));
      router.refresh();
    });
  }
  function older() {
    void perform(async () => {
      const res = await checked(`${base}/discussion${query}&before=${data.comments[0].id}`);
      const previous: Discussion = await res.json();
      setData((old) => ({ ...previous, comments: [...previous.comments, ...old.comments] }));
    });
  }

  return (
    <section id="comments" aria-label="나눔 하트와 댓글" className="mx-4 scroll-mt-24 border-t border-border/60 py-5">
      <div className="mb-3 flex items-center gap-3 text-xs text-foreground/60">
      <button type="button" disabled={busy} aria-pressed={data.reactions[0].mine}
        aria-label={`하트 ${data.reactions[0].count}개, ${data.reactions[0].mine ? "취소" : "남기기"}`}
        onClick={() => react(data.reactions[0])}
        className={`inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 ${data.reactions[0].mine ? "text-rose-500" : "text-foreground/60"}`}>
        <Heart className="size-4" fill={data.reactions[0].mine ? "currentColor" : "none"} aria-hidden="true" />
        <span>{data.reactions[0].count}</span>
      </button>
      <span className="inline-flex min-h-11 min-w-11 items-center gap-1" aria-label={`댓글 ${data.commentCount}개`}>
        <MessageCircle className="size-4" aria-hidden="true" />
        {data.commentCount}
      </span>
      </div>
      {data.hasMore && <Button variant="ghost" className="mb-3 w-full" disabled={busy} onClick={older}>이전 댓글 보기</Button>}
      {data.comments.length === 0 && <p className="py-4 text-sm text-foreground/60">첫 댓글로 마음을 나눠 주세요.</p>}
      <ol className="space-y-5">
        {data.comments.map((comment) => (
          <li key={comment.id}>
            <div className="flex items-center gap-2.5">
              <Image src={comment.author.profileImageUrl ?? "/mascot/default.png"} alt="" width={36} height={36}
                className={`size-9 shrink-0 rounded-full ${comment.author.profileImageUrl ? "object-cover" : "object-contain"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{comment.author.name}</p>
                <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-foreground/50">
                  <time dateTime={comment.createdAt}>{comment.createdAt.slice(0, 16).replace("T", " ")}</time>
                  {comment.edited && <span>수정됨</span>}
                </div>
              </div>
              {comment.mine && editingId !== comment.id && (
                <div className="flex shrink-0 items-center">
                  <Button type="button" variant="ghost" size="icon" className="size-11 text-foreground/60" disabled={busy}
                    aria-label="내 댓글 수정" title="수정하기"
                    onClick={() => { setEditingId(comment.id); setEditBody(comment.body); setError(""); }}>
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-11 text-foreground/60" disabled={busy}
                    aria-label="내 댓글 삭제" title="삭제하기" onClick={() => remove(comment)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
            {editingId === comment.id ? (
              <form className="mt-1 p-2" onSubmit={(event) => { event.preventDefault(); saveEdit(comment); }}>
                <textarea aria-label="댓글 수정" autoFocus value={editBody} maxLength={1000} rows={3} disabled={busy}
                  onChange={(event) => setEditBody(event.target.value)}
                  className="w-full resize-y rounded-xl border border-border bg-background p-3 text-base focus-visible:outline-2 focus-visible:outline-ring" />
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="icon" className="size-11" disabled={busy}
                    aria-label="댓글 수정 취소" title="취소" onClick={() => setEditingId(null)}>
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                  <Button type="submit" variant="ghost" size="icon" className="size-11" disabled={busy || !editBody.trim()}
                    aria-label="댓글 수정 저장" title="저장">
                    <Check className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </form>
            ) : <p className="mt-1 whitespace-pre-wrap break-words p-2 text-sm leading-relaxed">{comment.body}</p>}
          </li>
        ))}
      </ol>
      <form className="mt-5 space-y-2" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <label htmlFor="sharing-comment" className="text-sm font-bold">댓글 남기기</label>
        <textarea id="sharing-comment" value={body} maxLength={1000} rows={3} disabled={busy}
          placeholder="나눔을 읽고 전하고 싶은 마음을 남겨 주세요."
          onChange={(event) => { setBody(event.target.value); requestId.current = null; }}
          className="w-full resize-y rounded-xl border border-border bg-background p-3 text-base focus-visible:outline-2 focus-visible:outline-ring" />
        <div className="flex justify-end">
          <Button type="submit" disabled={busy || !body.trim()}>댓글 남기기</Button>
        </div>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
