import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildGeminiJsonPrompt, GEMINI_JSON_REPAIR_ATTEMPTS } from "../supabase/functions/_shared/gemini-json-repair.mjs";

test("hanya satu percobaan perbaikan tambahan yang diizinkan", () => {
  assert.equal(GEMINI_JSON_REPAIR_ATTEMPTS, 1);
  assert.equal(GEMINI_JSON_REPAIR_ATTEMPTS + 1, 2);
});

test("percobaan pertama mengirim prompt asli tanpa tambahan", () => {
  const prompt = "Ubah alamat penerima saja.";
  assert.equal(buildGeminiJsonPrompt(prompt, "jawaban rusak", 0), prompt);
});

test("percobaan kedua menyertakan instruksi dan jawaban sebelumnya", () => {
  const prompt = buildGeminiJsonPrompt("Cari stok kain lap.", "{tidak valid", 1);
  assert.match(prompt, /PERBAIKAN OTOMATIS/);
  assert.match(prompt, /Cari stok kain lap\./);
  assert.match(prompt, /\{tidak valid/);
});

test("jawaban sebelumnya dibatasi agar prompt perbaikan tidak membesar tanpa batas", () => {
  const longOutput = "x".repeat(13000);
  const prompt = buildGeminiJsonPrompt("prompt", longOutput, 1);
  const instructionLength = (
    "PERBAIKAN OTOMATIS: Jawaban sebelumnya tidak dapat diproses sebagai JSON valid. " +
    "Tinjau ulang perintah dan seluruh data awal di atas, lalu susun ulang jawaban lengkap. " +
    "Jangan menyerah. Keluarkan tepat satu objek JSON valid sesuai struktur wajib, tanpa markdown. " +
    "Jawaban pertama: "
  ).length;
  assert.equal(prompt.length, "prompt".length + 2 + instructionLength + 12000);
});

for (const [name, path] of [
  ["dokumen-ai", new URL("../supabase/functions/dokumen-ai/index.ts", import.meta.url)],
  ["inventory-ai", new URL("../supabase/functions/inventory-ai/index.ts", import.meta.url)]
]) {
  test(name + " menggunakan helper dan loop perbaikan yang dibatasi", async () => {
    const source = await readFile(path, "utf8");
    assert.match(source, /buildGeminiJsonPrompt, GEMINI_JSON_REPAIR_ATTEMPTS/);
    assert.match(source, /for \(let attempt = 0; attempt <= GEMINI_JSON_REPAIR_ATTEMPTS; attempt\+\+\)/);
    assert.match(source, /buildGeminiJsonPrompt\(args\.prompt, previous, attempt\)/);
    assert.match(source, /Deno\.env\.get\("GEMINI_API_KEY"\)/);
    assert.doesNotMatch(source, /AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}/);
  });
}
