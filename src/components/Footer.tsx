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
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800/80 transition-colors">
      {/* Upper Worker Status Bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/50 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">Sistem Pengawasan Otonom Aktif</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Sinkronisasi Realtime 33 Kab/Kota Sumut</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
            <span className="flex items-center gap-1 text-teal-400"><Cpu className="w-3 h-3" /> Background Workers: Operational</span>
            <span>·</span>
            <span>Respon Otonom 24/7</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0FA3B1] to-[#0B7C8A] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-teal-900/20 font-mono">
                T
              </div>
              <div>
                <span className="text-lg font-bold text-white font-display tracking-tight block leading-none">TERANG</span>
                <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">Transparansi &amp; Akuntabilitas Publik</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Platform civic-tech terpadu yang memantau alokasi &amp; realisasi APBD 33 Kabupaten/Kota se-Sumatera Utara, mendeteksi deviasi proyek berbasis data cuaca &amp; bencana nyata, serta mengolah partisipasi warga secara akuntabel.
            </p>

            <div className="pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Privasi Pelapor Terjamin &amp; Dilindungi</span>
              </div>
            </div>
          </div>

          {/* Navigasi Platform */}
          <div>
            <h4 className="text-slate-100 font-bold text-[11px] uppercase tracking-wider mb-3.5 font-display flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0FA3B1]" /> Navigasi Utama
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
                    className="hover:text-[#0FA3B1] text-slate-400 transition-colors flex items-center gap-1.5 group cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-[#0FA3B1] transition-colors" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Metodologi & AI */}
          <div>
            <h4 className="text-slate-100 font-bold text-[11px] uppercase tracking-wider mb-3.5 font-display flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0FA3B1]" /> Metodologi &amp; AI
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
                    className="hover:text-[#0FA3B1] text-slate-400 transition-colors flex items-center gap-1.5 group cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-[#0FA3B1] transition-colors" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Layanan & Dukungan Publik */}
          <div>
            <h4 className="text-slate-100 font-bold text-[11px] uppercase tracking-wider mb-3.5 font-display flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0FA3B1]" /> Layanan &amp; Dukungan
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Headphones className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <button onClick={() => onNavigate('lapor')} className="hover:text-[#0FA3B1] transition-colors text-left cursor-pointer">
                  Layanan Pengaduan Warga 24/7
                </button>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <button onClick={() => onNavigate('lacak')} className="hover:text-[#0FA3B1] transition-colors text-left cursor-pointer">
                  Cek Status Tindak Lanjut Aduan
                </button>
              </li>
              <li className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Inspektorat Provinsi Sumatera Utara</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>kontak@terang.sumutprov.go.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>&copy; 2026 <strong>TERANG Nusantara</strong> · Provinsi Sumatera Utara, Indonesia</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400"><Lock className="w-3 h-3 text-emerald-400" /> HTTPS Safe &amp; Encrypted</span>
            <span className="text-slate-700">•</span>
            <span className="font-mono text-[#0FA3B1] font-semibold">v1.3.0 Live Production</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
