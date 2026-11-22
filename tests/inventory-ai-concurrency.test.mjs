import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../inventory.js", import.meta.url), "utf8");
const lockDeclaration = source.indexOf("let inventoryAIRequestInFlight=false;");
const runAIStart = source.indexOf("async function runAI(question){");
const guard = source.indexOf("if(inventoryAIRequestInFlight)", runAIStart);
const lockAcquire = source.indexOf("inventoryAIRequestInFlight=true;try{", runAIStart);
const request = source.indexOf("fetch(AI_FUNCTION_URL", runAIStart);
const release = source.indexOf("finally{inventoryAIRequestInFlight=false;", runAIStart);

test("runAI menolak permintaan tumpang tindih sebelum memanggil endpoint", () => {
  assert.notEqual(lockDeclaration, -1, "request lock harus dideklarasikan");
  assert.notEqual(runAIStart, -1, "runAI harus tersedia");
  assert.ok(runAIStart < guard, "guard harus berada di dalam runAI");
  assert.ok(guard < lockAcquire, "guard harus diperiksa sebelum lock diambil");
  assert.ok(lockAcquire < request, "lock harus diambil sebelum fetch");
});

test("runAI selalu melepas lock pada blok finally", () => {
  assert.notEqual(release, -1, "finally harus melepas request lock");
  assert.ok(request < release, "lock dilepas setelah bagian request");
  assert.match(
    source.slice(release, release + 150),
    /finally\{inventoryAIRequestInFlight=false;btn\.disabled=false;/
  );
});

test("pesan saat request lain berjalan tidak mengirim request kedua", () => {
  assert.match(
    source.slice(runAIStart, lockAcquire),
    /inventoryAIRequestInFlight\)\{inventoryAIState\("Permintaan sebelumnya masih diproses","running"\);return;\}/
  );
});
