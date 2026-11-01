import React, { useState, useEffect } from 'react';
import { PageMotion } from '../components/PageMotion';
import { PageHero } from '../components/PageHero';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Download,
  Building2,
  ArrowRight,
  ShieldAlert,
  Layers,
  Award,
} from 'lucide-react';
import { Region } from '../data/regionsData';

interface InsightViewProps {
  regions: Region[];
  onSelectProject: (id: string) => void;
}

export const InsightView: React.FC<InsightViewProps> = ({
  regions,
  onSelectProject,
}) => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [loading, setLoading] = useState(true);
  const [insightData, setInsightData] = useState<any>(null);

  // AI Narrative State
  const [aiNarrative, setAiNarrative] = useState<{ narasi: string; rekomendasi: string[] } | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Region comparison states
  const [compareRegionA, setCompareRegionA] = useState('reg-medan');
  const [compareRegionB, setCompareRegionB] = useState('reg-deliserdang');
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  useEffect(() => {
    fetchInsights();
  }, [selectedRegion]);

  useEffect(() => {
    fetchComparison();
  }, [compareRegionA, compareRegionB]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/insights?region_id=${selectedRegion}&tahun=2024`);
      const data = await res.json();
      setInsightData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async () => {
    try {
      const res = await fetch(`/api/v1/compare?region_a=${compareRegionA}&region_b=${compareRegionB}&tahun=2024`);
      const data = await res.json();
      setComparisonResult(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAiNarrative = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region_id: selectedRegion, tahun: 2024 }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAiNarrative(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDownloadSummary = () => {
    const list = insightData?.prioritized_projects || [];
    let csv = 'Kode,Nama Proyek,Daerah,Sektor,Pagu,Realisasi,Kemajuan Fisik (%),Skor Risiko,Tingkat Risiko\n';
    list.forEach((p: any) => {
      csv += `"${p.kode}","${p.nama.replace(/"/g, '""')}","${p.region_nama}","${p.sector_nama}",${p.pagu},${p.realisasi},${p.progres_fisik},${p.gap_indicator.riskScore},"${p.gap_indicator.level}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ringkasan_audit_prioritas_terang.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageMotion page="insight" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHero
        eyebrow="ANALISIS & PRIORITAS PENGAWASAN"
        title="Insight berbasis data"
        description="Kenali pola realisasi, bandingkan kinerja wilayah, dan arahkan perhatian pada proyek yang perlu ditinjau."
        icon={<TrendingUp className="w-6 h-6" />}
        actions={<>
          <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="page-hero-select">
            <option value="all">Seluruh Sumatera Utara</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
          </select>
          <button onClick={handleDownloadSummary} className="page-hero-light-button"><Download className="w-4 h-4" /> Unduh CSV</button>
        </>}
      />

      {/* AI Narrative Section */}
      <div className="bg-gradient-to-br from-[#0E8FA0] to-[#2F6FDB] text-white rounded-2xl p-6 lg:p-8 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0FA3B1] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm font-display text-white">Ringkasan Analitik AI TERANG</h3>
                <span className="text-[10px] font-medium bg-[#0FA3B1]/20 text-teal-50 px-2 py-0.5 rounded border border-teal-400/30">
                  Dibantu AI
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Disintesis otomatis dari angka agregat APBD dan riwayat aduan masyarakat
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAiNarrative}
            disabled={isGeneratingAi}
            className="px-4 py-2 bg-[#0FA3B1] hover:bg-[#0c8a96] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isGeneratingAi ? 'Menganalisis Data...' : 'Buat Ringkasan AI'}</span>
          </button>
        </div>

        {aiNarrative ? (
          <div className="space-y-4 pt-2 border-t border-slate-700/60 animate-in fade-in duration-200">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {aiNarrative.narasi}
            </p>

            <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
              <h4 className="font-semibold text-teal-50 text-xs uppercase tracking-wider">
                Rekomendasi Tindakan untuk Pengambil Kebijakan
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {aiNarrative.rekomendasi.map((rek, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-100 font-bold">•</span>
                    <span>{rek}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-[10px] text-slate-400 italic">
              * Ringkasan dibuat oleh model AI TERANG berbasis agregat data resmi; periksa dataset asli untuk keperluan audit hukum.
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <span>Klik tombol "Buat Ringkasan AI" di atas untuk menghasilkan narasi temuan dan 2 rekomendasi tindakan strategis untuk wilayah terpilih.</span>
          </div>
        )}
      </div>

      {/* Rule-Based Strategic Findings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {insightData?.rule_insights?.map((item: any, idx: number) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              {item.tipe === 'danger' && <ShieldAlert className="w-4 h-4 text-red-500" />}
              {item.tipe === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {item.tipe === 'info' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.kategori}</span>
            </div>
            <p className="text-xs font-medium text-slate-800 leading-relaxed">
              {item.ringkasan}
            </p>
          </div>
        ))}
      </div>

      {/* Tabel Proyek Prioritas Tinjauan Lapangan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Daftar Proyek Prioritas Tinjauan Lapangan (Urutan Skor Risiko)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Diurutkan berdasarkan skor risiko komposit: selisih keuangan vs fisik, aduan terverifikasi, dan status proyek
            </p>
          </div>
        </div>

        <div className="overflow-x-auto text-xs border border-slate-200 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Kode & Proyek</th>
                <th className="py-2.5 px-3">Daerah & Sektor</th>
                <th className="py-2.5 px-3 text-right">Pencairan Keuangan</th>
                <th className="py-2.5 px-3 text-right">Fisik Lapangan</th>
                <th className="py-2.5 px-3 text-right">Selisih Deviasi</th>
                <th className="py-2.5 px-3 text-center">Skor Risiko</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insightData?.prioritized_projects?.map((p: any) => {
                const finPct = Math.round((p.realisasi / p.pagu) * 100);
                const gap = p.gap_indicator;
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
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {finPct}% (Rp {(p.realisasi / 1e9).toFixed(1)} M)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700">
                      {p.progres_fisik}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">
                      -{gap.progressDelta}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                        gap.riskScore >= 60 ? 'bg-red-100 text-red-800' :
                        gap.riskScore >= 35 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {gap.riskScore} / 100
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectProject(p.id)}
                        className="px-2.5 py-1 rounded bg-[#0B7C8A] text-white hover:bg-[#096A76] text-[11px] transition-colors"
                      >
                        Detail Audit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Perbandingan 2 Daerah Berdampingan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold font-display text-slate-900">Perbandingan Kinerja Dua Daerah Berdampingan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bandingkan rasio anggaran belanja, serapan, dan tingkat penuntasan aduan publik
          </p>
        </div>

        {/* Region Selector A vs B */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Daerah A</label>
            <select
              value={compareRegionA}
              onChange={(e) => setCompareRegionA(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Daerah B</label>
            <select
              value={compareRegionB}
              onChange={(e) => setCompareRegionB(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-Side Comparison Cards */}
        {comparisonResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Card A */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-sm text-slate-900">{comparisonResult.daerah_a.nama}</h3>
                <span className="font-mono text-slate-500">Populasi: {comparisonResult.daerah_a.populasi.toLocaleString('id-ID')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Pagu APBD:</span>
                  <span className="font-mono font-bold text-slate-800">{comparisonResult.daerah_a.pagu_apbd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Realisasi Serapan:</span>
                  <span className="font-mono font-bold text-teal-700">{comparisonResult.daerah_a.serapan_persen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Aduan Warga:</span>
                  <span className="font-mono font-bold text-slate-800">{comparisonResult.daerah_a.total_laporan} Laporan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aduan Selesai Ditindaklanjuti:</span>
                  <span className="font-mono font-bold text-emerald-700">{comparisonResult.daerah_a.laporan_selesai} Kasus</span>
                </div>
              </div>
            </div>

            {/* Card B */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-sm text-slate-900">{comparisonResult.daerah_b.nama}</h3>
                <span className="font-mono text-slate-500">Populasi: {comparisonResult.daerah_b.populasi.toLocaleString('id-ID')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Pagu APBD:</span>
                  <span className="font-mono font-bold text-slate-800">{comparisonResult.daerah_b.pagu_apbd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Realisasi Serapan:</span>
                  <span className="font-mono font-bold text-teal-700">{comparisonResult.daerah_b.serapan_persen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Aduan Warga:</span>
                  <span className="font-mono font-bold text-slate-800">{comparisonResult.daerah_b.total_laporan} Laporan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Aduan Selesai Ditindaklanjuti:</span>
                  <span className="font-mono font-bold text-emerald-700">{comparisonResult.daerah_b.laporan_selesai} Kasus</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageMotion>
  );
};
