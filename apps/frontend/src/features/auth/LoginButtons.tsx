"use client";

import { cn } from "@/lib/utils";
import { ENABLED_PROVIDERS, oauthStartUrl, type OAuthProvider } from "./oauth";

/**
 * 소셜 로그인 버튼들. 디자인의 3종(Google/Kakao/Naver)을 모두 그리되, v1에서 실제로
 * 연결된 provider(oauth.ts의 ENABLED_PROVIDERS)만 활성화한다. 나머지는 "준비 중"으로 흐린다.
 *
 * 클릭은 <a href>로 백엔드 OAuth 시작 경로에 전체 이동한다(SPA 내비 아님) — OAuth는
 * provider 도메인으로 리다이렉트되므로 브라우저 전체가 움직여야 한다. router.push로는 안 된다.
 */
const PROVIDERS: { id: OAuthProvider; label: string; className: string }[] = [
  { id: "google", label: "Google", className: "border-secondary text-foreground" },
  { id: "kakao", label: "Kakao", className: "border-primary text-foreground" },
  { id: "naver", label: "Naver", className: "border-[#03C75A] text-foreground" },
];

export function LoginButtons() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {PROVIDERS.map(({ id, label, className }) => {
        const enabled = ENABLED_PROVIDERS.includes(id);
        return (
          <a
            key={id}
            href={enabled ? oauthStartUrl(id) : undefined}
            aria-disabled={!enabled}
            className={cn(
              "flex h-14 items-center justify-center gap-3 rounded-xl border-2 bg-background text-base font-medium",
              "transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              className,
              enabled ? "hover:bg-muted" : "pointer-events-none opacity-40",
            )}
          >
            <span aria-hidden className="font-bold">
              {label[0]}
            </span>
            <span>
              {label} 로그인
              {!enabled && <span className="ms-2 text-xs text-foreground/50">(준비 중)</span>}
            </span>
          </a>
        );
      })}
    </div>
  );
}
