# Konfigurasi AI AZX Office (Cloudflare Workers AI)

AI untuk **AZX Office** dan **AZX Inventory** menggunakan Cloudflare Workers AI melalui Supabase Edge Functions.

## Pengaturan pengelola (sekali di server)
Di Supabase Dashboard → Edge Functions → Secrets, pastikan tersedia:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `AI_ACCESS_CODE` (kode akses AZX yang sudah dipakai sebelumnya)

Jangan simpan Cloudflare API Token di HTML, JavaScript, atau repository. Jangan masukkan Cloudflare API Token ke kolom kode akses pengguna.

## Pengaturan pengguna
1. Masuk ke AZX Office atau AZX Inventory.
2. Pada penggunaan AI pertama di perangkat/browser tersebut, masukkan **AI_ACCESS_CODE** yang diberikan pengelola.
3. Kode akses disimpan lokal pada browser perangkat tersebut dan otomatis digunakan oleh kedua modul (dokumen dan inventory). Tidak perlu dimasukkan lagi setiap kali.
4. Jika kode ditolak atau diganti pengelola, masukkan kode terbaru saat diminta.

Catatan: penyimpanan lokal berlaku pada browser/perangkat dan domain yang sama. Menghapus data situs/browser akan menghapus kode tersimpan.

## Cara menggunakan AI dokumen
1. Pilih jenis dokumen dan tulis instruksi.
2. Tekan **Buat dengan AI** atau gunakan perintah suara.
3. Periksa identitas, tanggal, nomor, rincian, dan nominal sebelum disimpan atau dicetak.

## Model dan kuota
Backend menggunakan Cloudflare Workers AI (Llama 3.3 70B untuk teks dan Whisper Large v3 Turbo untuk transkripsi suara). Ketersediaan dan kuota mengikuti akun Cloudflare; penggunaan gratis memiliki batas dan dapat berubah.
