<<<<<<< HEAD
# terang_akuntabilitas_publik
=======
# TERANG — Transparansi & Akuntabilitas Publik

**Versi 1.3.0 — Tema Terang Profesional + SuperAgent Sekali Klik**

Aplikasi web React + TypeScript + Vite dengan server Express untuk dashboard APBD Sumatera Utara, katalog proyek publik, pelaporan warga, pelacakan aduan, analisis, dan panel pengelola.

## Menjalankan secara lokal

Persyaratan: Node.js 20.19+ atau 22.12+.

```bash
npm install
cp .env.example .env.local
# Isi GEMINI_API_KEY, AUTH_SECRET, dan DEMO_PASSWORD pada .env.local
npm run dev
```

Buka alamat lokal yang ditampilkan oleh Vite/Express. Navigasi dan komponen visual di halaman utama menggunakan transisi ringan serta animasi saat bagian halaman masuk ke area pandang; preferensi `prefers-reduced-motion` tetap dihormati. Jalankan `npm test` untuk pengujian logika inti. Untuk mode produksi jalankan `npm run build`, kemudian `NODE_ENV=production npm start`.

## Konfigurasi

- `GEMINI_API_KEY`: API key Gemini untuk layanan asisten. Aplikasi tetap menyediakan fallback bila kunci tidak dikonfigurasi.
- `AUTH_SECRET`: rahasia acak panjang untuk menandatangani sesi pengelola. Gunakan nilai yang stabil dan rahasia di deployment.
- `DEMO_PASSWORD`: kata sandi untuk akun demo super admin, verifikator, dan instansi. Ganti sebelum aplikasi dibuka ke publik.
- `APP_URL`: alamat deployment aplikasi bila dibutuhkan integrasi hosting.

## SuperAgent & data langsung

Buka menu **SuperAgent** lalu klik **Jalankan SuperAgent**. Seluruh alur berjalan otomatis dan progresnya tampil per langkah.

API gratis yang dipakai (tanpa API key): Open-Meteo, BMKG Open Data (`data.bmkg.go.id`), dan USGS FDSN. Server membutuhkan akses internet keluar; bila gagal, langkah terkait ditandai Offline dan agen tetap lanjut.

Variabel tambahan: `SUPERAGENT_AUTOPILOT_DEFAULT`, `SUPERAGENT_SCAN_INTERVAL_MS` (minimal 60000), `AGENT_PUBLIC_RUN` (setel `false` untuk produksi agar hanya pengelola yang dapat menjalankan agen).

Batasan yang jujur: keputusan agen berupa rekomendasi berbasis aturan transparan (ambang hujan 150 mm/14 hari, gempa M4+ radius 100 km, gerbang keyakinan triase 60%), bukan putusan hukum. Penyimpanan masih in-memory.

## Akun demo

- `admin@terang.test` — super admin
- `verifikator@terang.test` — verifikator
- `instansi@terang.test` — akun instansi

Ketiganya memakai nilai `DEMO_PASSWORD` yang sama dari konfigurasi server. Ganti nilainya sebelum deployment publik.

## Pengamanan yang diterapkan

- Endpoint pengelolaan membutuhkan Bearer token bertanda tangan dengan masa berlaku 8 jam.
- Izin peran diterapkan di server: impor CSV hanya untuk super admin; verifikasi untuk super admin/verifikator; tanggapan resmi untuk super admin/instansi.
- Identitas audit diambil dari sesi terverifikasi, bukan dari nilai `userEmail` yang dikirim browser.
- Endpoint publik menyamarkan nama dan tidak mengirim nomor kontak pelapor.
- Endpoint AI dan login memiliki pembatasan permintaan sederhana per alamat IP.
- Header keamanan dasar, validasi panjang input, dan validasi referensi wilayah/sektor/proyek diterapkan.

## Catatan sebelum produksi

Proyek ini masih memakai penyimpanan data in-memory untuk demonstrasi. Data baru akan hilang ketika proses server dimulai ulang. Sebelum digunakan sebagai layanan publik, pindahkan penyimpanan ke PostgreSQL/MySQL, gunakan HTTPS, simpan rahasia hanya di environment deployment, aktifkan backup, logging terpusat, dan gunakan rate limiter terdistribusi (misalnya Redis) bila menjalankan beberapa instance.
>>>>>>> ffabd3a (feat: inisialisasi aplikasi TERANG Akuntabilitas Publik dengan navigasi role-based dan route guard)
