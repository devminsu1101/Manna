import "server-only";

import { notFound } from "next/navigation";

import { backendGet } from "@/lib/backend";
import type { CommunityColor } from "@/features/community/colors";

/**
 * 읽기 전용 관리자(D-3625). 백엔드 `/api/v1/admin/**`를 서버에서 부른다 — 브라우저 rewrite가 필요 없다.
 * 관리자가 아니면(403) 화면이 있다는 것도 알리지 않고 404로 보낸다.
 */

export type AdminCommunity = {
  id: number;
  name: string;
  color: CommunityColor;
  leaderName: string | null;
  memberCount: number;
  pendingCount: number;
  createdAt: string;
};

export type AdminUser = {
  id: number;
  name: string;
  profileImageUrl: string | null;
  communities: string[];
  latestRequest: string | null;
  createdAt: string;
};

export type AdminCommunityDetail = {
  id: number;
  name: string;
  color: CommunityColor;
  members: {
    userId: number;
    name: string;
    profileImageUrl: string | null;
    role: "leader" | "member";
    status: "active" | "pending";
  }[];
  sharings: { id: number; type: string; authorName: string; body: string; createdAt: string }[];
};

export type AdminUserDetail = {
  user: { userId: number; name: string; profileImageUrl: string | null };
  communities: string[];
  requests: { id: number; body: string; visibility: "public" | "anonymous"; createdAt: string }[];
};

async function adminGet<T>(path: string): Promise<T> {
  const res = await backendGet(`/admin${path}`);
  if (res.status === 403 || res.status === 404) notFound();
  if (!res.ok) throw new Error(`관리자 데이터를 불러오지 못했습니다 (${res.status})`);
  return res.json();
}

export const listAllCommunities = () => adminGet<AdminCommunity[]>("/communities");
export const listAllUsers = () => adminGet<AdminUser[]>("/users");
export const getAdminCommunity = (id: number) =>
  adminGet<AdminCommunityDetail>(`/communities/${id}`);
export const getAdminUser = (id: number) => adminGet<AdminUserDetail>(`/users/${id}`);
