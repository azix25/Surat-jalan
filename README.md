# AZX Office — Surat Jalan & Administrasi

Aplikasi web administrasi perusahaan yang terdiri dari modul dokumen dan inventaris.

## File utama

- `index.html` — halaman masuk dan navigasi workspace.
- `dokumen.html`, `dokumen.css`, `dokumen.js` — editor dokumen, pratinjau, arsip lokal, cetak/PDF, template, stempel, dan bantuan AI.
- `inventory.html`, `inventory.css`, `inventory.js` — inventaris, transaksi stok, laporan, dan Surat Jalan dari barang keluar.
- `azx-office-enhancements.js` — autosave draf, pencarian arsip, backup/pemulihan, dan watermark.
- `Images/1794643437778.png` — gambar stempel referensi.
- `script.js` — skrip surat jalan versi lama/terpisah; tidak dimuat oleh halaman workspace utama.

## Menjalankan aplikasi

Publikasikan file pada hosting HTTPS, misalnya GitHub Pages. Koneksi internet diperlukan untuk Supabase, pustaka PDF, dan layanan AI. Fitur mikrofon memerlukan HTTPS atau localhost dan izin mikrofon.

## Backend dan keamanan

Autentikasi serta data inventaris menggunakan Supabase. Kunci publishable di browser memang bersifat publik; keamanan data harus ditegakkan melalui Row Level Security (RLS) dan kebijakan database. Simpan token layanan dan rahasia Cloudflare hanya pada server/Edge Function, bukan di file HTML atau JavaScript.

AI dokumen dan inventaris menggunakan Supabase Edge Functions. Kode akses AI disimpan di localStorage perangkat/browser. Hapus data situs untuk menghapus penyimpanan lokal tersebut.

## Penyimpanan dan backup

Arsip dokumen, stempel/logo, template, draf otomatis, dan antrean sinkronisasi Surat Jalan menggunakan penyimpanan browser. Gunakan fitur **Cadangkan data** secara berkala. Arsip lokal tidak otomatis tersedia di perangkat/browser lain.

## Catatan pengujian

Sebelum digunakan untuk operasional, uji login/logout, pembuatan dan pengeditan dokumen, arsip, unggah stempel/logo, kedua format, cetak/PDF, transaksi stok, sinkronisasi Surat Jalan, backup, serta pemulihan pada browser dan perangkat target.
