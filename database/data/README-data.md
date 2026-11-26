# Dataset Simulasi Prototipe TERANG - Sumatera Utara 2022-2025

Dokumentasi ini menjelaskan sifat dataset bawaan, struktur berkas CSV, dan cara menggantinya dengan data resmi/real pada platform **TERANG** (Transparansi, Evaluasi, Respons, Akuntabilitas Nusantara).

> **Catatan Kejujuran Data:** Dataset bawaan pada direktori ini (`apbd_realisasi.csv` dan `proyek_publik.csv`) **disintesis secara deterministik dari pola umum APBD dan belanja daerah** sebagai **data simulasi prototipe** untuk demonstrasi. Berkas ini **bukan dump atau ekstrak resmi** dari Kementerian Keuangan DJPK, BPS, maupun LPSE. Nama penyedia jasa pada data awal juga bersifat fiktif.

## 1. Sumber Referensi Pola & Data Lingkungan Langsung
1. **Pola Referensi Wilayah & Klasifikasi Sektor (Disintesis)**
   - Daftar 33 kabupaten/kota di Provinsi Sumatera Utara beserta kode referensi wilayah BPS dan batas poligon GeoJSON (`kabkota_sumut.geojson`).
   - Klasifikasi 9 sektor belanja daerah (Pendidikan, Kesehatan, Pekerjaan Umum & Tata Ruang, Perumahan & Permukiman, Pertanian & Pangan, Perhubungan & Logistik, Lingkungan Hidup, Sosial & Pengentasan Kemiskinan, Pariwisata & Kreatif) dan sumber pembiayaan (PAD, DAU, DAK, DBH).
2. **Data Proyek & Aduan Warga (Simulasi Prototipe)**
   - Paket pekerjaan publik contoh untuk menguji deteksi kesenjangan progres keuangan vs fisik, serta alur pelaporan warga dan verifikasi berjenjang.
3. **Data Cuaca & Gempa (Langsung / Live API)**
   - Fitur SuperAgent mengambil data lingkungan langsung dari Open-Meteo, BMKG Open Data (`data.bmkg.go.id`), dan USGS FDSN bila server terhubung ke internet.

## 2. Struktur Berkas CSV

### A. `apbd_realisasi.csv`
Kolom wajib: `nama_daerah`, `sektor`, `tahun`, `pagu`, `realisasi`.

Daftar kolom lengkap:
- `id`: Kode unik anggaran (contoh: `bgt-101`)
- `kode_bps`: Kode wilayah BPS (contoh: `1271`)
- `nama_daerah`: Nama Kabupaten / Kota (contoh: `Kota Medan`)
- `sektor`: Nama sektor pembangunan (contoh: `Pekerjaan Umum & Tata Ruang`)
- `tahun`: Tahun anggaran (`2022`, `2023`, `2024`, `2025`)
- `pagu`: Nilai pagu alokasi belanja dalam Rupiah
- `realisasi`: Nilai serapan realisasi belanja dalam Rupiah
- `serapan_persen`: Persentase serapan belanja (`Realisasi / Pagu * 100`)
- `sumber`: Sumber pembiayaan (`PAD`, `DAU`, `DAK`, `DBH`)

### B. `proyek_publik.csv`
Kolom wajib: `nama`, `nama_daerah`, `pagu`, `realisasi`, `progres_fisik`, `status`.

Daftar kolom lengkap:
- `id`: ID internal (contoh: `prj-1`)
- `kode`: Kode proyek publik (contoh: `PRJ-SU-2024-001`)
- `nama`: Nama paket pekerjaan proyek
- `deskripsi`: Ringkasan lingkup dan manfaat pekerjaan
- `nama_daerah`: Kabupaten/Kota lokasi pekerjaan
- `sektor`: Sektor pengampu
- `lokasi_nama`: Titik spesifik lokasi / jalan
- `lat`: Titik koordinat latitude
- `lng`: Titik koordinat longitude
- `pagu`: Nilai kontrak / pagu proyek (Rupiah)
- `realisasi`: Pembayaran termin keuangan (Rupiah)
- `progres_fisik`: Persentase capaian fisik di lapangan (`0-100`)
- `status`: `perencanaan` | `berjalan` | `selesai` | `mangkrak`
- `kontraktor`: Nama penyedia jasa / rekanan pelaksana
- `tahun`: Tahun anggaran kontrak
- `sumber_data`: Keterangan sumber data

### C. `kabkota_sumut.geojson`
Fitur geografis batas poligon koordinat 33 kabupaten/kota Provinsi Sumatera Utara untuk visualisasi peta choropleth tingkat serapan, jumlah laporan aduan, dan skor transparansi.

## 3. Cara Mengganti dengan Data Real lewat `scripts/import.ts`
Untuk mengganti dataset simulasi prototipe dengan data APBD atau proyek resmi dari instansi Anda:

1. Siapkan berkas CSV sesuai struktur kolom di atas (pastikan kolom wajib tersedia dan angka pagu/realisasi tanpa pemisah ribuan non-numerik).
2. Validasi berkas CSV menggunakan script `scripts/import.ts`:
```bash
# Validasi data APBD real
npx tsx scripts/import.ts path/ke/apbd_real.csv --type=apbd

# Validasi data Proyek Publik real
npx tsx scripts/import.ts path/ke/proyek_publik.csv --type=proyek
```
3. Setelah lolos validasi (`invalidRows: 0`), salin berkas tersebut ke `database/data/apbd_realisasi.csv` dan/atau `database/data/proyek_publik.csv` lalu mulai ulang server agar `DatabaseStore.loadRealCSVData()` memuat data baru saat startup.
4. Anda juga dapat memvalidasi berkas CSV melalui menu **Import CSV** pada Panel Admin (`POST /api/admin/import` untuk akun `super_admin`).
