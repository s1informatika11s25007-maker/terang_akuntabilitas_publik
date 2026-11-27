import React from 'react';
import {
  ShieldCheck,
  ChevronRight,
  Globe,
  Cpu,
  Lock,
  Headphones,
  Building,
  Mail,
  FileText,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-200 text-xs border-t border-slate-800 transition-colors w-full">
      {/* Upper Worker Status Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/90 py-3">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200 font-medium">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white">Sistem Pengawasan Otonom Aktif</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 font-medium">Sinkronisasi Realtime 33 Kab/Kota Sumut</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-teal-300 font-semibold"><Cpu className="w-3.5 h-3.5 text-teal-400" /> Background Workers: Operational</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">Respon Otonom 24/7</span>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0FA3B1] to-[#0B7C8A] flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-teal-900/30 font-mono">
                T
              </div>
              <div>
                <span className="text-lg font-extrabold text-white font-display tracking-tight block leading-none">TERANG</span>
                <span className="text-[10px] text-teal-300 tracking-wider font-bold uppercase">Transparansi, Evaluasi, Respons &amp; Akuntabilitas</span>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed font-normal">
              Platform civic-tech terpadu yang memantau alokasi &amp; realisasi APBD 33 Kabupaten/Kota se-Sumatera Utara, mendeteksi deviasi proyek berbasis data cuaca &amp; bencana nyata, serta mengolah partisipasi warga secara akuntabel.
            </p>

            <div className="pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-teal-300 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Privasi Pelapor Terjamin &amp; Dilindungi</span>
              </div>
            </div>
          </div>

          {/* Navigasi Platform */}
          <div>
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4 font-display flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0FA3B1]" /> Navigasi Utama
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { label: 'Beranda Utama', view: 'landing' },
                { label: 'Dashboard APBD Sumut', view: 'dashboard' },
                { label: 'Katalog Proyek & Gap Fisik', view: 'proyek' },
                { label: 'SuperAgent Otonom', view: 'agent-automation' },
                { label: 'Form Pengaduan Warga', view: 'lapor' },
                { label: 'Pelacakan Kode Laporan', view: 'lacak' },
              ].map((item) => (
                <li key={item.view + item.label}>
                  <button
                    onClick={() => onNavigate(item.view)}
                    className="hover:text-teal-300 text-slate-200 transition-colors flex items-center gap-2 group cursor-pointer font-medium"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Metodologi & AI */}
          <div>
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4 font-display flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0FA3B1]" /> Metodologi &amp; AI
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { label: 'Dataset Terbuka & API', view: 'data' },
                { label: 'Rumus Indikator Kesenjangan', view: 'data' },
                { label: 'Kalkulasi Skor Transparansi', view: 'insight' },
                { label: 'Model Triase AI Otonom', view: 'data' },
                { label: 'Kebijakan Privasi & Etika', view: 'tentang' },
              ].map((item, idx) => (
                <li key={idx + item.label}>
                  <button
                    onClick={() => onNavigate(item.view)}
                    className="hover:text-teal-300 text-slate-200 transition-colors flex items-center gap-2 group cursor-pointer font-medium"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Layanan & Dukungan Publik */}
          <div>
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider mb-4 font-display flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0FA3B1]" /> Layanan &amp; Dukungan
            </h4>
            <ul className="space-y-3 text-xs text-slate-200">
              <li className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-teal-300 shrink-0" />
                <button onClick={() => onNavigate('lapor')} className="hover:text-teal-300 transition-colors text-left cursor-pointer font-medium">
                  Layanan Pengaduan Warga 24/7
                </button>
              </li>
              <li className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-teal-300 shrink-0" />
                <button onClick={() => onNavigate('lacak')} className="hover:text-teal-300 transition-colors text-left cursor-pointer font-medium">
                  Cek Status Tindak Lanjut Aduan
                </button>
              </li>
              <li className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-teal-300 shrink-0" />
                <span className="font-medium text-slate-200">Inspektorat Provinsi Sumatera Utara</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-300 shrink-0" />
                <span className="font-mono text-teal-200">kontak@terang.sumutprov.go.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-300 text-xs">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-400 shrink-0" />
            <span>&copy; 2026 <strong className="text-white">TERANG Nusantara</strong> · Provinsi Sumatera Utara, Indonesia</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-200 font-medium"><Lock className="w-3.5 h-3.5 text-emerald-400" /> HTTPS Safe &amp; Encrypted</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-teal-300 font-bold">v1.3.0 Live Production</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
