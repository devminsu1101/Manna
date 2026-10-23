import "server-only";

import type { NextRequest } from "next/server";

/**
 * 사진 업로드 라우트(`me/photo` D-3618 · `community-cover` D-3624)가 같이 쓰는 것.
 *
 * 사진은 Vercel Blob(Public 스토어)에, 주소는 백엔드에 둔다. Railway 컨테이너 디스크는 재배포 때
 * 사라지기 때문이다(D-3608). **서버가 올리고 서버가 저장한다** — 브라우저가 Blob에 직접 올리고 주소를
 * 알려 주는 방식이면 아무 주소나 저장하게 만들 수 있다. 토큰은 `BLOB_READ_WRITE_TOKEN`.
 */
export const BACKEND = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

const MAX_BYTES = 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** 로컬 · 프리뷰에서 올린 사진은 운영 사진과 섞이지 않게 `dev/` 아래에 둔다. 스토어는 하나다. */
export const PREFIX = process.env.VERCEL_ENV === "production" ? "" : "dev/";

export function error(status: number, message: string) {
  return Response.json({ error: { message } }, { status });
}

/**
 * 백엔드의 CSRF 검사(D-404)는 마지막 PATCH에서야 걸린다. 그 전에 Blob에 올리지 않도록 같은 규칙
 * (쿠키 = 헤더)을 먼저 본다. 통과하면 백엔드에 그대로 넘길 토큰을, 아니면 null.
 */
export function xsrfOf(req: NextRequest): string | null {
  const xsrf = req.headers.get("x-xsrf-token") ?? "";
  return xsrf && xsrf === req.cookies.get("XSRF-TOKEN")?.value ? xsrf : null;
}

/** multipart의 `photo` 한 장. 문제가 있으면 화면에 보여 줄 문장으로 실패한다. */
export async function readPhoto(form: FormData | null): Promise<File | string> {
  const photo = form?.get("photo");
  if (!(photo instanceof File)) return "사진을 골라 주세요.";
  if (!TYPES.has(photo.type)) return "JPG · PNG · WEBP 사진만 올릴 수 있어요.";
  if (photo.size > MAX_BYTES) return "사진이 너무 커요.";
  return photo;
}

/** 우리가 올린 사진인지. Google 사진 같은 남의 주소는 지우지 않는다. */
export function isUploaded(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}
