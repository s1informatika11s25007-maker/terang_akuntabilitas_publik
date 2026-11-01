import { PROJECTS } from './projectsData.js';
import { REGIONS } from './regionsData.js';

export type ReportStatus = 'diterima' | 'diverifikasi' | 'ditindaklanjuti' | 'selesai' | 'ditolak';

export interface ReportUpdate {
  id: string;
  report_id: string;
  status_dari: ReportStatus;
  status_ke: ReportStatus;
  catatan: string;
  petugas: string;
  is_public: boolean;
  created_at: string;
}

export interface AgencyResponse {
  id: string;
  report_id: string;
  instansi: string;
  pejabat: string;
  tanggapan: string;
  created_at: string;
}

export interface CivicReport {
  id: string;
  tracking_code: string;
  project_id: string | null;
  project_nama?: string;
  region_id: string;
  region_nama: string;
  sector_id: string;
  sector_nama: string;
  kategori: string;
  judul: string;
  deskripsi: string;
  lat: number;
  lng: number;
  alamat: string;
  nama_pelapor: string; // anonymized or masked in public display
  kontak: string; // encrypted/hidden from public
  is_anonim: boolean;
  status: ReportStatus;
  alasan_tolak?: string;
  dukungan_count: number;
  verified_by?: string;
  verified_at?: string;
  completed_at?: string;
  created_at: string;
  foto_bukti: string[];
  foto_tindak_lanjut?: string[];
  updates: ReportUpdate[];
  agency_response?: AgencyResponse;
  // AI fields
  ai_kategori?: string;
  ai_urgensi?: number; // 1 - 5
  ai_ringkasan?: string;
  ai_dupe_of?: string;
}

export const REPORTS: CivicReport[] = [
  {
    id: 'rep-1',
    tracking_code: 'TRG-2026-F9A27D',
    project_id: 'prj-1',
    project_nama: 'Peningkatan Struktur Jalan Provinsi Jurusan Medan - Berastagi KM 38-46',
    region_id: 'reg-deliserdang',
    region_nama: 'Kabupaten Deli Serdang',
    sector_id: 'sec-pupr',
    sector_nama: 'Pekerjaan Umum & Tata Ruang',
    kategori: 'proyek_mangkrak',
    judul: 'Pelebaran Jalan Medan-Berastagi KM 42 Terhenti Sejak 2 Bulan, Tebing Rawan Longsor',
    deskripsi: 'Pekerjaan galian tebing dan pelebaran jalan di KM 42 Sibolangit tampak ditinggalkan alat berat tanpa pekerja selama 2 bulan terakhir. Material batu bronjong berserakan di bahu jalan dan rawan runtuh saat hujan lebat membahayakan pengendara bus dan sayur.',
    lat: 3.2842,
    lng: 98.5721,
    alamat: 'Jl. Jamin Ginting KM 42, Tikungan Sibolangit, Kec. Sibolangit, Deli Serdang',
    nama_pelapor: 'Bambang Sembiring',
    kontak: '08126048xxxx',
    is_anonim: false,
    status: 'ditindaklanjuti',
    dukungan_count: 84,
    verified_by: 'Dedi Pratama, S.T. (Verifikator Inspektorat)',
    verified_at: '2026-03-02 10:15',
    created_at: '2026-02-28 14:20',
    foto_bukti: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
    ],
    foto_tindak_lanjut: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
    ],
    updates: [
      {
        id: 'upd-1-1',
        report_id: 'rep-1',
        status_dari: 'diterima',
        status_ke: 'diverifikasi',
        catatan: 'Laporan telah diverifikasi faktual. Koordinat cocok dengan lokasi proyek strategis provinsi PRJ-SU-2024-001. Diteruskan ke Dinas PUPR Prov. Sumut.',
        petugas: 'Verifikator Inspektorat Daerah',
        is_public: true,
        created_at: '2026-03-02 10:15',
      },
      {
        id: 'upd-1-2',
        report_id: 'rep-1',
        status_dari: 'diverifikasi',
        status_ke: 'ditindaklanjuti',
        catatan: 'Dinas PUPR Prov. Sumut melayangkan Surat Peringatan (SP-2) kepada kontraktor pelaksana untuk segera memobilisasi alat perkuatan lereng tebing dan pembersihan material.',
        petugas: 'Dinas PUPR Provinsi Sumatera Utara',
        is_public: true,
        created_at: '2026-03-08 09:30',
      },
    ],
    agency_response: {
      id: 'res-1',
      report_id: 'rep-1',
      instansi: 'Dinas PUPR Provinsi Sumatera Utara - Bidang Bina Marga',
      pejabat: 'Ir. Hendra Lubis, M.Si',
      tanggapan: 'Terima kasih atas laporan masyarakat. Kami telah menginstruksikan PPK dan kontraktor PT Hutama Karya untuk menambah shift kerja proteksi lereng mulai minggu ini. Pengawasan harian ditingkatkan untuk mengejar ketertinggalan progres fisik 37%.',
      created_at: '2026-03-08 14:00',
    },
    ai_kategori: 'proyek_mangkrak',
    ai_urgensi: 5,
    ai_ringkasan: 'Pekerjaan lereng jalan KM 42 terbengkalai 2 bulan dengan bahaya longsor tinggi bagi angkutan umum.',
  },
  {
    id: 'rep-2',
    tracking_code: 'TRG-2026-C4B819',
    project_id: 'prj-2',
    project_nama: 'Pembangunan Jaringan Distribusi Utama SPAM Regional Mebidang',
    region_id: 'reg-medan',
    region_nama: 'Kota Medan',
    sector_id: 'sec-perkim',
    sector_nama: 'Perumahan & Permukiman',
    kategori: 'kualitas_buruk',
    judul: 'Galian Pipa SPAM Mebidang Dibiarkan Rusak Tanpa Pengaspalan Kembali di Helvetia',
    deskripsi: 'Bekas galian pipa air bersih di Jl. Kapten Muslim hanya ditutup tanah uruk kasar tanpa pengaspalan kembali sesuai standar kontrak. Saat hujan jalanan becek berlumpur dan ketika terik timbul debu pekat hingga pedagang pinggir jalan mengeluh.',
    lat: 3.5972,
    lng: 98.6384,
    alamat: 'Jl. Kapten Muslim No. 88, Helvetia Tengah, Kota Medan',
    nama_pelapor: 'Farida Hanum',
    kontak: '08527512xxxx',
    is_anonim: false,
    status: 'selesai',
    dukungan_count: 62,
    verified_by: 'Siti Rahma, S.Sos (Verifikator Kota Medan)',
    verified_at: '2026-02-14 11:00',
    completed_at: '2026-02-25 16:30',
    created_at: '2026-02-12 09:45',
    foto_bukti: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    ],
    foto_tindak_lanjut: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    ],
    updates: [
      {
        id: 'upd-2-1',
        report_id: 'rep-2',
        status_dari: 'diterima',
        status_ke: 'diverifikasi',
        catatan: 'Laporan valid. Foto menunjukkan ketidaksesuaian rekonstruksi bahu jalan pasca penanaman pipa HDPE.',
        petugas: 'Inspektorat Kota Medan',
        is_public: true,
        created_at: '2026-02-14 11:00',
      },
      {
        id: 'upd-2-2',
        report_id: 'rep-2',
        status_dari: 'diverifikasi',
        status_ke: 'ditindaklanjuti',
        catatan: 'Tim Satgas Jalan Dinas SDABMBK bersama kontraktor pelaksana memulai pengaspalan patching hotmix.',
        petugas: 'Dinas SDABMBK Medan',
        is_public: true,
        created_at: '2026-02-20 14:15',
      },
      {
        id: 'upd-2-3',
        report_id: 'rep-2',
        status_dari: 'ditindaklanjuti',
        status_ke: 'selesai',
        catatan: 'Pengaspalan ulang sepanjang 450 meter selesai dikerjakan dan dinyatakan mulus serta aman dilalui.',
        petugas: 'Inspektorat Kota Medan',
        is_public: true,
        created_at: '2026-02-25 16:30',
      },
    ],
    agency_response: {
      id: 'res-2',
      report_id: 'rep-2',
      instansi: 'Dinas SDABMBK Kota Medan',
      pejabat: 'Topan Obaja Ginting, S.STP, M.SP',
      tanggapan: 'Perbaikan jalan bekas galian SPAM telah dituntaskan dengan aspal hotmix sesuai spesifikasi teknis bina marga. Terima kasih atas kepedulian warga Medan.',
      created_at: '2026-02-26 10:00',
    },
    ai_kategori: 'kualitas_buruk',
    ai_urgensi: 3,
    ai_ringkasan: 'Bahu jalan bekas galian pipa air SPAM di Jl Kapten Muslim belum diaspal kembali menyebabkan debu dan bahaya.',
  },
  {
    id: 'rep-3',
    tracking_code: 'TRG-2026-K7M392',
    project_id: 'prj-3',
    project_nama: 'Pembangunan Gedung Rawat Inap Terpadu 5 Lantai RSUD Sidikalang',
    region_id: 'reg-dairi',
    region_nama: 'Kabupaten Dairi',
    sector_id: 'sec-kesehatan',
    sector_nama: 'Kesehatan',
    kategori: 'tidak_sesuai_laporan',
    judul: 'Klaim Gedung RSUD Sidikalang 100% Selesai Padahal Lift dan Ruang Isolasi Belum Berfungsi',
    deskripsi: 'Di website LPSE dan laporan serapan tertulis proyek sudah selesai 100% per Juli 2024. Namun saat keluarga pasien hendak berobat, lantai 4 dan 5 masih digembok, lift pasien belum terpasang kabel mesin, dan toilet bocor.',
    lat: 2.7482,
    lng: 98.3112,
    alamat: 'Kompleks RSUD Sidikalang, Batang Beruh, Kec. Sidikalang, Dairi',
    nama_pelapor: 'Tumpal Situmorang',
    kontak: '08216899xxxx',
    is_anonim: false,
    status: 'diverifikasi',
    dukungan_count: 51,
    verified_by: 'Budi Simanjuntak (Inspektorat Kab. Dairi)',
    verified_at: '2026-03-05 15:40',
    created_at: '2026-03-04 11:25',
    foto_bukti: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    ],
    updates: [
      {
        id: 'upd-3-1',
        report_id: 'rep-3',
        status_dari: 'diterima',
        status_ke: 'diverifikasi',
        catatan: 'Diverifikasi. Hasil uji petik lapangan menemukan lantai 4-5 belum memenuhi sertifikat laik fungsi (SLF). Kasus dinaikkan ke Tim Audit Khusus BPKP & Inspektorat.',
        petugas: 'Inspektorat Daerah Kab. Dairi',
        is_public: true,
        created_at: '2026-03-05 15:40',
      },
    ],
    ai_kategori: 'tidak_sesuai_laporan',
    ai_urgensi: 4,
    ai_ringkasan: 'Laporan administrasi menyatakan gedung 100% selesai tetapi fasilitas lift dan ruang isolasi belum berfungsi.',
  },
  {
    id: 'rep-4',
    tracking_code: 'TRG-2026-D8E315',
    project_id: null,
    region_id: 'reg-langkat',
    region_nama: 'Kabupaten Langkat',
    sector_id: 'sec-pupr',
    sector_nama: 'Pekerjaan Umum & Tata Ruang',
    kategori: 'jalan_rusak',
    judul: 'Jembatan Gantung Desa Batang Serangan Patah Tali Baja, Anak Sekolah Bertaruh Nyawa',
    deskripsi: 'Jembatan gantung penghubung Dusun II dan Dusun IV Desa Batang Serangan salah satu seling bajanya putus. Lantai papan lapuk berlubang. Puluhan anak sekolah dan pengangkut kelapa sawit harus melintas bergantian dengan resiko jatuh ke sungai deras.',
    lat: 3.6542,
    lng: 98.1912,
    alamat: 'Dusun IV Batang Serangan, Kec. Batang Serangan, Langkat',
    nama_pelapor: 'M. Yusuf Tarigan',
    kontak: '08139744xxxx',
    is_anonim: false,
    status: 'ditindaklanjuti',
    dukungan_count: 118,
    verified_by: 'Ahmad Ridwan (Verifikator Langkat)',
    verified_at: '2026-02-18 08:30',
    created_at: '2026-02-17 17:10',
    foto_bukti: [
      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80',
    ],
    foto_tindak_lanjut: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    ],
    updates: [
      {
        id: 'upd-4-1',
        report_id: 'rep-4',
        status_dari: 'diterima',
        status_ke: 'diverifikasi',
        catatan: 'Kondisi kritis dikonfirmasi. Lokasi prioritas keselamatan warga.',
        petugas: 'Tim Tanggap Cepat Langkat',
        is_public: true,
        created_at: '2026-02-18 08:30',
      },
      {
        id: 'upd-4-2',
        report_id: 'rep-4',
        status_dari: 'diverifikasi',
        status_ke: 'ditindaklanjuti',
        catatan: 'Dinas PUPR Langkat memasang seling baja darurat dan mengganti seluruh bantalan kayu jembatan.',
        petugas: 'Dinas PUPR Langkat',
        is_public: true,
        created_at: '2026-02-22 13:40',
      },
    ],
    agency_response: {
      id: 'res-4',
      report_id: 'rep-4',
      instansi: 'Pemerintah Kabupaten Langkat - BPBD & PUPR',
      pejabat: 'Kadis Kominfo & Humas Langkat',
      tanggapan: 'Penanganan darurat penguatan tali seling dan lantai jembatan telah berjalan. Untuk penanganan permanen telah diusulkan dalam alokasi DAK Fisik APBD-P TA 2026.',
      created_at: '2026-02-23 09:15',
    },
    ai_kategori: 'jalan_rusak',
    ai_urgensi: 5,
    ai_ringkasan: 'Tali baja jembatan gantung anak sekolah putus dan lantai berlubang di Batang Serangan Langkat.',
  },
  {
    id: 'rep-5',
    tracking_code: 'TRG-2026-H1N704',
    project_id: 'prj-5',
    project_nama: 'Pembangunan Dermaga Pelabuhan Penyeberangan Teluk Dalam',
    region_id: 'reg-niasselatan',
    region_nama: 'Kabupaten Nias Selatan',
    sector_id: 'sec-perhubungan',
    sector_nama: 'Perhubungan & Logistik',
    kategori: 'proyek_mangkrak',
    judul: 'Tiang Dermaga Teluk Dalam Dibiarkan Berkarat Tanpa Kelanjutan Proyek Selama 1 Tahun',
    deskripsi: 'Tiang pancang dermaga apung di Teluk Dalam dibiarkan terbengkalai sejak akhir tahun 2023. Besi beton coran mulai keropos akibat air laut asin. Kapal nelayan dan penumpang dari Pulau Tello tetap kesulitan bersandar saat gelombang tinggi.',
    lat: 0.5542,
    lng: 97.8212,
    alamat: 'Dermaga Rakyat Teluk Dalam, Nias Selatan',
    nama_pelapor: 'Ama Martinus Halawa',
    kontak: '08536122xxxx',
    is_anonim: false,
    status: 'diverifikasi',
    dukungan_count: 73,
    verified_by: 'Markus Wau (Verifikator Kepulauan Nias)',
    verified_at: '2026-03-01 14:00',
    created_at: '2026-02-27 10:20',
    foto_bukti: [
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80',
    ],
    updates: [
      {
        id: 'upd-5-1',
        report_id: 'rep-5',
        status_dari: 'diterima',
        status_ke: 'diverifikasi',
        catatan: 'Laporan diverifikasi. Telah dilakukan koordinasi dengan Dinas Perhubungan Provinsi untuk audit sisa anggaran termin.',
        petugas: 'Inspektorat Prov. Sumut Wilayah Kepulauan Nias',
        is_public: true,
        created_at: '2026-03-01 14:00',
      },
    ],
    ai_kategori: 'proyek_mangkrak',
    ai_urgensi: 4,
    ai_ringkasan: 'Tiang pancang dermaga penyeberangan Teluk Dalam mangkrak dan besi berkarat air laut.',
  },
  {
    id: 'rep-6',
    tracking_code: 'TRG-2026-R5W823',
    project_id: 'prj-4',
    project_nama: 'Normalisasi Sungai Deli dan Perkuatan Tanggul Banjir Kota Medan',
    region_id: 'reg-medan',
    region_nama: 'Kota Medan',
    sector_id: 'sec-pupr',
    sector_nama: 'Pekerjaan Umum & Tata Ruang',
    kategori: 'masalah_lingkungan',
    judul: 'Tumpukan Lumpur Kerukan Sungai Deli Dibuang di Pinggir Pemukiman Warga Hamdan',
    deskripsi: 'Proses pengerukan dasar sungai deli meninggalkan gunungan lumpur bercampur sampah plastik di dekat pekarangan rumah warga tanpa diangkut ke TPA. Saat hujan lumpur kembali hanyut dan menimbulkan bau busuk menyengat.',
    lat: 3.5784,
    lng: 98.6812,
    alamat: 'Bantaran Sungai Deli Jl. Brigjend Katamso Gg. Meriam, Medan Maimun',
    nama_pelapor: 'Warga Peduli Deli',
    kontak: '08126344xxxx',
    is_anonim: true,
    status: 'ditindaklanjuti',
    dukungan_count: 42,
    verified_by: 'Siti Rahma (Verifikator Medan)',
    verified_at: '2026-03-06 09:10',
    created_at: '2026-03-05 16:30',
    foto_bukti: [
      'https://images.unsplash.com/photo-1611288875785-59bf6a133917?w=800&auto=format&fit=crop&q=80',
    ],
    updates: [
      {
        id: 'upd-6-1',
        report_id: 'rep-6',
        status_dari: 'diterima',
        status_ke: 'diverifikasi',
        catatan: 'Laporan terverifikasi. Sesuai SOP amdal, disposal pengerukan harus langsung diangkut ke disposal area Terjun.',
        petugas: 'Dinas Lingkungan Hidup Kota Medan',
        is_public: true,
        created_at: '2026-03-06 09:10',
      },
      {
        id: 'upd-6-2',
        report_id: 'rep-6',
        status_dari: 'diverifikasi',
        status_ke: 'ditindaklanjuti',
        catatan: 'Penyedia jasa mengerahkan 6 unit dump truck untuk memindahkan endapan sedimen ke tempat pembuangan akhir.',
        petugas: 'BWS Sumatera II',
        is_public: true,
        created_at: '2026-03-07 11:20',
      },
    ],
    ai_kategori: 'masalah_lingkungan',
    ai_urgensi: 3,
    ai_ringkasan: 'Lumpur hasil kerukan Sungai Deli menumpuk di pemukiman warga Hamdan dan memicu bau busuk.',
  },
  {
    id: 'rep-7',
    tracking_code: 'TRG-2026-Z2P941',
    project_id: null,
    region_id: 'reg-asahan',
    region_nama: 'Kabupaten Asahan',
    sector_id: 'sec-kesehatan',
    sector_nama: 'Kesehatan',
    kategori: 'layanan_publik',
    judul: 'Puskesmas Pembantu Desa Sei Silau Sering Kosong Tanpa Tenaga Medis Saat Jam Layanan',
    deskripsi: 'Warga desa yang hendak imunisasi bayi atau berobat demam sering mendapati pintu puskesmas terkunci pada hari kerja pukul 10.00 pagi. Harus menempuh 18 km ke kota Kisaran untuk berobat.',
    lat: 2.9712,
    lng: 99.6142,
    alamat: 'Dusun III Sei Silau Barat, Kec. Buntu Pane, Asahan',
    nama_pelapor: 'Suratmi',
    kontak: '08529611xxxx',
    is_anonim: false,
    status: 'selesai',
    dukungan_count: 36,
    verified_by: 'Budi Hartono (Inspektorat Asahan)',
    verified_at: '2026-02-10 10:00',
    completed_at: '2026-02-19 14:00',
    created_at: '2026-02-09 13:10',
    foto_bukti: [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
    ],
    updates: [
      {
        id: 'upd-7-1',
        report_id: 'rep-7',
        status_dari: 'diterima',
        status_ke: 'diverifikasi',
        catatan: 'Diverifikasi. Dilakukan pemanggilan kepada kepala puskesmas induk terkait jadwal rotasi bidan dan perawat.',
        petugas: 'Dinas Kesehatan Kab. Asahan',
        is_public: true,
        created_at: '2026-02-10 10:00',
      },
      {
        id: 'upd-7-2',
        report_id: 'rep-7',
        status_dari: 'diverifikasi',
        status_ke: 'selesai',
        catatan: 'Dinas Kesehatan menempatkan 1 bidan desa PTT menetap dan 1 perawat pembantu dengan jam piket teratur.',
        petugas: 'Dinas Kesehatan Kab. Asahan',
        is_public: true,
        created_at: '2026-02-19 14:00',
      },
    ],
    agency_response: {
      id: 'res-7',
      report_id: 'rep-7',
      instansi: 'Dinas Kesehatan Kabupaten Asahan',
      pejabat: 'dr. Hari Saputra',
      tanggapan: 'Kami memohon maaf atas kendala pelayanan. Mulai 16 Februari 2026, petugas medis telah ditempatkan secara tetap di Pustu Sei Silau dengan jadwal pelayanan Senin s/d Sabtu pukul 08.00-14.00 WIB.',
      created_at: '2026-02-19 15:30',
    },
    ai_kategori: 'layanan_publik',
    ai_urgensi: 3,
    ai_ringkasan: 'Puskesmas pembantu di Desa Sei Silau sering tutup pada jam operasional kerja.',
  },
];

// Seed 55+ more realistic reports across North Sumatra to reach 60+ reports
const CATEGORIES = [
  'jalan_rusak',
  'kualitas_buruk',
  'proyek_mangkrak',
  'tidak_sesuai_laporan',
  'masalah_lingkungan',
  'layanan_publik',
  'dugaan_penyimpangan',
];

const TITLES_MAP: Record<string, string[]> = {
  jalan_rusak: [
    'Aspal Jalan Poros Berlubang dan Rusak Parah Mengancam Keselamatan Warga',
    'Gorong-Gorong Jalan Amblas Akibat Hujan Lebat Belum Ada Tanda Peringatan',
    'Pondasi Bahu Jalan Longsor Mengikis Separuh Badan Jalan Antar Dusun',
  ],
  kualitas_buruk: [
    'Plafon Ruang Belajar Sekolah Baru Selesai Sudah Jebol Saat Hujan',
    'Saluran Drainase Tidak Mengalirkan Air Akibat Kemiringan Terbalik dan Tersumbat',
    'Aspal Tipis Baru Selesai 3 Bulan Sudah Retak dan Terkelupas Dihajar Truk',
  ],
  proyek_mangkrak: [
    'Pembangunan Puskesmas Pembantu Terhenti di Tahap Struktur Kolom Semen',
    'Pemasangan Pipa Air Bersih SPAM Pedesaan Berhenti Tanpa Ada Sambungan Rumah',
    'Pembangunan Pasar Desa Terbengkalai dan Ditumbuhi Semak Belukar',
  ],
  tidak_sesuai_laporan: [
    'Data Menyebutkan Irigasi Berfungsi Normal Namun Sawah Warga Tetap Kering',
    'Bantuan Bibit Pertanian Tidak Sesuai Varietas Unggul yang Dijanjikan',
  ],
  masalah_lingkungan: [
    'Limbah Material Proyek Dibuang ke Aliran Sungai Warga',
    'TPS Liar Muncul di Dekat Kawasan Sekolah Tanpa Pengangkutan Rutin',
  ],
  layanan_publik: [
    'Lampu Penerangan Jalan Umum (PJU) Padam Berbulan-bulan Rawan Kriminalitas',
    'Distribusi Air Bersih PDAM Mengalir Keruh dan Berbau Tanah Selama Seminggu',
  ],
  dugaan_penyimpangan: [
    'Ketebalan Cor Beton Jalan Terindikasi Lebih Tipis dari Papan Informasi Proyek',
    'Papan Proyek Tidak Memuat Nilai Anggaran dan Nama Kontraktor Pelaksana',
  ],
};

let repSeq = REPORTS.length + 1;
const STATUS_OPTIONS: ReportStatus[] = ['diterima', 'diverifikasi', 'ditindaklanjuti', 'selesai', 'ditolak'];

for (const reg of REGIONS) {
  // Generate 1-2 reports per region to distribute across all Sumut
  const count = (reg.populasi % 2) + 1;
  for (let i = 0; i < count; i++) {
    const cat = CATEGORIES[(repSeq + i) % CATEGORIES.length];
    const titles = TITLES_MAP[cat] || TITLES_MAP['jalan_rusak'];
    const title = `${titles[i % titles.length]} di ${reg.nama}`;

    const statusRoll = (repSeq * 7) % 10;
    let status: ReportStatus = 'diterima';
    if (statusRoll >= 6) status = 'selesai';
    else if (statusRoll >= 4) status = 'ditindaklanjuti';
    else if (statusRoll >= 2) status = 'diverifikasi';
    else if (statusRoll === 1) status = 'diterima';
    else status = 'ditolak';

    // Find a matching project in this region if possible
    const regProjects = PROJECTS.filter((p) => p.region_id === reg.id);
    const linkedProject = regProjects.length > 0 && i % 2 === 0 ? regProjects[i % regProjects.length] : null;

    const latOffset = (((repSeq * 19) % 100) - 50) / 1000;
    const lngOffset = (((repSeq * 29) % 100) - 50) / 1000;

    const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codeStr = '';
    for (let c = 0; c < 6; c++) {
      codeStr += codeChars.charAt((repSeq * 13 + c * 7) % codeChars.length);
    }
    const trackingCode = `TRG-2026-${codeStr}`;

    const reportDate = new Date(2026, 1, 10 + (repSeq % 45));
    const createdStr = `${reportDate.toISOString().slice(0, 10)} 10:30`;

    const updates: ReportUpdate[] = [];
    if (status !== 'diterima') {
      updates.push({
        id: `upd-${repSeq}-1`,
        report_id: `rep-${repSeq}`,
        status_dari: 'diterima',
        status_ke: status === 'ditolak' ? 'ditolak' : 'diverifikasi',
        catatan: status === 'ditolak' ? 'Laporan ditolak: Informasi lokasi tidak spesifik dan bukan merupakan aset pemerintah daerah.' : 'Laporan terverifikasi valid dan diteruskan ke dinas teknis pengampu.',
        petugas: 'Tim Verifikasi TERANG',
        is_public: true,
        created_at: `${reportDate.toISOString().slice(0, 10)} 14:00`,
      });
    }

    if (status === 'ditindaklanjuti' || status === 'selesai') {
      updates.push({
        id: `upd-${repSeq}-2`,
        report_id: `rep-${repSeq}`,
        status_dari: 'diverifikasi',
        status_ke: 'ditindaklanjuti',
        catatan: 'Dinas teknis telah menerjunkan tim survei dan menyiapkan surat penanganan.',
        petugas: `Dinas Pengampu ${reg.nama}`,
        is_public: true,
        created_at: `${reportDate.toISOString().slice(0, 10)} 17:00`,
      });
    }

    if (status === 'selesai') {
      updates.push({
        id: `upd-${repSeq}-3`,
        report_id: `rep-${repSeq}`,
        status_dari: 'ditindaklanjuti',
        status_ke: 'selesai',
        catatan: 'Penanganan pekerjaan fisik telah selesai dan dikonfirmasi warga sekitar.',
        petugas: `Inspektorat Daerah ${reg.nama}`,
        is_public: true,
        created_at: `${reportDate.toISOString().slice(0, 10)} 18:00`,
      });
    }

    REPORTS.push({
      id: `rep-${repSeq}`,
      tracking_code: trackingCode,
      project_id: linkedProject ? linkedProject.id : null,
      project_nama: linkedProject ? linkedProject.nama : undefined,
      region_id: reg.id,
      region_nama: reg.nama,
      sector_id: linkedProject ? linkedProject.sector_id : 'sec-pupr',
      sector_nama: linkedProject ? linkedProject.sector_nama : 'Pekerjaan Umum & Tata Ruang',
      kategori: cat,
      judul: title,
      deskripsi: `Masyarakat di sekitar kawasan ${reg.ibu_kota} mengeluhkan ${title.toLowerCase()}. Kondisi ini membutuhkan respons cepat dan keterbukaan dari instansi terkait agar keselamatan warga terjamin.`,
      lat: Number((reg.lat + latOffset).toFixed(4)),
      lng: Number((reg.lng + lngOffset).toFixed(4)),
      alamat: `Jl. Protokol ${reg.ibu_kota}, ${reg.nama}`,
      nama_pelapor: `Warga ${reg.ibu_kota}`,
      kontak: '08127000xxxx',
      is_anonim: repSeq % 3 === 0,
      status,
      alasan_tolak: status === 'ditolak' ? 'Bukan merupakan wewenang APBD kabupaten/kota (aset jalan nasional).' : undefined,
      dukungan_count: (repSeq * 7) % 85 + 4,
      verified_by: status !== 'diterima' ? 'Verifikator Terpadu TERANG' : undefined,
      verified_at: status !== 'diterima' ? `${reportDate.toISOString().slice(0, 10)} 14:00` : undefined,
      completed_at: status === 'selesai' ? `${reportDate.toISOString().slice(0, 10)} 18:00` : undefined,
      created_at: createdStr,
      foto_bukti: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
      ],
      updates,
      ai_kategori: cat,
      ai_urgensi: (repSeq % 5) + 1,
      ai_ringkasan: `Laporan warga ${reg.nama} terkait ${cat.replace('_', ' ')} yang membutuhkan koordinasi pemda.`,
    });

    repSeq++;
  }
}

export function getReportByTrackingCode(code: string): CivicReport | undefined {
  const clean = code.trim().toUpperCase();
  return REPORTS.find((r) => r.tracking_code === clean);
}
