import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../inventory.js", import.meta.url), "utf8");

function extractRunAI(sourceText) {
  const start = sourceText.indexOf("async function runAI(question){");
  assert.notEqual(start, -1, "runAI harus tersedia");
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
  throw new Error("runAI memiliki kurung kurawal yang tidak seimbang");
}

const lockDeclaration = source.match(/let\s+inventoryAIRequestInFlight\s*=\s*false\s*;/)?.[0];
assert.ok(lockDeclaration, "request lock harus dideklarasikan");
const runAIFunction = extractRunAI(source);
assert.match(runAIFunction, /if\(inventoryAIRequestInFlight\)/);
assert.match(runAIFunction, /finally\{inventoryAIRequestInFlight=false;/);

function okResponse(answer) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ answer, matched_item_ids: [] })
  };
}

function createHarness(fetchImpl) {
  const nodes = {
    aiSearchBtn: { disabled: false, textContent: "Kirim pertanyaan" },
    aiAnswer: { hidden: true, textContent: "" },
    inventoryAnswerAudioControls: { hidden: true },
    inventorySpeakAnswer: { disabled: true }
  };
  const states = [];
  const sandbox = {
    $: id => nodes[id] || (nodes[id] = {}),
    session: { user: { id: "synthetic-user" } },
    getAIAccessCode: () => "synthetic-access-code",
    inventoryAIState: (...args) => states.push(args),
    toast: () => {},
    supabase: {
      auth: {
        getSession: async () => ({
          data: { session: { access_token: "synthetic-session-token" } }
        })
      }
    },
    fetch: fetchImpl,
    AI_FUNCTION_URL: "https://example.invalid/functions/v1/inventory-ai",
    SUPABASE_KEY: "synthetic-public-key",
    clearSavedAIAccessCode: () => {},
    formatInventoryAnswerDates: value => String(value ?? ""),
    items: [],
    fmt: value => String(value),
    stockOf: () => 0,
    speakInventoryAIAnswer: async () => {}
  };

  vm.runInNewContext(
    lockDeclaration + "\n" + runAIFunction + "\nthis.runAI = runAI;",
    sandbox
  );
  return { runAI: sandbox.runAI, nodes, states };
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
