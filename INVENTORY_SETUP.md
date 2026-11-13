# AZX Inventory — Setup & Operasional

## File
- `inventory.html`: antarmuka modul terpisah.
- `inventory.css`: tampilan Modern Corporate Office responsif.
- `inventory.js`: autentikasi Supabase, barang, transaksi, AI Search, dan laporan PDF/cetak.

## Backend
Proyek Supabase: `nqwqlhcwiwprsbcdadhy`
- Tabel `inventory_items` dan `inventory_transactions`.
- RLS membatasi data per akun terautentikasi.
- Edge Function `inventory-ai` memvalidasi sesi pengguna dan kode akses AZX, lalu memanggil Cloudflare Workers AI.

## Konfigurasi AI
Di Supabase Dashboard → Edge Functions → Secrets, pastikan tersedia:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `AI_ACCESS_CODE` (kode akses AZX yang sama dengan AZX Office)

Cloudflare API Token hanya disimpan sebagai server secret. Jangan masukkan token Cloudflare ke browser.

Pengguna memasukkan AI_ACCESS_CODE satu kali per browser/perangkat. Kode disimpan dengan kunci localStorage bersama, sehingga AZX Office dan Inventory otomatis menggunakannya. Menghapus data situs/browser akan menghapus kode tersimpan. Jika kode server berubah atau ditolak, masukkan kembali kode terbaru.

## Pengguna
Buka `inventory.html`, pilih Buat akun, daftarkan email dan kata sandi. Jika verifikasi email aktif, konfirmasi email terlebih dahulu lalu masuk. Setiap akun melihat data inventarisnya sendiri.

## Catatan operasional
- Gunakan URL HTTPS/hosting GitHub Pages.
- Database online memerlukan koneksi internet.
- Stok dihitung dari stok awal + barang masuk + koreksi tambah − barang keluar − diambil − rusak − koreksi kurang.
- Transaksi historis tidak disediakan tombol hapus; kesalahan stok diperbaiki dengan transaksi koreksi agar jejak audit tetap ada.
- Laporan dibuat melalui pratinjau lalu dialog cetak browser (pilih Simpan sebagai PDF).
- Uji di browser/HP nyata tetap diperlukan sebelum dipakai untuk operasional harian.
