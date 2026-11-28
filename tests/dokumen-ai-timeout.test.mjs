import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../dokumen.js", import.meta.url), "utf8");
const timeoutLine = source.split(/\r?\n/).find(line => line.startsWith("const DOCUMENT_AI_REQUEST_TIMEOUT_MS="));
assert.equal(timeoutLine, "const DOCUMENT_AI_REQUEST_TIMEOUT_MS=90000", "timeout Dokumen harus 90 detik");

function extractFunction(sourceText, signature) {
  const start = sourceText.indexOf(signature);
  assert.notEqual(start, -1, signature + " harus tersedia");
  let depth = 0;
  let quote = null;
  let escaped = false;
  let opened = false;
  for (let i = sourceText.indexOf("{", start); i < sourceText.length; i += 1) {
    const char = sourceText[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char.charCodeAt(0) === 96) {
      quote = char;
      continue;
    }
    if (char === "{") {
      depth += 1;
      opened = true;
    } else if (char === "}" && opened) {
      depth -= 1;
      if (depth === 0) return sourceText.slice(start, i + 1);
    }
  }
  throw new Error(signature + " memiliki kurung kurawal yang tidak seimbang");
}

const helperNames = ["isGeminiQuotaExhausted", "shouldRetryAIResponse", "getAIRetryDelayMs"];
const helperLines = source.split(/\r?\n/).filter(line =>
  helperNames.some(name => line.startsWith("function " + name + "("))
);
assert.equal(helperLines.length, helperNames.length, "helper kebijakan retry harus tersedia tepat satu kali");
const requestFunction = extractFunction(source, "async function requestAIWithRetry(url,options,status){");

function createHarness(fetchImpl, options = {}) {
  let nextTimerId = 0;
  const timeoutCallbacks = new Map();
  const cleared = [];
  const delays = [];
  const fakeSetTimeout = (callback, delay) => {
    const id = ++nextTimerId;
    delays.push(delay);
    if (delay === 90000) timeoutCallbacks.set(id, callback);
    else queueMicrotask(callback);
    return id;
  };
  const fakeClearTimeout = id => {
    cleared.push(id);
    timeoutCallbacks.delete(id);
  };
  const sandbox = {
    fetch: fetchImpl,
    AbortController: Object.prototype.hasOwnProperty.call(options, "AbortController")
      ? options.AbortController : AbortController,
    setTimeout: fakeSetTimeout,
    clearTimeout: fakeClearTimeout,
    status: { textContent: "" }
  };
  runInNewContext(
    timeoutLine + "\n" + helperLines.join("\n") + "\n" + requestFunction +
    "\nglobalThis.requestAIWithRetry=requestAIWithRetry;",
    sandbox
  );
  return {
    request: sandbox.requestAIWithRetry,
    status: sandbox.status,
    delays,
    cleared,
    fireTimeout() {
      const entry = [...timeoutCallbacks.entries()][0];
      assert.ok(entry, "timer batas waktu harus aktif");
      entry[1]();
    },
    pendingTimeouts: () => timeoutCallbacks.size
  };
}

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    clone() { return { json: async () => payload }; },
    headers: { get: () => null }
  };
}

test("respons sukses dibaca sebagai JSON dan timer dibersihkan", async () => {
  let calls = 0;
  const harness = createHarness(async (_url, options) => {
    calls += 1;
    assert.ok(options.signal instanceof AbortSignal);
    return jsonResponse(200, { document: { pihak: "Penerima Uji" } });
  });
  const result = await harness.request("https://example.invalid/dokumen-ai", { method: "POST" }, harness.status);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { document: { pihak: "Penerima Uji" } });
  assert.equal(calls, 1);
  assert.ok(harness.delays.includes(90000));
  assert.equal(harness.pendingTimeouts(), 0);
  assert.equal(harness.cleared.length, 1);
});

test("timeout saat membaca body membatalkan request dan tidak mencoba ulang", async () => {
  let calls = 0;
  const harness = createHarness(async (_url, options) => {
    calls += 1;
    return {
      ok: true,
      status: 200,
      clone() {
        return {
          json: () => new Promise((_resolve, reject) => {
            options.signal.addEventListener("abort", () => {
              const error = new Error("synthetic abort");
              error.name = "AbortError";
              reject(error);
            }, { once: true });
          })
        };
      },
      headers: { get: () => null }
    };
  });
  const pending = harness.request("https://example.invalid/dokumen-ai", { method: "POST" }, harness.status);
  await Promise.resolve();
  harness.fireTimeout();
  await assert.rejects(pending, /Waktu tunggu AI Dokumen habis setelah 90 detik/);
  assert.equal(calls, 1, "AbortError tidak boleh memicu request kedua");
  assert.equal(harness.pendingTimeouts(), 0);
  assert.equal(harness.cleared.length, 1);
});

test("HTTP 503 masih mengikuti retry terbatas lalu menerima JSON kedua", async () => {
  let calls = 0;
  const harness = createHarness(async () => {
    calls += 1;
    return calls === 1
      ? jsonResponse(503, { error: "Gemini sedang sibuk" })
      : jsonResponse(200, { document: { nomorDokumen: "SJ-UJI-002" } });
  });
  const result = await harness.request("https://example.invalid/dokumen-ai", { method: "POST" }, harness.status);
  assert.equal(calls, 2);
  assert.equal(result.document.nomorDokumen, "SJ-UJI-002");
  assert.equal(harness.delays.filter(delay => delay === 90000).length, 2);
  assert.equal(harness.pendingTimeouts(), 0);
  assert.equal(harness.cleared.length, 2);
});

test("HTTP sukses dengan JSON rusak ditolak, bukan dianggap draf berhasil", async () => {
  const harness = createHarness(async () => ({
    ok: true,
    status: 200,
    clone() { return { json: async () => { throw new SyntaxError("invalid JSON"); } }; },
    headers: { get: () => null }
  }));
  await assert.rejects(
    harness.request("https://example.invalid/dokumen-ai", { method: "POST" }, harness.status),
    /Respons AI Dokumen tidak valid/
  );
  assert.equal(harness.pendingTimeouts(), 0);
  assert.equal(harness.cleared.length, 1);
});

test("browser tanpa AbortController ditolak sebelum request dikirim", async () => {
  let calls = 0;
  const harness = createHarness(async () => { calls += 1; }, { AbortController: undefined });
  await assert.rejects(
    harness.request("https://example.invalid/dokumen-ai", { method: "POST" }, harness.status),
    /Browser belum mendukung batas waktu AI/
  );
  assert.equal(calls, 0);
  assert.equal(harness.delays.length, 0);
});
