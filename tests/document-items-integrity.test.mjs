import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import {
  isDocumentItemMutation,
  prepareDocumentModelInput,
  reconcileDocumentItems,
} from "../supabase/functions/_shared/document-items.mjs";

const makeItems = (count) => Array.from({ length: count }, (_, i) => ({
  nama: "Barang " + (i + 1),
  qty: "1 pcs",
  harga: 0,
  custom: { Warna: i % 2 ? "Biru" : "Merah", Batch: "B-" + (i + 1) },
}));

test("perubahan alamat tidak dianggap sebagai perubahan rincian", () => {
  assert.equal(isDocumentItemMutation("Ubah alamat penerima menjadi Jl. Baru 2"), false);
});

test("permintaan tanpa perubahan item tidak mengirim daftar item ke Gemini", () => {
  const source = { alamatPihak: "Lama", items: makeItems(301) };
  const prepared = prepareDocumentModelInput(source, "Ubah alamat penerima", { readOnly: false });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.itemMutation, false);
  assert.equal("items" in prepared.document, false);
  assert.equal(source.items.length, 301);
});

test("permintaan baca-saja tetap dapat mengirim konteks item dan tidak memutasi", () => {
  const source = { items: makeItems(2) };
  const prepared = prepareDocumentModelInput(source, "Jelaskan barang apa saja di dokumen", { readOnly: true });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.itemMutation, false);
  assert.equal(prepared.document.items.length, 2);
  const result = reconcileDocumentItems({ sourceItems: source.items, modelItems: [], instruction: "Jelaskan barang apa saja di dokumen", itemMutation: false });
  assert.deepEqual(result.items, source.items);
});

test("301 item tetap dipertahankan untuk perubahan field yang tidak terkait", () => {
  const source = makeItems(301);
  const result = reconcileDocumentItems({ sourceItems: source, modelItems: undefined, instruction: "Ubah alamat penerima", itemMutation: false });
  assert.equal(result.ok, true);
  assert.equal(result.items.length, 301);
  assert.deepEqual(result.items, source);
});

test("perubahan item pada dokumen lebih dari 300 baris ditolak sebelum Gemini", () => {
  const prepared = prepareDocumentModelInput({ items: makeItems(301) }, "Ubah qty barang menjadi 2 pcs", { readOnly: false });
  assert.equal(prepared.ok, false);
  assert.match(prepared.error, /301 rincian/);
});

test("hasil model yang kehilangan item ditolak tanpa menerapkan hasil parsial", () => {
  const source = makeItems(3);
  const result = reconcileDocumentItems({ sourceItems: source, modelItems: makeItems(2), instruction: "Ubah qty barang", itemMutation: true });
  assert.equal(result.ok, false);
  assert.match(result.error, /2 dari 3 rincian/);
  assert.deepEqual(source, makeItems(3));
});

test("penambahan item hanya diterima bila instruksi menyatakan penambahan", () => {
  const source = makeItems(1);
  const rejected = reconcileDocumentItems({ sourceItems: source, modelItems: makeItems(2), instruction: "Ubah harga barang", itemMutation: true });
  assert.equal(rejected.ok, false);
  const accepted = reconcileDocumentItems({ sourceItems: source, modelItems: makeItems(2), instruction: "Tambahkan satu item baru", itemMutation: true });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.items.length, 2);
});

test("kolom custom yang tidak disebut tetap utuh saat satu kolom diubah", () => {
  const source = [{ nama: "Kain Lap", qty: "30 pcs", harga: 0, custom: { Warna: "Merah", Batch: "B-01" }, extension: "tetap" }];
  const model = [{ nama: "Kain Lap", qty: "30 pcs", harga: 0, custom: { Warna: "Biru" } }];
  const result = reconcileDocumentItems({ sourceItems: source, modelItems: model, instruction: "Ubah warna item menjadi Biru", itemMutation: true });
  assert.equal(result.ok, true);
  assert.deepEqual(result.items[0].custom, { Warna: "Biru", Batch: "B-01" });
  assert.equal(result.items[0].extension, "tetap");
  assert.equal(result.items[0].qty, "30 pcs");
});

test("qty bersatuan tetap berupa teks", () => {
  const result = reconcileDocumentItems({ sourceItems: [{ nama: "Kabel", qty: "30 pcs", harga: 0 }], modelItems: [{ nama: "Kabel", qty: "30 pcs", harga: 0 }], instruction: "Ubah qty item", itemMutation: true });
  assert.equal(result.items[0].qty, "30 pcs");
});

test("permintaan penghapusan item ditolak secara eksplisit", () => {
  const prepared = prepareDocumentModelInput({ items: makeItems(2) }, "Hapus item Barang 1", { readOnly: false });
  assert.equal(prepared.ok, false);
  assert.match(prepared.error, /hapus baris langsung/i);
});

test("instruksi jangan hapus item tidak salah diklasifikasikan sebagai penghapusan", () => {
  const prepared = prepareDocumentModelInput({ items: makeItems(2) }, "Ubah alamat dan jangan hapus item", { readOnly: false });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.itemMutation, false);
});

test("hasil item dengan elemen non-objek ditolak", () => {
  const result = reconcileDocumentItems({ sourceItems: makeItems(1), modelItems: ["barang palsu"], instruction: "Ubah item", itemMutation: true });
  assert.equal(result.ok, false);
  assert.match(result.error, /format.*rincian/i);
});

test("instruksi mempertahankan item lama sekaligus menambah item baru tetap dikenali", () => {
  assert.equal(isDocumentItemMutation("Jangan ubah item lama, tambahkan satu item baru"), true);
});


test("dokumen-ai mengeluarkan items dari prompt non-item dan memvalidasi hasil sebelum respons", async () => {
  const source = await readFile(new URL("../supabase/functions/dokumen-ai/index.ts", import.meta.url), "utf8");
  assert.match(source, /prepareDocumentModelInput\(sourceDoc, instruction/);
  assert.match(source, /currentDocument: modelInput\.document/);
  assert.match(source, /reconcileDocumentItems\(/);
  assert.match(source, /doc\.items = itemResult\.items/);
  assert.doesNotMatch(source, /modelItems\.slice\(0,\s*300\)/);
  assert.ok(source.indexOf("const modelInput = prepareDocumentModelInput") < source.indexOf("const aiModels ="));
});
