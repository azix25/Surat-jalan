import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../inventory-date-format.js", import.meta.url), "utf8");
const context = vm.createContext({ Intl, Date, String, Object });
vm.runInContext(source, context);
const format = context.AZXInventoryDateFormat.formatAnswerDates;

const expected = (year, monthIndex, day) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, monthIndex, day)));

test("formats a valid ISO date in Indonesian", () => {
  assert.equal(format("Transaksi 2026-11-26"), "Transaksi " + expected(2026, 10, 26));
});

test("formats leap day when the year is a leap year", () => {
  assert.equal(format("2024-02-29"), expected(2024, 1, 29));
});

test("preserves a non-existent day instead of normalizing it", () => {
  assert.equal(format("Tanggal 2026-02-31"), "Tanggal 2026-02-31");
});

test("preserves February 29 in a non-leap year", () => {
  assert.equal(format("2023-02-29"), "2023-02-29");
});

test("preserves invalid month and day boundaries", () => {
  assert.equal(format("2026-13-01 / 2026-04-00"), "2026-13-01 / 2026-04-00");
});

test("formats valid dates while leaving invalid dates unchanged in the same answer", () => {
  assert.equal(
    format("Masuk 2026-11-26; tanggal sumber 2026-02-31"),
    "Masuk " + expected(2026, 10, 26) + "; tanggal sumber 2026-02-31"
  );
});

test("converts nullish input to an empty string", () => {
  assert.equal(format(null), "");
});
