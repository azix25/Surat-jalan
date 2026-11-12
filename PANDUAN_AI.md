# Konfigurasi AI Dokumen (Gemini)

Fitur AI dokumen menggunakan Google Gemini API melalui Supabase Edge Function. Kunci API disimpan sebagai Supabase Secret, bukan di HTML/JavaScript atau repository.

## Aktifkan akses gratis
1. Buka Google AI Studio: https://aistudio.google.com/apikey
2. Masuk dengan akun Google, buat API key untuk Gemini API, lalu salin.
3. Buka Supabase Secrets: https://supabase.com/dashboard/project/nqwqlhcwiwprsbcdadhy/functions/secrets
4. Tambahkan atau perbarui secret:
   - Nama: `GEMINI_API_KEY`
   - Nilai: API key dari Google AI Studio
5. Pertahankan secret `AI_ACCESS_CODE` yang sudah ada. Jika belum ada, buat kode akses panjang dan rahasia.
6. Buka halaman `dokumen.html`, masukkan nilai `AI_ACCESS_CODE` pada kolom Kode akses AI.

## Cara menggunakan
1. Pilih jenis dokumen: invoice, surat jalan, penawaran, atau penagihan.
2. Tulis instruksi yang jelas di kotak AI.
3. Tekan **Buat dengan AI**.
4. Periksa identitas, tanggal, nomor, rincian, harga, pajak, dan total. AI tidak boleh dianggap sebagai pengganti pemeriksaan manusia.
5. Simpan atau cetak menjadi PDF.

## Catatan penting
- Gemini API menyediakan Free Tier untuk model/region yang memenuhi syarat, dengan kuota dan batas permintaan. Gratis bukan berarti tanpa batas. Jika kuota habis, tunggu kuota pulih; jangan aktifkan billing jika ingin tetap gratis.
- Ketersediaan Free Tier, model, dan batas pemakaian ditentukan Google dan dapat berubah. Periksa halaman harga: https://ai.google.dev/gemini-api/docs/pricing
- Jangan memasukkan API key Google ke kolom Kode akses AI, chat, atau GitHub.
- Template Canva tetap disimpan secara lokal pada browser/perangkat.
