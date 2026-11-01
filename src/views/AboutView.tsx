import React, { useState } from 'react';
import { PageMotion } from '../components/PageMotion';
import { PageHero } from '../components/PageHero';
import {
  ShieldCheck,
  HelpCircle,
  FileText,
  Lock,
  ChevronDown,
  Award,
  Users,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Dari mana sumber data anggaran APBD dan proyek di TERANG?',
      a: 'Data anggaran bersumber langsung dari portal resmi Satu Data Kemenkeu DJPK dan BPS Sumatera Utara. Data paket proyek diperoleh dari keterbukaan data LPSE & SiRUP LKPP Pemerintah Provinsi Sumatera Utara dan 33 kabupaten/kota.',
    },
    {
      q: 'Apakah identitas saya aman saat mengirimkan laporan aduan?',
      a: 'Sangat aman. Platform TERANG menerapkan prinsip zero-leakage untuk privasi warga: nomor telepon dan kontak Anda dienkripsi serta tidak pernah ditampilkan ke publik. Anda juga dapat memilih opsi lapor secara anonim.',
    },
    {
      q: 'Bagaimana cara kerja Indikator Kesenjangan (Gap Indicator)?',
      a: 'Sistem secara otomatis membandingkan persentase pencairan termin keuangan dengan persentase kemajuan fisik di lapangan. Jika selisih deviasi mencapai 25% atau lebih, atau proyek diklaim selesai tetapi menerima banyak aduan kerusakan, sistem menandai proyek tersebut "Perlu Verifikasi Lapangan".',
    },
    {
      q: 'Apa yang terjadi setelah laporan warga dikirim?',
      a: 'Laporan Anda menerima kode pelacakan TRG-2026-XXXXXX dan masuk ke meja verifikator Inspektorat Daerah. Jika terverifikasi valid, status berubah menjadi Diverifikasi, kemudian diteruskan ke dinas teknis (misal: Dinas PUPR atau Kesehatan) untuk ditindaklanjuti dan dibuktikan dengan foto hasil pekerjaan.',
    },
    {
      q: 'Bagaimana peran AI (Kecerdasan Buatan) di platform TERANG?',
      a: 'AI digunakan sebagai asisten penunjang: (1) Asisten percakapan "Tanya TERANG" dengan grounded tools, (2) Membantu pelapor merapikan kalimat deskripsi, (3) Membantu menyarankan estimasi tingkat urgensi awal. Keputusan verifikasi akhir sepenuhnya berada di tangan inspektur manusia (Human-in-the-Loop).',
    },
  ];

  return (
    <PageMotion page="about" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <PageHero
        eyebrow="TENTANG TERANG · KETERBUKAAN PUBLIK"
        title="Teknologi untuk akuntabilitas bersama"
        description="TERANG menjembatani data anggaran yang terbuka dengan partisipasi warga agar pembangunan lebih mudah dipantau, dipahami, dan dipertanggungjawabkan."
        icon={<Award className="w-6 h-6" />}
      />

      {/* Visi & Subtema */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 text-xs text-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm font-display">Latar Belakang & Urgensi</h3>
            <p className="leading-relaxed text-slate-600">
              Setiap tahun triliunan rupiah APBD dialokasikan untuk pembangunan jalan, jembatan, gedung sekolah, dan layanan kesehatan di Sumatera Utara. Namun, kesenjangan antara dokumen laporan serapan keuangan yang tampak 100% selesai dengan kondisi fisik riil di lapangan kerap luput dari pengawasan.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm font-display">Solusi Konvergensi</h3>
            <p className="leading-relaxed text-slate-600">
              TERANG menggabungkan dua pilar utama: <strong>Open Government Data</strong> (dashboard choropleth & grafik anggaran) dengan <strong>Civic Reporting & Accountability</strong> (pelaporan aduan warga yang terhubung langsung ke ID proyek bersangkutan) dengan tata kelola terverifikasi.
            </p>
          </div>
        </div>
      </div>

      {/* Etika & Batasan AI di TERANG */}
      <div className="bg-gradient-to-br from-[#0E8FA0] to-[#2F6FDB] text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0FA3B1] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-white">Etika & Batasan AI di Platform TERANG</h2>
            <p className="text-xs text-slate-300">Prinsip kecerdasan buatan yang bertanggung jawab, aman, dan berpusat pada manusia</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
            <h4 className="font-semibold text-teal-50 text-xs">1. Perlindungan Data Pribadi Total</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Data pribadi pelapor (nama asli, nomor telepon, kontak) <strong>TIDAK PERNAH dikirimkan ke model AI atau LLM</strong>. Payload AI hanya memproses teks kronologi fisik yang telah disanitasi.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
            <h4 className="font-semibold text-teal-50 text-xs">2. Human-in-the-Loop</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              AI tidak memiliki wewenang menolak atau memverifikasi aduan. Seluruh keputusan moderasi laporan <strong>100% diputuskan oleh petugas inspektorat manusia</strong>. AI hanya memberikan saran pendukung.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
            <h4 className="font-semibold text-teal-50 text-xs">3. Anti-Halusinasi (Grounded Tools)</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Fitur "Tanya TERANG" tidak diizinkan mengarang angka. Model wajib mengeksekusi function-calling tools langsung ke database SQL/JSON untuk menghasilkan fakta yang terverifikasi.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
            <h4 className="font-semibold text-teal-50 text-xs">4. Transparansi & Label AI</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Setiap keluaran analitik atau penyempurnaan kalimat yang dihasilkan oleh kecerdasan buatan diberi label jelas "Dibantu AI" dengan opsi umpan balik masyarakat.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Interaktif */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#0FA3B1]" />
          <h2 className="text-base font-bold font-display text-slate-900">Pertanyaan Umum (FAQ)</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {faqs.map((f, idx) => (
            <div key={idx} className="py-3">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-[#0FA3B1] transition-colors gap-4"
              >
                <span>{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <p className="mt-2 text-slate-600 leading-relaxed text-xs animate-in fade-in duration-150">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageMotion>
  );
};
