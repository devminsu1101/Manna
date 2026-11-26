import { del, put } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { BACKEND, PREFIX, error, readPhoto, xsrfOf } from "@/lib/blob";

export async function POST(req: NextRequest) {
  const xsrf = xsrfOf(req);
  if (!xsrf) return error(403, "다시 시도해 주세요.");
  const cookie = req.headers.get("cookie") ?? "";
  const form = await req.formData().catch(() => null);
  const id = Number(form?.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return error(400, "소식을 먼저 저장해 주세요.");
  const path = `${BACKEND}/api/v1/admin/updates/${id}`;
  const check = await fetch(path, { headers: { cookie }, redirect: "manual", cache: "no-store" }).catch(() => null);
  if (!check) return error(502, "서버에 연결하지 못했어요.");
  if (!check.ok) return error(check.status, "관리자만 사진을 올릴 수 있어요.");
  const photo = await readPhoto(form);
  if (typeof photo === "string") return error(400, photo);
  if (photo.size === 0) return error(400, "빈 사진은 올릴 수 없어요.");
  let url: string;
  try {
    const blob = await put(`${PREFIX}updates/${id}`, photo, { access: "public", addRandomSuffix: true, contentType: photo.type });
    url = blob.url;
  } catch { return error(502, "사진을 저장하지 못했어요."); }
  const saved = await fetch(`${path}/photo`, {
    method: "PATCH", headers: { cookie, "content-type": "application/json", "x-xsrf-token": xsrf },
    body: JSON.stringify({ photoUrl: url }), redirect: "manual", cache: "no-store",
  }).catch(() => null);
  if (!saved) {
    // 저장 여부를 알 수 없는 통신 실패에서는 연결됐을 수 있는 사진을 삭제하지 않는다.
    return error(502, "저장 결과를 확인하지 못했어요. 화면을 다시 열어 확인해 주세요.");
  }
  if (!saved.ok) {
    await del(url).catch(() => {});
    return error(saved.status, "사진을 저장하지 못했어요.");
  }
  // shortcut: 교체된 사진은 보존한다. 업로드가 많아지면 참조 없는 Blob 정리 작업을 추가한다.
  return Response.json({ url });
}
