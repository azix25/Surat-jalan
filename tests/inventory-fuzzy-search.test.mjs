import test from "node:test";
import assert from "node:assert/strict";
import { rankInventoryItems } from "../supabase/functions/_shared/inventory-search.mjs";

const fillers = Array.from({ length: 100 }, (_, index) => ({
  id: "f-" + index,
  kode: "SKU-" + String(index).padStart(3, "0"),
  nama: "Barang stok umum " + String(index).padStart(3, "0"),
  varian: "",
  kategori: "Umum",
}));

test("salah ketik nama dan warna tetap menemukan kandidat di luar 80 item awal", () => {
  const target = { id: "target", kode: "KBL-RED", nama: "Kabel", varian: "Merah", kategori: "Listrik" };
  const blue = { id: "blue", kode: "KBL-BLU", nama: "Kabel", varian: "Biru", kategori: "Listrik" };
  const ranked = rankInventoryItems("tampilkan kable merha", [...fillers, blue, target]);
  assert.equal(ranked[0].item.id, "target");
  assert.ok(ranked.findIndex(entry => entry.item.id === "target") < 80);
});

test("satu transposisi huruf diperbolehkan untuk salah ketik ringan", () => {
  const items = [{ id: "1", nama: "Kain lap Chamois", varian: "Premium", kategori: "Lap" }];
  assert.equal(rankInventoryItems("cari chamios", items)[0].score, 1);
});

test("kandidat typo yang ambigu tidak diberi skor fuzzy", () => {
  const items = [
    { id: "a", nama: "Kabel", varian: "", kategori: "" },
    { id: "b", nama: "Kabté", varian: "", kategori: "" },
  ];
  const ranked = rankInventoryItems("kable", items);
  assert.deepEqual(ranked.map(entry => entry.score), [0, 0]);
});

test("token pendek seperti nama warna tidak dikoreksi secara fuzzy", () => {
  const items = [
    { id: "biru", nama: "Kain Biru", varian: "", kategori: "" },
    { id: "baru", nama: "Kain Baru", varian: "", kategori: "" },
  ];
  const ranked = rankInventoryItems("biru", items);
  assert.equal(ranked[0].item.id, "biru");
  assert.equal(ranked[1].score, 0);
});

test("SKU tetap membutuhkan kecocokan persis dan mendapat bobot lebih tinggi", () => {
  const items = [
    { id: "exact", kode: "ABC-001", nama: "Barang", varian: "", kategori: "" },
    { id: "name", kode: "XYZ-001", nama: "ABC-001", varian: "", kategori: "" },
  ];
  const ranked = rankInventoryItems("ABC-001", items);
  assert.equal(ranked[0].item.id, "exact");
  assert.equal(ranked[0].score, 12);
});

test("normalisasi tidak mengubah urutan pencarian exact", () => {
  const items = [{ id: "1", nama: "Kopi Café", varian: "Arabika", kategori: "Minuman" }];
  assert.equal(rankInventoryItems("cafe", items)[0].item.id, "1");
});
