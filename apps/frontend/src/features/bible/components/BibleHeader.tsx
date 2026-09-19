"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileButton } from "@/features/auth/ProfileButton";
import { BiblePicker } from "./BiblePicker";

/**
 * 성경 화면 상단 바. 좌: 알림, 중앙: 권 이름 + 장(누르면 선택 시트), 우: 프로필.
 *
 * 숨지 않는다. 하단 네비만 스크롤에 따라 숨었다 나타나고, 이쪽은 sticky로 항상 붙어 있다.
 * 그래서 transform을 소유할 클라이언트 래퍼(ReaderChrome)가 필요 없고 자기 위치를 자기가 갖는다.
 *
 * z-30이라 장 제목 밴드(z-20)를 덮는다. 밴드는 헤더 밑으로 미끄러져 들어가고, 바로 그
 * 시점에 숫자가 다음 장으로 바뀐다. 배경(bg-header)이 같아서 이어지듯 넘어간다.
 * 장 번호를 밴드와 중복해서 갖는 건 그래서 의도된 것이다 — 밴드가 헤더에 가려 안 보이게 된
 * 지금은 여기가 유일하게 항상 보이는 현재 위치 표시다.
 *
 * 장 숫자와 스토어 구독은 BiblePicker가 갖는다. 트리거가 현재 장을 보여줘야 하는데
 * 트리거와 시트는 한 몸이어야 하기 때문이다. 여기는 배치만 한다.
 */
export function BibleHeader({
  bookName,
  bookAbbrev,
}: {
  bookName: string;
  bookAbbrev: string;
}) {
  return (
    // header-bleed: 헤더 위쪽으로 같은 색을 한 장 더 깐다(globals.css). 리더만 문서 스크롤을
    // 쓰기 때문에 iOS 고무줄에 이 헤더가 끌려 내려가고, 그 틈으로 흰 배경이 드러난다.
    // 다른 화면은 AppShell이 문서를 잠가서 애초에 그 일이 안 생긴다.
    <header className="header-bleed sticky top-0 z-30 flex items-center justify-between gap-1 border-b border-border bg-header px-4 py-3">
      <Button variant="ghost" size="icon-lg" className="relative" aria-label="알림">
        <Bell className="size-6" />
        {/* TODO: 읽지 않은 알림 여부를 실제 데이터에 연결할 것 */}
        <span
          className="absolute end-1.5 top-1.5 size-2 rounded-full bg-accent"
          aria-label="읽지 않은 알림 있음"
        />
      </Button>

      {/* 책 경계를 넘지 않으므로 권 이름은 피드 내내 고정이다. 장 숫자만 스크롤에 따라 바뀐다.
          abbrev는 시트가 "지금 읽는 권"을 목록에서 짚는 데 쓴다. */}
      <BiblePicker bookName={bookName} bookAbbrev={bookAbbrev} />

      {/* 홈 상단바와 같은 컴포넌트다. 2026-09-19까지 여기만 정적 아이콘이었는데, 그건
          "인증이 프로덕션에서 살아나기 전에 바꾸면 로그인도 안 되는 화면에 '로그인' 글자만
          뜬다"는 이유였다. 로컬에서 인증이 실제로 돌고 마이페이지라는 목적지가 생겨
          그 이유가 사라졌다(D-2403, D-2405). */}
      <ProfileButton />
    </header>
  );
}
