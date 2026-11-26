import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FileCheck2,
  TrendingUp,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Map,
  FileText,
  Users,
  Activity,
  ChevronDown,
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

const SLIDE_LABELS = [
  "Sambutan & Hero",
  "Mengapa TERANG",
  "Fitur Pengawasan",
  "Arsitektur & Sistem",
  "Statistik Kinerja",
  "Mulai & Akses App",
];

/*
 * Distinct multi-slide animations with 3D perspective transforms & clipPath reveals.
 */
const SLIDE_MOTIONS = [
  // Slide 0: Polygon ClipPath Reveal
  {
    initial: { opacity: 0, clipPath: "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)", scale: 1.04 },
    animate: { opacity: 1, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", scale: 1 },
    exit: { opacity: 0, clipPath: "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)", scale: 0.97 },
    transition: { duration: 0.82, ease: [0.76, 0, 0.24, 1] as const },
    style: { transformPerspective: 1600, transformOrigin: "center center" },
  },
  // Slide 1: 3D Y-Axis Flip Card Rotation
  {
    initial: (direction: number) => ({
      opacity: 0,
      rotateY: direction > 0 ? 34 : -34,
      x: direction > 0 ? 100 : -100,
      scale: 0.94,
    }),
    animate: { opacity: 1, rotateY: 0, x: 0, scale: 1 },
    exit: (direction: number) => ({
      opacity: 0,
      rotateY: direction > 0 ? -30 : 30,
      x: direction > 0 ? -80 : 80,
      scale: 0.96,
    }),
    transition: { duration: 0.74, ease: [0.2, 0.8, 0.2, 1] as const },
    style: { transformPerspective: 1500, transformOrigin: "center center" },
  },
  // Slide 2: Radial Circle ClipPath Expansion
  {
    initial: { opacity: 0, clipPath: "circle(0% at 50% 48%)", scale: 0.96 },
    animate: { opacity: 1, clipPath: "circle(145% at 50% 48%)", scale: 1 },
    exit: { opacity: 0, clipPath: "circle(0% at 50% 48%)", scale: 1.03 },
    transition: { duration: 0.88, ease: [0.16, 1, 0.3, 1] as const },
    style: { transformPerspective: 1400, transformOrigin: "center center" },
  },
  // Slide 3: 3D ScaleX Door Opening Effect
  {
    initial: { opacity: 0, scaleX: 0.08, rotateY: 24, x: -40 },
    animate: { opacity: 1, scaleX: 1, rotateY: 0, x: 0 },
    exit: { opacity: 0, scaleX: 0.08, rotateY: -24, x: 40 },
    transition: { duration: 0.78, ease: [0.65, 0, 0.35, 1] as const },
    style: { transformPerspective: 1700, transformOrigin: "left center" },
  },
  // Slide 4: 3D Z-tilt Blur Rise
  {
    initial: { opacity: 0, y: 110, rotateZ: 6, scale: 0.86, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, rotateZ: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: -90, rotateZ: -5, scale: 0.91, filter: "blur(8px)" },
    transition: { duration: 0.76, ease: [0.22, 1, 0.36, 1] as const },
    style: { transformPerspective: 1400, transformOrigin: "center center" },
  },
  // Slide 5: Inset Rounded Rect Reveal
  {
    initial: { opacity: 0, clipPath: "inset(48% 0% 48% 0% round 28px)", scale: 1.04 },
    animate: { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 0px)", scale: 1 },
    exit: { opacity: 0, clipPath: "inset(48% 0% 48% 0% round 28px)", scale: 0.98 },
    transition: { duration: 0.8, ease: [0.7, 0, 0.2, 1] as const },
    style: { transformPerspective: 1400, transformOrigin: "center center" },
  },
];

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  kpis,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const slideContentRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wheelLockRef = useRef(false);

  const totalSlides = SLIDE_LABELS.length;

  const goToSlide = useCallback(
    (nextIndex: number) => {
      const safeIndex = Math.max(0, Math.min(totalSlides - 1, nextIndex));
      setSlideDirection(safeIndex >= activeSlide ? 1 : -1);
      setActiveSlide(safeIndex);
    },
    [activeSlide, totalSlides]
  );

  const runAgent = () => {
    try {
      sessionStorage.setItem("terang_autorun", "1");
    } catch {
      /* penyimpanan dinonaktifkan */
    }
    onNavigate("agent-automation");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (isTyping) return;

      if (event.key === "PageDown" || event.key === "ArrowDown" || (event.altKey && event.key === "ArrowRight")) {
        event.preventDefault();
        goToSlide(activeSlide + 1);
      } else if (event.key === "PageUp" || event.key === "ArrowUp" || (event.altKey && event.key === "ArrowLeft")) {
        event.preventDefault();
        goToSlide(activeSlide - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide, goToSlide]);

  // Wheel scroll navigation
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (Math.abs(event.deltaY) < 35) return;
      if (wheelLockRef.current) return;

      const movingDown = event.deltaY > 0;
      wheelLockRef.current = true;
      goToSlide(activeSlide + (movingDown ? 1 : -1));

      setTimeout(() => {
        wheelLockRef.current = false;
      }, 750);
    },
    [activeSlide, goToSlide]
  );

  // Touch swipe navigation
  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches?.[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaY) > 50) {
      goToSlide(activeSlide + (deltaY < 0 ? 1 : -1));
    }
  };

  const currentMotion = SLIDE_MOTIONS[activeSlide] || SLIDE_MOTIONS[0];
  const initialMotion = prefersReducedMotion
    ? { opacity: 0 }
    : typeof currentMotion.initial === "function"
    ? currentMotion.initial(slideDirection)
    : currentMotion.initial;
  const exitMotion = prefersReducedMotion
    ? { opacity: 0 }
    : typeof currentMotion.exit === "function"
    ? currentMotion.exit(slideDirection)
    : currentMotion.exit;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Background Ambient Glow Effects */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#0FA3B1]/20 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-slate-800/40 blur-3xl" />
      </div>

      {/* Slide Presentation Container */}
      <div
        className="relative w-full h-full pt-4"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            ref={slideContentRef}
            key={activeSlide}
            custom={slideDirection}
            initial={initialMotion}
            animate={prefersReducedMotion ? { opacity: 1 } : currentMotion.animate}
            exit={exitMotion}
            transition={prefersReducedMotion ? { duration: 0.01 } : currentMotion.transition}
            style={prefersReducedMotion ? {} : currentMotion.style}
            className="w-full h-full flex flex-col justify-center items-center px-4 sm:px-8 lg:px-16"
          >
            {/* ============================================================ */}
            {/* SLIDE 0: HERO & WELCOME */}
            {/* ============================================================ */}
            {activeSlide === 0 && (
              <div className="max-w-6xl w-full grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    PLATFORM AKUNTABILITAS · SUMATERA UTARA
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-extrabold font-display leading-tight text-white">
                    Anggaran publik.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0FA3B1] via-teal-300 to-amber-300">
                      Diawasi satu klik.
                    </span>
                  </h1>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                    Platform terpadu memantau APBD 33 kabupaten/kota, mendeteksi proyek tertinggal dengan konteks cuaca dan gempa nyata, serta memproses laporan warga secara otomatis dengan moderasi RBAC.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={runAgent}
                      className="px-6 py-3.5 bg-[#0B7C8A] hover:bg-[#096A76] text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-teal-900/40 transition-all hover:scale-105 cursor-pointer"
                    >
                      Jalankan Agen Otonom <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onNavigate("dashboard")}
                      className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-xl text-sm flex items-center gap-2 border border-slate-700 transition-all hover:scale-105 cursor-pointer"
                    >
                      Jelajahi Data <FileCheck2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-teal-400" /> Data APBD 33 Kab/Kota</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Privasi Pelapor Terjamin</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Sensor Cuaca BMKG &amp; Gempa USGS</span>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
                    <img
                      src="/terang_hero_banner_1792932754839.jpg"
                      alt="Kawasan pemerintahan Sumatera Utara"
                      className="w-full h-auto object-cover max-h-80 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-[11px] font-bold text-slate-300 tracking-wider font-mono">
                      PANTAU · PAHAMI · OTONOM
                    </div>
                    {/* Floating stats */}
                    <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-700 backdrop-blur-md p-2.5 rounded-xl text-white text-xs flex items-center gap-2 shadow-xl">
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                      <div>
                        <small className="block text-[9px] text-slate-400">Serapan APBD</small>
                        <strong className="text-xs font-mono font-bold text-teal-300">{kpis.avgSerapan}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 1: MENGAPA TERANG (3D Y-Axis Flip Card Rotation) */}
            {/* ============================================================ */}
            {activeSlide === 1 && (
              <div className="max-w-5xl w-full space-y-8 text-center">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    TANTANGAN &amp; SOLUSI DIGITAL
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white">
                    Mengapa TERANG Dibutuhkan?
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
                    Mengatasi deviasi pembangunan fisik vs keuangan melalui pemetaan berbasis data saintifik dan sistem otonom.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-slate-700 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                      ⚠️
                    </div>
                    <h3 className="text-xl font-bold text-white font-display">Tantangan Pengawasan Klasik</h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span> Keterlambatan proyek fisik di wilayah terpencil 33 Kabupaten/Kota.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span> Sulit mendeteksi dampak faktor eksternal (curah hujan tinggi BMKG / gempa bumi USGS).
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span> Laporan aduan warga menumpuk tanpa sistem triase otomatis yang adil.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-teal-950/60 to-slate-900 border border-teal-500/40 p-6 rounded-2xl space-y-4 hover:border-teal-400 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold">
                      <ShieldCheck className="w-6 h-6 text-teal-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white font-display">Solusi Otonom TERANG</h3>
                    <ul className="space-y-2 text-xs text-teal-100">
                      <li className="flex items-start gap-2">
                        <span className="text-teal-400 font-bold">•</span> <strong className="text-white font-bold">SuperAgent Otonom 1-Klik</strong>: Memindai deviasi &amp; membuat rekomendasi.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-400 font-bold">•</span> <strong className="text-white font-bold">Integrasi Sensor BMKG &amp; USGS</strong>: Analisis konteks bencana &amp; cuaca otomatis.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-teal-400 font-bold">•</span> <strong className="text-white font-bold">Kompresi Foto Bukti &amp; State Machine</strong>: Pelaporan warga aman &amp; terstruktur.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 2: FITUR UTAMA PENGAWASAN (Radial Circle Expansion) */}
            {/* ============================================================ */}
            {activeSlide === 2 && (
              <div className="max-w-5xl w-full space-y-8 text-center">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                    EKOSISTEM TERPADU
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white">
                    4 Pilar Fitur Pengawasan TERANG
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
                  {[
                    {
                      icon: Map,
                      title: "Choropleth GIS",
                      desc: "Pemetaan interaktif status realisasi APBD 33 Kabupaten/Kota Sumut.",
                      tag: "Peta Tematik",
                    },
                    {
                      icon: Cpu,
                      title: "SuperAgent Otonom",
                      desc: "Pemindaian otonom 1-klik untuk deteksi keterlambatan &amp; nota dinas.",
                      tag: "Pengawasan Cerdas",
                    },
                    {
                      icon: FileText,
                      title: "Aduan Faktual",
                      desc: "Pelaporan warga dengan kompresi foto fisik &amp; kode tracking TRG-2026.",
                      tag: "Real-time",
                    },
                    {
                      icon: Users,
                      title: "Moderasi RBAC",
                      desc: "Panel bertingkat untuk Super Admin, Verifikator, &amp; Instansi Dinas.",
                      tag: "Hak Akses",
                    },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 p-5 rounded-2xl space-y-3 transition-all hover:-translate-y-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-300 flex items-center justify-center">
                        <f.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider block">
                        {f.tag}
                      </span>
                      <h3 className="text-base font-bold text-white font-display">{f.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 3: ARSITEKTUR & ALUR KERJA OTONOM (3D Door Opening) */}
            {/* ============================================================ */}
            {activeSlide === 3 && (
              <div className="max-w-5xl w-full space-y-8 text-center">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    DIAGRAM ALUR KERJA
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white">
                    Arsitektur Otonom TERANG
                  </h2>
                  <p className="text-slate-400 text-sm max-w-xl mx-auto">
                    Transformasi data masukan publik dan sensor real-time menjadi keputusan otomatis yang dapat dipertanggungjawabkan.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <span className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center text-xs font-bold font-mono">
                      01
                    </span>
                    <h3 className="text-base font-bold text-white font-display">Input Publik &amp; Sensor</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Aduan warga dengan koordinat GPS, data APBD CSV, serta sensor BMKG &amp; USGS secara berkala.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-teal-500/40 p-5 rounded-2xl space-y-3 relative">
                    <span className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-bold font-mono">
                      02
                    </span>
                    <h3 className="text-base font-bold text-white font-display">Engine SuperAgent Otonom</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Evaluasi triase urgensi 1-5, pencocokan skor risiko deviasi, dan draf otomatis Nota Dinas rekomendasi.
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold font-mono">
                      03
                    </span>
                    <h3 className="text-base font-bold text-white font-display">Panel RBAC &amp; Dispatch</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Verifikasi lanjutan oleh petugas inspektorat / instansi dinas terkait sebelum penerbitan resmi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 4: STATISTIK KINERJA (3D Z-Tilt Blur Rise) */}
            {/* ============================================================ */}
            {activeSlide === 4 && (
              <div className="max-w-5xl w-full space-y-8 text-center">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    REAL-TIME METRICS
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white">
                    Statistik Pengawasan Terpadu
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-2">
                    <span className="text-xs text-slate-400 font-medium">Total Pagu APBD</span>
                    <div className="text-3xl font-extrabold font-mono text-white">
                      Rp {(kpis.totalPagu / 1e12).toFixed(1)} T
                    </div>
                    <span className="text-[11px] text-teal-400 font-medium block">TA 2024</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-2">
                    <span className="text-xs text-slate-400 font-medium">Rata-rata Serapan</span>
                    <div className="text-3xl font-extrabold font-mono text-[#0FA3B1]">
                      {kpis.avgSerapan}%
                    </div>
                    <span className="text-[11px] text-slate-400 block">Target: 85%</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-2">
                    <span className="text-xs text-slate-400 font-medium">Paket Proyek</span>
                    <div className="text-3xl font-extrabold font-mono text-white">
                      {kpis.totalProjects}+
                    </div>
                    <span className="text-[11px] text-slate-400 block">9 Sektor Belanja</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-2">
                    <span className="text-xs text-slate-400 font-medium">Laporan Selesai</span>
                    <div className="text-3xl font-extrabold font-mono text-emerald-400">
                      {kpis.completedReports} / {kpis.totalReports}
                    </div>
                    <span className="text-[11px] text-slate-400 block">Otomasi 100%</span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 5: MULAI & AKSES APLIKASI (Inset Rounded Rect Reveal) */}
            {/* ============================================================ */}
            {activeSlide === 5 && (
              <div className="max-w-4xl w-full space-y-8 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0FA3B1] to-teal-600 flex items-center justify-center text-white font-extrabold text-2xl font-display mx-auto shadow-xl shadow-teal-900/40">
                    T
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white">
                    Siap Memulai Pengawasan?
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
                    Akses dashboard transparansi APBD, jalankan pemindaian agen otonom, atau laporkan temuan fisik proyek publik di sekitarmu.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={runAgent}
                    className="px-8 py-4 bg-[#0B7C8A] hover:bg-[#096A76] text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-xl shadow-teal-950/60 transition-all hover:scale-105 cursor-pointer"
                  >
                    <Activity className="w-4 h-4 text-teal-300" /> Jalankan Agen Otonom
                  </button>

                  <button
                    onClick={() => onNavigate("dashboard")}
                    className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm flex items-center gap-2 border border-slate-700 transition-all hover:scale-105 cursor-pointer"
                  >
                    Buka Dashboard <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigate("lapor")}
                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-sm flex items-center gap-2 border border-slate-700 transition-all hover:scale-105 cursor-pointer"
                  >
                    Buat Laporan Warga
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Scroll / Slide Navigation Arrow Indicator */}
        {activeSlide < totalSlides - 1 && (
          <button
            onClick={() => goToSlide(activeSlide + 1)}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center text-slate-400 hover:text-white transition-colors cursor-pointer group"
          >
            <span className="text-[10px] font-mono tracking-widest uppercase mb-1">
              SCROLL / LANJUT
            </span>
            <ChevronDown className="w-5 h-5 animate-bounce text-teal-400 group-hover:scale-125 transition-transform" />
          </button>
        )}
      </div>

      {/* Slide Chapter Dot Indicator (Right Side) */}
      <nav
        aria-label="Navigasi Slide Presentasi"
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3 bg-slate-900/80 backdrop-blur-md p-2.5 rounded-full border border-slate-800 shadow-xl"
      >
        {SLIDE_LABELS.map((label, index) => (
          <button
            key={label}
            onClick={() => goToSlide(index)}
            aria-label={`Buka slide ${index + 1}: ${label}`}
            title={label}
            className={`rounded-full transition-all duration-300 focus:outline-none ${
              activeSlide === index
                ? "h-8 w-2.5 bg-teal-400 shadow-md shadow-teal-500/50"
                : "h-2.5 w-2.5 bg-slate-700 hover:bg-slate-400"
            }`}
          />
        ))}
      </nav>
    </div>
  );
};
