import Image from "next/image";

import { ProfileButton } from "@/features/auth/ProfileButton";
import { DocsButton } from "@/features/devdocs/DocsButton";
import { cn } from "@/lib/utils";

/**
 * 앱의 유일한 상단 바. 좌: (개발자면 문서 버튼) + 마스코트 + 제목, 우: 프로필(로그인 상태).
 * 성경 리더도 이걸 쓴다 — 제목 자리에 BiblePicker를 넣고 className으로 sticky를 준다.
 *
 * 서버 컴포넌트지만 우측 프로필만 클라이언트(ProfileButton)로 뗀다 — 세션 쿠키로 로그인
 * 상태를 판정해야 하기 때문. 알림 벨은 MVP에서 뺐다(아래 주석으로 남김, 알림 도메인 후속).
 *
 * 가운데 글자를 바꿀 수 있게 열어 둔 이유: 공동체 대문(`Community Page.png`)은 같은 바에
 * 앱 이름 대신 **방 이름**을 놓는다. 벨과 프로필이 똑같은 자리에 똑같이 있으므로,
 * 두 줄만 다른 컴포넌트를 하나 더 만들면 알림 배지를 실데이터로 바꿀 때 두 곳을 고치게 된다.
 */
export function MainTopBar({
  /** 제목. 문자열이면 h1으로 감싸고, 노드면 그대로 둔다 — 자기 h1을 가진 BiblePicker용. */
  title = "Manna",
  /** 제목 왼쪽 마스코트. public/mascot/ 경로. */
  icon,
  /** 헤더에 얹을 클래스. 성경 리더만 쓴다(아래 sticky 주석). */
  className,
}: {
  title?: React.ReactNode;
  icon?: string;
  className?: string;
} = {}) {
  return (
    // sticky가 없다. 이 바는 AppShell의 스크롤러 **바깥**에 있어서 처음부터 움직이지 않는다
    // — sticky가 하던 일을 셸이 구조로 한다. iOS 고무줄에 같이 끌려 내려가지 않는 것도
    // 그래서다(sticky로는 그게 안 됐다).
    // 예외는 성경 리더 — AppShell 없이 문서 스크롤을 쓰므로(AppShell 주석) 페이지가
    // "header-bleed sticky top-0 z-30"을 넘긴다. z-30은 장 제목 밴드(z-20)를 덮기 위함.
    // 색은 prop으로 받지 않는다. bg-tone-surface가 화면 톤(globals.css의 --tone)을 따르고,
    // 그게 세그먼트의 themeColor와 같은 값이라 상태바와 이어진다.
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-b border-border bg-tone-surface px-4 py-3",
        className,
      )}
    >
      {/* 벨 옆 문서 아이콘은 개발자 계정에만 뜬다(DocsButton). 아니면 자리도 없다. */}
      {/* TODO(알림 도메인): 안 읽은 알림 여부를 실제 데이터에 연결. 지금은 항상 표시. */}
      {/* <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon-lg" className="relative shrink-0" aria-label="알림">
          <Bell className="size-6" />
          <span
            className="absolute end-1.5 top-1.5 size-2 rounded-full bg-accent"
            aria-label="읽지 않은 알림 있음"
          />
        </Button>
      </div> */}

      {/* 방 이름은 길어질 수 있다. 벨·프로필을 밀어내지 않도록 이 가운데 칸만 줄어든다. */}
      <div className="flex min-w-0 items-center gap-2">
        <DocsButton />
        {icon && (
          <Image src={icon} alt="" width={32} height={32} className="size-8 shrink-0 object-contain" />
        )}
        {typeof title === "string" ? (
          <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
        ) : (
          title
        )}
      </div>

      <ProfileButton />
    </header>
  );
}
