"use client";

import { useEffect, useState } from "react";

export type Me = { id: number; name: string; profileImageUrl: string | null };

/**
 * 현재 로그인한 사용자. 클라이언트에서 /api/v1/me를 부른다(Next 프록시 → Spring).
 *
 * 서버 컴포넌트가 아니라 클라이언트인 이유: 세션 쿠키를 브라우저가 자동으로 실어 보낸다.
 * 서버(SSR)에서 부르면 쿠키를 손으로 포워딩해야 해서 번거롭다. 로그인 상태 표시 정도는
 * 클라이언트에서 판정하는 게 단순하다.
 *
 * 401이면 me=null(미로그인). 백엔드가 아직 안 떠 있으면 fetch가 실패해도 null로 떨어진다.
 */
export function useMe(): { me: Me | null; loading: boolean } {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/me", { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<Me>) : null))
      .then((data) => alive && setMe(data))
      .catch(() => alive && setMe(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { me, loading };
}
