import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  GEMINI_HTTP_RETRIES,
  shouldRetryGeminiHttpStatus
} from "../supabase/functions/_shared/gemini-http-retry.mjs";

test("backend retry dibatasi tepat satu pengulangan", () => {
  assert.equal(GEMINI_HTTP_RETRIES, 1);
});

for (const status of [500, 502, 503, 504]) {
  test(`HTTP ${status} boleh dicoba ulang satu kali`, () => {
    assert.equal(shouldRetryGeminiHttpStatus(status, 0), true);
    assert.equal(shouldRetryGeminiHttpStatus(status, 1), false);
  });
}

for (const status of [200, 400, 401, 403, 404, 429]) {
  test(`HTTP ${status} tidak memicu retry backend`, () => {
    assert.equal(shouldRetryGeminiHttpStatus(status, 0), false);
  });
}

test("indeks retry tidak valid tidak mengizinkan pengulangan", () => {
  assert.equal(shouldRetryGeminiHttpStatus(503, -1), false);
  assert.equal(shouldRetryGeminiHttpStatus(503, 0.5), false);
});

for (const [name, path] of [
  ["inventory-ai", new URL("../supabase/functions/inventory-ai/index.ts", import.meta.url)],
  ["dokumen-ai", new URL("../supabase/functions/dokumen-ai/index.ts", import.meta.url)]
]) {
  test(name + " menggunakan kebijakan retry HTTP bersama", async () => {
    const source = await readFile(path, "utf8");
    assert.match(source, /import \{ shouldRetryGeminiHttpStatus \} from "\.\.\/\_shared\/gemini-http-retry\.mjs";/);
    assert.match(source, /for \(let retry = 0; ; retry\+\+\)/);
    assert.match(source, /shouldRetryGeminiHttpStatus\(response\.status, retry\)/);
    assert.match(source, /setTimeout\(resolve, 300\)/);
  });
}
