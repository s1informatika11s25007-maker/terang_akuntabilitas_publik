import React, { useState } from 'react';
import { PageMotion } from '../components/PageMotion';
import { PageHero } from '../components/PageHero';
import {
  Download,
  Database,
  FileCode,
  Terminal,
  ExternalLink,
  BookOpen,
  Calculator,
  Copy,
  Check,
} from 'lucide-react';

export const DataMethodologyView: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [activeApiTab, setActiveApiTab] = useState<'budgets' | 'projects' | 'reports' | 'scores'>('budgets');

  const copyUrl = (endpoint: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${endpoint}`);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const apiEndpoints = {
    budgets: {
      url: '/api/v1/budgets?tahun=2024&region_id=reg-medan',
      method: 'GET',
      desc: 'Mengambil data anggaran dan serapan APBD per sektor, KPI agregat, dan tren tahunan.',
      sampleResponse: `{
  "status": "success",
  "kpi": {
    "total_pagu": 6500000000000,
    "total_realisasi": 5460000000000,
    "serapan_persen": 84.0,
    "jumlah_proyek": 7,
    "proyek_bermasalah": 1
  },
  "by_sector": [
    { "sector_nama": "Pendidikan", "pagu": 1430000000000, "realisasi": 1258400000000, "serapan_persen": 88.0 }
  ]
}`,
    },
    projects: {
      url: '/api/v1/projects?tahun=2024&filter=gap',
      method: 'GET',
      desc: 'Mendapatkan daftar proyek pembangunan beserta indikator kesenjangan dan riwayat aduan.',
      sampleResponse: `{
  "status": "success",
  "total": 3,
  "data": [
    {
      "kode": "PRJ-SU-2024-001",
      "nama": "Peningkatan Struktur Jalan Provinsi Jurusan Medan - Berastagi KM 38-46",
      "progres_fisik": 58,
      "serapan_persen": 95.0,
      "gap_indicator": {
        "needsFieldVerification": true,
        "level": "Tinggi",
        "progressDelta": 37.0,
        "riskScore": 75
      }
    }
  ]
}`,
    },
    reports: {
      url: '/api/v1/reports?status=diverifikasi',
      method: 'GET',
      desc: 'Mengambil data aduan publik yang telah divalidasi inspektorat (data privasi warga disanitasi).',
      sampleResponse: `{
  "status": "success",
  "total": 24,
  "data": [
    {
      "tracking_code": "TRG-2026-F9A27D",
      "judul": "Pelebaran Jalan Medan-Berastagi KM 42 Terhenti Sejak 2 Bulan",
      "status": "ditindaklanjuti",
      "dukungan_count": 84,
      "nama_pelapor": "Bambang Sembiring"
    }
  ]
}`,
    },
    scores: {
      url: '/api/v1/transparency-scores?tahun=2024',
      method: 'GET',
      desc: 'Kalkulasi skor transparansi seluruh 33 kabupaten/kota Provinsi Sumatera Utara (0-100).',
      sampleResponse: `{
  "status": "success",
  "tahun": 2024,
  "top5": [
    {
      "region": { "nama": "Kota Medan", "tipe": "kota" },
      "scores": { "skor_total": 92.5, "skor_kelengkapan": 38.0, "skor_respons": 27.5, "skor_penyelesaian": 27.0, "grade": "A" }
    }
  ]
}`,
    },
  };

  const handleDownloadDataset = (fileName: string) => {
    window.location.href = `/database/data/${fileName}`;
  };

  return (
    <PageMotion page="data" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <PageHero
        eyebrow="OPEN DATA · DOKUMENTASI TEKNIS"
        title="Data & metodologi"
        description="Akses dataset, pahami cara penghitungan indikator, dan gunakan API publik dengan dokumentasi yang transparan."
        icon={<Database className="w-6 h-6" />}
      />

      {/* Dataset Downloads */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#0FA3B1]" />
          <h2 className="text-base font-bold font-display text-slate-900">Katalog Dataset Resmi TERANG (CSV & GeoJSON)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* APBD CSV */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="font-mono text-[11px] text-teal-700 font-bold">apbd_realisasi.csv</span>
              <h3 className="font-semibold text-slate-800 text-xs">Realisasi APBD 33 Daerah (2022-2025)</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                1.188 baris data alokasi pagu dan serapan SP2D per sektor pembangunan berdasarkan data Kemenkeu DJPK.
              </p>
            </div>
            <button
              onClick={() => handleDownloadDataset('apbd_realisasi.csv')}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV (1.188 Baris)</span>
            </button>
          </div>

          {/* Proyek CSV */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="font-mono text-[11px] text-teal-700 font-bold">proyek_publik.csv</span>
              <h3 className="font-semibold text-slate-800 text-xs">Katalog 156+ Paket Proyek Pembangunan</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Daftar paket pekerjaan fisik, nama kontraktor, koordinat GPS, serapan termin, dan persentase progres fisik.
              </p>
            </div>
            <button
              onClick={() => handleDownloadDataset('proyek_publik.csv')}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV (156 Baris)</span>
            </button>
          </div>

          {/* GeoJSON */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="font-mono text-[11px] text-teal-700 font-bold">kabkota_sumut.geojson</span>
              <h3 className="font-semibold text-slate-800 text-xs">Batas Wilayah Poligon 33 Daerah Sumut</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Format poligon GeoJSON standar spasial WGS84 untuk pemetaan choropleth tingkat kabupaten/kota.
              </p>
            </div>
            <button
              onClick={() => handleDownloadDataset('kabkota_sumut.geojson')}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh GeoJSON Poligon</span>
            </button>
          </div>
        </div>
      </div>

      {/* Penjelasan Rumus Matematis & Metodologi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#3B82F6]" />
          <h2 className="text-base font-bold font-display text-slate-900">Rumus Matematis & Kerangka Evaluasi</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
          {/* Rumus 1: Serapan */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-xs font-display">1. Persentase Serapan Anggaran</h3>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-center text-teal-800 font-bold text-xs">
              Serapan (%) = (Realisasi / Pagu) × 100
            </div>
            <p className="text-[11px] leading-relaxed">
              Mengukur efektivitas eksekusi anggaran daerah. Nilai ≥ 85% mencerminkan penyerapan optimal, sedangkan &lt; 70% di akhir tahun mengindikasikan kelambatan lelang atau SILPA berlebih.
            </p>
          </div>

          {/* Rumus 2: Indikator Kesenjangan */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-xs font-display">2. Indikator Kesenjangan Proyek (Gap)</h3>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-center text-red-800 font-bold text-[11px]">
              Deviasi = Serapan Keuangan (%) - Progres Fisik (%)
            </div>
            <p className="text-[11px] leading-relaxed">
              Ditandai "Perlu Verifikasi Lapangan" bila (Status = Selesai ATAU Keuangan ≥ 90%) DAN (Aduan Warga Terverifikasi ≥ 3 ATAU Deviasi Kesenjangan Fisik ≥ 25 poin).
            </p>
          </div>

          {/* Rumus 3: Skor Transparansi */}
          <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-xs font-display">3. Skor Transparansi Daerah (0-100)</h3>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-center text-slate-900 font-bold text-[11px]">
              Skor = 40%(Kelengkapan) + 30%(Kecepatan) + 30%(Tuntas)
            </div>
            <p className="text-[11px] leading-relaxed">
              • 40% kelengkapan atribut proyek.<br />
              • 30% kecepatan respons (hari tanggap verifikasi inspektorat).<br />
              • 30% rasio penuntasan laporan aduan masyarakat.
            </p>
          </div>
        </div>
      </div>

      {/* REST API Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#0B2545]" />
            <h2 className="text-base font-bold font-display text-slate-900">Dokumentasi API Publik Terbuka (REST JSON)</h2>
          </div>
          <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
            v1.0 Bebas Akses
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
          {[
            { id: 'budgets', label: 'APBD & Serapan' },
            { id: 'projects', label: 'Proyek & Kesenjangan' },
            { id: 'reports', label: 'Laporan Publik' },
            { id: 'scores', label: 'Skor Transparansi' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveApiTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeApiTab === tab.id
                  ? 'bg-[#0B7C8A] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Endpoint details */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between bg-slate-100 text-slate-800 border border-slate-200 p-3 rounded-xl font-mono text-xs">
            <div className="flex items-center gap-3 truncate">
              <span className="text-teal-400 font-bold">{apiEndpoints[activeApiTab].method}</span>
              <span className="truncate">{apiEndpoints[activeApiTab].url}</span>
            </div>
            <button
              onClick={() => copyUrl(apiEndpoints[activeApiTab].url)}
              className="text-slate-400 hover:text-white flex items-center gap-1 shrink-0 ml-2"
              title="Salin URL Lengkap"
            >
              {copiedEndpoint === apiEndpoints[activeApiTab].url ? (
                <Check className="w-3.5 h-3.5 text-teal-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="text-[11px]">Salin</span>
            </button>
          </div>

          <p className="text-slate-600 text-xs">
            {apiEndpoints[activeApiTab].desc}
          </p>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Contoh Respons JSON:</span>
            <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[11px] text-slate-800 overflow-x-auto leading-relaxed">
              {apiEndpoints[activeApiTab].sampleResponse}
            </pre>
          </div>
        </div>
      </div>
    </PageMotion>
  );
};
