import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { MainTopBar } from "@/features/home/MainTopBar";
import { cn } from "@/lib/utils";

/**
 * 아직 도메인이 붙지 않은 탭의 화면. `/prayer` · `/sharings/new`가 쓴다.
 * (`/community`도 이걸 썼지만 `/communities` 목록 화면으로 대체됐다.)
 *
 * 404를 주지 않고 실제 화면을 두는 이유: 이 셋은 **하단 네비가 늘 가리키고 있는 곳**이라
 * 사용자가 오타로 들어오는 자리가 아니라 눌러서 들어오는 자리다. 없는 페이지가 아니라
 * 아직 안 만든 페이지이므로, 그렇게 말해 주는 편이 정직하다.
 *
 * 상단바·하단 네비를 그대로 두는 것도 그래서다 — 여기서 막다른 곳에 갇히면 안 되고,
 * 눌러 본 탭이 눌린 채로 남아 있어야 방금 어디를 눌렀는지 알 수 있다.
 *
 * 색은 홈의 섹션 카드와 같은 도메인 배분을 따른다(globals.css: love=기도, warm=공동체,
 * cool=말씀). 홈에서 "곧 제공"이라고 본 그 색이 여기서도 나오면 같은 것으로 읽힌다.
 */
export function ComingSoonScreen({
  icon,
  iconAlt,
  title,
  description,
  surface,
}: {
  icon: string;
  iconAlt: string;
  title: string;
  description: React.ReactNode;
  surface: "love" | "warm" | "cool";
}) {
  return (
    <AppShell topBar={<MainTopBar />} className="flex flex-col">
      <section
        className={cn(
          "flex flex-1 flex-col items-center justify-center rounded-2xl px-6 py-16 text-center",
          surface === "love" && "bg-surface-love",
          surface === "warm" && "bg-surface-warm",
          surface === "cool" && "bg-surface-cool",
        )}
      >
        <Image
          src={icon}
          alt={iconAlt}
          width={160}
          height={160}
          className="size-24 object-contain"
        />

        {/* h1이 아니라 h2다 — 이 셸에서는 MainTopBar의 "Manna"가 h1이다(홈과 같은 구조).
            404는 상단바가 없어 거기서만 h1이 여기 온다. */}
        <h2 className="mt-6 text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/60">{description}</p>

        <span className="mt-6 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-foreground/60">
          준비 중
        </span>
      </section>
    </AppShell>
  );
}
