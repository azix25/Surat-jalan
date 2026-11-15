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
