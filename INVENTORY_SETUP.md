# AZX Inventory — Setup & Operasional

## File
- `inventory.html`: antarmuka modul terpisah.
- `inventory.css`: tampilan Modern Corporate Office responsif.
- `inventory.js`: autentikasi Supabase, barang, transaksi, AI Search, dan laporan PDF/cetak.

## Backend yang sudah disiapkan
Proyek Supabase: `nqwqlhcwiwprsbcdadhy`
- Tabel `inventory_items` dan `inventory_transactions`.
- RLS membatasi data per akun terautentikasi.
- Edge Function `inventory-ai` dengan JWT verification aktif.

## Konfigurasi wajib untuk AI
Tambahkan secret `GEMINI_API_KEY` di Supabase Dashboard → Edge Functions → Secrets. Fungsi AI tidak menerima API key dari browser. Jika secret tidak ada, pencarian biasa masih bisa digunakan tetapi AI memberi pesan konfigurasi.

## Pengguna
Buka `inventory.html`, pilih Buat akun, daftarkan email dan kata sandi. Jika verifikasi email aktif, konfirmasi email terlebih dahulu lalu masuk. Setiap akun melihat data inventarisnya sendiri.

## Catatan penting
- Gunakan URL HTTPS/hosting GitHub Pages.
- Database online memerlukan koneksi internet.
- Stok dihitung dari stok awal + barang masuk + koreksi tambah − barang keluar − diambil − rusak − koreksi kurang.
- Transaksi historis tidak disediakan tombol hapus; kesalahan stok diperbaiki dengan transaksi koreksi agar jejak audit tetap ada.
- Laporan dibuat melalui pratinjau lalu dialog cetak browser (pilih Simpan sebagai PDF).
- Uji di browser/HP nyata tetap diperlukan sebelum dipakai untuk operasional harian.
