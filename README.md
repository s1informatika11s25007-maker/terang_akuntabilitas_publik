# TERANG — Transparansi, Evaluasi, Respons, Akuntabilitas Nusantara

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

Buka alamat lokal yang ditampilkan oleh Vite/Express. Navigasi dan komponen visual di halaman utama menggunakan transisi ringan serta animasi saat bagian halaman masuk ke area pandang; preferensi `prefers-reduced-motion` tetap dihormati. Jalankan `npm run lint` untuk pemeriksaan tipe TypeScript dan `npm test` untuk pengujian logika inti. Untuk mode produksi jalankan `npm run build`, kemudian `npm run start:prod`.

## Konfigurasi

- `GEMINI_API_KEY`: API key Gemini untuk layanan asisten. Aplikasi tetap menyediakan fallback berbasis aturan bila kunci tidak dikonfigurasi.
- `GEMINI_MODEL_NAME`: nama model Gemini (opsional, default `gemini-3.8-flash`).
- `AUTH_SECRET`: rahasia acak panjang untuk menandatangani sesi pengelola. Gunakan nilai yang stabil dan rahasia di deployment.
- `DEMO_PASSWORD`: kata sandi untuk akun demo super admin, verifikator, dan instansi. Ganti sebelum aplikasi dibuka ke publik.
- `APP_URL`: alamat deployment aplikasi bila dibutuhkan integrasi hosting.

## SuperAgent & data langsung

Buka menu **SuperAgent** lalu klik **Jalankan SuperAgent**. Seluruh alur berjalan dan progresnya tampil per langkah.

API gratis yang dipakai (tanpa API key): Open-Meteo, BMKG Open Data (`data.bmkg.go.id`), dan USGS FDSN. Server membutuhkan akses internet keluar; bila gagal, langkah terkait ditandai Offline dan agen tetap lanjut.

Variabel tambahan: `SUPERAGENT_AUTOPILOT_DEFAULT`, `SUPERAGENT_SCAN_INTERVAL_MS` (minimal 60000), `AGENT_PUBLIC_RUN` (setel `false` untuk produksi agar hanya pengelola yang dapat menjalankan agen).

> **Prinsip Pengawasan:** **AI membantu, keputusan akhir oleh manusia.** Keputusan dan rekomendasi agen berupa penyaringan berbasis aturan transparan (ambang hujan 150 mm/14 hari, gempa M4+ radius 100 km, gerbang keyakinan triase 60%), bukan putusan hukum maupun pengganti verifikasi resmi inspektorat.

## Status & Checklist Jujur

- [x] Dashboard APBD, peta choropleth Leaflet offline-ready, dan katalog proyek publik 33 kab/kota Sumut (data simulasi prototipe)
- [x] Pelaporan warga dengan unggah & kompresi foto bukti di browser serta pelacakan kode `TRG-2026-XXXXXX`
- [x] State machine transisi status laporan terverifikasi dan panel moderasi berbasis peran (`super_admin`, `verifikator`, `instansi`)
- [x] Chatbot **Tanya TERANG** dan **SuperAgent** dengan integrasi cuaca/gempa langsung dan mode fallback offline
- [x] Persistensi state laporan, dukungan, dan log aktivitas ke `data/state.json` serta endpoint reset demo (`POST /api/admin/reset-demo`)
- [ ] Integrasi langsung dengan API/dump resmi Kemenkeu DJPK, BPS, atau LPSE (saat ini memakai data simulasi sintetis; lihat `database/data/README-data.md` untuk impor CSV)
- [ ] Migrasi penyimpanan dari berkas JSON/in-memory ke basis data relasional (PostgreSQL/MySQL) dan rate limiter terdistribusi (Redis) untuk deployment publik skala besar

## Akun demo

- `admin@terang.test` — super admin
- `verifikator@terang.test` — verifikator
- `instansi@terang.test` — akun instansi

Ketiganya memakai nilai `DEMO_PASSWORD` yang sama dari konfigurasi server. Ganti nilainya sebelum deployment publik.

## Pengamanan yang diterapkan

- Endpoint pengelolaan membutuhkan Bearer token bertanda tangan dengan masa berlaku 8 jam.
- Izin peran diterapkan di server: impor CSV dan reset data demo hanya untuk super admin; verifikasi untuk super admin/verifikator; tanggapan resmi untuk super admin/instansi.
- Identitas audit diambil dari sesi terverifikasi, bukan dari nilai `userEmail` yang dikirim browser.
- Endpoint publik menyamarkan nama dan tidak mengirim nomor kontak pelapor.
- Endpoint AI dan login memiliki pembatasan permintaan sederhana per alamat IP.
- Header keamanan dasar, validasi panjang input, validasi transisi status (HTTP 409 bila tidak sah), dan validasi referensi wilayah/sektor/proyek diterapkan.

## Catatan sebelum produksi

Proyek ini merupakan prototipe dengan dataset APBD/proyek simulasi dan penyimpanan JSON sederhana (`data/state.json`) untuk demonstrasi. Sebelum digunakan sebagai layanan publik resmi, ganti dataset dengan data terverifikasi via `scripts/import.ts`, pindahkan penyimpanan ke PostgreSQL/MySQL, gunakan HTTPS, simpan rahasia hanya di environment deployment, aktifkan backup, logging terpusat, dan gunakan rate limiter terdistribusi (misalnya Redis) bila menjalankan beberapa instance.
