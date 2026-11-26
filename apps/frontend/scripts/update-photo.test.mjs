import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function load(file, imports, fetch) {
  const exports = {};
  const source = fs.readFileSync(path.join(import.meta.dirname, "..", file), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "exports", "fetch", js)((name) => imports[name], exports, fetch);
  return exports;
}

async function upload({ adminStatus = 200, saveStatus = 200, csrf = true, type = "image/png", bytes = 4, networkFailure = false } = {}) {
  const calls = { puts: 0, deletes: 0, requests: 0 };
  const blob = load("src/lib/blob.ts", { "server-only": {} });
  const route = load("src/app/api/v1/update-photo/route.ts", {
    "@/lib/blob": blob,
    "@vercel/blob": {
      put: async () => { calls.puts++; return { url: "https://test.public.blob.vercel-storage.com/photo.png" }; },
      del: async () => { calls.deletes++; },
    },
  }, async () => {
    calls.requests++;
    if (calls.requests === 1) return new Response("{}", { status: adminStatus });
    if (networkFailure) throw new Error("connection lost");
    return new Response("{}", { status: saveStatus });
  });
  const form = new FormData();
  form.append("id", "1");
  form.append("photo", new File([new Uint8Array(bytes)], "photo.png", { type }));
  const response = await route.POST({
    headers: new Headers(csrf ? { "x-xsrf-token": "token" } : {}),
    cookies: { get: () => ({ value: "token" }) },
    formData: async () => form,
  });
  return { status: response.status, ...calls };
}

test("rejects missing CSRF and non-admin before uploading", async () => {
  assert.deepEqual(await upload({ csrf: false }), { status: 403, puts: 0, deletes: 0, requests: 0 });
  assert.deepEqual(await upload({ adminStatus: 403 }), { status: 403, puts: 0, deletes: 0, requests: 1 });
});
test("rejects unsupported, empty and oversized images", async () => {
  for (const options of [{ type: "image/svg+xml" }, { bytes: 0 }, { bytes: 1024 * 1024 + 1 }]) {
    const result = await upload(options);
    assert.equal(result.status, 400);
    assert.equal(result.puts, 0);
  }
});
test("stores an authorized image and cleans up a rejected save", async () => {
  assert.deepEqual(await upload(), { status: 200, puts: 1, deletes: 0, requests: 2 });
  assert.deepEqual(await upload({ saveStatus: 403 }), { status: 403, puts: 1, deletes: 1, requests: 2 });
});
test("does not delete a potentially saved image after an ambiguous network failure", async () => {
  assert.deepEqual(await upload({ networkFailure: true }), { status: 502, puts: 1, deletes: 0, requests: 2 });
});
