import { cn } from "@/lib/utils";

/**
 * 중보기도실 집중 모드 스위치(D-3611). 일반 모드에서는 상단바 바로 아래, 집중 모드에서는 상단바가
 * 사라지므로 화면 맨 위 — 켜고 끄는 자리가 같다.
 *
 * **Next `Link`가 아니라 평범한 `<a>`다.** iOS standalone은 상태바 색(`themeColor`)을 문서를 새로 뜰
 * 때만 읽는다(D-2203). 클라이언트 이동이면 화면은 어두워져도 상태바는 밝은 채로 남는다.
 */
export function FocusToggle({ on }: { on: boolean }) {
  return (
    <a
      href={on ? "/prayer" : "/prayer?focus=1"}
      role="switch"
      aria-checked={on}
      className="flex shrink-0 items-center justify-between gap-3 rounded-xl px-1 py-1"
    >
      <span>
        <span className="block text-sm font-bold text-foreground">집중 모드</span>
        <span className="block text-xs text-foreground/50">
          {on ? "끄면 원래 화면으로 돌아가요" : "어두운 화면에서 기도제목만 보며 기도해요"}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors",
          on ? "justify-end bg-accent" : "justify-start bg-foreground/20",
        )}
      >
        <span className="size-6 rounded-full bg-[#ffffff] shadow-sm" />
      </span>
    </a>
  );
}
