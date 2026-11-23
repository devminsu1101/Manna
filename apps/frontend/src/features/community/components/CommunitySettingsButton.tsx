"use client";

import { Settings } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

/** 공동체 이름 옆의 단일 관리 진입점. */
export function CommunitySettingsButton({ pendingCount, members, settings }: {
  pendingCount: number;
  members: ReactNode;
  settings: ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-11 shrink-0"
          aria-label={`공동체 멤버 및 설정${pendingCount ? `, 승인 대기 ${pendingCount}명` : ""}`}
        >
          <Settings className="size-5 text-foreground/60" aria-hidden="true" />
          {pendingCount > 0 && (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" aria-hidden="true" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-lg rounded-t-2xl">
        <SheetHeader className="shrink-0 pr-12">
          <SheetTitle>공동체 설정</SheetTitle>
          <SheetDescription>멤버 확인과 초대, 공동체 설정을 한곳에서 관리해요.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {members}
          {settings}
        </div>
      </SheetContent>
    </Sheet>
  );
}
