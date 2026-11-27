import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LeafletMap } from "../components/LeafletMap";
import { PROJECTS } from "../data/projectsData";
import { REGIONS } from "../data/regionsData";
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
  BarChart3,
  Award,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface LandingViewProps {
  onNavigate: (view: string) => void;
  onOpenAuth: (tab?: "login" | "register") => void;
  onLoginSuccess?: (user: any, token: string) => void;
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
  "Peta Choropleth Sumut",
  "Fitur Pengawasan",
  "Arsitektur & Sistem",
  "Statistik Kinerja",
  "Masuk & Daftar Akun",
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
  // Slide 2: Peta Choropleth 3D Scale & Rotate Entrance
  {
    initial: { opacity: 0, scale: 0.92, rotateX: 12, filter: "blur(8px)" },
    animate: { opacity: 1, scale: 1, rotateX: 0, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.04, rotateX: -10, filter: "blur(6px)" },
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
    style: { transformPerspective: 1500, transformOrigin: "center center" },
  },
  // Slide 3: Radial Circle ClipPath Expansion
  {
    initial: { opacity: 0, clipPath: "circle(0% at 50% 48%)", scale: 0.96 },
    animate: { opacity: 1, clipPath: "circle(145% at 50% 48%)", scale: 1 },
    exit: { opacity: 0, clipPath: "circle(0% at 50% 48%)", scale: 1.03 },
    transition: { duration: 0.88, ease: [0.16, 1, 0.3, 1] as const },
    style: { transformPerspective: 1400, transformOrigin: "center center" },
  },
  // Slide 4: 3D ScaleX Door Opening Effect
  {
    initial: { opacity: 0, scaleX: 0.08, rotateY: 24, x: -40 },
    animate: { opacity: 1, scaleX: 1, rotateY: 0, x: 0 },
    exit: { opacity: 0, scaleX: 0.08, rotateY: -24, x: 40 },
    transition: { duration: 0.78, ease: [0.65, 0, 0.35, 1] as const },
    style: { transformPerspective: 1700, transformOrigin: "left center" },
  },
  // Slide 5: 3D Z-tilt Blur Rise
  {
    initial: { opacity: 0, y: 110, rotateZ: 6, scale: 0.86, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, rotateZ: 0, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, y: -90, rotateZ: -5, scale: 0.91, filter: "blur(8px)" },
    transition: { duration: 0.76, ease: [0.22, 1, 0.36, 1] as const },
    style: { transformPerspective: 1400, transformOrigin: "center center" },
  },
  // Slide 6: Full Bleed Inset Rect Reveal
  {
    initial: { opacity: 0, clipPath: "inset(48% 0% 48% 0% round 0px)", scale: 1.04 },
    animate: { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 0px)", scale: 1 },
    exit: { opacity: 0, clipPath: "inset(48% 0% 48% 0% round 0px)", scale: 0.98 },
    transition: { duration: 0.8, ease: [0.7, 0, 0.2, 1] as const },
    style: { transformPerspective: 1400, transformOrigin: "center center" },
  },
];

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenAuth,
  onLoginSuccess,
  kpis,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const slideContentRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const wheelLockRef = useRef(false);

  // Map metric state for the Choropleth map slide
  const [mapMetric, setMapMetric] = useState<"serapan" | "laporan" | "skor">("serapan");

  // Auth Form State inside Slide 6
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("admin@terang.test");
  const [loginPassword, setLoginPassword] = useState("password");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"warga" | "verifikator" | "instansi">("warga");
  const [regRegionId, setRegRegionId] = useState("reg-deliserdang");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

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

  // Login handler
  const handleSlideLogin = async (e?: React.FormEvent, overrideEmail?: string) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    const targetEmail = overrideEmail || loginEmail;

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: loginPassword || "password" }),
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        setAuthSuccess(`Selamat datang, ${data.user.name}! Masuk otomatis...`);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user, data.token);
          } else {
            localStorage.setItem("terang_user", JSON.stringify(data.user));
            localStorage.setItem("terang_token", data.token);
            onNavigate(data.user.role === "warga" ? "dashboard" : "admin");
          }
        }, 400);
      } else {
        setAuthError(data.message || "Login gagal. Periksa email dan kata sandi.");
      }
    } catch (err: any) {
      setAuthError(err?.message || "Gagal terhubung ke server.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Register handler
  const handleSlideRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.includes("@") || !regPassword || regPassword.length < 4) {
      setAuthError("Email valid dan kata sandi (minimal 4 karakter) wajib diisi.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          region_id: regRegionId,
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        setAuthSuccess(`Pendaftaran berhasil! Selamat datang, ${data.user.name}.`);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user, data.token);
          } else {
            localStorage.setItem("terang_user", JSON.stringify(data.user));
            localStorage.setItem("terang_token", data.token);
            onNavigate(data.user.role === "warga" ? "dashboard" : "admin");
          }
        }, 400);
      } else {
        setAuthError(data.message || "Pendaftaran gagal.");
      }
    } catch (err: any) {
      setAuthError(err?.message || "Gagal mendaftar ke server.");
    } finally {
      setAuthLoading(false);
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
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#F8FAFC] text-slate-800 font-sans select-none">
      {/* Background Subtle Ambient Glows (Light Theme) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-slate-200/40 blur-3xl" />
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
            className={`w-full h-full flex flex-col justify-center items-center ${
              activeSlide === 6 ? "px-0" : "px-4 sm:px-8 lg:px-16"
            }`}
          >
            {/* ============================================================ */}
            {/* SLIDE 0: HERO & WELCOME */}
            {/* ============================================================ */}
            {activeSlide === 0 && (
              <div className="max-w-6xl w-full grid lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5 text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[#0FA3B1] animate-ping" />
                    PLATFORM AKUNTABILITAS · SUMATERA UTARA
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-extrabold font-display leading-tight text-slate-900">
                    Anggaran publik.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0FA3B1] to-teal-700">
                      Diawasi satu klik.
                    </span>
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                    Platform terpadu memantau APBD 33 kabupaten/kota, mendeteksi proyek tertinggal dengan konteks cuaca dan gempa nyata, serta memproses laporan warga secara otomatis dengan moderasi RBAC.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setAuthTab("login");
                        goToSlide(6);
                      }}
                      className="px-6 py-3.5 bg-[#0B7C8A] hover:bg-[#096A76] text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-teal-900/20 transition-all hover:scale-105 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" /> Masuk Akun
                    </button>
                    <button
                      onClick={() => {
                        setAuthTab("register");
                        goToSlide(6);
                      }}
                      className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Daftar Akun Baru
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-[#0B7C8A]" /> Data APBD 33 Kab/Kota</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Privasi Pelapor Terjamin</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Sensor Cuaca BMKG &amp; Gempa USGS</span>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl group bg-white">
                    <img
                      src="/terang_hero_banner_1792932754839.jpg"
                      alt="Kawasan pemerintahan Sumatera Utara"
                      className="w-full h-auto object-cover max-h-80 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 text-[11px] font-bold text-white tracking-wider font-mono">
                      PANTAU · PAHAMI · OTONOM
                    </div>
                    {/* Floating stats */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 rounded-xl text-slate-900 text-xs flex items-center gap-2 shadow-lg">
                      <TrendingUp className="w-4 h-4 text-[#0FA3B1]" />
                      <div>
                        <small className="block text-[9px] text-slate-500">Serapan APBD</small>
                        <strong className="text-xs font-mono font-bold text-[#0B7C8A]">{kpis.avgSerapan}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 1: MENGAPA TERANG DIBUTUHKAN */}
            {/* ============================================================ */}
            {activeSlide === 1 && (
              <div className="max-w-5xl w-full space-y-8 text-center">
                <div className="space-y-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    TANTANGAN &amp; SOLUSI DIGITAL
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900">
                    Mengapa TERANG Dibutuhkan?
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
                    Mengatasi deviasi pembangunan fisik vs keuangan melalui pemetaan berbasis data saintifik dan sistem otonom.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white border border-amber-200/80 p-6 rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 font-bold">
                      <AlertTriangle className="w-6 h-6 text-amber-700" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 font-display">Tantangan Pengawasan Klasik</h3>
                    <ul className="space-y-3 text-xs text-slate-600">
                      <li className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>Keterlambatan proyek fisik di wilayah terpencil 33 Kabupaten/Kota.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>Sulit mendeteksi dampak faktor eksternal (curah hujan tinggi BMKG / gempa bumi USGS).</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>Laporan aduan warga menumpuk tanpa sistem triase yang adil dan efisien.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50/80 to-white border border-teal-200 p-6 rounded-2xl space-y-4 shadow-md hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-[#0B7C8A] font-bold">
                      <ShieldCheck className="w-6 h-6 text-[#0B7C8A]" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 font-display">Solusi Otonom TERANG</h3>
                    <ul className="space-y-3 text-xs text-slate-700">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0FA3B1] shrink-0 mt-0.5" />
                        <span><strong className="text-slate-900 font-bold">Sistem Pengawasan Otonom</strong>: Memindai deviasi proyek &amp; membuat rekomendasi.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0FA3B1] shrink-0 mt-0.5" />
                        <span><strong className="text-slate-900 font-bold">Integrasi Sensor BMKG &amp; USGS</strong>: Analisis konteks bencana &amp; cuaca otomatis.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#0FA3B1] shrink-0 mt-0.5" />
                        <span><strong className="text-slate-900 font-bold">Kompresi Foto Bukti &amp; State Machine</strong>: Pelaporan warga aman &amp; terstruktur.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 2: PETA CHOROPLETH & SEBARAN PROYEK SUMATERA UTARA */}
            {/* ============================================================ */}
            {activeSlide === 2 && (
              <div className="max-w-6xl w-full space-y-4 text-center">
                <div className="space-y-1.5">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    PETA CHOROPLETH &amp; SEBARAN PROYEK
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-slate-900">
                    Pemetaan Real-time 33 Kabupaten/Kota Sumut
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto">
                    Pantau Serapan APBD (%), Jumlah Aduan Warga, dan Skor Transparansi Daerah secara spasial dengan penanda lokasi proyek publik.
                  </p>
                </div>

                {/* Metric Selector Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs max-w-3xl mx-auto">
                  <span className="text-xs font-bold text-slate-700 pl-2">Metrik Visualisasi:</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setMapMetric("serapan")}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        mapMetric === "serapan"
                          ? "bg-[#0B7C8A] text-white shadow-sm font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Serapan APBD (%)
                    </button>
                    <button
                      onClick={() => setMapMetric("laporan")}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        mapMetric === "laporan"
                          ? "bg-[#0B7C8A] text-white shadow-sm font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Jumlah Aduan
                    </button>
                    <button
                      onClick={() => setMapMetric("skor")}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        mapMetric === "skor"
                          ? "bg-[#0B7C8A] text-white shadow-sm font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" /> Skor Transparansi
                    </button>
                  </div>
                </div>

                {/* Leaflet Map Interactive Container */}
                <div className="relative w-full h-[340px] sm:h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white">
                  <LeafletMap
                    selectedMetric={mapMetric}
                    projects={PROJECTS}
                    onSelectProject={(projectId) => onNavigate("proyek")}
                    onSelectRegion={(regId) => onNavigate("dashboard")}
                  />
                </div>

                {/* Legenda & Panduan Indikator Visual Spasial Terbuka 100% */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-left max-w-5xl mx-auto pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-md bg-[#2E9E6B] shrink-0 border border-slate-300 shadow-2xs" />
                    <div className="text-[11px] leading-tight">
                      <strong className="block text-slate-900 font-bold">Tinggi / Terkendali</strong>
                      <span className="text-slate-500 font-medium">
                        {mapMetric === "serapan" ? "≥ 88% Realisasi" : mapMetric === "skor" ? "Skor ≥ 80 (Grade A)" : "0 Aduan Warga"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-md bg-[#0FA3B1] shrink-0 border border-slate-300 shadow-2xs" />
                    <div className="text-[11px] leading-tight">
                      <strong className="block text-slate-900 font-bold">Baik / Rendah</strong>
                      <span className="text-slate-500 font-medium">
                        {mapMetric === "serapan" ? "80 - 87% Realisasi" : mapMetric === "skor" ? "Skor 70 - 79 (Grade B)" : "1 - 2 Aduan Warga"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-md bg-[#F5A623] shrink-0 border border-slate-300 shadow-2xs" />
                    <div className="text-[11px] leading-tight">
                      <strong className="block text-slate-900 font-bold">Waspada / Perhatian</strong>
                      <span className="text-slate-500 font-medium">
                        {mapMetric === "serapan" ? "72 - 79% Realisasi" : mapMetric === "skor" ? "Skor 55 - 69 (Grade C)" : "3 - 4 Aduan Warga"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-md bg-[#D64545] shrink-0 border border-slate-300 shadow-2xs" />
                    <div className="text-[11px] leading-tight">
                      <strong className="block text-slate-900 font-bold">Kritis / Kesenjangan</strong>
                      <span className="text-slate-500 font-medium">
                        {mapMetric === "serapan" ? "< 72% Realisasi" : mapMetric === "skor" ? "Skor < 55 (Grade D/E)" : "≥ 5 Aduan Warga"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 3: FITUR UTAMA PENGAWASAN */}
            {/* ============================================================ */}
            {activeSlide === 3 && (
              <div className="max-w-5xl w-full space-y-8 text-center">
                <div className="space-y-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    EKOSISTEM TERPADU
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900">
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
                      className="bg-white border border-slate-200 hover:border-teal-400 p-5 rounded-2xl space-y-3 shadow-xs hover:shadow-md transition-all hover:-translate-y-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0B7C8A] flex items-center justify-center">
                        <f.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-[#0FA3B1] uppercase tracking-wider block font-semibold">
                        {f.tag}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 font-display">{f.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 4: ARSITEKTUR & ALUR KERJA OTONOM */}
            {/* ============================================================ */}
            {activeSlide === 4 && (
              <div className="max-w-5xl w-full space-y-8 text-center">
                <div className="space-y-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    DIAGRAM ALUR KERJA
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900">
                    Arsitektur Otonom TERANG
                  </h2>
                  <p className="text-slate-600 text-sm max-w-xl mx-auto">
                    Transformasi data masukan publik dan sensor real-time menjadi keputusan otomatis yang dapat dipertanggungjawabkan.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
                    <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-bold font-mono">
                      01
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-display">Input Publik &amp; Sensor</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Aduan warga dengan koordinat GPS, data APBD CSV, serta sensor BMKG &amp; USGS secara berkala.
                    </p>
                  </div>

                  <div className="bg-teal-50/50 border border-teal-300 p-5 rounded-2xl space-y-3 shadow-md relative">
                    <span className="w-8 h-8 rounded-lg bg-[#0B7C8A] text-white flex items-center justify-center text-xs font-bold font-mono">
                      02
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-display">Engine SuperAgent Otonom</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Evaluasi triase urgensi 1-5, pencocokan skor risiko deviasi, dan draf otomatis Nota Dinas rekomendasi.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold font-mono">
                      03
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-display">Panel RBAC &amp; Dispatch</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Verifikasi lanjutan oleh petugas inspektorat / instansi dinas terkait sebelum penerbitan resmi.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 5: STATISTIK KINERJA */}
            {/* ============================================================ */}
            {activeSlide === 5 && (
              <div className="max-w-5xl w-full space-y-8 text-center">
                <div className="space-y-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    REAL-TIME METRICS
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-slate-900">
                    Statistik Pengawasan Terpadu
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition-shadow">
                    <span className="text-xs text-slate-500 font-medium">Total Pagu APBD</span>
                    <div className="text-3xl font-extrabold font-mono text-slate-900">
                      Rp {(kpis.totalPagu / 1e12).toFixed(1)} T
                    </div>
                    <span className="text-[11px] text-[#0B7C8A] font-medium block">TA 2024</span>
                  </div>

                  <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition-shadow">
                    <span className="text-xs text-slate-500 font-medium">Rata-rata Serapan</span>
                    <div className="text-3xl font-extrabold font-mono text-[#0FA3B1]">
                      {kpis.avgSerapan}%
                    </div>
                    <span className="text-[11px] text-slate-400 block">Target: 85%</span>
                  </div>

                  <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition-shadow">
                    <span className="text-xs text-slate-500 font-medium">Paket Proyek</span>
                    <div className="text-3xl font-extrabold font-mono text-slate-900">
                      {kpis.totalProjects}+
                    </div>
                    <span className="text-[11px] text-slate-400 block">9 Sektor Belanja</span>
                  </div>

                  <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition-shadow">
                    <span className="text-xs text-slate-500 font-medium">Laporan Selesai</span>
                    <div className="text-3xl font-extrabold font-mono text-emerald-600">
                      {kpis.completedReports} / {kpis.totalReports}
                    </div>
                    <span className="text-[11px] text-slate-400 block">Otomasi 100%</span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SLIDE 6: FORM MASUK & DAFTAR AKUN FULL-BLEED SEAMLESS PAGE LAYOUT */}
            {/* ============================================================ */}
            {activeSlide === 6 && (
              <div className="w-full h-full flex flex-col lg:flex-row items-stretch justify-between overflow-hidden">
                {/* SISI KIRI: ELEGANT DEEP SLATE SHOWCASE (40% Lebar - lg:w-5/12 - TIDAK FULL PUTIH) */}
                <div className="lg:w-5/12 bg-[#0F172A] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden text-left shadow-xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#0FA3B1]/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="space-y-5 relative z-10 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0FA3B1]/20 text-teal-300 border border-teal-500/30">
                      <ShieldCheck className="w-4 h-4 text-teal-300" />
                      PORTAL ADUAN WARGA &amp; AKUNTABILITAS PUBLIK
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight text-white">
                      Kawal Anggaran APBD.
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0FA3B1] via-teal-300 to-amber-300">
                        Laporkan Faktual di Lapangan.
                      </span>
                    </h2>

                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      Satu akun terpadu untuk warga Sumatera Utara, verifikator inspektorat, dan instansi dinas terkait. Kirim aduan fisik proyek publik secara transparan, aman, dan terpantau real-time.
                    </p>

                    <div className="pt-2 space-y-3 text-xs text-slate-300">
                      <div className="flex items-start gap-3">
                        <span className="p-1.5 rounded-lg bg-[#0FA3B1]/20 text-teal-300 font-bold shrink-0">✓</span>
                        <div>
                          <strong className="text-white block font-bold">Privasi Pelapor Faktual &amp; Enkripsi Data</strong>
                          <span className="text-slate-400 text-[11px]">Identitas pelapor terenkripsi aman dan mendukung mode pelaporan anonim.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="p-1.5 rounded-lg bg-[#0FA3B1]/20 text-teal-300 font-bold shrink-0">✓</span>
                        <div>
                          <strong className="text-white block font-bold">Kompresi Foto Fisik &amp; Kode Tracking TRG-2026</strong>
                          <span className="text-slate-400 text-[11px]">Foto dikompres otomatis di HP/browser dan diberi nomor resi pantau publik.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="p-1.5 rounded-lg bg-[#0FA3B1]/20 text-teal-300 font-bold shrink-0">✓</span>
                        <div>
                          <strong className="text-white block font-bold">Moderasi State Machine &amp; Respons Dinas</strong>
                          <span className="text-slate-400 text-[11px]">Transisi status laporan diverifikasi secara akuntabel hingga tindak lanjut dinas.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Footer on Left Side */}
                  <div className="pt-5 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 relative z-10">
                    <span>52 Laporan Faktual</span>
                    <span>•</span>
                    <span>156 Paket Proyek</span>
                    <span>•</span>
                    <span className="text-teal-400 font-bold">33 Kab/Kota Sumut</span>
                  </div>
                </div>

                {/* SISI KANAN: FORM LOGIN & REGISTER ELEGANT WHITE LEBIH LEBAR (60% Lebar - lg:w-7/12) */}
                <div className="lg:w-7/12 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-left space-y-5">
                  <div className="max-w-xl mx-auto w-full my-auto space-y-5">
                    {/* Header Title inside Right Panel */}
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-[#0FA3B1] uppercase tracking-wider block">
                        {authTab === "login" ? "SESI MASUK AKUN REAL" : "PENDAFTARAN WARGA PUBLIK REAL"}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                        {authTab === "login" ? "Masuk ke TERANG" : "Buat Akun Baru"}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {authTab === "login"
                          ? "Masukkan email dan kata sandi Anda untuk mengakses portal pengawasan."
                          : "Lengkapi formulir pendaftaran untuk menyampaikan aduan warga secara terverifikasi."}
                      </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => {
                          setAuthTab("login");
                          setAuthError(null);
                          setAuthSuccess(null);
                        }}
                        className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          authTab === "login"
                            ? "bg-[#0B7C8A] text-white shadow-sm font-extrabold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <UserCheck className="w-4 h-4" /> Masuk Akun
                      </button>

                      <button
                        onClick={() => {
                          setAuthTab("register");
                          setAuthError(null);
                          setAuthSuccess(null);
                        }}
                        className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          authTab === "register"
                            ? "bg-[#0B7C8A] text-white shadow-sm font-extrabold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <UserPlus className="w-4 h-4" /> Daftar Akun Baru
                      </button>
                    </div>

                    {/* Status Alerts */}
                    {authError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {authSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-semibold">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{authSuccess}</span>
                      </div>
                    )}

                    {/* FORM MASUK AKUN (LOGIN) */}
                    {authTab === "login" && (
                      <form onSubmit={(e) => handleSlideLogin(e)} className="space-y-4 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">Alamat Email</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                              type="email"
                              required
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="nama@email.com"
                              className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0FA3B1] focus:ring-2 focus:ring-teal-100"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">Kata Sandi</label>
                          <div className="relative">
                            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                              type="password"
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="Masukkan kata sandi"
                              className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0FA3B1] focus:ring-2 focus:ring-teal-100"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full py-3.5 bg-[#0B7C8A] hover:bg-[#096A76] text-white font-bold rounded-xl text-xs shadow-md transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50 mt-2"
                        >
                          {authLoading ? "Memproses Sesi..." : "Masuk Akun TERANG →"}
                        </button>

                        {/* Quick Fill Demo Shortcuts */}
                        <div className="pt-3 border-t border-slate-200 space-y-2">
                          <span className="text-[11px] font-bold text-slate-500 block">
                            Atau Sekali Klik Masuk Otomatis Sesi Demo:
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              disabled={authLoading}
                              onClick={() => {
                                setLoginEmail("admin@terang.test");
                                setLoginPassword("password");
                                handleSlideLogin(undefined, "admin@terang.test");
                              }}
                              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-[11px] text-center cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              Super Admin
                            </button>

                            <button
                              type="button"
                              disabled={authLoading}
                              onClick={() => {
                                setLoginEmail("verifikator@terang.test");
                                setLoginPassword("password");
                                handleSlideLogin(undefined, "verifikator@terang.test");
                              }}
                              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] text-center cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              Verifikator
                            </button>

                            <button
                              type="button"
                              disabled={authLoading}
                              onClick={() => {
                                setLoginEmail("instansi@terang.test");
                                setLoginPassword("password");
                                handleSlideLogin(undefined, "instansi@terang.test");
                              }}
                              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-[11px] text-center cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                              Instansi PUPR
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* FORM DAFTAR AKUN BARU (REGISTER) */}
                    {authTab === "register" && (
                      <form onSubmit={handleSlideRegister} className="space-y-3.5 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block text-[11px]">Nama Lengkap</label>
                          <div className="relative">
                            <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              placeholder="Nama lengkap Anda"
                              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0FA3B1]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700 block text-[11px]">Email</label>
                            <input
                              type="email"
                              required
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="nama@email.com"
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0FA3B1]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700 block text-[11px]">Kata Sandi</label>
                            <input
                              type="password"
                              required
                              minLength={4}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="Min 4 char"
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#0FA3B1]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700 block text-[11px]">Peran Pengguna</label>
                            <select
                              value={regRole}
                              onChange={(e) => setRegRole(e.target.value as any)}
                              className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-[11px] font-semibold focus:outline-none focus:border-[#0FA3B1]"
                            >
                              <option value="warga">Pelapor Warga</option>
                              <option value="verifikator">Verifikator</option>
                              <option value="instansi">Instansi Dinas</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700 block text-[11px]">Kabupaten/Kota</label>
                            <select
                              value={regRegionId}
                              onChange={(e) => setRegRegionId(e.target.value)}
                              className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-[11px] font-semibold focus:outline-none focus:border-[#0FA3B1]"
                            >
                              {REGIONS.map((reg) => (
                                <option key={reg.id} value={reg.id}>
                                  {reg.nama}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full py-3.5 bg-[#0B7C8A] hover:bg-[#096A76] text-white font-bold rounded-xl text-xs shadow-md transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50 mt-2"
                        >
                          {authLoading ? "Mendaftar..." : "Daftar & Masuk Akun →"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Scroll / Slide Navigation Arrow Indicator */}
        {activeSlide < totalSlides - 1 && (
          <button
            onClick={() => goToSlide(activeSlide + 1)}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
          >
            <span className="text-[10px] font-mono tracking-widest uppercase mb-1 font-semibold">
              SCROLL / LANJUT
            </span>
            <ChevronDown className="w-5 h-5 animate-bounce text-[#0FA3B1] group-hover:scale-125 transition-transform" />
          </button>
        )}
      </div>

      {/* Slide Chapter Dot Indicator (Right Side - Light Theme) */}
      <nav
        aria-label="Navigasi Slide Presentasi"
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3 bg-white/90 backdrop-blur-md p-2.5 rounded-full border border-slate-200 shadow-lg"
      >
        {SLIDE_LABELS.map((label, index) => (
          <button
            key={label}
            onClick={() => goToSlide(index)}
            aria-label={`Buka slide ${index + 1}: ${label}`}
            title={label}
            className={`rounded-full transition-all duration-300 focus:outline-none ${
              activeSlide === index
                ? "h-8 w-2.5 bg-[#0FA3B1] shadow-md shadow-teal-500/30"
                : "h-2.5 w-2.5 bg-slate-300 hover:bg-slate-500"
            }`}
          />
        ))}
      </nav>
    </div>
  );
};
