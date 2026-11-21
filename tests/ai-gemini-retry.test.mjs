import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../dokumen.js", import.meta.url), "utf8");
const helperNames = ["isGeminiQuotaExhausted", "shouldRetryAIResponse", "getAIRetryDelayMs"];
const helperLines = source.split(/\r?\n/).filter(line =>
  helperNames.some(name => line.startsWith(`function ${name}(`))
);
assert.equal(helperLines.length, helperNames.length, "Semua helper retry AI harus ada tepat satu kali");

const sandbox = {};
runInNewContext(
  `${helperLines.join("\n")}\nglobalThis.aiRetryHelpers = { isGeminiQuotaExhausted, shouldRetryAIResponse, getAIRetryDelayMs };`,
  sandbox
);
const { isGeminiQuotaExhausted, shouldRetryAIResponse, getAIRetryDelayMs } = sandbox.aiRetryHelpers;

for (const [message, expected] of [
  ["Kuota Gemini sedang mencapai batas", true],
  ["Batas kuota Gemini tercapai", true],
  ["Batas penggunaan AI harian tercapai. Silakan coba lagi besok.", true],
  ["RESOURCE_EXHAUSTED", true],
  ["quota limit exceeded", true],
  ["Permintaan AI terlalu cepat. Tunggu sebentar sebelum mencoba lagi.", false],
  ["Gemini sedang sibuk", false],
  ["Temporary overload", false],
  ["Koneksi timeout", false]
]) {
  test(`deteksi kuota: ${message}`, () => {
    assert.equal(isGeminiQuotaExhausted(message), expected);
  });
}

for (const [name, status, message, expected] of [
  ["kuota Indonesia tidak diulang", 429, "Kuota Gemini sedang mencapai batas", false],
  ["batas harian AZX tidak diulang", 429, "Batas penggunaan AI harian tercapai", false],
  ["pembatasan per menit boleh mencoba ulang", 429, "Permintaan AI terlalu cepat", true],
  ["HTTP 503 dicoba ulang", 503, "Gemini sedang sibuk", true],
  ["HTTP 504 dicoba ulang", 504, "Gateway timeout", true],
  ["HTTP 400 tidak dicoba ulang", 400, "Format permintaan tidak valid", false]
]) {
  test(name, () => assert.equal(shouldRetryAIResponse(status, message), expected));
}

test("header Retry-After lebih diutamakan daripada body", () => {
  const response = { headers: { get: () => "5" } };
  assert.equal(getAIRetryDelayMs(response, { retry_after: 60 }, 1), 5000);
});

test("retry_after dari body dipakai jika header tidak tersedia", () => {
  const response = { headers: { get: () => null } };
  assert.equal(getAIRetryDelayMs(response, { retry_after: 30 }, 1), 30000);
});

test("fallback memakai jeda eksponensial", () => {
  const response = { headers: { get: () => null } };
  assert.equal(getAIRetryDelayMs(response, {}, 2), 3000);
});

test("jeda server dibatasi maksimal 60 detik", () => {
  const response = { headers: { get: () => null } };
  assert.equal(getAIRetryDelayMs(response, { retry_after: 120 }, 1), 60000);
});

test("header Retry-After HTTP-date dihitung relatif terhadap waktu uji", () => {
  const now = Date.UTC(2026, 10, 18, 3, 0, 0);
  const response = { headers: { get: () => "Wed, 18 Nov 2026 03:00:05 GMT" } };
  assert.equal(getAIRetryDelayMs(response, { retry_after: 30 }, 1, now), 5000);
});

test("HTTP-date Retry-After yang sudah lewat berarti coba ulang segera", () => {
  const now = Date.UTC(2026, 10, 18, 3, 0, 0);
  const response = { headers: { get: () => "Tue, 17 Nov 2026 03:00:00 GMT" } };
  assert.equal(getAIRetryDelayMs(response, { retry_after: 30 }, 1, now), 0);
});

test("Retry-After bernilai nol diutamakan daripada body", () => {
  const response = { headers: { get: () => "0" } };
  assert.equal(getAIRetryDelayMs(response, { retry_after: 30 }, 1), 0);
});

test("header Retry-After tidak valid memakai retry_after dari body", () => {
  const response = { headers: { get: () => "bukan-tanggal" } };
  assert.equal(getAIRetryDelayMs(response, { retry_after: 30 }, 1), 30000);
});

test("retry_after body bernilai nol dihormati", () => {
  const response = { headers: { get: () => null } };
  assert.equal(getAIRetryDelayMs(response, { retry_after: 0 }, 1), 0);
});
