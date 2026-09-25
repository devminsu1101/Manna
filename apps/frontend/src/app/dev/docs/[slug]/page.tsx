import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { DocMarkdown } from "@/features/devdocs/DocMarkdown";
import { getDoc, listDocs } from "@/features/devdocs/docs";
import { MainTopBar } from "@/features/home/MainTopBar";

type PageProps = { params: Promise<{ slug: string }> };

/** 전부 빌드 때 만든다. 목록에 없는 slug는 런타임에 파일을 찾지 않고 바로 404. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listDocs()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const doc = await getDoc((await params).slug);
  return { title: doc ? `${doc.meta.title} | 문서` : "문서" };
}

/**
 * 문서 하나를 원본 그대로. 긴 문서(07_HISTORY는 1700줄)를 폰에서 다니려고 위에 목차를
 * 접어 둔다. 목차 id는 docs.ts의 buildToc가 렌더러와 같은 규칙으로 만든다.
 */
export default async function DocPage({ params }: PageProps) {
  const doc = await getDoc((await params).slug);
  if (!doc) notFound();

  return (
    <AppShell topBar={<MainTopBar title={`${doc.meta.slug}.md`} />} className="text-foreground/90">
      {doc.toc.length > 0 && (
        <details className="mb-4 rounded-2xl bg-surface-warm px-4 py-3 text-sm">
          <summary className="cursor-pointer font-bold text-foreground">목차 ({doc.toc.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {doc.toc.map((item) => (
              <li key={item.id} className={item.depth === 3 ? "ps-4 text-foreground/60" : undefined}>
                <a href={`#${item.id}`} className="block truncate">
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      <article className="min-w-0 break-words">
        <DocMarkdown source={doc.source} />
      </article>

      {/* 상단바에서 들어오는 화면이라 돌아갈 길을 화면 안에 둔다(D-1505). */}
      <Button asChild variant="ghost" className="mt-8 h-11 w-full">
        <Link href="/dev/docs">문서 목록</Link>
      </Button>
    </AppShell>
  );
}
