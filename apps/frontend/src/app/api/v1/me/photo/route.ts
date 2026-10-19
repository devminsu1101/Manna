import { del, put } from "@vercel/blob";
import type { NextRequest } from "next/server";

/**
 * POST /api/v1/me/photo — 프로필 사진 바꾸기(D-3618). multipart의 `photo` 한 장.
 *
 * 사진 파일은 Vercel Blob(Public 스토어)에, 주소는 백엔드 `users.profile_image_url`에 둔다.
 * Railway 컨테이너 디스크는 재배포 때 사라지기 때문이다(D-3608).
 *
 * **서버가 올리고 서버가 저장한다** — 브라우저가 Blob에 직접 올리고 주소를 알려 주는 방식이면 아무 주소나
 * 저장하게 만들 수 있다. 사진은 브라우저가 미리 400px JPEG(수십 KB)로 줄여 보내므로 서버를 거쳐도 가볍다.
 *
 * 순서: CSRF 확인 → 로그인 확인(백엔드 GET /me) → 파일 검사 → Blob 업로드 → 백엔드 PATCH /me →
 * 예전에 올린 사진 삭제. PATCH가 실패하면 방금 올린 Blob을 지워 고아 파일을 남기지 않는다.
 *
 * 토큰은 `BLOB_READ_WRITE_TOKEN`(Vercel 프로젝트에 스토어를 연결하면 자동, 로컬은 .env.local).
 */
const BACKEND = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

const MAX_BYTES = 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** 로컬 · 프리뷰에서 올린 사진은 운영 사진과 섞이지 않게 `dev/` 아래에 둔다. 스토어는 하나다. */
const PREFIX = process.env.VERCEL_ENV === "production" ? "" : "dev/";

function error(status: number, message: string) {
  return Response.json({ error: { message } }, { status });
}

function isUploaded(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // 백엔드의 CSRF 검사(D-404)는 마지막 PATCH에서야 걸린다. 그 전에 Blob에 올리지 않도록 여기서도 같은 규칙
  // (쿠키 = 헤더)을 먼저 본다.
  const xsrf = req.headers.get("x-xsrf-token") ?? "";
  if (!xsrf || xsrf !== req.cookies.get("XSRF-TOKEN")?.value) {
    return error(403, "다시 시도해 주세요.");
  }
  const cookie = req.headers.get("cookie") ?? "";

  let me: { id: number; profileImageUrl: string | null };
  try {
    const res = await fetch(`${BACKEND}/api/v1/me`, {
      headers: { cookie },
      redirect: "manual",
      cache: "no-store",
    });
    if (!res.ok) return error(401, "로그인이 필요해요.");
    me = await res.json();
  } catch {
    return error(502, "서버에 연결하지 못했어요.");
  }

  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File)) return error(400, "사진을 골라 주세요.");
  if (!TYPES.has(photo.type)) return error(400, "JPG · PNG · WEBP 사진만 올릴 수 있어요.");
  if (photo.size > MAX_BYTES) return error(400, "사진이 너무 커요.");

  let url: string;
  try {
    const blob = await put(`${PREFIX}profiles/${me.id}.jpg`, photo, {
      access: "public",
      addRandomSuffix: true,
      contentType: photo.type,
    });
    url = blob.url;
  } catch {
    return error(502, "사진을 저장하지 못했어요.");
  }

  const saved = await fetch(`${BACKEND}/api/v1/me`, {
    method: "PATCH",
    headers: { cookie, "content-type": "application/json", "x-xsrf-token": xsrf },
    body: JSON.stringify({ profileImageUrl: url }),
    redirect: "manual",
    cache: "no-store",
  }).catch(() => null);
  if (!saved?.ok) {
    await del(url).catch(() => {});
    return error(saved?.status ?? 502, "사진을 저장하지 못했어요.");
  }

  // 예전에 직접 올린 사진만 지운다. Google 사진은 우리 것이 아니다. 실패해도 새 사진은 이미 저장됐다.
  if (isUploaded(me.profileImageUrl)) {
    await del(me.profileImageUrl).catch(() => {});
  }

  return Response.json({ url });
}
