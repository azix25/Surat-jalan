export const MAX_DOCUMENT_ITEMS = 300;

const ITEM_REFERENCE_PATTERN = /\b(?:barang|brg|item|rincian|produk|sku|qty|jumlah|kuantitas|satuan|harga|pcs|dus|box|karton|batang|warna|ukuran|varian)\b|\bkolom\s+tambahan\b/i;
const NO_ITEM_CHANGE_PATTERN = /\b(?:jangan|tidak|tanpa)\s+(?:mengubah|ubah|merubah|mengedit|edit|menambah|tambah|menghapus|hapus|menghilangkan|hilangkan)\s+(?:daftar\s+)?(?:barang|brg|item|rincian|produk|sku|qty|jumlah|kuantitas|satuan|harga|pcs|dus|box|karton|batang|warna|ukuran|varian)\b/i;
const PRESERVE_ITEM_PATTERN = /\b(?:tetap|pertahankan|jaga)\s+(?:semua\s+)?(?:barang|brg|item|rincian|produk|sku|qty|jumlah|kuantitas|satuan|harga|pcs|dus|box|karton|batang|warna|ukuran|varian)\b/i;
const DELETE_PATTERN = /\b(?:hapus|hapuskan|menghapus|hilangkan|menghilangkan|buang|membuang|delete)\b/i;
const NEGATED_DELETE_PATTERN = /\b(?:jangan|tidak|tanpa)\s+(?:menghapus|hapus|menghilangkan|hilangkan|membuang|buang)\b/i;
const ADD_PATTERN = /\b(?:buat|buatkan|bikin|tambah|tambahkan|masukkan|sertakan|cantumkan|isi)\b/i;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isDocumentItemMutation(instruction) {
  const text = String(instruction ?? "").toLocaleLowerCase("id").trim();
  if (!text || ((NO_ITEM_CHANGE_PATTERN.test(text) || PRESERVE_ITEM_PATTERN.test(text)) && !ADD_PATTERN.test(text))) return false;
  return ITEM_REFERENCE_PATTERN.test(text);
}

function hasExplicitDeleteIntent(instruction) {
  const text = String(instruction ?? "").toLocaleLowerCase("id");
  return DELETE_PATTERN.test(text) && !NEGATED_DELETE_PATTERN.test(text);
}

function hasExplicitAddIntent(instruction) {
  return ADD_PATTERN.test(String(instruction ?? "").toLocaleLowerCase("id"));
}

export function prepareDocumentModelInput(currentDocument, instruction, options = {}) {
  const document = isRecord(currentDocument) ? { ...currentDocument } : {};
  const readOnly = options.readOnly === true;
  const maxItems = Number.isInteger(options.maxItems) && options.maxItems > 0
    ? options.maxItems
    : MAX_DOCUMENT_ITEMS;
  const sourceItems = Array.isArray(document.items) ? document.items : [];
  const itemMutation = !readOnly && isDocumentItemMutation(instruction);

  if (itemMutation && sourceItems.length > maxItems) {
    return {
      ok: false,
      itemMutation,
      error: "Dokumen memiliki " + sourceItems.length + " rincian. AI hanya dapat mengubah maksimal " + maxItems + " rincian sekaligus. Tidak ada perubahan yang diterapkan.",
    };
  }
  if (itemMutation && hasExplicitDeleteIntent(instruction)) {
    return {
      ok: false,
      itemMutation,
      error: "Penghapusan rincian melalui AI belum diterapkan secara aman. Hapus baris langsung pada editor agar rincian lain tetap utuh.",
    };
  }

  // For unrelated edits, do not send the potentially large item list to Gemini.
  // The server restores the original list after the model response.
  if (!itemMutation && !readOnly) delete document.items;

  return { ok: true, document, itemMutation };
}

export function reconcileDocumentItems({ sourceItems, modelItems, instruction, itemMutation, maxItems = MAX_DOCUMENT_ITEMS }) {
  const source = Array.isArray(sourceItems) ? sourceItems : [];
  if (!itemMutation) return { ok: true, items: source, reason: "preserved" };

  if (source.length > maxItems) {
    return { ok: false, error: "Dokumen memiliki lebih dari " + maxItems + " rincian. Tidak ada perubahan yang diterapkan." };
  }
  if (hasExplicitDeleteIntent(instruction)) {
    return {
      ok: false,
      error: "Penghapusan rincian melalui AI belum diterapkan secara aman. Hapus baris langsung pada editor agar rincian lain tetap utuh.",
    };
  }
  if (!Array.isArray(modelItems)) {
    return { ok: false, error: "AI tidak mengembalikan daftar rincian yang valid. Dokumen tidak diubah." };
  }
  if (modelItems.length > maxItems) {
    return { ok: false, error: "AI menghasilkan lebih dari " + maxItems + " rincian. Dokumen tidak diubah." };
  }
  if (!modelItems.every(isRecord)) {
    return { ok: false, error: "Format salah satu rincian dari AI tidak valid. Dokumen tidak diubah." };
  }
  if (modelItems.length < source.length) {
    return {
      ok: false,
      error: "AI hanya mengembalikan " + modelItems.length + " dari " + source.length + " rincian. Hasil tidak diterapkan agar tidak ada barang yang hilang.",
    };
  }
  if (modelItems.length > source.length && !hasExplicitAddIntent(instruction)) {
    return {
      ok: false,
      error: "AI menambahkan rincian tanpa perintah penambahan yang jelas. Dokumen tidak diubah.",
    };
  }

  const items = modelItems.map((item, index) => {
    const original = isRecord(source[index]) ? source[index] : {};
    const originalCustom = isRecord(original.custom) ? original.custom : {};
    const modelCustom = isRecord(item.custom) ? item.custom : {};
    const merged = { ...original, ...item };
    if (Object.keys(originalCustom).length || Object.keys(modelCustom).length) {
      merged.custom = { ...originalCustom, ...modelCustom };
    }
    merged.nama = String(item.nama ?? original.nama ?? "").slice(0, 300);
    merged.qty = String(item.qty ?? original.qty ?? 0).slice(0, 80);
    merged.harga = Math.max(0, Number(item.harga ?? original.harga ?? 0) || 0);
    return merged;
  });

  return { ok: true, items, reason: "updated" };
}
