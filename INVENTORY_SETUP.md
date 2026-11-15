# AZX Inventory — Setup & Operasional

## File

- `inventory.html`: antarmuka modul terpisah.
- `inventory.css`: tampilan modul.
- `inventory.js`: autentikasi Supabase, barang, transaksi, AI Search, dan laporan.

## Backend

Proyek Supabase: `nqwqlhcwiwprsbcdadhy`

- Tabel `inventory_items` dan `inventory_transactions`.
- RLS membatasi akses data berdasarkan akun terautentikasi.
- Edge Function `inventory-ai` memvalidasi sesi pengguna dan `AI_ACCESS_CODE`, membaca data inventaris, lalu meminta Gemini menyusun jawaban.
- AI Search bersifat baca-saja: fungsi AI tidak membuat, mengubah, atau menghapus barang maupun transaksi.

## Konfigurasi AI

Di Supabase Dashboard → Edge Functions → Secrets, pastikan tersedia:

- `GEMINI_API_KEY` — wajib untuk AI Inventory dan AI Dokumen.
- `AI_ACCESS_CODE` — kode akses AI yang sama dengan AZX Office.

Model teks yang dikonfigurasi pada audit 15 November 2026 adalah `gemini-3.8-flash`. Gemini API Key hanya disimpan sebagai server secret. Jangan memasukkan API Key ke browser atau kolom kode akses.

Pertanyaan pengguna dan konteks inventaris yang diperlukan (misalnya kode, nama, varian, stok, serta ringkasan transaksi) dikirim ke Gemini melalui Edge Function untuk menghasilkan jawaban. Hindari memasukkan catatan yang tidak diperlukan atau data pribadi ke dalam data inventaris.

## Pengguna

1. Masuk ke AZX Office menggunakan akun Supabase.
2. Buka `inventory.html`.
3. Pada penggunaan AI pertama di browser/perangkat tersebut, masukkan `AI_ACCESS_CODE`.
4. Kode akses disimpan di localStorage pada origin yang sama sehingga dapat digunakan bersama oleh modul Dokumen dan Inventory.
5. Menghapus data situs/browser akan menghapus kode tersimpan.

## Perhitungan stok

Stok berjalan mengikuti rumus:

`stok awal + masuk + koreksi tambah − keluar − diambil − rusak − koreksi kurang`.

Pastikan setiap transaksi tercatat satu kali dan gunakan SKU varian yang tepat. Kode utama yang memiliki beberapa varian tidak boleh membuat stok tiap varian tercampur.

## Pengujian dan keamanan

- Gunakan data sintetis di lingkungan uji untuk menguji pencarian kode/nama/warna, varian, stok berjalan, jenis transaksi, rentang tanggal, salah ketik, dan pertanyaan ambigu.
- Periksa jawaban AI terhadap angka sumber sebelum keputusan operasional.
- Pastikan permintaan AI tidak mengubah tabel inventaris atau transaksi.
- Jangan menjalankan uji tulis pada database produksi.
- Jangan menaruh API Key atau token server di file HTML/JavaScript.
- Jangan menganggap jawaban AI sebagai pengganti laporan transaksi resmi.

## Catatan operasional

- Gunakan URL HTTPS/hosting GitHub Pages.
- Data database memerlukan koneksi internet.
- Transaksi historis dipertahankan; koreksi stok dicatat sebagai transaksi koreksi agar jejak audit tetap ada.
- Uji di browser dan perangkat target tetap diperlukan sebelum dipakai untuk operasional harian.
