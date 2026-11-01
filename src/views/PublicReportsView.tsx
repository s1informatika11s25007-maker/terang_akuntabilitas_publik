import React, { useState, useEffect } from 'react';
import { PageMotion } from '../components/PageMotion';
import { PageHero } from '../components/PageHero';
import {
  ThumbsUp,
  MapPin,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { CivicReport } from '../data/reportsData';
import { Region } from '../data/regionsData';

interface PublicReportsViewProps {
  regions: Region[];
  onSelectReport: (code: string) => void;
}

export const PublicReportsView: React.FC<PublicReportsViewProps> = ({
  regions,
  onSelectReport,
}) => {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [supportedReports, setSupportedReports] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchReports();
  }, [selectedStatus, selectedRegion, selectedCategory]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: selectedStatus,
        region_id: selectedRegion,
        kategori: selectedCategory,
        search,
      });

      const res = await fetch(`/api/v1/reports?${q.toString()}`);
      const data = await res.json();
      setReports(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSupport = async (reportId: string) => {
    if (supportedReports[reportId]) return;

    // Generate local device fingerprint
    let fp = localStorage.getItem('terang_device_fp');
    if (!fp) {
      fp = `fp-${Math.random().toString(36).substring(2)}-${Date.now()}`;
      localStorage.setItem('terang_device_fp', fp);
    }

    try {
      const res = await fetch(`/api/v1/reports/${reportId}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp }),
      });
      const data = await res.json();

      if (res.ok) {
        setSupportedReports((prev) => ({ ...prev, [reportId]: true }));
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, dukungan_count: data.dukungan_count } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageMotion page="reports" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHero
        eyebrow="RUANG PARTISIPASI WARGA · TERKURASI"
        title="Laporan publik terverifikasi"
        description="Ikuti isu yang telah melalui pemeriksaan, lihat tindak lanjutnya, dan dukung pengawasan yang relevan."
        icon={<Shield className="w-6 h-6" />}
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              placeholder="Cari aduan atau kode TRG..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              <option value="all">Semua Status (Lolos Verifikasi)</option>
              <option value="diverifikasi">Diverifikasi (Menunggu Eksekusi)</option>
              <option value="ditindaklanjuti">Sedang Ditindaklanjuti</option>
              <option value="selesai">Selesai Dikerjakan</option>
            </select>
          </div>

          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              <option value="all">Semua Kabupaten/Kota</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              <option value="all">Semua Kategori Aduan</option>
              <option value="jalan_rusak">Jalan / Jembatan Rusak</option>
              <option value="proyek_mangkrak">Proyek Mangkrak</option>
              <option value="kualitas_buruk">Kualitas Buruk</option>
              <option value="tidak_sesuai_laporan">Tidak Sesuai Laporan</option>
              <option value="masalah_lingkungan">Masalah Lingkungan</option>
              <option value="layanan_publik">Layanan Publik</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Memuat papan aduan terverifikasi...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs space-y-3">
          <Shield className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-sm">Belum ada laporan yang sesuai kriteria</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Gunakan filter lain untuk menemukan laporan aduan publik terverifikasi di wilayah lainnya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 font-semibold">{rep.tracking_code}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    rep.status === 'selesai' ? 'bg-emerald-50 text-emerald-700' :
                    rep.status === 'ditindaklanjuti' ? 'bg-blue-50 text-blue-700' :
                    rep.status === 'diverifikasi' ? 'bg-teal-50 text-teal-700' :
                    rep.status === 'ditolak' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {rep.status.toUpperCase()}
                  </span>
                </div>

                <h3
                  onClick={() => onSelectReport(rep.tracking_code)}
                  className="font-bold text-sm text-slate-900 hover:text-[#0FA3B1] transition-colors cursor-pointer line-clamp-2"
                >
                  {rep.judul}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {rep.deskripsi}
                </p>

                {rep.project_nama && (
                  <div className="text-[11px] text-teal-700 bg-teal-50/60 p-2 rounded border border-teal-100 truncate">
                    Terhubung: <strong className="font-medium">{rep.project_nama}</strong>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{rep.region_nama}</span>
                  <span>·</span>
                  <span>{rep.created_at.slice(0, 10)}</span>
                </div>
              </div>

              {/* Card Footer: Support Button & Timeline Link */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleSupport(rep.id)}
                  disabled={supportedReports[rep.id]}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors ${
                    supportedReports[rep.id]
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                  title="Dukung agar mendapat atensi lebih cepat dari instansi berwenang"
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${supportedReports[rep.id] ? 'fill-teal-600' : ''}`} />
                  <span className="font-mono font-semibold">{rep.dukungan_count}</span>
                  <span className="text-[11px] hidden sm:inline">Dukungan</span>
                </button>

                <button
                  onClick={() => onSelectReport(rep.tracking_code)}
                  className="text-xs text-[#0FA3B1] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Pantau Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageMotion>
  );
};
