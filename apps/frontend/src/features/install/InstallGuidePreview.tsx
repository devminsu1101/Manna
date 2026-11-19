"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InstallGuideSheet } from "./InstallGuideSheet";
import type { InstallPlatform } from "./install-guide";

const cases: { label: string; platform: InstallPlatform; canPrompt: boolean }[] = [
  { label: "아이폰 · 카카오톡", platform: "ios-kakao", canPrompt: false },
  { label: "아이폰 · Safari", platform: "ios-safari", canPrompt: false },
  { label: "갤럭시 · 카카오톡", platform: "android-kakao", canPrompt: false },
  { label: "갤럭시 · 설치 버튼", platform: "android-samsung", canPrompt: true },
  { label: "갤럭시 · 수동 설치", platform: "android-samsung", canPrompt: false },
  { label: "Android · Chrome 수동 설치", platform: "android-chrome", canPrompt: false },
];

export function InstallGuidePreview() {
  const [selected, setSelected] = useState(cases[0]);
  const [open, setOpen] = useState(false);
  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="text-xl font-bold">홈 화면 설치 안내 미리보기</h1>
      <p className="mt-2 text-sm text-foreground/60">개발 환경 전용입니다. 설치 버튼과 닫기 기록은 실제 계정에 적용되지 않습니다.</p>
      <div className="mt-6 flex flex-col gap-3">
        {cases.map((item) => <Button key={item.label} variant="outline" size="block" onClick={() => { setSelected(item); setOpen(true); }}>
          {item.label}
        </Button>)}
      </div>
      <InstallGuideSheet open={open} platform={selected.platform} canPrompt={selected.canPrompt} preview
        onClose={() => setOpen(false)} onSnooze={() => setOpen(false)} onInstalled={() => setOpen(false)} onPrompt={() => {}} />
    </main>
  );
}
