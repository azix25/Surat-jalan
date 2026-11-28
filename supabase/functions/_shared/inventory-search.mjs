const FUZZY_STOP_WORDS = new Set([
  "tampilkan", "tampil", "cari", "carikan", "temukan", "lihat", "cek", "periksa",
  "berapa", "stok", "persediaan", "barang", "item", "produk", "semua", "seluruh",
  "daftar", "rekap", "laporan", "jumlah", "sisa", "total", "hampir", "habis",
  "masuk", "keluar", "transaksi", "riwayat", "periode", "tanggal", "bulan", "tahun",
  "tolong", "minta", "saya", "mau", "ingin", "yang", "untuk", "dengan", "dan",
  "atau", "di", "ke", "dari", "pada", "ini", "itu", "warna", "varian", "jenis",
]);

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id");
}

function tokenize(value) {
  return normalizeSearchText(value).match(/[a-z0-9]+/g) || [];
}

function isOneEditAway(left, right) {
  if (!left || !right || left === right || Math.abs(left.length - right.length) > 1) return false;
  if (left.length === right.length) {
    const mismatches = [];
    for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) mismatches.push(i);
    if (mismatches.length === 1) return true;
    if (mismatches.length === 2) {
      const [first, second] = mismatches;
      return second === first + 1 && left[first] === right[second] && left[second] === right[first];
    }
    return false;
  }
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  let i = 0, j = 0, skipped = false;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) { i++; j++; continue; }
    if (skipped) return false;
    skipped = true;
    j++;
  }
  return true;
}

export function rankInventoryItems(question, items) {
  const terms = normalizeSearchText(question).match(/[a-z0-9-]{2,}/g) || [];
  const entries = (Array.isArray(items) ? items : []).map(item => {
    const searchable = [item?.nama, item?.varian, item?.kategori].filter(Boolean).join(" ");
    const haystack = [item?.kode, item?.kode_utama, searchable].filter(Boolean).map(normalizeSearchText).join(" ");
    return { item, haystack, searchableTokens: new Set(tokenize(searchable)) };
  });

  // Fuzzy correction is deliberately conservative: only alphabetic terms of at least
  // five characters, only one edit away, and only when the entire catalog has one
  // distinct candidate token. SKU/code matching remains exact.
  const catalogTokens = new Set(entries.flatMap(entry => [...entry.searchableTokens]));
  const fuzzyTargets = new Map();
  const fuzzyQueryTerms = terms.filter(term => /^[a-z]{5,}$/.test(term) && !FUZZY_STOP_WORDS.has(term)).slice(0, 8);
  for (const term of fuzzyQueryTerms) {
    if (entries.some(entry => entry.haystack.includes(term))) continue;
    const candidates = [];
    for (const token of catalogTokens) {
      if (isOneEditAway(term, token)) {
        candidates.push(token);
        if (candidates.length > 1) break;
      }
    }
    if (candidates.length === 1) fuzzyTargets.set(term, candidates[0]);
  }

  return entries.map(({ item, haystack, searchableTokens }) => {
    const score = terms.reduce((sum, term) => {
      if (!haystack.includes(term)) return sum;
      const exactSku = normalizeSearchText(item?.kode) === term || normalizeSearchText(item?.kode_utama) === term;
      return sum + (exactSku ? 12 : 2);
    }, 0);
    const fuzzyScore = [...fuzzyTargets.values()].reduce((sum, token) => sum + (searchableTokens.has(token) ? 1 : 0), 0);
    return { item, score: score + fuzzyScore };
  }).sort((a, b) => b.score - a.score);
}
