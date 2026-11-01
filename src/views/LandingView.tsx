import React from "react";
import { PageMotion } from '../components/PageMotion';
import {
  ArrowRight,
  FileCheck2,
  TrendingUp,
  Building2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface LandingViewProps {
  onNavigate: (view: string) => void;
  kpis: {
    totalPagu: number;
    avgSerapan: number;
    totalProjects: number;
    totalReports: number;
    completedReports: number;
    avgResponseDays: number;
  };
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  kpis,
}) => {
  const runAgent = () => {
    try { sessionStorage.setItem('terang_autorun', '1'); } catch { /* penyimpanan dinonaktifkan */ }
    onNavigate('agent-automation');
  };

  return (
    <PageMotion page="landing" className="space-y-12 pb-16">
      {/* Hero — Clean Professional Enterprise Layout */}
      <section className="landing-hero relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-12 shadow-sm">
        <div className="max-w-7xl mx-auto landing-hero-inner">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow text-[#0FA3B1]"><span className="landing-live-dot" /> PLATFORM AKUNTABILITAS · SUMATERA UTARA</div>
            <h1 className="text-3xl sm:text-5xl font-bold font-display text-white mt-2 leading-tight">Anggaran publik.<br /><span className="text-[#0FA3B1]">Diawasi satu klik.</span></h1>
            <p className="landing-lead text-slate-300 text-sm sm:text-base mt-4 leading-relaxed max-w-xl">
              Platform terpadu yang memantau APBD 33 kabupaten/kota, mendeteksi proyek yang tertinggal dengan konteks cuaca dan gempa nyata, serta memproses laporan warga secara otomatis dengan pengawasan manusia untuk kasus yang meragukan.
            </p>
            <div className="landing-hero-actions mt-6 flex flex-wrap items-center gap-3">
              <button onClick={runAgent} className="px-6 py-3.5 bg-[#0B7C8A] hover:bg-[#096A76] text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer">
                Jalankan Agen Otonom <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => onNavigate('dashboard')} className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors cursor-pointer">
                Jelajahi Data <FileCheck2 className="w-4 h-4" />
              </button>
            </div>
            <div className="landing-trust-row mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-teal-400" /> Data Resmi Terbuka</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Privasi Pelapor Terjamin</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Data Cuaca &amp; Gempa Langsung</span>
            </div>
          </div>

          <div className="landing-hero-visual mt-8 lg:mt-0">
            <div className="landing-visual-frame relative rounded-2xl overflow-hidden border border-slate-800">
              <img src="/terang_hero_banner_1792932754839.jpg" alt="Kawasan pemerintahan Sumatera Utara" className="w-full h-auto object-cover max-h-96" referrerPolicy="no-referrer" />
              <div className="landing-visual-shade absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              <div className="landing-visual-caption absolute bottom-4 left-4 text-[11px] font-bold text-slate-300 tracking-wider font-mono">PANTAU · PAHAMI · OTONOM</div>
              <div className="landing-float-card landing-float-top absolute top-4 right-4 bg-slate-900/90 border border-slate-700 backdrop-blur-md p-3 rounded-xl text-white text-xs flex items-center gap-2 shadow-lg">
                <span className="p-2 rounded-lg bg-teal-500/20 text-teal-300"><TrendingUp className="w-4 h-4" /></span>
                <span><small className="block text-[10px] text-slate-400">Rata-rata serapan APBD</small><strong className="text-sm font-bold font-mono">{kpis.avgSerapan}%</strong></span>
              </div>
              <div className="landing-float-card landing-float-bottom absolute bottom-4 right-4 bg-slate-900/90 border border-slate-700 backdrop-blur-md p-3 rounded-xl text-white text-xs flex items-center gap-2 shadow-lg">
                <span className="p-2 rounded-lg bg-teal-500/20 text-teal-300"><FileCheck2 className="w-4 h-4" /></span>
                <span><small className="block text-[10px] text-slate-400">Proyek terpantau</small><strong className="text-sm font-bold font-mono">{kpis.totalProjects}+ paket publik</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Counter Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="landing-metrics-panel bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-lg font-bold font-display text-slate-900">
              Statistik Kinerja Pengawasan Terpadu
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Data terkonsolidasi dari 33 kabupaten/kota se-Sumatera Utara
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1 p-3">
              <span className="text-xs text-slate-500 font-medium">Total Pagu APBD</span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                Rp {(kpis.totalPagu / 1e12).toFixed(1)} T
              </div>
              <span className="text-[11px] text-teal-600 font-medium">TA 2024</span>
            </div>

            <div className="space-y-1 p-3">
              <span className="text-xs text-slate-500 font-medium">Rata-rata Serapan</span>
              <div className="text-2xl font-bold font-mono text-[#0FA3B1]">
                {kpis.avgSerapan}%
              </div>
              <span className="text-[11px] text-slate-400">Target: 85%</span>
            </div>

            <div className="space-y-1 p-3">
              <span className="text-xs text-slate-500 font-medium">Paket Proyek</span>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {kpis.totalProjects}+
              </div>
              <span className="text-[11px] text-slate-400">9 Sektor Belanja</span>
            </div>

            <div className="space-y-1 p-3">
              <span className="text-xs text-slate-500 font-medium">Laporan Ditindaklanjuti</span>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                {kpis.completedReports} / {kpis.totalReports}
              </div>
              <span className="text-[11px] text-slate-400">Otomasi 100%</span>
            </div>
          </div>
        </div>
      </section>
    </PageMotion>
  );
};
