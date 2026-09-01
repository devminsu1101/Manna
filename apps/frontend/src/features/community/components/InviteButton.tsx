"use client";

import { Check, CircleAlert, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";

/** 결과를 버튼에 띄워 두는 시간. CopyVerseButton과 같은 값이라야 두 버튼이 같게 느껴진다. */
const FEEDBACK_MS = 1500;

type Status = "idle" | "copied" | "failed";

/** 아이콘만 남은 버튼이라 이름이 aria-label과 라이브 리전에만 있다. 지우지 말 것. */
const LABEL: Record<Status, string> = {
  idle: "초대 링크 복사하기",
  copied: "초대 링크를 복사했어요",
  failed: "복사하지 못했어요",
};

const ICON: Record<Status, React.ElementType> = {
  idle: UserPlus,
  copied: Check,
  failed: CircleAlert,
};

/**
 * 멤버 목록 옆의 초대 버튼 (D-1003).
 *
 * **가입은 초대 링크로만 이뤄진다** — 공개 검색은 배제됐다(D-1004). 기도제목이 이 앱에서
 * 가장 사적인 데이터라, 모르는 사람이 찾아 들어올 수 있으면 사람들이 진짜 기도제목을
 * 쓰지 않기 때문. 그래서 이 버튼 하나가 사실상 유일한 유입 경로다.
 *
 * 링크를 붙여넣기 화면으로 보내지 않고 곧바로 클립보드에 넣는 이유: 실제 유통 경로가
 * 카톡이라 "복사 → 단톡방에 붙여넣기"가 사용자가 실제로 하는 동작이다.
 *
 * 오리진을 서버에서 만들지 않고 클릭할 때 `location.origin`에서 읽는다 — 로컬·미리보기·
 * 프로덕션이 서로 다른 주소이고, 그중 하나를 서버 환경변수에 박아 두면 나머지에서 틀린
 * 링크가 복사된다.
 */
export function InviteButton({ inviteCode }: { inviteCode: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // 클립보드 호출까지 await를 끼우지 않는다. iOS Safari는 사용자 제스처가 끊기면 거부한다.
  const handleCopy = async () => {
    const copied = await copyToClipboard(`${window.location.origin}/invite/${inviteCode}`);
    setStatus(copied ? "copied" : "failed");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  };

  // 대문자 변수여야 JSX가 컴포넌트로 알아본다.
  const Icon = ICON[status];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        aria-label={LABEL[status]}
        // 실패만 색을 바꾼다. 보안 컨텍스트가 아닌 곳(폰에서 http://192.168.x.x)에서는
        // 클립보드 API가 아예 없어 실제로 마주치는 결과다(D-704).
        className={status === "failed" ? "text-destructive" : undefined}
      >
        <Icon className="size-5" />
      </Button>

      {/* 라벨이 바뀌는 것만으로는 스크린 리더에 결과가 전달되지 않는다. */}
      <span role="status" aria-live="polite" className="sr-only">
        {status === "idle" ? "" : LABEL[status]}
      </span>
    </>
  );
}
