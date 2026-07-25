import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/**
 * 하단 탭 네비게이션. 로드맵 Phase 1~3의 네 도메인 + 가운데 작성 버튼.
 * 아이콘은 마스코트 일러스트라 lucide로 대체할 수 없다. public/mascot/의 PNG를 쓴다.
 *
 * 위치는 호출부가 정한다. 성경 리더에서는 스크롤에 따라 숨었다 나타나야 하는데,
 * 그 transform은 클라이언트 래퍼(ReaderChrome)가 소유해야 하기 때문이다.
 */
const TABS = [
  { href: "/", label: "만나!", icon: "/mascot/hi.png" },
  // 장을 직접 찍지 않는다. /bible이 마지막에 읽던 장으로 이어준다 — 이 한 겹 덕분에
  // 여기가 정적인 href를 갖는 서버 컴포넌트로 남는다.
  { href: "/bible", label: "성경 읽기", icon: "/mascot/bible.png" },
  { href: "/community", label: "공동체", icon: "/mascot/together.png" },
  { href: "/prayer", label: "기도하기", icon: "/mascot/warm.png" },
] as const;

export function BottomNav() {
  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];

  return (
    <nav className="flex items-center justify-around border-t border-border bg-background px-2 py-2">
      {left.map((tab) => (
        <NavTab key={tab.href} {...tab} />
      ))}

      {/* TODO: 작성 시트 열기 (로드맵 Phase 2 나눔) */}
      <Link
        href="/sharings/new"
        aria-label="새로 작성하기"
        className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-secondary text-secondary"
      >
        <Plus className="size-6" />
      </Link>

      {right.map((tab) => (
        <NavTab key={tab.href} {...tab} />
      ))}
    </nav>
  );
}

function NavTab({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="flex w-16 flex-col items-center gap-1">
      <Image src={icon} alt="" width={32} height={32} className="size-8 object-contain" />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  );
}
