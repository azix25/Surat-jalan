# Snapshot Edge Functions AI AZX Office

Folder ini berisi snapshot source dari Supabase yang diambil secara baca-saja pada 20 November 2026.

| Function | Status/versi saat snapshot | Source SHA |
|---|---:|---|
| `dokumen-ai` | ACTIVE v50 | `c0cf4193db4aed34601791c289e4e65c7e6ad06baee0eb09567cd65f2d3ce81b` |
| `inventory-ai` | ACTIVE v29 | `9187824dc877f62d1c6d3f0f979f964b17b75ad3b3298625f64412cda4ec6b2d` |

Kedua fungsi menggunakan Gemini melalui `GEMINI_API_KEY` yang dibaca dari environment server. Tidak ada nilai secret yang disimpan pada source.

Perubahan pada branch ini memperbaiki satu percobaan perbaikan JSON/schema yang sebelumnya tidak terjangkau. Ini adalah perubahan kode/prompt orchestration, bukan retraining model.

**Penting:** file di folder ini adalah source branch untuk review. Jangan deploy langsung. Periksa ulang versi dan source SHA ACTIVE di Supabase, jalankan tes staging dengan data sintetis, dan minta persetujuan eksplisit sebelum deployment.
