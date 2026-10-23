import { del, put } from "@vercel/blob";
import type { NextRequest } from "next/server";

import { BACKEND, PREFIX, error, isUploaded, readPhoto, xsrfOf } from "@/lib/blob";

/**
 * POST /api/v1/community-cover — 공동체 목록 카드의 사진 바꾸기(D-3624, 리더). multipart `communityId` + `photo`.
 *
 * ⚠️ 주소가 `/api/v1/communities/{id}/cover`가 아닌 이유: next.config의 `/api/v1/communities/:path*`
 * rewrite(afterFiles)가 동적 라우트보다 먼저 걸려서 이 핸들러에 닿지 못하고 백엔드로 간다.
 *
 * 순서는 `me/photo`와 같다: CSRF → 리더 확인(백엔드 GET /communities/{id}) → 파일 검사 → Blob 업로드 →
 * 백엔드 PATCH → 예전 사진 삭제. PATCH가 실패하면 방금 올린 Blob을 지운다.
 */
export async function POST(req: NextRequest) {
  const xsrf = xsrfOf(req);
  if (!xsrf) return error(403, "다시 시도해 주세요.");
  const cookie = req.headers.get("cookie") ?? "";

  const form = await req.formData().catch(() => null);
  const id = Number(form?.get("communityId"));
  if (!Number.isInteger(id)) return error(400, "공동체를 알 수 없어요.");

  let community: { myRole: string; coverImageUrl: string | null };
  try {
    const res = await fetch(`${BACKEND}/api/v1/communities/${id}`, {
      headers: { cookie },
      redirect: "manual",
      cache: "no-store",
    });
    if (res.status === 401) return error(401, "로그인이 필요해요.");
    if (!res.ok) return error(404, "없는 공동체예요.");
    community = await res.json();
  } catch (e) {
    console.error("[community-cover] GET /communities", e);
    return error(502, "서버에 연결하지 못했어요.");
  }
  // 백엔드 PATCH도 막지만, 리더가 아니면 Blob에 올리기 전에 돌려보낸다.
  if (community.myRole !== "leader") return error(403, "리더만 바꿀 수 있어요.");

  const photo = await readPhoto(form);
  if (typeof photo === "string") return error(400, photo);

  let url: string;
  try {
    const blob = await put(`${PREFIX}communities/${id}.jpg`, photo, {
      access: "public",
      addRandomSuffix: true,
      contentType: photo.type,
    });
    url = blob.url;
  } catch (e) {
    console.error("[community-cover] blob put", e);
    return error(502, "사진을 저장하지 못했어요.");
  }

  const saved = await fetch(`${BACKEND}/api/v1/communities/${id}`, {
    method: "PATCH",
    headers: { cookie, "content-type": "application/json", "x-xsrf-token": xsrf },
    body: JSON.stringify({ coverImageUrl: url }),
    redirect: "manual",
    cache: "no-store",
  }).catch(() => null);
  if (!saved?.ok) {
    console.error("[community-cover] PATCH /communities", saved?.status);
    await del(url).catch(() => {});
    return error(saved?.status ?? 502, "사진을 저장하지 못했어요.");
  }

  if (isUploaded(community.coverImageUrl)) {
    await del(community.coverImageUrl).catch(() => {});
  }

  return Response.json({ url });
}
