"use client";

import { Check, Copy, Download, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { copyToClipboard } from "@/lib/clipboard";
import type { InstallPlatform } from "./install-guide";

type Props = {
  open: boolean;
  platform: InstallPlatform;
  canPrompt: boolean;
  onClose: () => void;
  onSnooze: () => void;
  onInstalled: () => void;
  onPrompt: () => void;
  preview?: boolean;
};

function instructions(platform: InstallPlatform, canPrompt: boolean): string[] {
  if (platform === "ios-kakao") return [
    "카카오톡 화면의 메뉴에서 ‘Safari로 열기’를 누르세요.",
    "Safari의 공유 버튼을 누르세요.",
    "아래로 내려 ‘홈 화면에 추가’를 누르세요.",
  ];
  if (platform === "ios-safari") return [
    "Safari의 공유 버튼을 누르세요.",
    "아래로 내려 ‘홈 화면에 추가’를 누르세요.",
  ];
  if (platform === "android-kakao") return [
    "카카오톡 화면의 메뉴에서 ‘기본 인터넷 앱으로 열기’를 누르세요.",
    "열린 인터넷 앱에서 ‘설치’ 버튼이나 메뉴의 ‘설치 및 바로가기 만들기’를 누르세요.",
  ];
  if (canPrompt) return ["아래 ‘만나 설치하기’를 누르고 설치를 승인하세요."];
  if (platform === "android-samsung") return [
    "삼성 인터넷 메뉴에서 ‘설치 및 바로가기 만들기’ 또는 설치 아이콘을 누르세요.",
    "‘홈 화면에 추가’ 또는 ‘설치’를 선택하세요.",
  ];
  if (platform === "android-chrome") return [
    "Chrome 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 누르세요.",
    "화면에 나오는 설치 확인을 완료하세요.",
  ];
  return ["휴대폰의 Safari 또는 인터넷 앱에서 이 페이지를 여세요.", "공유 또는 메뉴에서 ‘홈 화면에 추가’를 선택하세요."];
}

export function InstallGuideSheet({ open, platform, canPrompt, onClose, onSnooze, onInstalled, onPrompt, preview = false }: Props) {
  const [copied, setCopied] = useState(false);
  const kakao = platform === "ios-kakao" || platform === "android-kakao";
  const steps = instructions(platform, canPrompt);
  const showPrompt = canPrompt && platform.startsWith("android") && !kakao;

  async function copyLink() {
    // 클릭 제스처 안에서 바로 호출해야 iOS가 클립보드를 허용한다.
    const ok = await copyToClipboard(window.location.href);
    setCopied(ok);
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-3xl px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:mx-auto sm:max-w-md">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" aria-label="설치 안내 닫기" onClick={onClose}>
          <X className="size-5" />
        </Button>
        <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-warm text-primary">
          <Download className="size-6" />
        </div>
        <SheetHeader className="p-0 pr-8">
          <SheetTitle className="text-lg font-bold">만나를 홈 화면에 추가해 보세요</SheetTitle>
          <SheetDescription>아이콘을 눌러 바로 기도하러 올 수 있어요</SheetDescription>
        </SheetHeader>

        <ol className="mt-5 space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-6 text-foreground">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-warm text-xs font-bold text-primary">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
          <li className="flex items-start gap-3 text-sm leading-6 text-foreground">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-warm text-primary"><Check className="size-3.5" /></span>
            <span>홈 화면의 만나 아이콘으로 앱처럼 사용하세요.</span>
          </li>
        </ol>

        {kakao && (
          <div className="mt-5 rounded-xl bg-muted p-3 text-sm text-foreground/70">
            <p>외부 앱으로 열기 메뉴가 안 보이나요?</p>
            <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={copyLink}>
              {copied ? <Check /> : <Copy />}
              {copied ? "현재 링크를 복사했어요" : "현재 링크 복사하기"}
            </Button>
            <p className="mt-2 text-xs">복사한 링크를 {platform === "ios-kakao" ? "Safari" : "기본 인터넷 앱"}에 붙여 넣으세요.</p>
          </div>
        )}

        {showPrompt && (
          <Button variant="warm" size="block" className="mt-6" onClick={onPrompt}>
            <Download className="size-4" /> 만나 설치하기
          </Button>
        )}
        {preview && showPrompt && <p className="mt-2 text-center text-xs text-foreground/50">미리보기에서는 설치 버튼이 동작하지 않습니다.</p>}
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onInstalled}>이미 설치했어요</Button>
          <Button variant="outline" onClick={onSnooze}>오늘 안 보기</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
