"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ENABLED_PROVIDERS, oauthStartUrl, type OAuthProvider } from "./oauth";

/**
 * 소셜 로그인 버튼들. 세 회사의 버튼 가이드를 따른다 — 색 · 로고 · 문구를 우리 마음대로 바꾸면 안 된다.
 * - Google: Light 테마(흰 배경 · #747775 1px 테두리 · #1F1F1F 글자) + 공식 4색 G. "Google"만 단독으로 쓰지 않는다.
 *   https://developers.google.com/identity/branding-guidelines
 * - Kakao: #FEE500 배경 · 검정 말풍선 심볼 · 검정 85% 글자 · radius 12px. 심볼 없는 버튼 금지.
 *   https://developers.kakao.com/docs/ko/kakaologin/design-guide
 * - Naver: 네이버 그린 #03C75A · 흰 N. 연결할 때 네이버 디벨로퍼스의 공식 버튼과 대조한다(검수 대상).
 * ⚠️ 카카오 말풍선 · 네이버 N은 공식 파일이 아니라 모양을 따라 그린 것이다 — 실제로 연결할 때 공식 에셋으로 바꾼다.
 *
 * v1에서 실제로 연결된 provider(oauth.ts의 ENABLED_PROVIDERS)만 누를 수 있고 나머지는 흐리게 "준비 중"이다.
 * 클릭은 <a href>로 백엔드 OAuth 시작 경로에 전체 이동한다(SPA 내비 아님) — OAuth는
 * provider 도메인으로 리다이렉트되므로 브라우저 전체가 움직여야 한다. router.push로는 안 된다.
 */
const PROVIDERS: { id: OAuthProvider; label: string; logo: ReactNode; className: string }[] = [
  {
    id: "google",
    label: "Google 계정으로 로그인",
    logo: <GoogleLogo />,
    className: "border border-[#747775] bg-white text-[#1F1F1F] hover:bg-[#F2F2F2]",
  },
  {
    id: "kakao",
    label: "카카오 로그인",
    logo: <KakaoSymbol />,
    className: "bg-[#FEE500] text-black/85",
  },
  {
    id: "naver",
    label: "네이버 로그인",
    logo: <NaverLogo />,
    className: "bg-[#03C75A] text-white",
  },
];

export function LoginButtons() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {PROVIDERS.map(({ id, label, logo, className }) => {
        const enabled = ENABLED_PROVIDERS.includes(id);
        return (
          <a
            key={id}
            href={enabled ? oauthStartUrl(id) : undefined}
            aria-disabled={!enabled}
            className={cn(
              "flex h-12 items-center justify-center gap-2.5 rounded-xl text-[15px] font-medium",
              "transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              className,
              !enabled && "pointer-events-none opacity-40",
            )}
          >
            {logo}
            <span>
              {label}
              {!enabled && <span className="ms-1.5 text-xs opacity-70">(준비 중)</span>}
            </span>
          </a>
        );
      })}
    </div>
  );
}

/** 공식 4색 G. 색 · 비율을 바꾸지 않는다(Google 가이드). */
function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-5 shrink-0">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function KakaoSymbol() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="size-[18px] shrink-0">
      <path
        fill="#000000"
        d="M9 1.5C4.58 1.5 1 4.32 1 7.8c0 2.24 1.49 4.2 3.73 5.32l-.95 3.47c-.08.3.26.54.52.37l4.13-2.73c.19.02.38.03.57.03 4.42 0 8-2.82 8-6.3S13.42 1.5 9 1.5z"
      />
    </svg>
  );
}

function NaverLogo() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 shrink-0">
      <path fill="#FFFFFF" d="M10.85 8.56 5.01 0H0v16h5.15V7.44L10.99 16H16V0h-5.15z" />
    </svg>
  );
}
