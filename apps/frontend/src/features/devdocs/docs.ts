import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import GithubSlugger from "github-slugger";
import type { Heading, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

/**
 * 저장소 루트의 `docs/*.md`를 읽는다. **빌드 때만** 불린다 — 두 페이지 모두 정적 생성이라
 * 배포된 서버가 런타임에 파일을 찾을 일이 없다(서버리스 함수에 docs 폴더가 안 실려도 된다).
 *
 * `process.cwd()`는 `apps/frontend`다(로컬 `next dev`/`next build`, Vercel Root Directory 모두).
 * Vercel은 Root Directory 밖 파일도 빌드 단계에 넣어 준다 — 프로젝트 설정
 * "Include files outside the root directory in the Build Step"(기본 켜짐). 그게 꺼지면
 * 목록이 비고 빌드가 아래 throw로 멈춘다.
 */
const DOCS_DIR = path.join(process.cwd(), "..", "..", "docs");

export type DocMeta = { slug: string; title: string };
export type TocItem = { depth: 2 | 3; id: string; text: string };

/** `00_SETUP_GUIDE` 같은 파일명(확장자 제외)이 slug다. 번호 순으로 정렬된다. */
export async function listDocs(): Promise<DocMeta[]> {
  const files = (await readdir(DOCS_DIR)).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) throw new Error(`docs 폴더에 md가 없다: ${DOCS_DIR}`);

  return Promise.all(
    files.map(async (file) => {
      const slug = file.slice(0, -".md".length);
      const source = await readFile(path.join(DOCS_DIR, file), "utf8");
      const title = source.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? slug;
      return { slug, title };
    }),
  );
}

/**
 * 문서 하나. 목록에 있는 slug만 받는다 — `../` 같은 값으로 docs 밖을 읽지 못하게.
 * 없으면 null(→ 404).
 */
export async function getDoc(
  slug: string,
): Promise<{ meta: DocMeta; source: string; toc: TocItem[] } | null> {
  const meta = (await listDocs()).find((d) => d.slug === slug);
  if (!meta) return null;

  const source = await readFile(path.join(DOCS_DIR, `${slug}.md`), "utf8");
  return { meta, source, toc: buildToc(source) };
}

/**
 * `##`·`###` 목차. id는 렌더러의 rehype-slug와 **같은 규칙**(github-slugger, 문서 전체에서
 * 중복 시 -1, -2)이어야 앵커가 맞는다. 그래서 정규식이 아니라 같은 파서로 제목 텍스트를
 * 뽑는다 — `**굵게**`·`` `코드` ``가 섞인 제목에서 둘이 어긋나지 않게.
 * 슬러거는 h1까지 전부 거쳐야 번호가 렌더러와 같아진다.
 */
function buildToc(source: string): TocItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(source) as Root;
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];

  // 인용문·목록 안의 제목도 rehype-slug는 센다. 문서 순서대로 전부 훑어야 번호가 맞는다.
  const walk = (node: Root | Root["children"][number]) => {
    if (node.type === "heading") {
      const text = toString(node as Heading);
      const id = slugger.slug(text);
      if (node.depth === 2 || node.depth === 3) toc.push({ depth: node.depth, id, text });
      return;
    }
    if ("children" in node) for (const child of node.children) walk(child as Root["children"][number]);
  };
  walk(tree);
  return toc;
}
