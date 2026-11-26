import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function load(file, imports, window, navigator) {
  const source = fs.readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  new Function("require", "exports", "window", "navigator", "localStorage", js)(
    (name) => imports[name], exports, window, navigator,
    { getItem: () => "true" }, // ‘이미 설치했어요’를 선택해도 브라우저 메뉴는 유지한다.
  );
  return exports;
}

test("hides the entire row in standalone, keeps manual help in browsers", () => {
  for (const [media, ios, server, hidden] of [
    [true, false, false, true], [false, true, false, true],
    [false, false, false, false], [false, false, true, true],
  ]) {
    const window = { matchMedia: () => ({ matches: media }) };
    const navigator = { standalone: ios };
    const guide = load("features/install/install-guide.ts", {}, window, navigator);
    const button = load("features/install/InstallGuideButton.tsx", {
      "react": { useSyncExternalStore: (_subscribe, snapshot, serverSnapshot) => server ? serverSnapshot() : snapshot() },
      "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "fragment" },
      "lucide-react": { ChevronRight: "icon" },
      "@/components/ui/button": { Button: "button" },
      "./install-guide": guide,
    }, window, navigator);
    const result = button.InstallGuideButton();
    assert.equal(result === null, hidden);
    if (!hidden) assert.equal(result.type, "button");
  }
});
