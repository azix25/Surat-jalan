# Konfigurasi AI AZX Office

## Arsitektur AI saat ini

- **Pembuatan dokumen:** Google Gemini melalui Supabase Edge Function `dokumen-ai`.
- **Pencarian dan analisis inventaris:** Google Gemini melalui Supabase Edge Function `inventory-ai`.
- **Transkripsi perintah suara:** Cloudflare Workers AI Whisper Large v3 Turbo melalui `dokumen-ai`.
- **Validasi keluaran:** server memeriksa struktur JSON dan mencoba memperbaiki keluaran yang tidak valid sebelum mengirimkannya ke aplikasi.

Cloudflare bukan model utama untuk pembuatan teks pada konfigurasi kode saat ini. Gemini adalah model teks utama.

## Secret server Supabase

Di Supabase Dashboard → Edge Functions → Secrets, pastikan secret berikut tersedia:

- `GEMINI_API_KEY` — wajib untuk pembuatan dokumen dan AI inventaris.
- `AI_ACCESS_CODE` — kode akses AZX yang dimasukkan pengguna.
- `CLOUDFLARE_ACCOUNT_ID` — diperlukan untuk transkripsi suara.
- `CLOUDFLARE_API_TOKEN` — diperlukan untuk transkripsi suara dan harus memiliki izin Workers AI.

Jangan menyimpan Gemini API Key atau Cloudflare API Token di HTML, JavaScript, atau repository. Jangan memasukkan API Key ke kolom kode akses pengguna.

## Pengaturan pengguna

1. Masuk ke AZX Office atau AZX Inventory.
2. Saat pertama kali menggunakan AI pada browser/perangkat tersebut, masukkan `AI_ACCESS_CODE` dari pengelola.
3. Kode akses disimpan lokal pada browser dan otomatis digunakan oleh modul Dokumen serta Inventory pada origin yang sama.
4. Jika kode ditolak atau diganti pengelola, masukkan kode terbaru saat diminta.

Penyimpanan lokal berlaku pada browser dan origin yang sama. Menghapus data situs/browser akan menghapus kode tersimpan.

## Cara menggunakan AI dokumen

1. Pilih jenis dokumen dan tulis instruksi dalam bahasa Indonesia sehari-hari.
2. Tekan **Buat dengan AI** atau gunakan perintah suara.
3. AI menggunakan dokumen aktif sebagai konteks dan seharusnya mempertahankan bagian yang tidak diminta untuk diubah.
4. Periksa kembali identitas, tanggal, nomor, rincian, jumlah, pajak, dan nominal sebelum menyimpan atau mencetak.

## Cara menggunakan AI inventaris

1. Masuk ke Inventory menggunakan akun yang memiliki akses.
2. Tulis pertanyaan tentang kode, nama, varian, stok, atau riwayat barang.
3. AI membaca data inventaris yang dapat diakses akun dan memberikan jawaban serta barang terkait.
4. Cocokkan jawaban dengan daftar stok dan riwayat transaksi sebelum mengambil keputusan operasional.

AI inventaris hanya untuk membaca, mencari, menghitung, dan merangkum. Perubahan stok tetap dilakukan melalui fitur transaksi, bukan melalui jawaban AI.

## Kuota dan pemecahan masalah

- Kuota dan batas permintaan pembuatan teks mengikuti akun Google Gemini yang dipakai pada `GEMINI_API_KEY`.
- Kuota transkripsi suara mengikuti akun Cloudflare Workers AI.
- Jika Gemini mencapai batas, tunggu kuota pulih atau periksa batas penggunaan akun Google.
- Jika teks berfungsi tetapi suara gagal, periksa secret Cloudflare dan izin token Workers AI.
- Jika kode akses ditolak, pastikan `AI_ACCESS_CODE` di server sama dengan kode yang dimasukkan pengguna.
- Jangan pernah membagikan API Key atau token rahasia melalui chat, tangkapan layar, atau kolom kode akses.

## Catatan pengembangan

Peningkatan AI harus diuji dengan contoh perintah nyata, termasuk bahasa sehari-hari, salah ketik, perintah lanjutan, perubahan sebagian dokumen, nama/kode varian, dan pertanyaan stok. Perbaikan prompt atau kode bukan berarti model telah dilatih ulang. Perubahan backend harus diuji sebelum deployment dan tidak boleh mengubah data pengguna, transaksi, akun, atau aturan akses.
