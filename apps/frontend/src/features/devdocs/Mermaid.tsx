"use client";

import { useEffect, useId, useState } from "react";

/**
 * ```mermaid 코드블록을 그림으로. docs에서는 06_ERD · 08_USER_FLOWS 두 곳뿐이다.
 *
 * mermaid는 무겁다(수 MB). **동적 import**라 이 컴포넌트가 실제로 그려지는 문서에서만
 * 받는다. 그리는 동안·실패 시에는 원문을 그대로 보여준다 — 문법 오류가 있어도 내용은 읽힌다.
 */
export function Mermaid({ chart }: { chart: string }) {
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
        const { svg } = await mermaid.render(id, chart);
        if (alive) setSvg(svg);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [id, chart]);

  if (svg) {
    return (
      <div
        className="my-4 overflow-x-auto rounded-xl border border-border bg-white p-3 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-none"
        // mermaid가 securityLevel strict로 만든 SVG다. 입력도 저장소의 문서뿐이다.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <pre className="my-4 overflow-x-auto rounded-xl bg-foreground/5 p-3 text-xs">
      {failed && <span className="mb-2 block text-destructive">다이어그램을 그리지 못했어요 — 원문</span>}
      <code>{chart}</code>
    </pre>
  );
}
