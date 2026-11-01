import React, { useState, useEffect } from 'react';
import { PageMotion } from '../components/PageMotion';
import { PageHero } from '../components/PageHero';
import {
  Search,
  Filter,
  AlertTriangle,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  PlusCircle,
  X,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Project } from '../data/projectsData';
import { Region } from '../data/regionsData';
import { Sector } from '../data/sectorsData';
import { CivicReport } from '../data/reportsData';

interface ProjectsViewProps {
  regions: Region[];
  sectors: Sector[];
  onOpenReportFormWithProject: (project: Project) => void;
  onSelectReport: (code: string) => void;
  initialProjectId?: string | null;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  regions,
  sectors,
  onOpenReportFormWithProject,
  onSelectReport,
  initialProjectId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [onlyGap, setOnlyGap] = useState(false);

  const [activeProjectDetail, setActiveProjectDetail] = useState<any | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchProjects(), 260);
    return () => window.clearTimeout(timer);
  }, [selectedRegion, selectedSector, selectedStatus, onlyGap, search]);

  useEffect(() => {
    if (initialProjectId) {
      loadProjectDetail(initialProjectId);
    }
  }, [initialProjectId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        region_id: selectedRegion,
        sector_id: selectedSector,
        status: selectedStatus,
        search,
      });
      if (onlyGap) q.append('filter', 'gap');

      const res = await fetch(`/api/v1/projects?${q.toString()}`);
      const data = await res.json();
      setProjects(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/projects/${id}`);
      const data = await res.json();
      if (data.status === 'success') {
        setActiveProjectDetail(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageMotion page="projects" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHero
        eyebrow="KATALOG PEMBANGUNAN · 33 KABUPATEN/KOTA"
        title="Proyek pembangunan publik"
        description="Telusuri paket pekerjaan, nilai anggaran, progres fisik, dan sinyal kesenjangan di lapangan."
        icon={<Building2 className="w-6 h-6" />}
        actions={<button onClick={() => setOnlyGap(!onlyGap)} className={onlyGap ? 'page-hero-alert-button' : 'page-hero-light-button'}><AlertTriangle className="w-4 h-4" /> {onlyGap ? 'Filter risiko aktif' : 'Fokus kesenjangan'}</button>}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
              placeholder="Cari proyek, kontraktor, kode..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            />
          </div>

          {/* Region filter */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              <option value="all">Semua Kabupaten/Kota (33)</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Sector filter */}
          <div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              <option value="all">Semua Sektor Belanja</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              <option value="all">Semua Status Pelaksanaan</option>
              <option value="berjalan">Sedang Berjalan</option>
              <option value="selesai">Selesai</option>
              <option value="mangkrak">Mangkrak / Terhenti</option>
              <option value="perencanaan">Perencanaan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Memuat katalog proyek pembangunan...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs space-y-3">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-sm">Tidak ada proyek yang sesuai filter</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh proyek.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedRegion('all');
              setSelectedSector('all');
              setSelectedStatus('all');
              setOnlyGap(false);
            }}
            className="px-4 py-2 bg-[#0B7C8A] text-white rounded-lg font-medium hover:bg-[#096A76] transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj: any) => {
            const finRate = Math.round((proj.realisasi / proj.pagu) * 100);
            const gap = proj.gap_indicator;
            const isHighGap = gap?.needsFieldVerification;

            return (
              <div
                key={proj.id}
                className={`bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between ${
                  isHighGap ? 'border-l-4 border-l-red-500 ring-1 ring-red-500/20 shadow-red-500/10' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-400">{proj.kode}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      proj.status === 'selesai' ? 'bg-emerald-50 text-emerald-700' :
                      proj.status === 'mangkrak' ? 'bg-red-50 text-red-700' :
                      proj.status === 'berjalan' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {proj.status.toUpperCase()}
                    </span>
                  </div>

                  <h3
                    onClick={() => loadProjectDetail(proj.id)}
                    className="font-bold text-sm text-slate-900 hover:text-[#0FA3B1] transition-colors cursor-pointer line-clamp-2"
                  >
                    {proj.nama}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{proj.lokasi_nama}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{proj.kontraktor}</span>
                    </div>
                  </div>

                  {/* Dual Progress Bar with High Visual Contrast */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600"></span> Keuangan:</span>
                        <span className="font-mono font-semibold text-indigo-900">{finRate}% (Rp {(proj.realisasi / 1e9).toFixed(1)} M)</span>
                      </div>
                      <div className="w-full bg-indigo-50 rounded-full h-2 overflow-hidden border border-indigo-100">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, finRate)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Fisik Lapangan:</span>
                        <span className="font-mono font-bold text-emerald-700">{proj.progres_fisik}%</span>
                      </div>
                      <div className="w-full bg-emerald-50 rounded-full h-2 overflow-hidden border border-emerald-100">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, proj.progres_fisik)}%` }} />
                      </div>
                    </div>

                    {isHighGap && (
                      <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-bold pt-1 bg-red-50/80 p-1.5 rounded-lg border border-red-200">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                        <span>Kesenjangan Tinggi: Deviasi -{gap.progressDelta}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{proj.laporan_count || 0} aduan warga</span>
                  <button
                    onClick={() => loadProjectDetail(proj.id)}
                    className="text-xs text-[#0FA3B1] hover:underline font-semibold"
                  >
                    Rincian Proyek &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      {activeProjectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#0B7C8A] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-teal-700/30 shrink-0">
              <div className="max-w-[85%]">
                <span className="text-[11px] font-mono text-teal-300 font-semibold">{activeProjectDetail.kode}</span>
                <h2 className="text-sm sm:text-base font-bold font-display text-white mt-0.5 line-clamp-1">
                  {activeProjectDetail.nama}
                </h2>
              </div>
              <button
                onClick={() => setActiveProjectDetail(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Tutup rincian proyek"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-xs text-slate-700">
              {/* Gap Warning Banner if applicable */}
              {activeProjectDetail.gap_indicator?.needsFieldVerification && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-900 text-xs">Indikator Kesenjangan Tinggi Terdeteksi</h4>
                    <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                      {activeProjectDetail.gap_indicator.reasons.join('. ')}. Membutuhkan verifikasi fisik independen dari Inspektorat Daerah.
                    </p>
                  </div>
                </div>
              )}

              {/* Scope & Description */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Deskripsi & Lingkup Pekerjaan</h4>
                <p className="leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-600">
                  {activeProjectDetail.deskripsi}
                </p>
              </div>

              {/* Financial & Technical Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500">Pagu Kontrak</span>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    Rp {(activeProjectDetail.pagu / 1e9).toFixed(2)} M
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500">Realisasi Keuangan</span>
                  <div className="font-mono font-bold text-[#0B2545] text-sm mt-0.5">
                    Rp {(activeProjectDetail.realisasi / 1e9).toFixed(2)} M
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500">Kemajuan Fisik</span>
                  <div className="font-mono font-bold text-teal-700 text-sm mt-0.5">
                    {activeProjectDetail.progres_fisik}%
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500">Status Proyek</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5 capitalize">
                    {activeProjectDetail.status}
                  </div>
                </div>
              </div>

              {/* Administrative Specifications */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">Informasi Teknis & Pelaksana</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Kontraktor Pelaksana:</span>{' '}
                    <strong className="text-slate-800">{activeProjectDetail.kontraktor}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Lokasi:</span>{' '}
                    <strong className="text-slate-800">{activeProjectDetail.lokasi_nama}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Jadwal Pelaksanaan:</span>{' '}
                    <strong className="text-slate-800">{activeProjectDetail.tgl_mulai} s/d {activeProjectDetail.tgl_target}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Sumber Data:</span>{' '}
                    <strong className="text-slate-800">{activeProjectDetail.sumber_data}</strong>
                  </div>
                </div>
              </div>

              {/* Linked Civic Reports */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                    Laporan Aduan Warga Terkait ({activeProjectDetail.reports?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      const prj = activeProjectDetail;
                      setActiveProjectDetail(null);
                      onOpenReportFormWithProject(prj);
                    }}
                    className="text-xs text-white bg-[#0FA3B1] hover:bg-[#0c8a96] px-3 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Laporkan Masalah Proyek Ini</span>
                  </button>
                </div>

                {activeProjectDetail.reports && activeProjectDetail.reports.length > 0 ? (
                  <div className="space-y-2">
                    {activeProjectDetail.reports.map((rep: CivicReport) => (
                      <div
                        key={rep.id}
                        onClick={() => {
                          setActiveProjectDetail(null);
                          onSelectReport(rep.tracking_code);
                        }}
                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="space-y-0.5 max-w-[80%]">
                          <span className="font-mono text-[11px] text-slate-500 font-semibold">{rep.tracking_code}</span>
                          <p className="font-semibold text-slate-800 text-xs truncate">{rep.judul}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          rep.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' :
                          rep.status === 'ditindaklanjuti' ? 'bg-blue-100 text-blue-800' :
                          'bg-teal-100 text-teal-800'
                        }`}>
                          {rep.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">
                    Belum ada aduan warga untuk proyek ini. Jika Anda menemukan ketidaksesuaian di lapangan, laporkan melalui tombol di atas.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Koordinat: {activeProjectDetail.lat}, {activeProjectDetail.lng}</span>
              <button
                onClick={() => setActiveProjectDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </PageMotion>
  );
};
