import React, { useState, useEffect } from 'react';
import { PageMotion } from '../components/PageMotion';
import { PageHero } from '../components/PageHero';
import {
  Download,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Table as TableIcon,
  MapPin,
  AlertCircle,
  Building,
  RefreshCw,
  Eye,
  CheckCircle,
  LayoutDashboard,
} from 'lucide-react';
import { Region } from '../data/regionsData';
import { Sector } from '../data/sectorsData';
import { LeafletMap } from '../components/LeafletMap';
import { Project } from '../data/projectsData';

interface DashboardViewProps {
  regions: Region[];
  sectors: Sector[];
  onSelectProject: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  regions,
  sectors,
  onSelectProject,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [mapMetric, setMapMetric] = useState<'serapan' | 'laporan' | 'skor'>('serapan');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [showDataTable, setShowDataTable] = useState(false);
  const [activeChartTable, setActiveChartTable] = useState<string | null>(null);

  // Sync with URL query on mount and change
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const y = urlParams.get('tahun');
    const r = urlParams.get('daerah');
    const s = urlParams.get('sektor');
    if (y) setSelectedYear(parseInt(y));
    if (r) setSelectedRegion(r);
    if (s) setSelectedSector(s);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedYear, selectedRegion, selectedSector]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        tahun: selectedYear.toString(),
        region_id: selectedRegion,
        sector_id: selectedSector,
      });

      // Update URL query string cleanly without refresh
      const newUrl = `${window.location.pathname}?${q.toString()}`;
      window.history.replaceState({}, '', newUrl);

      const [resBgt, resPrj] = await Promise.all([
        fetch(`/api/v1/budgets?${q.toString()}`),
        fetch(`/api/v1/projects?${q.toString()}`),
      ]);

      const dataBgt = await resBgt.json();
      const dataPrj = await resPrj.json();

      setDashboardData(dataBgt);
      setProjectsList(dataPrj.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!projectsList || projectsList.length === 0) return;
    let csv = 'Kode,Nama Proyek,Daerah,Sektor,Pagu,Realisasi,Progres Fisik (%),Status,Kontraktor\n';
    projectsList.forEach((p) => {
      csv += `"${p.kode}","${p.nama.replace(/"/g, '""')}","${p.region_nama}","${p.sector_nama}",${p.pagu},${p.realisasi},${p.progres_fisik},"${p.status}","${p.kontraktor}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proyek_terang_${selectedYear}_${selectedRegion}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpi = dashboardData?.kpi || {
    total_pagu: 0,
    total_realisasi: 0,
    serapan_persen: 0,
    jumlah_proyek: 0,
    proyek_bermasalah: 0,
    jumlah_laporan: 0,
  };

  const bySector = dashboardData?.by_sector || [];
  const trend = dashboardData?.trend || [];
  const lowestRegions = dashboardData?.lowest_regions || [];

  return (
    <PageMotion page="dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Global Filter Bar */}
      <div className="dashboard-filter-shell">
        <PageHero
          eyebrow="PUSAT DATA ANGGARAN · SUMATERA UTARA"
          title="Dashboard anggaran publik"
          description="Baca alokasi, realisasi, dan kemajuan proyek dalam satu tampilan yang dapat ditelusuri."
          icon={<LayoutDashboard className="w-6 h-6" />}
          actions={<>
            <button onClick={handleExportCSV} className="page-hero-light-button"><Download className="w-4 h-4" /> Ekspor CSV</button>
            <button onClick={() => { setSelectedYear(2024); setSelectedRegion('all'); setSelectedSector('all'); }} className="page-hero-quiet-button" title="Reset filter"><RefreshCw className="w-4 h-4" /> Reset</button>
          </>}
        />

        {/* Global Filter Form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 sm:p-6 bg-white border border-slate-200 border-t-0 rounded-b-2xl text-xs dashboard-filter-grid">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tahun Anggaran</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              {[2025, 2024, 2023, 2022].map((yr) => (
                <option key={yr} value={yr}>
                  Tahun Anggaran {yr} {yr === 2025 ? '(Berjalan)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              <option value="all">Seluruh Sumatera Utara (33 Daerah)</option>
              {regions.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sektor Belanja</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              <option value="all">Semua Sektor Pembangunan</option>
              {sectors.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Pagu</span>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            Rp {(kpi.total_pagu / 1e12).toFixed(2)} T
          </div>
          <span className="text-[11px] text-slate-400">Alokasi Anggaran</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Realisasi</span>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            Rp {(kpi.total_realisasi / 1e12).toFixed(2)} T
          </div>
          <span className="text-[11px] text-slate-400">Realisasi SP2D</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Serapan APBD</span>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-[#0FA3B1] mt-1 tabular-nums">
            {kpi.serapan_persen}%
          </div>
          <span className="text-[11px] text-teal-600 font-medium">
            {kpi.serapan_persen >= 85 ? 'Kinerja Baik' : 'Di Bawah Rata-rata'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Paket Proyek</span>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {kpi.jumlah_proyek}
          </div>
          <span className="text-[11px] text-slate-400">Paket Fisik Terdata</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Kesenjangan Tinggi</span>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-red-600 mt-1 tabular-nums">
            {kpi.proyek_bermasalah}
          </div>
          <span className="text-[11px] text-red-500 font-medium">Perlu Audit Fisik</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Aduan Warga</span>
          <div className="text-base sm:text-lg lg:text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {kpi.jumlah_laporan}
          </div>
          <span className="text-[11px] text-slate-400">Laporan Terhubung</span>
        </div>
      </div>

      {/* Peta Choropleth Leaflet dengan Switcher Metrik */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0FA3B1] shrink-0" />
              <span>Peta Choropleth & Sebaran Proyek Sumatera Utara</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik wilayah pada peta untuk memfilter dasbor ke kabupaten/kota tersebut
            </p>
          </div>

          {/* Metric Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setMapMetric('serapan')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-medium transition-colors text-center whitespace-nowrap ${
                mapMetric === 'serapan' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Serapan (%)
            </button>
            <button
              onClick={() => setMapMetric('laporan')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-medium transition-colors text-center whitespace-nowrap ${
                mapMetric === 'laporan' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jumlah Aduan
            </button>
            <button
              onClick={() => setMapMetric('skor')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-medium transition-colors text-center whitespace-nowrap ${
                mapMetric === 'skor' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Skor Transparansi
            </button>
          </div>
        </div>

        {/* Leaflet map container */}
        <LeafletMap
          selectedMetric={mapMetric}
          selectedRegionId={selectedRegion !== 'all' ? selectedRegion : undefined}
          onSelectRegion={(regId) => setSelectedRegion(regId)}
          projects={projectsList}
          onSelectProject={onSelectProject}
        />
      </div>

      {/* 4 Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Pagu vs Realisasi per Sektor */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0FA3B1]" />
              <h3 className="font-bold text-sm text-slate-900">Alokasi Pagu vs Realisasi per Sektor</h3>
            </div>
            <button
              onClick={() => setActiveChartTable(activeChartTable === 'sektor' ? null : 'sektor')}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{activeChartTable === 'sektor' ? 'Grafik' : 'Lihat Data'}</span>
            </button>
          </div>

          {activeChartTable === 'sektor' ? (
            <div className="overflow-x-auto text-xs max-h-72">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Sektor</th>
                    <th className="py-2 px-3 text-right">Pagu</th>
                    <th className="py-2 px-3 text-right">Realisasi</th>
                    <th className="py-2 px-3 text-right">Serapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bySector.map((s: any) => (
                    <tr key={s.sector_id}>
                      <td className="py-2 px-3 font-medium text-slate-800">{s.sector_nama}</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">Rp {(s.pagu / 1e9).toFixed(1)} M</td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums">Rp {(s.realisasi / 1e9).toFixed(1)} M</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-teal-700">{s.serapan_persen}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {bySector.slice(0, 7).map((s: any) => (
                <div key={s.sector_id} className="space-y-1 text-xs">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-700 gap-0.5">
                    <span className="font-semibold text-slate-800 truncate">{s.sector_nama}</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      <strong className="text-teal-700 font-bold">{s.serapan_persen}%</strong> · Rp {(s.realisasi / 1e9).toFixed(1)}M / {(s.pagu / 1e9).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-[#0FA3B1] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, s.serapan_persen)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
            <span>Sumber: DJPK Kemenkeu RI APBD 2024</span>
            <span className="text-teal-600 font-medium">9 Sektor Aktif</span>
          </div>
        </div>

        {/* Chart 2: Komposisi Anggaran Donut/Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#3B82F6]" />
              <h3 className="font-bold text-sm text-slate-900">Proporsi Anggaran Belanja Publik</h3>
            </div>
            <span className="text-xs text-slate-400">Total Pagu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
            <div className="space-y-2 text-xs">
              {bySector.slice(0, 5).map((s: any, idx: number) => {
                const colors = ['#0FA3B1', '#3B82F6', '#F5A623', '#2E9E6B', '#8B5CF6'];
                const pct = kpi.total_pagu > 0 ? ((s.pagu / kpi.total_pagu) * 100).toFixed(1) : 0;
                return (
                  <div key={s.sector_id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className="text-slate-700 truncate">{s.sector_nama}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100 text-xs space-y-2">
              <span className="text-slate-500 font-medium">Mandatori Pendidikan & Kesehatan</span>
              <div className="text-2xl font-bold font-mono text-slate-900">40.2%</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Memenuhi amanat UUD 1945 (Pendidikan min 20%) dan UU Kesehatan (min 10%).
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
            <span>Satu Data Indonesia</span>
            <span>Klasifikasi BAS</span>
          </div>
        </div>

        {/* Chart 3: Tren Serapan per Tahun 2022-2025 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2E9E6B]" />
              <h3 className="font-bold text-sm text-slate-900">Tren Tingkat Serapan APBD (2022 - 2025)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Multi-Tahun</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3 text-center">
            {trend.map((t: any) => (
              <div key={t.tahun} className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                <span className="text-xs font-semibold text-slate-600">TA {t.tahun}</span>
                <div className="text-lg font-bold font-mono text-[#0B2545]">{t.serapan_persen}%</div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#2E9E6B] h-full rounded-full"
                    style={{ width: `${Math.min(100, t.serapan_persen)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  Rp {(t.realisasi / 1e12).toFixed(1)}T / {(t.pagu / 1e12).toFixed(1)}T
                </span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
            <span>Performa multi-tahun</span>
            <span>Tahun 2025 data semester 1</span>
          </div>
        </div>

        {/* Chart 4: Top 10 Daerah Serapan Terendah */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#F5A623]" />
              <h3 className="font-bold text-sm text-slate-900">10 Daerah dengan Serapan Terendah (TA {selectedYear})</h3>
            </div>
            <span className="text-xs text-amber-600 font-medium">Prioritas Dorongan</span>
          </div>

          <div className="space-y-2 text-xs max-h-60 overflow-y-auto pr-1">
            {lowestRegions.map((r: any, idx: number) => (
              <div
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 font-bold font-mono text-slate-400">{idx + 1}</span>
                  <span className="font-medium text-slate-800">{r.nama}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-red-600">{r.serapan_persen}%</span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">(Rp {(r.realisasi / 1e12).toFixed(1)} T)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
            <span>Klik daerah untuk memfilter</span>
            <span className="text-red-500 font-medium">&lt; 78% di bawah rata-rata</span>
          </div>
        </div>
      </div>

      {/* Tabel Rincian Proyek Publik Terfilter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900">
              Daftar Paket Proyek Terfilter ({projectsList.length} Paket)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih proyek untuk melihat rincian kemajuan fisik, riwayat pembayaran, atau melaporkan ketidaksesuaian
            </p>
          </div>

          <button
            onClick={() => setShowDataTable(!showDataTable)}
            className="text-xs text-[#0FA3B1] hover:underline font-semibold"
          >
            {showDataTable ? 'Sembunyikan Tabel' : 'Tampilkan Tabel Penuh'}
          </button>
        </div>

        {showDataTable && (
          <div className="overflow-x-auto text-xs border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Kode & Nama Proyek</th>
                  <th className="py-2.5 px-3">Daerah & Sektor</th>
                  <th className="py-2.5 px-3 text-right">Pagu</th>
                  <th className="py-2.5 px-3 text-right">Keuangan (%)</th>
                  <th className="py-2.5 px-3 text-right">Fisik (%)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectsList.slice(0, 20).map((p) => {
                  const finPct = Math.round((p.realisasi / p.pagu) * 100);
                  const isHighGap = (finPct - p.progres_fisik) >= 25;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-semibold text-slate-900 hover:text-[#0FA3B1] cursor-pointer" onClick={() => onSelectProject(p.id)}>
                          {p.nama}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">{p.kode}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>{p.region_nama}</div>
                        <div className="text-[11px] text-slate-400">{p.sector_nama}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                        Rp {(p.pagu / 1e9).toFixed(1)} M
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-900">{finPct}%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {p.progres_fisik}%
                        {isHighGap && (
                          <span className="block text-[10px] text-red-600 font-sans font-bold">Gap Tinggi</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          p.status === 'selesai' ? 'bg-emerald-50 text-emerald-700' :
                          p.status === 'mangkrak' ? 'bg-red-50 text-red-700' :
                          p.status === 'berjalan' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onSelectProject(p.id)}
                          className="px-2.5 py-1 rounded bg-[#0B7C8A] text-white hover:bg-[#096A76] text-[11px] transition-colors"
                        >
                          Lihat Rincian
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageMotion>
  );
};
