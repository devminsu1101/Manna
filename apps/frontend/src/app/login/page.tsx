import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { LoginButtons } from "@/features/auth/LoginButtons";

/**
 * 로그인 화면. 소셜 로그인만 제공한다(디자인: Google/Kakao/Naver).
 *
 * v1은 Google만 실제로 연결한다 — 카카오·네이버는 자리만 두고 "준비 중"이다(oauth.ts).
 * 서버 컴포넌트로 두고 버튼만 클라이언트로 뗀다.
 */
export default function LoginPage() {
  return (
    <AppShell className="flex flex-col items-center bg-muted px-8 py-8 pb-16 gap-8">
      {/* 마스코트를 화면 가운데 위쪽에 크게. 로그인 버튼은 아래 3분의 1 지점. */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <Image
          src="/mascot/together.png"
          alt="서로 안고 있는 만나 마스코트들"
          width={220}
          height={220}
          priority
          className="size-32 object-contain"
        />
        <p className="mt-10 text-center text-base leading-relaxed font-medium text-foreground/80">
          새 계명을 너희에게 주노니 서로 사랑하라
          <br />
          내가 너희를 사랑한 것 같이 너희도 서로 사랑하라
        </p>
        <p className="mt-2 text-sm text-foreground/50">(요 13:34)</p>
      </div>

      <LoginButtons />

    </AppShell>
  );
}
