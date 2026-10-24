import { del, put } from "@vercel/blob";
import type { NextRequest } from "next/server";

import { BACKEND, PREFIX, error, isUploaded, readPhoto, xsrfOf } from "@/lib/blob";

/**
 * POST /api/v1/me/photo — 프로필 사진 바꾸기(D-3618). multipart의 `photo` 한 장.
 *
 * 사진 파일은 Vercel Blob에, 주소는 백엔드 `users.profile_image_url`에 둔다(공통 규칙은 `lib/blob.ts`).
 * 사진은 브라우저가 미리 400px JPEG(수십 KB)로 줄여 보내므로 서버를 거쳐도 가볍다.
 *
 * 순서: CSRF 확인 → 로그인 확인(백엔드 GET /me) → 파일 검사 → Blob 업로드 → 백엔드 PATCH /me →
 * 예전에 올린 사진 삭제. PATCH가 실패하면 방금 올린 Blob을 지워 고아 파일을 남기지 않는다.
 */
export async function POST(req: NextRequest) {
  const xsrf = xsrfOf(req);
  if (!xsrf) return error(403, "다시 시도해 주세요.");
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
  } catch (e) {
    console.error("[me/photo] GET /me", e);
    return error(502, "서버에 연결하지 못했어요.");
  }

  const photo = await readPhoto(await req.formData().catch(() => null));
  if (typeof photo === "string") return error(400, photo);

  let url: string;
  try {
    const blob = await put(`${PREFIX}profiles/${me.id}.jpg`, photo, {
      access: "public",
      addRandomSuffix: true,
      contentType: photo.type,
    });
    url = blob.url;
  } catch (e) {
    console.error("[me/photo] blob put", e);
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
    console.error("[me/photo] PATCH /me", saved?.status);
    await del(url).catch(() => {});
    return error(saved?.status ?? 502, "사진을 저장하지 못했어요.");
  }

  // 예전에 직접 올린 사진만 지운다. Google 사진은 우리 것이 아니다. 실패해도 새 사진은 이미 저장됐다.
  if (isUploaded(me.profileImageUrl)) {
    await del(me.profileImageUrl).catch(() => {});
  }

  return Response.json({ url });
}
