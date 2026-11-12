# Konfigurasi AI Dokumen

Fitur AI menggunakan Supabase Edge Function `dokumen-ai` dan OpenAI API. API key tidak disimpan di HTML/JavaScript atau repository.

## Wajib dilakukan satu kali di Supabase
Buka project Supabase `nqwqlhcwiwprsbcdadhy` > Edge Functions > Secrets, lalu tambahkan:
- `OPENAI_API_KEY` = API key OpenAI milik pengelola
- `AI_ACCESS_CODE` = buat kode akses panjang dan rahasia untuk pengguna aplikasi

Jangan memasukkan kedua nilai tersebut ke GitHub atau membagikannya di chat. Setelah secret tersimpan, fungsi dapat langsung membacanya tanpa deploy ulang.

## Cara pakai
1. Buka halaman `dokumen.html`.
2. Masukkan kode akses AI yang sudah ditentukan pengelola.
3. Tulis instruksi, misalnya "Buat surat penawaran jasa pengecoran untuk PT ABC, volume 100 m3, harga belum ditentukan".
4. Periksa hasilnya, lengkapi data yang kosong, lalu simpan/cetak PDF.

## Catatan
- Pemakaian AI membutuhkan akun/API billing OpenAI yang aktif; biaya API mengikuti pemakaian.
- Jangan gunakan API key OpenAI sebagai kode akses. Buat kode akses aplikasi yang berbeda.
- AI hanya membuat draf. Periksa kembali harga, identitas, dan ketentuan sebelum dokumen dikirim.
- Template Canva disimpan pada penyimpanan lokal browser/perangkat yang digunakan.
