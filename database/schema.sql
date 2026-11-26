-- ============================================================
-- TERANG — DDL Basis Data PostgreSQL / Supabase Schema
-- Transparansi & Akuntabilitas Publik Sumatera Utara
-- ============================================================

-- 1. Tabel REGIONS (Wilayah Kabupaten / Kota)
CREATE TABLE IF NOT EXISTS regions (
    id VARCHAR PRIMARY KEY,
    nama VARCHAR NOT NULL,
    tipe VARCHAR NOT NULL CHECK (tipe IN ('kabupaten', 'kota')),
    kode_bps VARCHAR,
    geojson_key VARCHAR,
    populasi INT DEFAULT 0,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    ibu_kota VARCHAR
);

-- 2. Tabel SECTORS (Sektor Pembangunan)
CREATE TABLE IF NOT EXISTS sectors (
    id VARCHAR PRIMARY KEY,
    nama VARCHAR NOT NULL,
    ikon VARCHAR,
    warna VARCHAR,
    deskripsi TEXT
);

-- 3. Tabel BUDGETS (Anggaran APBD & Realisasi)
CREATE TABLE IF NOT EXISTS budgets (
    id VARCHAR PRIMARY KEY,
    region_id VARCHAR REFERENCES regions(id) ON DELETE CASCADE,
    sector_id VARCHAR REFERENCES sectors(id) ON DELETE CASCADE,
    tahun INT NOT NULL,
    pagu BIGINT NOT NULL DEFAULT 0,
    realisasi BIGINT NOT NULL DEFAULT 0,
    serapan_persen DOUBLE PRECISION DEFAULT 0,
    sumber VARCHAR CHECK (sumber IN ('PAD', 'DAU', 'DAK', 'DBH'))
);

-- 4. Tabel PROJECTS (Katalog Proyek Fisik Publik)
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR PRIMARY KEY,
    region_id VARCHAR REFERENCES regions(id) ON DELETE CASCADE,
    sector_id VARCHAR REFERENCES sectors(id) ON DELETE CASCADE,
    kode VARCHAR UNIQUE,
    nama VARCHAR NOT NULL,
    deskripsi TEXT,
    lokasi_nama VARCHAR,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    pagu BIGINT NOT NULL DEFAULT 0,
    realisasi BIGINT NOT NULL DEFAULT 0,
    progres_fisik INT DEFAULT 0,
    status VARCHAR CHECK (status IN ('perencanaan', 'berjalan', 'selesai', 'mangkrak')),
    kontraktor VARCHAR,
    tahun INT NOT NULL,
    tgl_mulai DATE,
    tgl_target DATE,
    tgl_selesai DATE,
    sumber_data VARCHAR
);

-- 5. Tabel USERS (Pengguna RBAC Admin/Verifikator/Instansi/Warga)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR,
    name VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('super_admin', 'verifikator', 'instansi', 'warga')),
    region_id VARCHAR REFERENCES regions(id) ON DELETE SET NULL,
    status VARCHAR NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel USER_SESSIONS (Sesi Autentikasi & Token Login)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel USER_REGISTRATIONS (Log Pendaftaran Akun Baru)
CREATE TABLE IF NOT EXISTS user_registrations (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    nik VARCHAR,
    kontak VARCHAR,
    region_id VARCHAR REFERENCES regions(id) ON DELETE SET NULL,
    status VARCHAR NOT NULL DEFAULT 'terverifikasi' CHECK (status IN ('pending', 'terverifikasi', 'ditolak')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel REPORTS (Laporan Aduan Warga Faktual)
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR PRIMARY KEY,
    tracking_code VARCHAR UNIQUE NOT NULL,
    project_id VARCHAR REFERENCES projects(id) ON DELETE SET NULL,
    region_id VARCHAR REFERENCES regions(id) ON DELETE CASCADE,
    sector_id VARCHAR REFERENCES sectors(id) ON DELETE CASCADE,
    kategori VARCHAR NOT NULL,
    judul VARCHAR NOT NULL,
    deskripsi TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    alamat TEXT,
    nama_pelapor VARCHAR,
    kontak VARCHAR,
    is_anonim BOOLEAN DEFAULT false,
    status VARCHAR NOT NULL DEFAULT 'diterima' CHECK (status IN ('diterima', 'diverifikasi', 'ditindaklanjuti', 'selesai', 'ditolak')),
    alasan_tolak TEXT,
    dukungan_count INT DEFAULT 1,
    verified_by VARCHAR,
    verified_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    ai_urgensi INT DEFAULT 1,
    ai_ringkasan TEXT,
    ai_dupe_of VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel REPORT_PHOTOS (Foto Bukti Fisik Lapangan)
CREATE TABLE IF NOT EXISTS report_photos (
    id VARCHAR PRIMARY KEY,
    report_id VARCHAR REFERENCES reports(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    tipe VARCHAR DEFAULT 'bukti_warga' CHECK (tipe IN ('bukti_warga', 'bukti_tindak_lanjut')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabel REPORT_UPDATES (Riwayat Tahapan Status Laporan)
CREATE TABLE IF NOT EXISTS report_updates (
    id VARCHAR PRIMARY KEY,
    report_id VARCHAR REFERENCES reports(id) ON DELETE CASCADE,
    user_id VARCHAR,
    status_dari VARCHAR,
    status_ke VARCHAR NOT NULL,
    catatan TEXT,
    petugas VARCHAR,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabel REPORT_SUPPORTS (Dukungan Warga / Upvotes)
CREATE TABLE IF NOT EXISTS report_supports (
    id VARCHAR PRIMARY KEY,
    report_id VARCHAR REFERENCES reports(id) ON DELETE CASCADE,
    fingerprint VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_report_support UNIQUE (report_id, fingerprint)
);

-- 12. Tabel AGENCY_RESPONSES (Tanggapan Resmi Dinas / Instansi)
CREATE TABLE IF NOT EXISTS agency_responses (
    id VARCHAR PRIMARY KEY,
    report_id VARCHAR REFERENCES reports(id) ON DELETE CASCADE,
    user_id VARCHAR,
    instansi VARCHAR NOT NULL,
    pejabat VARCHAR NOT NULL,
    tanggapan TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Tabel ACTIVITY_LOGS (Log Audit & Aktivitas Sistem)
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR PRIMARY KEY,
    user_email VARCHAR,
    role VARCHAR,
    aksi VARCHAR NOT NULL,
    subjek VARCHAR NOT NULL,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Tabel TRANSPARENCY_SCORES (Skor Indeks Transparansi Daerah)
CREATE TABLE IF NOT EXISTS transparency_scores (
    id VARCHAR PRIMARY KEY,
    region_id VARCHAR REFERENCES regions(id) ON DELETE CASCADE,
    tahun INT NOT NULL,
    skor_total DOUBLE PRECISION DEFAULT 0,
    skor_kelengkapan DOUBLE PRECISION DEFAULT 0,
    skor_respons DOUBLE PRECISION DEFAULT 0,
    skor_penyelesaian DOUBLE PRECISION DEFAULT 0,
    grade VARCHAR DEFAULT 'C' CHECK (grade IN ('A', 'B', 'C', 'D', 'E')),
    dihitung_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk Mengoptimalkan Performa Query, Auth & GIS
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_reports_region ON reports(region_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_tracking ON reports(tracking_code);
CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region_id);
CREATE INDEX IF NOT EXISTS idx_budgets_region_year ON budgets(region_id, tahun);
