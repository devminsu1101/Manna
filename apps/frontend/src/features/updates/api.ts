import "server-only";
import { notFound } from "next/navigation";
import { backendFetch, backendGet } from "@/lib/backend";
import type { UpdatePost, UpdateSummary } from "./types";

export async function listUpdates(): Promise<UpdateSummary[]> {
  const res = await backendFetch("/updates");
  if (!res.ok) throw new Error("업데이트 소식을 불러오지 못했어요.");
  return res.json();
}
export async function getUpdate(id: string, admin = false): Promise<UpdatePost> {
  if (!/^\d+$/.test(id)) notFound();
  const res = await (admin ? backendGet : backendFetch)(`${admin ? "/admin" : ""}/updates/${id}`);
  if (res.status === 403 || res.status === 404) notFound();
  if (!res.ok) throw new Error("업데이트 소식을 불러오지 못했어요.");
  return res.json();
}
export async function listAdminUpdates(): Promise<UpdatePost[]> {
  const res = await backendGet("/admin/updates");
  if (res.status === 403) notFound();
  if (!res.ok) throw new Error("업데이트 소식을 불러오지 못했어요.");
  return res.json();
}
