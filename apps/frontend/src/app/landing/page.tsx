"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 진입 스플래시. 마스코트 + 진행 바를 잠깐 보여주고 로그인으로 넘긴다.
 *
 * 디자인의 "최신 버전 확인 중"은 앱스토어식 부팅 화면 문구다. 웹/PWA엔 실제 버전 체크가
 * 없으므로 지금은 짧은 연출로만 둔다 — 진행 바가 차면 로그인으로 이동한다.
 *
 * 인증이 붙으면(백엔드 태스크) 여기서 세션을 확인해 로그인/메인으로 갈린다.
 * 지금은 세션이 없으므로 항상 로그인으로 보낸다.
 */
export default function LandingPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 다음 프레임에 목표값을 줘서 CSS 트랜지션이 0 → 100으로 흐르게 한다.
    const raf = requestAnimationFrame(() => setProgress(100));
    const timer = setTimeout(() => router.replace("/login"), 1800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-muted px-8">
      <Image
        src="/mascot/hi.png"
        alt="만나"
        width={160}
        height={160}
        priority
        className="size-40 object-contain"
      />

      <div className="mt-24 flex w-full max-w-xs flex-col items-center gap-4">
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-white"
          role="progressbar"
          aria-label="앱을 준비하는 중"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-[1600ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-foreground/60">앱을 준비하는 중…</p>
      </div>
    </main>
  );
}
