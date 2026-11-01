import { REGIONS } from './regionsData.js';
import { SECTORS } from './sectorsData.js';

export interface Project {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  region_id: string;
  region_nama: string;
  sector_id: string;
  sector_nama: string;
  lokasi_nama: string;
  lat: number;
  lng: number;
  pagu: number;
  realisasi: number;
  progres_fisik: number; // 0 - 100
  status: 'perencanaan' | 'berjalan' | 'selesai' | 'mangkrak';
  kontraktor: string;
  tahun: number;
  tgl_mulai: string;
  tgl_target: string;
  tgl_selesai?: string;
  sumber_data: string;
}

const CONTRACTORS = [
  'PT Hutama Karya (Persero)',
  'PT Wijaya Karya (Persero) Tbk',
  'PT Pembangunan Perumahan (Persero)',
  'PT Horas Mandiri Sejahtera',
  'PT Karya Sumut Lestari',
  'PT Medan Bangun Persada',
  'PT Citra Sinar Toba',
  'PT Deli Megah Konstruksi',
  'PT Asahan Graha Pratama',
  'PT Nias Berdikari Mandiri',
  'CV Karo Agave Engineering',
  'PT Bina Rekayasa Mandiri',
  'PT Dairi Mitra Sentosa',
  'PT Simalungun Cipta Sarana',
];

// Curated high-impact landmark projects across North Sumatra
const FEATURED_PROJECTS: Array<Omit<Project, 'id'>> = [
  {
    kode: 'PRJ-SU-2024-001',
    nama: 'Peningkatan Struktur Jalan Provinsi Jurusan Medan - Berastagi KM 38-46',
    deskripsi: 'Pelebaran jalur dan perkuatan tebing rawan longsor pada koridor ekonomi Medan - Karo guna mengurangi kemacetan dan kecelakaan.',
    region_id: 'reg-deliserdang',
    region_nama: 'Kabupaten Deli Serdang',
    sector_id: 'sec-pupr',
    sector_nama: 'Pekerjaan Umum & Tata Ruang',
    lokasi_nama: 'Jalan Raya Medan - Berastagi KM 42, Sibolangit',
    lat: 3.2842,
    lng: 98.5721,
    pagu: 78500000000,
    realisasi: 74575000000, // 95% keuangan
    progres_fisik: 58, // GAP BESAR: delta 37%!
    status: 'berjalan',
    kontraktor: 'PT Hutama Karya (Persero)',
    tahun: 2024,
    tgl_mulai: '2024-02-15',
    tgl_target: '2024-11-30',
    sumber_data: 'Dinas PUPR Prov. Sumut & LPSE Sumutprov',
  },
  {
    kode: 'PRJ-SU-2024-002',
    nama: 'Pembangunan Jaringan Distribusi Utama SPAM Regional Mebidang',
    deskripsi: 'Pemasangan pipa transmisi air minum kapasitas 1.100 liter/detik untuk melayani warga Medan, Binjai, dan Deli Serdang.',
    region_id: 'reg-medan',
    region_nama: 'Kota Medan',
    sector_id: 'sec-perkim',
    sector_nama: 'Perumahan & Permukiman',
    lokasi_nama: 'Sunggal - Medan Helvetia',
    lat: 3.5872,
    lng: 98.6321,
    pagu: 112000000000,
    realisasi: 106400000000, // 95%
    progres_fisik: 62, // GAP: delta 33%
    status: 'berjalan',
    kontraktor: 'PT Wijaya Karya (Persero) Tbk',
    tahun: 2024,
    tgl_mulai: '2024-01-10',
    tgl_target: '2024-12-15',
    sumber_data: 'Kementerian PUPR Ditjen Cipta Karya / Dinas PKP2R',
  },
  {
    kode: 'PRJ-SU-2024-003',
    nama: 'Pembangunan Gedung Rawat Inap Terpadu 5 Lantai RSUD Sidikalang',
    deskripsi: 'Pembangunan fasilitas rawat inap kelas standar, instalasi hemodialisa, dan ruang isolasi terintegrasi.',
    region_id: 'reg-dairi',
    region_nama: 'Kabupaten Dairi',
    sector_id: 'sec-kesehatan',
    sector_nama: 'Kesehatan',
    lokasi_nama: 'Jl. Rumah Sakit No. 19, Sidikalang',
    lat: 2.7482,
    lng: 98.3112,
    pagu: 48500000000,
    realisasi: 48500000000, // 100%
    progres_fisik: 65, // Dilaporkan selesai padahal belum beroperasi!
    status: 'selesai',
    kontraktor: 'PT Dairi Mitra Sentosa',
    tahun: 2024,
    tgl_mulai: '2023-08-01',
    tgl_target: '2024-06-30',
    tgl_selesai: '2024-07-15',
    sumber_data: 'Dinas Kesehatan Kab. Dairi & DAK Fisik',
  },
  {
    kode: 'PRJ-SU-2024-004',
    nama: 'Normalisasi Sungai Deli dan Perkuatan Tanggul Banjir Kota Medan',
    deskripsi: 'Pengerukan sedimentasi lumpur sepanjang 8.5 km dan konstruksi bronjong penahan erosi di bantaran sungai Medan Maimun.',
    region_id: 'reg-medan',
    region_nama: 'Kota Medan',
    sector_id: 'sec-pupr',
    sector_nama: 'Pekerjaan Umum & Tata Ruang',
    lokasi_nama: 'Bantaran Sungai Deli, Kel. Hamdan, Medan Maimun',
    lat: 3.5784,
    lng: 98.6812,
    pagu: 54000000000,
    realisasi: 49680000000, // 92%
    progres_fisik: 88,
    status: 'berjalan',
    kontraktor: 'PT Pembangunan Perumahan (Persero)',
    tahun: 2024,
    tgl_mulai: '2024-03-01',
    tgl_target: '2024-12-20',
    sumber_data: 'BWS Sumatera II & Dinas SDABMBK Medan',
  },
  {
    kode: 'PRJ-SU-2023-005',
    nama: 'Pembangunan Dermaga Pelabuhan Penyeberangan Teluk Dalam',
    deskripsi: 'Pembangunan dermaga apung dan terminal penumpang untuk konektivitas pulau-pulau terluar Nias Selatan.',
    region_id: 'reg-niasselatan',
    region_nama: 'Kabupaten Nias Selatan',
    sector_id: 'sec-perhubungan',
    sector_nama: 'Perhubungan & Logistik',
    lokasi_nama: 'Kawasan Pelabuhan Teluk Dalam',
    lat: 0.5542,
    lng: 97.8212,
    pagu: 36200000000,
    realisasi: 28960000000, // 80%
    progres_fisik: 35, // Terhenti / mangkrak
    status: 'mangkrak',
    kontraktor: 'PT Nias Berdikari Mandiri',
    tahun: 2023,
    tgl_mulai: '2023-04-10',
    tgl_target: '2023-12-31',
    sumber_data: 'Dinas Perhubungan Prov. Sumut',
  },
  {
    kode: 'PRJ-SU-2024-006',
    nama: 'Rehabilitasi Jaringan Irigasi Tersier Daerah Irigasi Dolok Sanggul',
    deskripsi: 'Perbaikan saluran irigasi seluas 850 hektar sawah produktif masyarakat untuk ketahanan pangan lokal.',
    region_id: 'reg-humbanghasundutan',
    region_nama: 'Kabupaten Humbang Hasundutan',
    sector_id: 'sec-pertanian',
    sector_nama: 'Pertanian & Pangan',
    lokasi_nama: 'Kecamatan Dolok Sanggul',
    lat: 2.2642,
    lng: 98.7492,
    pagu: 18400000000,
    realisasi: 18032000000,
    progres_fisik: 96,
    status: 'selesai',
    kontraktor: 'PT Horas Mandiri Sejahtera',
    tahun: 2024,
    tgl_mulai: '2024-02-01',
    tgl_target: '2024-09-30',
    tgl_selesai: '2024-09-25',
    sumber_data: 'Dinas Pertanian Kab. Humbahas & Kemenkeu DAK',
  },
  {
    kode: 'PRJ-SU-2024-007',
    nama: 'Pembangunan Jembatan Tano Ponggol Samosir Jalur Lingkar Danau Toba',
    deskripsi: 'Pelebaran kanal dan rekonstruksi jembatan penghubung daratan Sumatera dengan Pulau Samosir berstandar internasional.',
    region_id: 'reg-samosir',
    region_nama: 'Kabupaten Samosir',
    sector_id: 'sec-pupr',
    sector_nama: 'Pekerjaan Umum & Tata Ruang',
    lokasi_nama: 'Pangururan, Danau Toba',
    lat: 2.6042,
    lng: 98.7012,
    pagu: 157000000000,
    realisasi: 155430000000,
    progres_fisik: 100,
    status: 'selesai',
    kontraktor: 'PT Wijaya Karya (Persero) Tbk',
    tahun: 2024,
    tgl_mulai: '2023-01-15',
    tgl_target: '2024-06-30',
    tgl_selesai: '2024-07-02',
    sumber_data: 'Kementerian PUPR BBPJN Sumut',
  },
  {
    kode: 'PRJ-SU-2024-008',
    nama: 'Revitalisasi Gedung Laboratorium Terpadu & RKB SMA Negeri 1 Tarutung',
    deskripsi: 'Pembangunan laboratorium fisika, kimia, biologi modern serta 6 ruang kelas baru pasca gempa bumi.',
    region_id: 'reg-tapanuliutara',
    region_nama: 'Kabupaten Tapanuli Utara',
    sector_id: 'sec-pendidikan',
    sector_nama: 'Pendidikan',
    lokasi_nama: 'Jl. Sisingamangaraja No. 45, Tarutung',
    lat: 2.0124,
    lng: 98.9612,
    pagu: 14200000000,
    realisasi: 13916000000,
    progres_fisik: 98,
    status: 'selesai',
    kontraktor: 'PT Karya Sumut Lestari',
    tahun: 2024,
    tgl_mulai: '2024-03-01',
    tgl_target: '2024-10-15',
    tgl_selesai: '2024-10-10',
    sumber_data: 'Dinas Pendidikan Prov. Sumut',
  },
];

// Generate comprehensive dataset to reach 160+ realistic projects
export const PROJECTS: Project[] = [];

// Push featured first
FEATURED_PROJECTS.forEach((p, idx) => {
  PROJECTS.push({
    ...p,
    id: `prj-${idx + 1}`,
  });
});

// Sector project templates for generating realistic authentic projects across 33 regions
const PROJECT_TEMPLATES: Record<string, Array<{ nama: string; deskripsi: string; paguRange: [number, number] }>> = {
  'sec-pupr': [
    { nama: 'Peningkatan Jalan Poros Penghubung Antar Kecamatan', deskripsi: 'Pekerjaan perkerasan lentur AC-WC dan pembangunan drainase tepi jalan sepanjang 12.4 km.', paguRange: [24000000000, 48000000000] },
    { nama: 'Pembangunan Jembatan Rangka Baja Bentang 45 Meter', deskripsi: 'Penggantian jembatan kayu lapuk menjadi konstruksi komposit baja untuk akses logistik warga.', paguRange: [18000000000, 32000000000] },
    { nama: 'Pembangunan Saluran Drainase Primer Perkotaan', deskripsi: 'Konstruksi gorong-gorong beton pracetak U-Ditch 120x120cm untuk mitigasi genangan banjir perkotaan.', paguRange: [12000000000, 26000000000] },
  ],
  'sec-pendidikan': [
    { nama: 'Pembangunan Ruang Kelas Baru dan Lab Komputer SMP/SMA', deskripsi: 'Pembangunan sarana penunjang ANBK, meja kursi ergonomis, serta jaringan kelistrikan dan internet.', paguRange: [8000000000, 16000000000] },
    { nama: 'Rehabilitasi Berat Atap dan Sanitasi Gedung Sekolah Dasar', deskripsi: 'Penggantian rangka atap baja ringan, perbaikan plafon, dan renovasi toilet sekolah sehat ramah anak.', paguRange: [4500000000, 9500000000] },
  ],
  'sec-kesehatan': [
    { nama: 'Pembangunan Gedung Puskesmas Rawat Inap Standar Kemenkes', deskripsi: 'Fasilitas UGD 24 jam, ruang persalinan VK, instalasi farmasi, dan perumahan dinas tenaga medis.', paguRange: [14000000000, 28000000000] },
    { nama: 'Pengadaan Alat Diagnostik USG 4D dan Laboratorium Klinis', deskripsi: 'Peralatan skrining ibu hamil berisiko tinggi dan deteksi dini anemia/stunting balita.', paguRange: [7500000000, 15000000000] },
  ],
  'sec-perkim': [
    { nama: 'Optimalisasi Jaringan Perpipaan Air Bersih Pedesaan (SPAM)', deskripsi: 'Pembangunan bak intake reservoir dan jaringan pipa HDPE transmisi air ke 650 sambungan rumah.', paguRange: [11000000000, 22000000000] },
    { nama: 'Bantuan Stimulan Perumahan Swadaya (BSPS) Bedah Rumah', deskripsi: 'Rehabilitasi 250 unit rumah tidak layak huni menjadi rumah sehat berlantai semen dan bersanitasi.', paguRange: [5000000000, 10000000000] },
  ],
  'sec-pertanian': [
    { nama: 'Pembangunan Embung Penampung Air dan Jaringan Irigasi Tersier', deskripsi: 'Penyediaan pasokan air irigasi saat musim kemarau seluas 400 hektar kawasan sentra padi/hortikultura.', paguRange: [9000000000, 17500000000] },
    { nama: 'Pembangunan Jalan Usaha Tani (JUT) Rabat Beton', deskripsi: 'Akses transportasi roda tiga dan traktor untuk menekan biaya angkut hasil panen petani lokal.', paguRange: [6000000000, 12000000000] },
  ],
  'sec-perhubungan': [
    { nama: 'Pemasangan Lampu Penerangan Jalan Umum (PJU) Solar Cell', deskripsi: 'Pengadaan dan instalasi 320 titik PJU tenaga surya pada jalur rawan kecelakaan dan begal.', paguRange: [7000000000, 13500000000] },
    { nama: 'Pembangunan Halte Terintegrasi dan Fasilitas Pejalan Kaki', deskripsi: 'Penyediaan zebra cross terangkat, guiding block disabilitas, dan shelter bus modern.', paguRange: [4000000000, 8500000000] },
  ],
  'sec-lingkungan': [
    { nama: 'Pembangunan Tempat Pengolahan Sampah Terpadu (TPST 3R)', deskripsi: 'Penyediaan mesin pencacah plastik, hanggar pengomposan organik, dan armada truk pengangkut.', paguRange: [8500000000, 16000000000] },
  ],
  'sec-sosial': [
    { nama: 'Pembangunan Pusat Sentra Kreasi dan Pelatihan Disabilitas', deskripsi: 'Ruang inkubasi vokasional tata boga, kriya, sablon, dan pendampingan izin berusaha UMKM sosial.', paguRange: [5500000000, 11000000000] },
  ],
  'sec-pariwisata': [
    { nama: 'Penataan Kawasan Daya Tarik Wisata dan Plaza Kuliner Lokal', deskripsi: 'Pembangunan dermaga pandang, kios cendera mata, toilet higienis, dan instalasi pencahayaan artistik.', paguRange: [12000000000, 25000000000] },
  ],
};

let projIdSeq = PROJECTS.length + 1;

// Loop across 33 regions and sectors to generate realistic projects
for (const reg of REGIONS) {
  // Generate 4-6 projects per region
  const projectCount = reg.populasi > 1000000 ? 7 : reg.populasi > 400000 ? 5 : 4;

  const usedSectors = ['sec-pupr', 'sec-pendidikan', 'sec-kesehatan', 'sec-perkim', 'sec-pertanian'];
  if (reg.populasi > 300000) usedSectors.push('sec-perhubungan', 'sec-pariwisata');

  for (let i = 0; i < projectCount; i++) {
    const secId = usedSectors[i % usedSectors.length];
    const templates = PROJECT_TEMPLATES[secId] || PROJECT_TEMPLATES['sec-pupr'];
    const tpl = templates[i % templates.length];
    const secObj = SECTORS.find((s) => s.id === secId)!;

    // Small random offset around region lat/lng
    const latOffset = (((i * 17 + reg.populasi) % 100) - 50) / 1000;
    const lngOffset = (((i * 23 + reg.lat) % 100) - 50) / 1000;

    const basePagu = Math.round((tpl.paguRange[0] + ((reg.populasi % 20) / 20) * (tpl.paguRange[1] - tpl.paguRange[0])) / 100000000) * 100000000;

    // Status: 2024 has 60% selesai, 30% berjalan, 7% perencanaan, 3% mangkrak
    const statusRoll = (i * 3 + reg.nama.length) % 10;
    let status: Project['status'] = 'berjalan';
    let progresFisik = 75;
    let realisasi = Math.round(basePagu * 0.78 / 1000000) * 1000000;
    let tglSelesai: string | undefined = undefined;

    if (statusRoll >= 6) {
      status = 'selesai';
      progresFisik = 100;
      realisasi = Math.round(basePagu * 0.96 / 1000000) * 1000000;
      tglSelesai = '2024-11-15';
    } else if (statusRoll === 5) {
      status = 'perencanaan';
      progresFisik = 5;
      realisasi = Math.round(basePagu * 0.1 / 1000000) * 1000000;
    } else if (statusRoll === 4 && i % 4 === 0) {
      status = 'mangkrak';
      progresFisik = 38;
      realisasi = Math.round(basePagu * 0.82 / 1000000) * 1000000; // financial high, physical low
    } else {
      status = 'berjalan';
      progresFisik = 40 + (i * 11) % 50;
      const finRate = Math.min(0.95, (progresFisik + 8) / 100);
      realisasi = Math.round(basePagu * finRate / 1000000) * 1000000;
    }

    const contractor = CONTRACTORS[(i + reg.nama.length) % CONTRACTORS.length];
    const year = 2024 - (i % 2);

    PROJECTS.push({
      id: `prj-${projIdSeq}`,
      kode: `PRJ-SU-${year}-${String(projIdSeq).padStart(3, '0')}`,
      nama: `${tpl.nama} di ${reg.nama}`,
      deskripsi: `${tpl.deskripsi} Menunjang kesejahteraan dan pelayanan publik di wilayah ${reg.nama}.`,
      region_id: reg.id,
      region_nama: reg.nama,
      sector_id: secId,
      sector_nama: secObj.nama,
      lokasi_nama: `${reg.ibu_kota}, ${reg.nama}`,
      lat: Number((reg.lat + latOffset).toFixed(4)),
      lng: Number((reg.lng + lngOffset).toFixed(4)),
      pagu: basePagu,
      realisasi,
      progres_fisik: progresFisik,
      status,
      kontraktor: contractor,
      tahun: year,
      tgl_mulai: `${year}-02-10`,
      tgl_target: `${year}-12-15`,
      tgl_selesai: tglSelesai,
      sumber_data: `APBD ${reg.nama} & LPSE Daerah`,
    });

    projIdSeq++;
  }
}

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
