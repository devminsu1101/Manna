"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { UpdatePost } from "./types";

export function UpdateForm({ post }: { post?: UpdatePost }) {
  const router = useRouter();
  const [id, setId] = useState(post?.id);
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [photoUrl, setPhotoUrl] = useState(post?.photoUrl ?? null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [message, setMessage] = useState("");
  const published = !!post?.publishedAt;

  async function checked(res: Response) {
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error?.message ?? "저장하지 못했어요. 다시 시도해 주세요.");
    }
    return res.json();
  }

  async function save(publish: boolean) {
    if (saving.current) return;
    if (!title.trim() || !body.trim()) { setMessage("제목과 내용을 입력해 주세요."); return; }
    if (photo && (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size === 0 || photo.size > 1024 * 1024)) {
      setMessage("사진은 1MB 이하의 JPG·PNG·WEBP로 선택해 주세요."); return;
    }
    if (publish && !confirm("이 소식을 게시하고 전체 회원에게 알림을 보낼까요?")) return;
    saving.current = true;
    setBusy(true);
    setMessage("");
    try {
      const saved: UpdatePost = await checked(await apiFetch(`/api/v1/admin/updates${id ? `/${id}` : ""}`, {
        method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body }),
      }));
      setId(saved.id);
      if (photo) {
        const data = new FormData();
        data.append("id", String(saved.id));
        data.append("photo", photo);
        const uploaded = await checked(await apiFetch("/api/v1/update-photo", { method: "POST", body: data }));
        setPhotoUrl(uploaded.url);
        setPhoto(null);
      } else if (removePhoto) {
        await checked(await apiFetch(`/api/v1/admin/updates/${saved.id}/photo`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photoUrl: null }),
        }));
        setPhotoUrl(null);
      }
      setRemovePhoto(false);
      if (publish) {
        await checked(await apiFetch(`/api/v1/admin/updates/${saved.id}/publish`, { method: "POST" }));
        router.push(`/mypage/updates/${saved.id}`);
      } else {
        setMessage(published ? "수정했어요. 알림은 다시 보내지 않아요." : "임시저장했어요.");
        router.replace(`/admin/updates/${saved.id}`);
      }
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "서버에 연결하지 못했어요. 입력 내용은 유지돼요.");
    } finally { saving.current = false; setBusy(false); }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(false); }} className="space-y-5">
      <fieldset disabled={busy} className="space-y-5">
        <div>
          <label htmlFor="update-title" className="mb-2 block font-bold">제목</label>
          <input id="update-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100}
            className="w-full rounded-xl border border-border bg-white p-3 focus-visible:outline-ring" />
        </div>
        <div>
          <label htmlFor="update-body" className="mb-2 block font-bold">내용</label>
          <textarea id="update-body" value={body} onChange={(e) => setBody(e.target.value)} required maxLength={10000}
            rows={12} className="w-full rounded-xl border border-border bg-white p-3 leading-relaxed focus-visible:outline-ring" />
          <p className="text-xs text-foreground/60">강조할 부분은 **이렇게 감싸서** 입력하면 굵게 표시돼요.</p>
          <p className="text-right text-xs text-foreground/60">{body.length.toLocaleString()} / 10,000자</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="update-photo" className="block font-bold">사진 (선택)</label>
          <p id="photo-help" className="text-xs text-foreground/60">공개용 사진 한 장 · JPG, PNG, WEBP · 최대 1MB. 저장한 사진은 링크로 접근할 수 있어요.</p>
          <input id="update-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help"
            onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); setRemovePhoto(false); }} className="w-full text-sm" />
          {photoUrl && !removePhoto && <Image src={photoUrl} alt="저장된 첨부 사진" width={1200} height={900} unoptimized className="h-auto w-full rounded-xl" />}
          {photoUrl && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={removePhoto} onChange={(e) => { setRemovePhoto(e.target.checked); setPhoto(null); }} />기존 사진 삭제</label>}
        </div>
        <p className="text-sm text-foreground/60">{published ? "게시된 글의 수정은 즉시 반영되며 알림을 다시 보내지 않아요." : "임시저장은 관리자만 볼 수 있어요. 게시하면 전체 회원에게 앱 알림을 보내고, 알림을 켠 기기에는 푸시도 보내요."}</p>
        <Button type="submit" variant="outline" size="block">{busy ? "저장 중…" : published ? "수정 저장" : "임시저장"}</Button>
        {!published && <Button type="button" size="block" onClick={() => void save(true)}>게시하고 알림 보내기</Button>}
      </fieldset>
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  );
}
