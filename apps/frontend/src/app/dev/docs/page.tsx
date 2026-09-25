import { FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { listDocs } from "@/features/devdocs/docs";
import { MainTopBar } from "@/features/home/MainTopBar";

export const metadata: Metadata = { title: "문서 | 만나" };

/**
 * 개발 문서 목록(`docs/*.md`). 빌드 때 폴더를 읽어 만든다 — 문서를 추가하면 다음 배포에
 * 저절로 뜬다. 내용은 요약하지 않고 원본을 그대로 보여준다(`[slug]/page.tsx`).
 */
export default async function DocsIndexPage() {
  const docs = await listDocs();

  return (
    <AppShell topBar={<MainTopBar title="문서" />}>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-surface-warm">
        {docs.map((doc) => (
          <li key={doc.slug}>
            <Link href={`/dev/docs/${doc.slug}`} className="flex items-center gap-3 px-4 py-3.5">
              <FileText className="size-5 shrink-0 text-foreground/50" />
              <span className="min-w-0">
                <span className="block truncate font-bold text-foreground">{doc.title}</span>
                <span className="block truncate text-xs text-foreground/50">{doc.slug}.md</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
