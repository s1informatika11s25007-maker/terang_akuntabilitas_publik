export interface Sector {
  id: string;
  nama: string;
  ikon: string; // lucide icon identifier
  warna: string; // hex
  deskripsi: string;
}

export const SECTORS: Sector[] = [
  {
    id: 'sec-pendidikan',
    nama: 'Pendidikan',
    ikon: 'GraduationCap',
    warna: '#0FA3B1',
    deskripsi: 'Pembangunan sarana belajar, rehabilitasi ruang kelas, beasiswa dan BOS daerah.',
  },
  {
    id: 'sec-kesehatan',
    nama: 'Kesehatan',
    ikon: 'Activity',
    warna: '#2E9E6B',
    deskripsi: 'Pembangunan RSUD/Puskesmas, pengadaan alat medis, dan program penanganan stunting.',
  },
  {
    id: 'sec-pupr',
    nama: 'Pekerjaan Umum & Tata Ruang',
    ikon: 'HardHat',
    warna: '#F5A623',
    deskripsi: 'Peningkatan jalan provinsi/kabupaten, jembatan, bendung, dan drainase primer.',
  },
  {
    id: 'sec-perkim',
    nama: 'Perumahan & Permukiman',
    ikon: 'Home',
    warna: '#3B82F6',
    deskripsi: 'Jaringan SPAM air minum, sanitasi lingkungan, bedah rumah tidak layak huni.',
  },
  {
    id: 'sec-pertanian',
    nama: 'Pertanian & Pangan',
    ikon: 'Sprout',
    warna: '#84CC16',
    deskripsi: 'Irigasi tersier, bibit unggul, pupuk bersubsidi, dan jalan usaha tani.',
  },
  {
    id: 'sec-perhubungan',
    nama: 'Perhubungan & Logistik',
    ikon: 'Bus',
    warna: '#6366F1',
    deskripsi: 'Terminal antar kota, penerangan jalan umum (PJU), marka, dan dermaga penyeberangan Danau Toba.',
  },
  {
    id: 'sec-lingkungan',
    nama: 'Lingkungan Hidup',
    ikon: 'Trees',
    warna: '#10B981',
    deskripsi: 'Pengelolaan TPA regional, reboisasi DAS Wampu & Asahan, perbaikan sempadan sungai.',
  },
  {
    id: 'sec-sosial',
    nama: 'Sosial & Pengentasan Kemiskinan',
    ikon: 'HeartHandshake',
    warna: '#EC4899',
    deskripsi: 'Bantuan modal usaha mikro, perlindungan disabilitas, panti rehabilitasi sosial.',
  },
  {
    id: 'sec-pariwisata',
    nama: 'Pariwisata & Kreatif',
    ikon: 'Compass',
    warna: '#F43F5E',
    deskripsi: 'Pengembangan DPSP Danau Toba, atraksi budaya, penataan desa wisata dan pusat UMKM.',
  },
];

export function getSectorById(id: string): Sector | undefined {
  return SECTORS.find((s) => s.id === id);
}
