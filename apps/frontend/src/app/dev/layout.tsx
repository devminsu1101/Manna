import type { Metadata } from "next";

/**
 * 개발자용 화면. 검색 엔진에만 막는다 — 내용(docs/*.md)은 공개 저장소에 이미 있어서
 * 주소를 숨길 이유가 없다. 상단바 아이콘을 개발자에게만 보이는 건 실사용자 화면을
 * 어지럽히지 않으려는 것이지 접근 통제가 아니다(DocsButton 참고).
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return children;
}
