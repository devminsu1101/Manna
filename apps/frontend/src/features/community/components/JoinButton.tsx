"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { oauthStartUrl } from "@/features/auth/oauth";
import { useMe } from "@/features/auth/useMe";
import { apiFetch } from "@/lib/api";
import { PENDING_INVITE_COOKIE } from "../invite";

/** 로그인 왕복에 넉넉한 시간. 그 뒤에 홈에 와도 초대로 끌려가지 않게 짧게 둔다. */
const MAX_AGE = 60 * 10;

/**
 * 초대 화면의 가입 신청 버튼. `POST /api/v1/invites/{code}/requests` → `pending`.
 *
 * 비로그인이면 코드를 쿠키에 심고 Google 로그인으로 보낸다. 돌아오면 홈이 이 화면으로
 * 되돌리고, **버튼을 한 번 더** 누르게 한다 — 자동 가입은 잘못 누른 링크를 되돌릴 수 없다(D-1005).
 */
export function JoinButton({ code }: { code: string }) {
  const router = useRouter();
  const { me, loading } = useMe();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이 화면에 왔으면 복귀는 끝났다. 남겨 두면 다음에 홈을 열 때마다 여기로 끌려온다.
  useEffect(() => {
    document.cookie = `${PENDING_INVITE_COOKIE}=; path=/; max-age=0`;
  }, []);

  function login() {
    document.cookie = `${PENDING_INVITE_COOKIE}=${code}; path=/; max-age=${MAX_AGE}; samesite=lax`;
    window.location.assign(oauthStartUrl("google"));
  }

  async function join() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/v1/invites/${code}/requests`, { method: "POST" });
      if (res.status === 401) return login(); // 세션이 그새 끊겼다
      // 409(이미 신청함)도 화면을 다시 그리면 "승인 대기 중"으로 맞춰진다.
      if (res.ok || res.status === 409) return router.refresh();
      setError("신청하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } catch {
      setError("신청하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Button
        className="h-14 w-full rounded-xl text-base"
        disabled={loading || submitting}
        onClick={me ? join : login}
      >
        {me ? (submitting ? "신청하는 중…" : "가입 신청하기") : "Google로 로그인하고 신청하기"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
