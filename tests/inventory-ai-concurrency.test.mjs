import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../inventory.js", import.meta.url), "utf8");

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
const extractRunAI = sourceText => extractFunction(sourceText, "async function runAI(question){");

const timeoutDeclaration = source.match(/const\s+INVENTORY_AI_REQUEST_TIMEOUT_MS\s*=\s*60000\s*;/)?.[0];
assert.ok(timeoutDeclaration, "request timeout harus dideklarasikan");
const lockDeclaration = source.match(/let\s+inventoryAIRequestInFlight\s*=\s*false\s*;/)?.[0];
assert.ok(lockDeclaration, "request lock harus dideklarasikan");
const responseReaderFunction = extractFunction(source, "async function readInventoryAIResponse(response){");
const runAIFunction = extractRunAI(source);
assert.match(runAIFunction, /if\(inventoryAIRequestInFlight\)/);
assert.match(runAIFunction, /finally\s*\{[\s\S]*inventoryAIRequestInFlight=false;/);

function okResponse(answer) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ answer, matched_item_ids: [] })
  };
}

function createHarness(fetchImpl, options = {}) {
  const nodes = {
    aiSearchBtn: { disabled: false, textContent: "Kirim pertanyaan" },
    aiAnswer: { hidden: true, textContent: "" },
    inventoryAnswerAudioControls: { hidden: true },
    inventorySpeakAnswer: { disabled: true }
  };
  const states = [];
  let clearCodeCount = 0;
  let speechCount = 0;
  const sandbox = {
    $: id => nodes[id] || (nodes[id] = {}),
    session: { user: { id: "synthetic-user" } },
    getAIAccessCode: () => "synthetic-access-code",
    inventoryAIState: (...args) => states.push(args),
    toast: () => {},
    supabase: {
      auth: {
        getSession: async () => ({
          data: { session: Object.prototype.hasOwnProperty.call(options, "session") ? options.session : { access_token: "synthetic-session-token" } }
        })
      }
    },
    fetch: fetchImpl,
    AbortController,
    setTimeout: options.setTimeout || setTimeout,
    clearTimeout: options.clearTimeout || clearTimeout,
    AI_FUNCTION_URL: "https://example.invalid/functions/v1/inventory-ai",
    SUPABASE_KEY: "synthetic-public-key",
    clearSavedAIAccessCode: () => { clearCodeCount += 1; },
    formatInventoryAnswerDates: value => String(value ?? ""),
    items: [],
    fmt: value => String(value),
    stockOf: () => 0,
    speakInventoryAIAnswer: async () => { speechCount += 1; }
  };

  vm.runInNewContext(
    timeoutDeclaration + "\n" + lockDeclaration + "\n" + responseReaderFunction + "\n" + runAIFunction + "\nthis.runAI = runAI;",
    sandbox
  );
  return { runAI: sandbox.runAI, nodes, states, clearCodeCount: () => clearCodeCount, speechCount: () => speechCount };
}

test("request kedua ditolak saat Gemini masih memproses request pertama", async () => {
  let resolveFirst;
  let fetchCount = 0;
  const firstResponse = new Promise(resolve => {
    resolveFirst = resolve;
  });
  const harness = createHarness(async () => {
    fetchCount += 1;
    return fetchCount === 1 ? firstResponse : okResponse("Jawaban request berikutnya");
  });

  const firstRun = harness.runAI("stok kabel");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fetchCount, 1);

  await harness.runAI("stok pipa");
  assert.equal(fetchCount, 1, "endpoint hanya boleh menerima satu request aktif");
  assert.equal(harness.states.at(-1)?.[0], "Permintaan sebelumnya masih diproses");

  resolveFirst(okResponse("Jawaban request pertama"));
  await firstRun;
  await harness.runAI("stok pipa");
  assert.equal(fetchCount, 2, "request baru boleh berjalan setelah request pertama selesai");
  assert.match(harness.nodes.aiAnswer.textContent, /Jawaban request berikutnya/);
});

test("request lock dilepas setelah kegagalan jaringan", async () => {
  let fetchCount = 0;
  const harness = createHarness(async () => {
    fetchCount += 1;
    if (fetchCount === 1) throw new Error("synthetic network failure");
    return okResponse("Jawaban setelah pemulihan");
  });

  await harness.runAI("stok kabel");
  assert.match(harness.nodes.aiAnswer.textContent, /synthetic network failure/);
  assert.equal(harness.nodes.aiSearchBtn.disabled, false);

  await harness.runAI("stok kabel");
  assert.equal(fetchCount, 2);
  assert.match(harness.nodes.aiAnswer.textContent, /Jawaban setelah pemulihan/);
});

test("pertanyaan kosong tidak mengunci request valid berikutnya", async () => {
  let fetchCount = 0;
  const harness = createHarness(async () => {
    fetchCount += 1;
    return okResponse("Jawaban valid");
  });

  await harness.runAI("   ");
  assert.equal(fetchCount, 0);
  await harness.runAI("stok kabel");
  assert.equal(fetchCount, 1);
});


test("permintaan yang melewati 60 detik dibatalkan dan lock dapat dipakai ulang", async () => {
  let fetchCount = 0;
  let fireTimeout;
  let timeoutDelay = 0;
  let clearedTimers = 0;
  const harness = createHarness(async (_url, options) => {
    fetchCount += 1;
    if (fetchCount === 1) {
      return new Promise((_resolve, reject) => {
        const abort = () => {
          const error = new Error("synthetic abort");
          error.name = "AbortError";
          reject(error);
        };
        if (options.signal.aborted) abort();
        else options.signal.addEventListener("abort", abort, { once: true });
      });
    }
    return okResponse("Jawaban setelah timeout");
  }, {
    setTimeout(callback, delay) {
      fireTimeout = callback;
      timeoutDelay = delay;
      return 42;
    },
    clearTimeout(id) {
      if (id === 42) clearedTimers += 1;
    }
  });

  const firstRun = harness.runAI("stok kabel");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fetchCount, 1);
  assert.equal(timeoutDelay, 60000);
  assert.equal(typeof fireTimeout, "function");

  fireTimeout();
  await firstRun;
  assert.match(harness.nodes.aiAnswer.textContent, /Waktu tunggu AI habis setelah 60 detik/);
  assert.equal(harness.nodes.aiSearchBtn.disabled, false);
  assert.equal(clearedTimers, 1);

  await harness.runAI("stok kabel");
  assert.equal(fetchCount, 2);
  assert.match(harness.nodes.aiAnswer.textContent, /Jawaban setelah timeout/);
  assert.equal(clearedTimers, 2);
});

test("sesi yang sudah berakhir ditangani tanpa TypeError dan tanpa request Gemini", async () => {
  let fetchCount = 0;
  const harness = createHarness(async () => {
    fetchCount += 1;
    return okResponse("Tidak boleh dipanggil");
  }, { session: null });

  await harness.runAI("stok kabel");
  assert.match(harness.nodes.aiAnswer.textContent, /Sesi login berakhir/);
  assert.equal(fetchCount, 0);
  assert.equal(harness.nodes.aiSearchBtn.disabled, false);
});


test("respons non-JSON dari gateway menampilkan pesan aman dan request lock pulih", async () => {
  let fetchCount = 0;
  const harness = createHarness(async () => {
    fetchCount += 1;
    if (fetchCount === 1) {
      return { ok: false, status: 502, json: async () => { throw new SyntaxError("Unexpected token <"); } };
    }
    return okResponse("Jawaban setelah gateway pulih");
  });

  await harness.runAI("stok kabel");
  assert.match(harness.nodes.aiAnswer.textContent, /HTTP 502/);
  assert.doesNotMatch(harness.nodes.aiAnswer.textContent, /Unexpected token/);
  assert.equal(harness.nodes.aiSearchBtn.disabled, false);

  await harness.runAI("stok kabel");
  assert.equal(fetchCount, 2);
  assert.match(harness.nodes.aiAnswer.textContent, /Jawaban setelah gateway pulih/);
});

test("jawaban kosong atau bukan teks ditolak sebelum dibacakan", async () => {
  const harness = createHarness(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ answer: { text: "bukan string" } })
  }));

  await harness.runAI("stok kabel");
  assert.match(harness.nodes.aiAnswer.textContent, /jawaban kosong atau format tidak sesuai/i);
  assert.equal(harness.speechCount(), 0);
  assert.equal(harness.nodes.aiSearchBtn.disabled, false);
});

test("error JSON HTTP 401 ditampilkan dan kode akses lokal dibersihkan", async () => {
  const harness = createHarness(async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: "Sesi tidak valid" })
  }));

  await harness.runAI("stok kabel");
  assert.equal(harness.nodes.aiAnswer.textContent, "Sesi tidak valid");
  assert.equal(harness.clearCodeCount(), 1);
  assert.equal(harness.speechCount(), 0);
});

test("field opsional yang salah tipe diabaikan dan ID barang non-string tidak dipakai", async () => {
  const harness = createHarness(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      answer: "Stok kabel tersedia.",
      suggestion: { html: "<script>bad()</script>" },
      matched_item_ids: ["synthetic-id", 42, null, ""]
    })
  }));

  await harness.runAI("stok kabel");
  assert.equal(harness.nodes.aiAnswer.textContent, "Stok kabel tersedia.");
  assert.doesNotMatch(harness.nodes.aiAnswer.textContent, /Barang terkait/);
  assert.equal(harness.speechCount(), 1);
});
