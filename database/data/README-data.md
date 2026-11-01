# Dataset Resmi TERANG - Sumatera Utara 2022-2025

Dokumentasi ini menjelaskan format, metodologi kurasi, dan sumber data yang digunakan dalam platform **TERANG** (Transparansi, Evaluasi, Respons, Akuntabilitas Nusantara) untuk kompetisi **WIA 2026**.

## 1. Sumber Data Primer
1. **Portal Satu Data Indonesia (data.go.id)**
   - Master data kode wilayah, populasi BPS, dan batas administratif 33 kabupaten/kota Provinsi Sumatera Utara.
2. **Kementerian Keuangan RI - Direktorat Jenderal Perimbangan Keuangan (DJPK)**
   - Data agregat Anggaran Pendapatan dan Belanja Daerah (APBD) murni dan perubahan tahun anggaran 2022, 2023, 2024, serta 2025.
   - Klasifikasi belanja sektor: Pendidikan (mandatori 20%), Kesehatan (mandatori 10%), Pekerjaan Umum, Perumahan, Pertanian, Perhubungan, Lingkungan Hidup, Sosial, dan Pariwisata.
3. **Layanan Pengadaan Secara Elektronik (LPSE) & SiRUP LKPP Prov. Sumut & Pemda Kab/Kota**
   - Nama paket pekerjaan proyek fisik, lokasi koordinat geografis, nilai HPS / Pagu kontrak, realisasi termin, progres fisik, dan nama rekanan kontraktor.
4. **Data Pelaporan Warga (Civic Crowdsourcing)**
   - Laporan aduan warga lapangan, foto geotagging bukti fisik, verifikasi inspektorat daerah, dan riwayat tanggapan instansi pengampu.

## 2. Struktur Berkas CSV

### A. `apbd_realisasi.csv`
Kolom:
- `id`: Kode unik anggaran (contoh: `bgt-101`)
- `kode_bps`: Kode wilayah BPS (contoh: `1271`)
- `nama_daerah`: Nama Kabupaten / Kota (contoh: `Kota Medan`)
- `sektor`: Nama sektor pembangunan (contoh: `Pekerjaan Umum & Tata Ruang`)
- `tahun`: Tahun anggaran (2022, 2023, 2024, 2025)
- `pagu`: Nilai pagu alokasi belanja dalam Rupiah
- `realisasi`: Nilai serapan realisasi belanja dalam Rupiah
- `serapan_persen`: Persentase serapan belanja (Realisasi / Pagu * 100)
- `sumber`: Sumber pembiayaan (PAD, DAU, DAK, DBH)

### B. `proyek_publik.csv`
Kolom:
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
- `progres_fisik`: Persentase capaian fisik di lapangan (0-100)
- `status`: `perencanaan` | `berjalan` | `selesai` | `mangkrak`
- `kontraktor`: Nama penyedia jasa / rekanan pelaksana
- `tahun`: Tahun anggaran kontrak
- `sumber_data`: Instansi sumber data

### C. `kabkota_sumut.geojson`
Fitur geografis batas poligon koordinat 33 kabupaten/kota Provinsi Sumatera Utara untuk visualisasi peta choropleth tingkat serapan, jumlah laporan aduan, dan skor transparansi.

## 3. Cara Menjalankan Impor Data
Gunakan script CLI TERANG untuk memvalidasi kolom dan memasukkan data CSV ke dalam sistem:
```bash
# Mengimpor data APBD
npx tsx scripts/import.ts database/data/apbd_realisasi.csv --type=apbd

# Mengimpor data Proyek Publik
npx tsx scripts/import.ts database/data/proyek_publik.csv --type=proyek
```
Atau gunakan menu **Import CSV** pada Panel Admin (`/admin/import`) dengan fitur drag-and-drop, validasi otomatis, dan tinjauan pra-impor.
