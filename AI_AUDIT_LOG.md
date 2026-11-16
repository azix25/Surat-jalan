# Catatan Audit AI AZX Office

## 15 November 2026

- Repository: `azix25/Surat-jalan`, branch `main`.
- Supabase project: `nqwqlhcwiwprsbcdadhy`, status `ACTIVE_HEALTHY`.
- Edge Function `dokumen-ai`: `ACTIVE`, version **32**.
- Edge Function `inventory-ai`: `ACTIVE`, version **16**.
- Model yang dikonfigurasi pada kedua jalur teks: `gemini-3.8-flash`.
- Pemeriksaan sumber dilakukan pada file frontend dan kedua Edge Functions; tidak ada deployment atau perubahan database pada siklus ini.
- Pemeriksaan statis tidak menemukan penggunaan DeepSeek atau Ollama pada jalur AI yang diaudit.
- Log 24 jam terakhir menunjukkan respons HTTP 200 dan 502 pada kedua endpoint. Status 502 perlu ditelusuri dengan log error yang tidak memuat isi dokumen, data pribadi, token, atau API Key.
- Uji Gemini end-to-end dan uji regresi dengan fixture sintetis **belum dijalankan**; status ini tidak boleh dianggap lulus.
- Tidak ada perubahan kode aplikasi atau deployment karena temuan autentikasi, validasi data dokumen, cakupan data inventaris, dan perlindungan prompt/HTML memerlukan perbaikan terarah serta pengujian staging terlebih dahulu.
- Perubahan dokumentasi pada siklus ini: pembaruan panduan AI agar sesuai dengan implementasi Gemini dan penambahan daftar uji regresi sintetis.
- Tidak ada tabel, skema, transaksi, dokumen pengguna, akun, secret, atau hak akses yang diubah.

### Langkah berikutnya

1. Siapkan staging/fixture sintetis dan jalankan `AI_REGRESSION_TESTS.md`.
2. Prioritaskan perbaikan autentikasi endpoint Dokumen, sanitasi HTML keluaran AI, pelestarian qty bersatuan/kolom tambahan/item, dan validasi bahwa permintaan penjelasan tidak mengubah dokumen.
3. Perbaiki konteks Inventory agar pencarian rentang tanggal dan cakupan seluruh barang tidak bergantung pada ringkasan yang kehilangan rincian tanggal.
4. Telusuri respons 502 dari log diagnostik tanpa membaca atau menyimpan isi prompt maupun data bisnis.
5. Deploy hanya Edge Function yang berubah setelah uji staging lulus; verifikasi status ACTIVE dan versi setelah deployment.


## 16 November 2026

- Audit ulang dilakukan pada branch `main` dan Supabase project `nqwqlhcwiwprsbcdadhy` (region `ap-southeast-2`, status `ACTIVE_HEALTHY`).
- File frontend yang diperiksa ulang:
  - `dokumen.js` — blob SHA `fb51a2fff53af5582ae0d3a58785e0a3c0317ee0`.
  - `inventory.js` — blob SHA `59e8fc0fc97b41973192e100401ea3a005fc92a0`.
  - `dokumen.html` — blob SHA `efa3d352be281c95eaf1c00228f1a18ce5302226`.
  - `inventory.html` — blob SHA `7e9f12ba52006698cf5902a1b102b77717a6f3e5`.
- Edge Function:
  - `dokumen-ai`: **ACTIVE**, version **32**, `verify_jwt=false`, source SHA `3198e768b565a0b2f896256afb0ab63260a2ad7cec896a9141e7c421dd1c9b27`.
  - `inventory-ai`: **ACTIVE**, version **16**, `verify_jwt=false`, source SHA `a4649d9b33e54c0fffd19102d764d65ba252a17dad336ce6bdd890f5092035df`.
- Model yang tertulis pada kedua fungsi teks tetap `gemini-3.8-flash`. Pemindaian enam sumber AI/frontend tidak menemukan pemanggilan DeepSeek atau Ollama. Tidak ada API key/secret Gemini atau Cloudflare di empat file frontend yang diperiksa.
- Pemeriksaan statis menemukan masalah yang belum aman diperbaiki tanpa staging:
  1. **Autentikasi Dokumen — gagal:** `dokumen.js` mengirim kode akses tanpa Bearer session; `dokumen-ai` tidak memanggil `auth.getUser()`. Karena `verify_jwt=false`, endpoint dapat dipanggil langsung oleh pemegang kode AI tanpa membuktikan sesi akun. Gate login halaman tidak melindungi endpoint secara mandiri.
  2. **Autentikasi Inventory — pemeriksaan manual ada:** frontend mengirim access token dan `inventory-ai` memvalidasi token dengan `auth.getUser(token)`. `verify_jwt=false` tetap membuat validasi manual tersebut menjadi kontrol utama.
  3. **Integritas item Dokumen — gagal:** server mengubah `qty` menjadi angka melalui `Number()`; nilai sintetis `30 pcs` menjadi `0`. Proyeksi item server hanya mengembalikan `nama`, `qty`, dan `harga`, sehingga field `custom`/kolom tambahan hilang. Ini berisiko merusak data saat pengguna hanya meminta perubahan satu field.
  4. **Cakupan Inventory — terbatas:** konteks Gemini dibuat dari `stockItems.slice(0, 2000)`; item setelah 2.000 tidak terlihat model walaupun backend telah mengambil seluruh baris.
  5. **Rentang tanggal Inventory — tidak didukung konteks saat ini:** prompt Gemini menerima ringkasan total per jenis transaksi, bukan rincian setiap transaksi beserta tanggal. Jawaban periode tertentu tidak dapat diverifikasi secara andal.
  6. **Kuota/retry — berisiko:** respons kuota dari fungsi memakai teks Indonesia “Kuota Gemini sedang mencapai batas”, tetapi regex retry frontend hanya mengenali pola bahasa Inggris `quota`/kode provider. HTTP 429 tersebut dapat dianggap sementara dan dicoba ulang. Fungsi juga mencoba ulang 429 beberapa kali; lapisan retry frontend menambah permintaan lagi.
  7. **HTML Dokumen — perlu sanitasi:** hasil HTML AI dimasukkan ke editor melalui `innerHTML` tanpa allowlist sanitizer yang terlihat pada jalur tersebut. Event handler/URL HTML berbahaya perlu ditolak sebelum render.
  8. **Prompt injection — belum terbukti tahan:** pertanyaan dan konteks/catatan data disusun bersama prompt; belum ada batas validasi deterministik yang menjamin instruksi dari data tidak dipercaya tidak mengambil alih tugas.
  9. **Pesan error Dokumen — tidak konsisten:** handler frontend masih menyebut Cloudflare untuk beberapa error pada jalur pembuatan teks yang sebenarnya menggunakan Gemini. Fungsi `safeProviderMessage` di backend terdefinisi tetapi tidak digunakan.
- Pemeriksaan sintetis lokal: rumus fixture varian merah menghasilkan **21 pcs**; konversi `Number("30 pcs")` pada sanitizer saat ini menghasilkan **0**; pesan kuota Indonesia tidak cocok dengan regex retry saat ini. Ini adalah pemeriksaan kode/fixture, bukan uji Gemini.
- Supabase unified logs pada jendela 24 jam yang tersedia hanya memuat satu event `edge_logs` untuk `/rest/v1/` dengan HTTP 401; tidak ada event request `dokumen-ai`/ `inventory-ai` yang dapat dipakai untuk mengonfirmasi tingkat error AI. Karena itu statistik HTTP 200/502 tidak disimpulkan dari jendela ini.
- Regression suite sebelum penambahan berisi **35 kasus** dan seluruhnya masih belum dicentang. Tujuh kasus tambahan dicatat pada bagian G; tidak ada kasus Gemini end-to-end yang ditandai lulus.
- **Perubahan produksi:** tidak ada perubahan pada `dokumen.js`, `inventory.js`, `dokumen.html`, `inventory.html`, Edge Functions, database, secret, login, hak akses, stok, transaksi, dokumen, atau akun. Tidak ada deployment.
- **Alasan:** temuan menyentuh autentikasi lintas frontend/backend, integritas rincian dokumen, cakupan data stok, dan eksekusi HTML. Perbaikan tanpa staging dan pengujian regresi yang memadai berisiko mengganggu sistem/data yang sedang digunakan.

### Langkah berikutnya

1. Siapkan staging dan fixture sintetis tanpa menyalin data produksi.
2. Rancang autentikasi sesi untuk `dokumen-ai` secara konsisten dengan Inventory; jangan mengubah sistem login atau hak akses akun.
3. Perbaiki kontrak item Dokumen agar satuan, field tambahan, dan item lama dipertahankan; penjelasan/saran harus menghasilkan dokumen identik.
4. Rancang pencarian Inventory yang mencakup seluruh kandidat dan transaksi bertanggal tanpa mengirim catatan yang tidak diperlukan.
5. Batasi retry 429/kuota dan selaraskan pesan error Gemini.
6. Terapkan sanitasi HTML berbasis allowlist dan perlindungan prompt injection.
7. Jalankan kasus regresi terkait pada staging. Deploy hanya fungsi AI yang berubah setelah tes lulus, lalu verifikasi status, versi, dan source SHA.
