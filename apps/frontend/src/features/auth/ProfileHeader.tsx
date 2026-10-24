"use client";

import { Camera, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import { shrinkImage } from "@/lib/image";
import { cn } from "@/lib/utils";

import { EditableName } from "./EditableName";

/** 올리기 전에 가운데를 정사각형으로 잘라 이 크기로 줄인다. 화면에선 80px · 스토리 칸 정도라 넉넉하다. */
const SIZE = 400;

/**
 * 마이페이지 프로필 = 사진 + 이름(D-3608 · D-3618). 이름 옆 연필(이름 고치기) 오른쪽에 같은 모양의 카메라
 * (사진 바꾸기)를 둔다. 사진 위에 배지를 얹었더니 이름과 겹쳐 보여서 옮겼다. 사진 자체를 눌러도 같다.
 *
 * 브라우저에서 정사각형 400px JPEG로 줄인 뒤 `POST /api/v1/me/photo`로 보낸다 — 휴대폰 사진(수 MB)을
 * 그대로 올리지 않는다. 저장은 라우트 핸들러가 Blob 업로드와 `PATCH /me`까지 끝낸다.
 * 끝나면 `router.refresh()`. 상단바 프로필(`useMe`)은 다음 화면 이동 때 새 사진을 읽는다.
 */
export function ProfileHeader({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => input.current?.click();

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("photo", await shrinkImage(file, SIZE, SIZE), "photo.jpg");
      const res = await apiFetch("/api/v1/me/photo", { method: "POST", body: form });
      if (res.status === 401) return router.push("/login");
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
    <>
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        aria-label="프로필 사진 바꾸기"
        className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            width={80}
            height={80}
            className={cn("size-20 rounded-full object-cover", busy && "opacity-50")}
          />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-white">
            <User className="size-10 text-foreground/40" />
          </span>
        )}
      </button>
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

      <EditableName
        name={name}
        trailing={
          // 연필과 같은 톤 — 아이콘 크기 · 색 · hover 배경을 EditableName의 이름 버튼에 맞춘다.
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            aria-label="프로필 사진 바꾸기"
            className="shrink-0 rounded-lg p-0 transition-colors hover:bg-white/60"
          >
            <Camera className="size-4 text-foreground/40" />
          </button>
        }
      />

      {busy && <p className="text-xs text-foreground/60">사진을 바꾸는 중…</p>}
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
