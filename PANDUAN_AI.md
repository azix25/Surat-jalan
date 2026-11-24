# Konfigurasi AI AZX Office (Gemini API)

## Mesin AI

- **AI Dokumen** dan **AI Inventory** menggunakan Gemini API melalui Supabase Edge Functions.
- Snapshot Supabase 24 November 2026: `dokumen-ai` ACTIVE v50 dan `inventory-ai` ACTIVE v29; keduanya mencoba `gemini-3.5-flash-lite` lalu `gemini-3.6-flash` sebagai fallback.
- Fungsi backend: `dokumen-ai` dan `inventory-ai`. Versi Edge Function adalah nomor rilis fungsi, bukan nomor versi model Gemini.
- **Tidak menggunakan DeepSeek atau Ollama.**
- Transkripsi perintah suara pada AI Dokumen adalah jalur terpisah: bila secret Cloudflare tersedia, audio ditranskripsikan oleh Cloudflare Workers AI Whisper Large v3 Turbo. Teks hasil transkripsi kemudian diteruskan ke AI Dokumen yang menggunakan Gemini.

## Secret server

Di Supabase Dashboard → Edge Functions → Secrets, pastikan tersedia:

- `GEMINI_API_KEY` — wajib untuk AI Dokumen dan AI Inventory.
- `AI_ACCESS_CODE` — kode akses AI yang dimasukkan pengguna.
- `CLOUDFLARE_ACCOUNT_ID` dan `CLOUDFLARE_API_TOKEN` — opsional, hanya untuk transkripsi suara.

Jangan simpan Gemini API Key, Cloudflare API Token, atau secret server di HTML, JavaScript, atau repository. Jangan masukkan API Key ke kolom kode akses pengguna.

## Pengaturan pengguna

1. Masuk ke AZX Office atau AZX Inventory.
2. Pada penggunaan AI pertama di browser/perangkat tersebut, masukkan `AI_ACCESS_CODE` dari pengelola.
3. Kode akses disimpan pada localStorage browser dan dipakai bersama oleh modul Dokumen dan Inventory pada origin yang sama.
4. Jika kode ditolak atau diganti pengelola, masukkan kode terbaru saat diminta.

Catatan: penyimpanan lokal berlaku pada browser/perangkat dan domain yang sama. Menghapus data situs/browser akan menghapus kode tersimpan. Kode akses yang tersimpan di browser bukan pengganti autentikasi akun.

## Cara menggunakan AI Dokumen

1. Pilih jenis dan format dokumen.
2. Tulis instruksi bahasa Indonesia atau gunakan mikrofon.
3. Periksa kembali identitas, tanggal, nomor, rincian, satuan, dan nominal.
4. Simpan atau cetak hanya setelah hasil diperiksa. AI menghasilkan draf; AI tidak boleh dianggap sebagai persetujuan otomatis untuk menyimpan atau mencetak dokumen.

## Cara menggunakan AI Inventory

- Ajukan pertanyaan stok dengan kode, nama, warna, varian, atau periode tanggal.
- Periksa kode SKU, varian, satuan, dan angka sebelum mengambil keputusan operasional.
- Fitur AI Search ditujukan untuk membaca dan menjelaskan data; pencarian AI tidak boleh membuat atau mengubah transaksi stok.

## Kuota dan pembelajaran

- Kuota serta batas permintaan teks mengikuti akun dan kebijakan Gemini API.
- Kuota transkripsi suara, jika digunakan, mengikuti akun Cloudflare.
- Percakapan tidak otomatis melatih ulang Gemini secara permanen. Peningkatan AZX dilakukan melalui prompt, konteks, validasi, evaluasi, dan kode aplikasi.
- Jangan menggunakan isi dokumen, data pribadi, token, atau API Key sebagai contoh pelatihan. Gunakan data sintetis untuk pengujian regresi.

