import type { Element } from "hast";
import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

import { Mermaid } from "./Mermaid";

/** docs 안의 상대 링크 중 문서가 아닌 것(코드 경로 등)은 GitHub 원본으로 보낸다. */
const GITHUB_DOCS_BASE = "https://github.com/devminsu1101/Manna/blob/main/docs/";

/**
 * 문서끼리의 링크(`03_API_SPEC.md#...`, `./06_ERD.md`)를 뷰어 주소로 바꾼다.
 * 그 밖의 상대 링크는 GitHub, 앵커(`#...`)와 절대 URL은 그대로.
 */
function resolveHref(href: string): { href: string; internal: boolean } {
  if (href.startsWith("#")) return { href, internal: true };
  if (/^[a-z]+:/i.test(href)) return { href, internal: false };

  const doc = href.match(/^(?:\.\/)?(?:docs\/)?([\w-]+)\.md(#.*)?$/);
  if (doc) return { href: `/dev/docs/${doc[1]}${doc[2] ?? ""}`, internal: true };

  return { href: new URL(href, GITHUB_DOCS_BASE).toString(), internal: false };
}

/** `<pre><code class="language-mermaid">` → 다이어그램. 나머지 pre는 가로 스크롤 코드블록. */
function mermaidSource(node: Element | undefined): string | null {
  const code = node?.children[0];
  if (code?.type !== "element" || code.tagName !== "code") return null;
  const classes = code.properties.className;
  if (!Array.isArray(classes) || !classes.includes("language-mermaid")) return null;
  const text = code.children[0];
  return text?.type === "text" ? text.value : null;
}

/** react-markdown이 넘기는 `node`(hast)를 뺀 나머지 props. DOM 속성으로 새지 않게. */
function domProps<P extends { node?: unknown }>(props: P): Omit<P, "node"> {
  const { node, ...rest } = props;
  void node;
  return rest;
}

/**
 * className만 입힌 요소. react-markdown이 모든 컴포넌트에 `node`(hast)를 넘기는데, 그대로
 * 펼치면 DOM 속성으로 새어 React가 경고한다 — 여기서 걸러낸다.
 */
function styled<T extends keyof React.JSX.IntrinsicElements>(Tag: T, className: string) {
  function Styled(props: React.JSX.IntrinsicElements[T] & { node?: unknown; className?: string }) {
    const { className: own, ...rest } = domProps(props);
    const Comp = Tag as React.ElementType;
    return <Comp className={cn(className, own)} {...rest} />;
  }
  return Styled;
}

/**
 * 스타일은 요소별로 직접 입힌다(typography 플러그인 없이). 폰에서 읽는 게 목적이라
 * **표와 코드만 가로로 스크롤**하고 페이지 자체는 밀리지 않게 한다.
 */
const components: Components = {
  h1: styled("h1", "mt-2 mb-4 text-2xl font-bold text-foreground"),
  h2: styled("h2", "mt-10 mb-3 scroll-mt-4 border-b border-border pb-1 text-xl font-bold text-foreground"),
  h3: styled("h3", "mt-8 mb-2 scroll-mt-4 text-lg font-bold text-foreground"),
  h4: styled("h4", "mt-6 mb-2 scroll-mt-4 font-bold text-foreground"),
  p: styled("p", "my-3 leading-7"),
  ul: styled("ul", "my-3 list-disc space-y-1 ps-5 leading-7"),
  ol: styled("ol", "my-3 list-decimal space-y-1 ps-5 leading-7"),
  li: (props) => {
    const { className, ...p } = domProps(props);
    // GFM 체크박스 줄은 불릿을 빼서 체크박스가 불릿 자리에 오게 한다.
    return <li className={className === "task-list-item" ? "-ms-5 list-none" : undefined} {...p} />;
  },
  input: (props) => <input {...domProps(props)} className="me-1.5 align-middle" />,
  blockquote: styled("blockquote", "my-4 border-s-4 border-accent/60 bg-surface-warm/60 py-1 ps-4 pe-2"),
  hr: () => <hr className="my-8 border-border" />,
  a: ({ href = "", children }) => {
    const { href: to, internal } = resolveHref(href);
    const cls = "text-primary underline underline-offset-2 break-words";
    return internal ? (
      <Link href={to} className={cls}>
        {children}
      </Link>
    ) : (
      <a href={to} className={cls} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  },
  table: (props) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-sm" {...domProps(props)} />
    </div>
  ),
  th: styled("th", "border border-border bg-foreground/5 px-2 py-1.5 text-start font-bold"),
  td: styled("td", "border border-border px-2 py-1.5 align-top"),
  pre: ({ node, children }) => {
    const chart = mermaidSource(node);
    if (chart !== null) return <Mermaid chart={chart} />;
    return (
      <pre className="my-4 overflow-x-auto rounded-xl bg-foreground/5 p-3 text-xs leading-5 [&_code]:bg-transparent [&_code]:p-0">
        {children}
      </pre>
    );
  },
  code: styled("code", "rounded bg-foreground/5 px-1 py-0.5 text-[0.9em] break-words"),
  img: ({ alt }) => <span className="text-foreground/50">[이미지: {alt}]</span>,
};

/** md 원문을 그대로 그린다. raw HTML은 켜지 않는다(rehype-raw 없음). */
export function DocMarkdown({ source }: { source: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
      {source}
    </Markdown>
  );
}
