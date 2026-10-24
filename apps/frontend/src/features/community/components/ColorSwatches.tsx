"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { COLOR_KEYS, COMMUNITY_COLORS, type CommunityColor } from "../colors";

/** 공동체 색 고르기(D-3624). 만들기 폼과 대문의 "카드 꾸미기"가 같이 쓴다. */
export function ColorSwatches({
  value,
  onChange,
  disabled,
}: {
  value: CommunityColor;
  onChange: (color: CommunityColor) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="카드 색" className="flex flex-wrap gap-3">
      {COLOR_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={COMMUNITY_COLORS[key].label}
          disabled={disabled}
          onClick={() => onChange(key)}
          className={cn(
            "flex size-9 items-center justify-center rounded-full ring-offset-2 transition-shadow",
            COMMUNITY_COLORS[key].dot,
            value === key && "ring-2 ring-foreground/60",
          )}
        >
          {value === key && <Check className="size-4 text-white" />}
        </button>
      ))}
    </div>
  );
}
