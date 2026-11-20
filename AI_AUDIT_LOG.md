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

## Siklus 3 — 17 November 2026

### Snapshot sumber terbaru

- GitHub `main` tree SHA: `2410e9348e44e82a98f1bfe4917e5f38521ea6e5`.
- Frontend: `dokumen.js` `c0eb4b5f94a6ca77423c50358b2087e98a4f19a6`; `inventory.js` `f4741a4eb0098c5fa554b4813f1470d4258b96e0`; `dokumen.html` `97058ddc3250d75c18b344f92f3e30dde57c9465`; `inventory.html` `bda187739becf4140b90907a39ec091fe452df0f`.
- Supabase project `nqwqlhcwiwprsbcdadhy`: `ACTIVE_HEALTHY`.
- `dokumen-ai`: `ACTIVE`, versi **39**, `verify_jwt=false`, source SHA `5210828fcaa55b59c7da7b26f3beee62d1be12b33a2c0d76b1f4e513f3f87b8f`.
- `inventory-ai`: `ACTIVE`, versi **19**, `verify_jwt=false`, source SHA `9e6bd58dda83fa6b24affc0c8d939b662c8aae0e2c1184e8d43d1a42fe89b294`.
- Model aktif yang terlihat pada source: Dokumen mencoba `gemini-3.6-flash`, `gemini-3.8-flash`, lalu `gemini-3.7-flash` untuk kondisi failover tertentu; Inventory memakai `gemini-3.6-flash`. Pemindaian enam file kode dan dua source fungsi tidak menemukan DeepSeek atau Ollama.

### Temuan dan koreksi dari audit sebelumnya

1. **Autentikasi Dokumen sekarang terverifikasi pada source terbaru:** `dokumen.js` mengirim Bearer access token dan `dokumen-ai` versi 39 memanggil `auth.getUser(accessToken)` sebelum memproses AI. Inventory juga mengirim token dan memanggil `auth.getUser(token)`. `verify_jwt=false` masih dipakai, sehingga validasi manual di dalam fungsi tetap kontrol wajib. Ini memperbarui temuan audit sebelumnya yang merujuk source lama.
2. **Sanitasi HTML Dokumen ditemukan pada frontend terbaru:** `sanitizeDocumentHtml` memakai allowlist tag/style dan dipanggil saat `setData` untuk konten Format 1 dan Format 2. Temuan sebelumnya yang menyatakan sanitizer tidak terlihat sudah tidak berlaku untuk source saat ini. Uji payload berbahaya di browser tetap belum dijalankan; SEC-12 belum lulus.
3. **Integritas item Dokumen masih berisiko:** frontend membentuk `qty` sebagai teks bersatuan (contoh `30 pcs`) dan menyimpan kolom tambahan di `custom`. Backend masih memakai `Number(item.qty) || 0` dan hanya mengembalikan `nama`, `qty`, `harga`. Secara deterministik `Number("30 pcs")` menjadi `NaN`, lalu dinormalisasi menjadi **0**; kolom `custom` hilang. Batas 100 item juga diterapkan dengan pemotongan diam-diam.
4. **Mode penjelasan Dokumen belum dijaga secara deterministik:** larangan mengubah dokumen hanya ada di prompt. Backend tetap menerima objek `document` dari model dan frontend menerapkannya; belum ada pemeriksaan bahwa mode penjelasan harus mempertahankan seluruh dokumen identik.
5. **Satuan Inventory berpotensi salah:** transaksi dan `stockOf` dihitung dalam pcs, sedangkan UI menampilkan paket dengan membagi `pack_size`. Query AI tidak mengambil `pack_size`; konteks mengirim nilai stok pcs sebagai `stok` tetapi memberi label `satuan` dus/ball. Contoh 500 pcs dengan isi 100 pcs/dus seharusnya **5 dus (500 pcs)**, bukan 500 dus.
6. **Cakupan hasil Inventory terbatas:** semua baris diambil backend, tetapi prompt hanya mengirim `stockItems.slice(0, 2000)`. Barang setelah urutan ke-2.000 tidak dapat ditemukan model.
7. **Rentang tanggal belum dapat dihitung dengan andal:** transaksi diringkas menjadi total per jenis dan tanggal terakhir; rincian transaksi per tanggal tidak dikirim ke Gemini. Instruksi tanggal pada prompt tidak menggantikan data sumber yang hilang.
8. **Konteks percakapan tidak persisten:** request Inventory hanya mengirim `question`; Dokumen mengirim `instruction` dan `currentDocument`, bukan riwayat pesan. Rujukan seperti “yang tadi” tidak boleh diasumsikan tersedia jika tidak ada pada state dokumen/request.
9. **Retry kuota perlu dibatasi:** `inventory-ai` mengulang HTTP 429 hingga tiga percobaan pada helper Gemini. Di Dokumen, regex frontend mengenali `quota` tetapi tidak frasa Indonesia `Kuota Gemini sedang mencapai batas`; respons 429 kuota tersebut dapat dicoba ulang lagi oleh frontend. Ini berisiko menambah permintaan ketika kuota sudah habis.
10. **Prompt injection belum memiliki batas deterministik yang cukup:** catatan barang ikut dikirim dalam konteks JSON dan isi `currentDocument` ikut diberikan kepada model. Prompt meminta jawaban berdasarkan data, tetapi belum ada boundary eksplisit yang konsisten dan validasi hasil yang menjamin teks data tidak mengambil alih instruksi.
11. **Validasi JSON bersifat dasar:** kedua fungsi memeriksa bentuk objek dan field utama, tetapi validasi item Dokumen belum menjaga tipe/satuan/kolom tambahan secara ketat. Inventory memfilter ID hasil model terhadap ID yang valid, tetapi angka jawaban masih berasal dari teks model.
12. **Helper error Dokumen:** `safeProviderMessage` ada tetapi tidak dipakai pada jalur penanganan error utama.

### Pemeriksaan statis dan log

- Pemeriksaan statis mengonfirmasi kedua frontend mengirim Bearer token, kedua fungsi memvalidasi user melalui `auth.getUser`, sanitizer HTML dipakai pada jalur render Dokumen, skema JSON dasar diperiksa, dan hanya Gemini yang dipakai.
- Fixture hitung sintetis: stok varian Merah **21 pcs**, Biru **15 pcs**; contoh 500 pcs / 100 pcs per dus = **5 dus**. Konversi kode saat ini untuk `Number("30 pcs") || 0` menghasilkan **0**. Ini pemeriksaan kode/aritmetika, bukan uji Gemini.
- Log `function_edge_logs` 24 jam terakhir menunjukkan request Dokumen pada versi lama 34–37: versi 34 memiliki 2×200 dan 1×502; versi 35 memiliki 3×200, 1×503, 1×504; versi 36 memiliki 2×200; versi 37 memiliki 4×200. Inventory versi 17 memiliki 19×200. Tidak terlihat request pada versi terbaru 39 dan 19 di jendela 24 jam ini; karena itu belum ada bukti end-to-end untuk source terbaru.
- Supabase performance advisor menandai foreign key `inventory_transactions_item_owner_fk` tanpa covering index. Ini berpotensi memengaruhi query transaksi Inventory saat data membesar. Tidak ada indeks, tabel, skema, atau kebijakan yang diubah.
- Regression suite diperbarui dari 42 menjadi **45 kasus**: ditambah uji konversi pack-size, follow-up tanpa riwayat percakapan, dan mode penjelasan yang wajib no-op. Seluruh status tetap belum dicentang; belum ada uji Gemini end-to-end.

### Perubahan pada siklus ini

- Diperbarui: `AI_REGRESSION_TESTS.md` (baseline tanggal dan model per fungsi diperjelas; 3 kasus baru).
- Diperbarui: `AI_AUDIT_LOG.md` (catatan siklus 3 ini).
- Tidak diubah: `dokumen.js`, `inventory.js`, `dokumen.html`, `inventory.html`, source Edge Functions, database, secret/API key, sistem login, hak akses, stok, transaksi, dokumen, dan akun.
- Tidak ada deployment.

### Risiko dan langkah berikutnya

1. Siapkan staging dengan fixture sintetis; jangan menyalin data bisnis produksi.
2. Perbaiki kontrak item Dokumen agar qty bersatuan dan seluruh kolom tambahan tetap utuh; tolak hasil yang memotong daftar item.
3. Tambahkan guard deterministik untuk mode penjelasan/saran agar dokumen tidak dapat berubah.
4. Sertakan `pack_size` dan representasi stok pcs + dus/ball yang konsisten pada Inventory.
5. Lakukan pencarian kandidat terarah/chunking agar batas 2.000 tidak diam-diam mengecualikan barang; hitung rentang tanggal dari transaksi sumber sebelum meminta Gemini merangkumnya.
6. Tetapkan perilaku aman untuk follow-up tanpa riwayat, pisahkan data tak tepercaya dari instruksi, dan validasi hasil sebelum ditampilkan/diterapkan.
7. Hentikan retry berulang pada kuota 429, termasuk pesan Indonesia dan `RESOURCE_EXHAUSTED`.
8. Jalankan seluruh 45 kasus di staging. Deploy hanya fungsi AI yang berubah setelah seluruh tes terkait lulus; verifikasi status, versi, dan source SHA sesudah deployment.


## Siklus 4 — 20 November 2026 (snapshot main terbaru)

### Snapshot sumber dan runtime

- GitHub `main` saat audit: `a32e994e01858ab3ee7bf2c327a6f1c3be8c3c42`.
- PR #6 masih Draft dan divergen: 3 commit di depan serta 29 commit di belakang `main`; perubahan dokumentasinya tidak digabungkan atau dianggap sebagai kondisi main.
- Supabase project diperiksa secara baca-saja. `dokumen-ai` ACTIVE v50, source SHA `c0cf4193db4aed34601791c289e4e65c7e6ad06baee0eb09567cd65f2d3ce81b`; `inventory-ai` ACTIVE v29, source SHA `9187824dc877f62d1c6d3f0f979f964b17b75ad3b3298625f64412cda4ec6b2d`.
- Kedua fungsi mencoba `gemini-3.5-flash-lite` lalu `gemini-3.6-flash` sebagai fallback. API key dibaca dari environment server; pemindaian snapshot tidak menemukan pola API key hard-coded.

### Temuan terukur

1. **Perbaikan JSON Gemini tidak pernah berjalan:** kedua Edge Function memiliki loop `attempt < 1`, sementara prompt perbaikan baru ditambahkan ketika `attempt === 1`. Jadi hanya ada satu request per model dan cabang repair tidak terjangkau. Instruksi prompt menyebut perbaikan otomatis, tetapi implementasinya belum melakukannya.
2. **Deteksi kuota frontend tidak mengenali bahasa Indonesia:** `dokumen.js` di `main` hanya mencocokkan `quota`, sedangkan backend mengembalikan pesan `Kuota Gemini sedang mencapai batas` dan `Batas penggunaan AI harian tercapai`. HTTP 429 ini dapat keliru dianggap sementara dan diulang sampai tiga kali.
3. **Jeda retry kurang lengkap:** frontend hanya membaca `Retry-After` numerik dan membatasi jeda 15 detik; nilai `retry_after` pada body JSON serta format tanggal HTTP belum dipakai. HTTP 504 juga belum masuk daftar status sementara pada frontend.

### Perubahan di branch kerja

- Menambahkan snapshot source Edge Function aktif ke `supabase/functions/dokumen-ai/index.ts` dan `supabase/functions/inventory-ai/index.ts` agar kode backend yang diaudit dapat ditinjau melalui GitHub. Snapshot diberi versi dan source SHA; tidak ada nilai secret yang disalin.
- Menambahkan helper bersama `supabase/functions/_shared/gemini-json-repair.mjs`. Kedua fungsi sekarang mengizinkan tepat satu percobaan perbaikan JSON/schema tambahan (maksimal dua request per model), dan jawaban sebelumnya dibatasi 12.000 karakter saat dimasukkan ke prompt perbaikan.
- Memperbaiki `dokumen.js` agar mengenali kuota Indonesia/Inggris, tidak mengulang 429 saat kuota habis, mencoba ulang 504, dan membaca `Retry-After` sebagai detik atau HTTP-date serta `retry_after` dari body; jeda dibatasi 60 detik.
- Menambahkan 6 tes untuk helper dan integrasi loop JSON, serta membawa 22 tes regresi retry Gemini ke branch yang berbasis `main` terbaru. Workflow CI menjalankan `node --check dokumen.js` dan kedua suite Node.
- Matriks manual diperbarui menjadi 47 kasus; GEM-01 dan GEM-02 mencatat pengujian respons JSON rusak dan skema tidak lengkap.

### Batas verifikasi dan risiko

- Tes Node menguji helper retry frontend dan pembentukan prompt repair serta memeriksa integrasi statis kedua source. Tes ini **tidak** memanggil Gemini dan bukan pengujian staging end-to-end.
- Source Edge Function yang disalin adalah snapshot ACTIVE pada saat audit; sebelum deployment, bandingkan ulang source SHA/versi Supabase dan uji di staging. Tidak ada deployment dari branch ini.
- Belum ada bukti perilaku model pada respons JSON rusak sampai GEM-01/GEM-02 dijalankan dengan akun/kuota staging.
- Tidak ada perubahan database/RPC, data pengguna, inventory, transaksi, dokumen, akun, login, izin, secrets, atau konfigurasi produksi. Tidak ada merge, deployment, atau retraining.
