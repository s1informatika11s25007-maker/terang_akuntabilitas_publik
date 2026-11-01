import "./src/server/loadEnv.js";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { db, DEMO_USERS } from "./src/server/db.js";
import {
  askTanyaTerang,
  autoTriaseReport,
  clarifyReportText,
  generateInsightNarrative,
  toolBandingkanDaerah,
  runFullAutoPilotScan,
  autoTriageAllPendingReports,
  autoDispatchAgencyNotice,
  autoOptimizeBudgetAllocation,
} from "./src/server/aiService.js";
import {
  calculateAbsorptionRate,
  calculateGapIndicator,
  calculateTransparencyScore,
} from "./src/lib/calculations.js";
import { validateAndImportCSV } from "./scripts/import.js";
import { getMissionState, startMission } from "./src/server/superAgent.js";
import { loadLiveContext, forceRefreshLiveWorkers } from "./src/server/liveData.js";

const __dirname = process.cwd();

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), geolocation=(self), microphone=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";
// Signed, expiring demo sessions. Set AUTH_SECRET in deployments to keep sessions
// valid across restarts; a cryptographically random key is used for local demos.
const AUTH_SECRET = process.env.AUTH_SECRET || randomBytes(32).toString("hex");
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "password";

// Lightweight per-IP throttle for metered AI endpoints. Use a shared store such
// as Redis when deploying multiple server instances.
const aiRequestWindows = new Map<string, { count: number; resetAt: number }>();
const loginRequestWindows = new Map<string, { count: number; resetAt: number }>();
function loginRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const entry = loginRequestWindows.get(key);
  if (!entry || entry.resetAt <= now) {
    loginRequestWindows.set(key, { count: 1, resetAt: now + 60_000 });
    next();
    return;
  }
  if (entry.count >= 8) {
    res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
    res.status(429).json({ status: "error", message: "Terlalu banyak percobaan masuk. Silakan coba lagi sebentar." });
    return;
  }
  entry.count += 1;
  next();
}

function aiRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const entry = aiRequestWindows.get(key);
  if (!entry || entry.resetAt <= now) {
    aiRequestWindows.set(key, { count: 1, resetAt: now + 60_000 });
    next();
    return;
  }
  if (entry.count >= 20) {
    res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
    res.status(429).json({ status: "error", message: "Batas permintaan asisten tercapai. Coba kembali sebentar lagi." });
    return;
  }
  entry.count += 1;
  next();
}

const missionRequestWindows = new Map<string, { count: number; resetAt: number }>();
function missionRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Jika misi sedang berjalan atau dalam mode dev, jangan blokir pencarian status!
  if (!isProduction || getMissionState().running) {
    next();
    return;
  }
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const entry = missionRequestWindows.get(key);
  if (!entry || entry.resetAt <= now) {
    missionRequestWindows.set(key, { count: 1, resetAt: now + 60_000 });
    next();
    return;
  }
  if (entry.count >= 60) {
    res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
    res.status(429).json({ status: "error", message: "Agen Otonom sedang memproses. Silakan tunggu sebentar." });
    return;
  }
  entry.count += 1;
  next();
}

function createAdminToken(user: { email: string; role: string }) {
  const payload = Buffer.from(JSON.stringify({
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
  })).toString("base64url");
  const signature = createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function requireAdmin(...allowedRoles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authorization = req.header("authorization") || "";
    const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      res.status(401).json({ status: "error", message: "Sesi administrator diperlukan. Silakan masuk kembali." });
      return;
    }

    const [payloadPart, providedSignature] = token.split(".");
    if (!payloadPart || !providedSignature) {
      res.status(401).json({ status: "error", message: "Token sesi tidak valid." });
      return;
    }

    const expected = createHmac("sha256", AUTH_SECRET).update(payloadPart).digest();
    let actual: Buffer;
    try { actual = Buffer.from(providedSignature, "base64url"); }
    catch { actual = Buffer.alloc(0); }
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      res.status(401).json({ status: "error", message: "Token sesi tidak valid." });
      return;
    }

    try {
      const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
      const user = DEMO_USERS[String(payload.email || "").toLowerCase()];
      if (!user || user.role !== payload.role || !Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
        res.status(401).json({ status: "error", message: "Sesi telah berakhir. Silakan masuk kembali." });
        return;
      }
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        res.status(403).json({ status: "error", message: "Akun Anda tidak memiliki izin untuk tindakan ini." });
        return;
      }
      (req as any).adminUser = user;
      next();
    } catch {
      res.status(401).json({ status: "error", message: "Token sesi tidak dapat dibaca." });
    }
  };
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Never expose a reporter's contact details or legal name through public APIs.
// Admin actions are recorded using the signed session identity instead of request data.
function toPublicReport(report: any) {
  const { kontak: _privateContact, nama_pelapor: _privateName, ...publicFields } = report;
  return {
    ...publicFields,
    nama_pelapor: report.is_anonim ? "Warga Anonim" : "Warga",
  };
}

// ==========================================
// PUBLIC REST API ENDPOINTS (/api/v1/...)
// ==========================================

// GET /api/v1/regions
app.get("/api/v1/regions", (req, res) => {
  res.json({
    status: "success",
    data: db.regions,
  });
});

// GET /api/v1/geojson (Batas Wilayah Spasial Sumatera Utara)
app.get("/api/v1/geojson", (req, res) => {
  res.json({
    status: "success",
    data: db.geoJsonData,
  });
});

// GET /api/v1/sectors
app.get("/api/v1/sectors", (req, res) => {
  res.json({
    status: "success",
    data: db.sectors,
  });
});

// GET /api/v1/kpis
app.get("/api/v1/kpis", (req, res) => {
  res.json({
    status: "success",
    kpis: db.getKPIStats(),
  });
});

// GET /api/v1/budgets
app.get("/api/v1/budgets", (req, res) => {
  const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : 2024;
  const region_id = (req.query.region_id as string) || "all";
  const sector_id = (req.query.sector_id as string) || "all";

  let list = db.budgets.filter((b) => b.tahun === tahun);
  if (region_id !== "all") {
    list = list.filter((b) => b.region_id === region_id);
  }
  if (sector_id !== "all") {
    list = list.filter((b) => b.sector_id === sector_id);
  }

  const totalPagu = list.reduce((a, c) => a + c.pagu, 0);
  const totalRealisasi = list.reduce((a, c) => a + c.realisasi, 0);
  const serapanPersen = calculateAbsorptionRate(totalRealisasi, totalPagu);

  // Group by sector
  const sectorMap: Record<
    string,
    {
      sector_id: string;
      sector_nama: string;
      pagu: number;
      realisasi: number;
      serapan_persen: number;
    }
  > = {};
  for (const b of list) {
    if (!sectorMap[b.sector_id]) {
      sectorMap[b.sector_id] = {
        sector_id: b.sector_id,
        sector_nama: b.sector_nama,
        pagu: 0,
        realisasi: 0,
        serapan_persen: 0,
      };
    }
    sectorMap[b.sector_id].pagu += b.pagu;
    sectorMap[b.sector_id].realisasi += b.realisasi;
  }
  const bySector = Object.values(sectorMap).map((s) => ({
    ...s,
    serapan_persen: calculateAbsorptionRate(s.realisasi, s.pagu),
  }));

  // Trend over years for the selected region
  const years = [2022, 2023, 2024, 2025];
  const trend = years.map((yr) => {
    let yrList = db.budgets.filter((b) => b.tahun === yr);
    if (region_id !== "all")
      yrList = yrList.filter((b) => b.region_id === region_id);
    if (sector_id !== "all")
      yrList = yrList.filter((b) => b.sector_id === sector_id);
    const p = yrList.reduce((a, c) => a + c.pagu, 0);
    const r = yrList.reduce((a, c) => a + c.realisasi, 0);
    return {
      tahun: yr,
      pagu: p,
      realisasi: r,
      serapan_persen: calculateAbsorptionRate(r, p),
    };
  });

  // Top 10 lowest absorption regions for selected year
  const regAbsorption = db.regions
    .map((reg) => {
      const regB = db.budgets.filter(
        (b) => b.region_id === reg.id && b.tahun === tahun,
      );
      const p = regB.reduce((a, c) => a + c.pagu, 0);
      const r = regB.reduce((a, c) => a + c.realisasi, 0);
      return {
        id: reg.id,
        nama: reg.nama,
        tipe: reg.tipe,
        pagu: p,
        realisasi: r,
        serapan_persen: calculateAbsorptionRate(r, p),
      };
    })
    .sort((a, b) => a.serapan_persen - b.serapan_persen);

  res.json({
    status: "success",
    kpi: {
      total_pagu: totalPagu,
      total_realisasi: totalRealisasi,
      serapan_persen: serapanPersen,
      jumlah_proyek: db.projects.filter(
        (p) =>
          (region_id === "all" || p.region_id === region_id) &&
          p.tahun === tahun,
      ).length,
      jumlah_laporan: db.reports.filter(
        (r) => region_id === "all" || r.region_id === region_id,
      ).length,
      proyek_bermasalah: db.projects.filter((p) => {
        if (region_id !== "all" && p.region_id !== region_id) return false;
        if (p.tahun !== tahun) return false;
        const repCount = db.reports.filter((r) => r.project_id === p.id).length;
        return calculateGapIndicator(p, repCount).needsFieldVerification;
      }).length,
    },
    by_sector: bySector,
    trend,
    lowest_regions: regAbsorption.slice(0, 10),
    data: list,
  });
});

// GET /api/v1/projects
app.get("/api/v1/projects", (req, res) => {
  const tahun = req.query.tahun
    ? parseInt(req.query.tahun as string)
    : undefined;
  const region_id = (req.query.region_id as string) || "all";
  const sector_id = (req.query.sector_id as string) || "all";
  const status = (req.query.status as string) || "all";
  const search = ((req.query.search as string) || "").toLowerCase();
  const filterGap = req.query.filter === "gap";

  let list = db.projects;
  if (tahun) list = list.filter((p) => p.tahun === tahun);
  if (region_id !== "all") list = list.filter((p) => p.region_id === region_id);
  if (sector_id !== "all") list = list.filter((p) => p.sector_id === sector_id);
  if (status !== "all") list = list.filter((p) => p.status === status);
  if (search) {
    list = list.filter(
      (p) =>
        p.nama.toLowerCase().includes(search) ||
        p.kode.toLowerCase().includes(search) ||
        p.kontraktor.toLowerCase().includes(search) ||
        p.lokasi_nama.toLowerCase().includes(search) ||
        p.region_nama.toLowerCase().includes(search),
    );
  }

  // Attach gap indicator to each project
  const mapped = list.map((p) => {
    const verifiedReports = db.reports.filter(
      (r) => r.project_id === p.id && r.status !== "ditolak",
    );
    const gap = calculateGapIndicator(p, verifiedReports.length);
    return {
      ...p,
      serapan_persen: calculateAbsorptionRate(p.realisasi, p.pagu),
      gap_indicator: gap,
      laporan_count: verifiedReports.length,
    };
  });

  if (filterGap) {
    res.json({
      status: "success",
      total: mapped.filter((p) => p.gap_indicator.needsFieldVerification)
        .length,
      data: mapped.filter((p) => p.gap_indicator.needsFieldVerification),
    });
    return;
  }

  res.json({
    status: "success",
    total: mapped.length,
    data: mapped,
  });
});

// GET /api/v1/projects/:id
app.get("/api/v1/projects/:id", (req, res) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    res
      .status(404)
      .json({ status: "error", message: "Proyek tidak ditemukan" });
    return;
  }

  const reports = db.reports.filter((r) => r.project_id === project.id);
  const gap = calculateGapIndicator(
    project,
    reports.filter((r) => r.status !== "ditolak").length,
  );

  res.json({
    status: "success",
    data: {
      ...project,
      serapan_persen: calculateAbsorptionRate(project.realisasi, project.pagu),
      gap_indicator: gap,
      reports: reports.map(toPublicReport),
    },
  });
});

// GET /api/v1/reports
app.get("/api/v1/reports", (req, res) => {
  const status = (req.query.status as string) || "all";
  const region_id = (req.query.region_id as string) || "all";
  const sector_id = (req.query.sector_id as string) || "all";
  const kategori = (req.query.kategori as string) || "all";
  const search = ((req.query.search as string) || "").toLowerCase();

  let list = db.reports;
  if (status !== "all") list = list.filter((r) => r.status === status);
  if (region_id !== "all") list = list.filter((r) => r.region_id === region_id);
  if (sector_id !== "all") list = list.filter((r) => r.sector_id === sector_id);
  if (kategori !== "all") list = list.filter((r) => r.kategori === kategori);
  if (search) {
    list = list.filter(
      (r) =>
        r.judul.toLowerCase().includes(search) ||
        r.deskripsi.toLowerCase().includes(search) ||
        r.tracking_code.toLowerCase().includes(search) ||
        r.region_nama.toLowerCase().includes(search),
    );
  }

  res.json({
    status: "success",
    total: list.length,
    data: list.map(toPublicReport),
  });
});

// GET /api/v1/reports/track (Universal multi-field tracking & search with relevance scoring)
app.get("/api/v1/reports/track", (req, res) => {
  const rawQuery = (req.query.q as string) || "";
  const query = rawQuery.trim().toLowerCase();
  const cleanQuery = query.replace(/[^a-z0-9]/g, ""); // strip hyphens/spaces
  const status = (req.query.status as string) || "all";
  const region_id = (req.query.region_id as string) || "all";

  let candidates = db.reports;
  if (status !== "all") {
    candidates = candidates.filter((r) => r.status === status);
  }
  if (region_id !== "all") {
    candidates = candidates.filter((r) => r.region_id === region_id);
  }

  // If query is empty, return all candidate reports for default display
  if (!query) {
    res.json({
      status: "success",
      total: candidates.length,
      query: "",
      exactMatch: null,
      isExactMatch: false,
      data: candidates.map(toPublicReport),
    });
    return;
  }

  // Exact code match check
  const exactMatch = db.reports.find(
    (r) =>
      r.tracking_code.toLowerCase() === query ||
      r.id.toLowerCase() === query ||
      (cleanQuery.length >= 4 && r.tracking_code.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanQuery) ||
      (cleanQuery.length >= 4 && r.id.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanQuery),
  );

  // Score relevance for all reports
  const scored = candidates
    .map((r) => {
      let score = 0;
      const tc = r.tracking_code.toLowerCase();
      const tcClean = tc.replace(/[^a-z0-9]/g, "");
      const id = r.id.toLowerCase();
      const judul = r.judul.toLowerCase();
      const deskripsi = r.deskripsi.toLowerCase();
      const reg = r.region_nama.toLowerCase();
      const sec = r.sector_nama.toLowerCase();
      const kat = r.kategori.toLowerCase();

      if (tc === query || id === query || (cleanQuery.length >= 4 && tcClean === cleanQuery)) score += 100;
      else if (tc.includes(query) || id.includes(query) || (cleanQuery.length >= 4 && tcClean.includes(cleanQuery))) score += 80;

      if (judul.includes(query)) score += 60;
      if (reg.includes(query)) score += 40;
      if (sec.includes(query)) score += 30;
      if (deskripsi.includes(query)) score += 20;
      if (kat.includes(query)) score += 20;

      // Bonus points for multi-word matches
      const terms = query.split(/\s+/).filter((t) => t.length > 1);
      if (terms.length > 1) {
        let matchedTerms = 0;
        terms.forEach((term) => {
          if (judul.includes(term) || deskripsi.includes(term) || reg.includes(term)) {
            matchedTerms++;
          }
        });
        score += matchedTerms * 15;
      }

      return { report: r, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.report.dukungan_count - a.report.dukungan_count);

  const results = scored.map((s) => s.report);

  // Check if query specifically matches an exact code
  const isExactCodeMatch = Boolean(exactMatch) && (
    exactMatch?.tracking_code.toLowerCase() === query ||
    exactMatch?.id.toLowerCase() === query ||
    (cleanQuery.length >= 4 && exactMatch?.tracking_code.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanQuery)
  );

  res.json({
    status: "success",
    total: results.length,
    query,
    exactMatch: isExactCodeMatch && exactMatch ? toPublicReport(exactMatch) : null,
    isExactMatch: isExactCodeMatch,
    data: results.map(toPublicReport),
  });
});

// GET /api/v1/reports/:codeOrId
app.get("/api/v1/reports/:codeOrId", (req, res) => {
  const param = req.params.codeOrId.trim();
  const paramLower = param.toLowerCase();
  const cleanParam = paramLower.replace(/[^a-z0-9]/g, "");

  // 1. Try exact match on code, id, or cleaned code
  const exactReport = db.reports.find(
    (r) =>
      r.tracking_code.toLowerCase() === paramLower ||
      r.id.toLowerCase() === paramLower ||
      (cleanParam.length >= 4 && r.tracking_code.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanParam),
  );

  if (exactReport) {
    res.json({
      status: "success",
      exactMatch: toPublicReport(exactReport),
      data: toPublicReport(exactReport),
    });
    return;
  }

  // 2. Fallback to keyword search across all fields if exact match not found
  const matched = db.reports
    .map((r) => {
      let score = 0;
      const tc = r.tracking_code.toLowerCase();
      const judul = r.judul.toLowerCase();
      const deskripsi = r.deskripsi.toLowerCase();
      const reg = r.region_nama.toLowerCase();

      if (tc.includes(paramLower) || (cleanParam.length >= 4 && tc.replace(/[^a-z0-9]/g, "").includes(cleanParam))) score += 80;
      if (judul.includes(paramLower)) score += 60;
      if (reg.includes(paramLower)) score += 40;
      if (deskripsi.includes(paramLower)) score += 20;

      return { report: r, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matched.length > 0) {
    res.json({
      status: "success",
      exactMatch: matched.length === 1 ? toPublicReport(matched[0].report) : null,
      data: matched.length === 1 ? toPublicReport(matched[0].report) : matched.map((m) => toPublicReport(m.report)),
      totalMatches: matched.length,
    });
    return;
  }

  res.status(404).json({
    status: "error",
    message: `Laporan dengan kata kunci atau kode '${param}' tidak ditemukan. Coba gunakan kata kunci seperti 'pelebaran', 'Medan', atau kode TRG-2026-XXXXXX.`,
  });
});

// POST /api/v1/reports (Citizen submission)
app.post("/api/v1/reports", async (req, res) => {
  try {
    const {
      judul,
      deskripsi,
      kategori,
      region_id,
      sector_id,
      lat,
      lng,
      alamat,
      nama_pelapor,
      kontak,
      is_anonim,
      project_id,
      foto_bukti,
    } = req.body;

    if (typeof judul !== "string" || judul.length > 180 || typeof deskripsi !== "string" || deskripsi.length > 5000) {
      res.status(422).json({ status: "error", message: "Judul maksimal 180 karakter dan deskripsi maksimal 5.000 karakter." });
      return;
    }
    if (String(alamat || "").length > 250 || String(nama_pelapor || "").length > 120 || String(kontak || "").length > 100) {
      res.status(422).json({ status: "error", message: "Alamat, nama, atau kontak melebihi batas karakter." });
      return;
    }
    const latitude = lat === undefined || lat === null || lat === "" ? 3.5952 : Number(lat);
    const longitude = lng === undefined || lng === null || lng === "" ? 98.6722 : Number(lng);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      res.status(422).json({ status: "error", message: "Koordinat lokasi tidak valid." });
      return;
    }
    if (foto_bukti !== undefined && (!Array.isArray(foto_bukti) || foto_bukti.length > 5 || foto_bukti.some((photo: unknown) => typeof photo !== "string" || photo.length > 2_500_000))) {
      res.status(422).json({ status: "error", message: "Maksimal 5 foto bukti; ukuran tiap foto maksimal 2,5 MB." });
      return;
    }

    if (!judul || judul.trim().length < 5) {
      res.status(422).json({
        status: "error",
        message: "Judul laporan minimal 5 karakter.",
      });
      return;
    }
    if (!deskripsi || deskripsi.trim().length < 30) {
      res.status(422).json({
        status: "error",
        message:
          "Deskripsi laporan minimal 30 karakter agar dapat ditindaklanjuti.",
      });
      return;
    }
    if (!db.regions.some((region) => region.id === region_id) || !db.sectors.some((sector) => sector.id === sector_id)) {
      res.status(422).json({ status: "error", message: "Daerah atau sektor tidak terdaftar." });
      return;
    }
    if (project_id && !db.projects.some((project) => project.id === project_id)) {
      res.status(422).json({ status: "error", message: "Proyek yang dipilih tidak ditemukan." });
      return;
    }
    if (!region_id || !sector_id) {
      res
        .status(422)
        .json({ status: "error", message: "Daerah dan Sektor wajib dipilih." });
      return;
    }

    const { report, duplicateCheck } = db.createReport({
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      kategori: kategori || "jalan_rusak",
      region_id,
      sector_id,
      lat: latitude,
      lng: longitude,
      alamat: alamat || "Lokasi terdata",
      nama_pelapor: is_anonim ? "Warga Anonim" : nama_pelapor,
      kontak: kontak || "-",
      is_anonim: Boolean(is_anonim),
      project_id: project_id || null,
      foto_bukti,
    });

    // Run AI triage in background or synchronous
    const triage = await autoTriaseReport({
      judul: report.judul,
      deskripsi: report.deskripsi,
      lat: report.lat,
      lng: report.lng,
      kategori: report.kategori,
    });
    report.ai_urgensi = triage.urgensi;
    report.ai_ringkasan = triage.ringkasan;

    res.status(201).json({
      status: "success",
      message: "Laporan berhasil didaftarkan.",
      tracking_code: report.tracking_code,
      data: report,
      duplicate_warning: duplicateCheck.isDuplicate
        ? duplicateCheck.matchedReport
        : null,
    });
  } catch (err: any) {
    console.error("TERANG request failed:", err);
    res.status(500).json({ status: "error", message: "Permintaan belum dapat diproses. Silakan coba kembali." });
  }
});

// POST /api/v1/reports/:id/support (Upvote with fingerprint)
app.post("/api/v1/reports/:id/support", (req, res) => {
  const { fingerprint } = req.body;
  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const fp = fingerprint || `${ip}`;

  const result = db.supportReport(req.params.id, fp as string);
  if (!result.success) {
    res.status(409).json({
      status: "error",
      message: "Perangkat ini sudah memberikan dukungan untuk laporan ini.",
      dukungan_count: result.newCount,
    });
    return;
  }

  res.json({
    status: "success",
    message: "Dukungan berhasil ditambahkan.",
    dukungan_count: result.newCount,
  });
});

// GET /api/v1/transparency-scores
app.get("/api/v1/transparency-scores", (req, res) => {
  const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : 2024;
  const list = db.getTransparencyScores(tahun);

  res.json({
    status: "success",
    tahun,
    top5: list.slice(0, 5),
    bottom5: list.slice(-5).reverse(),
    data: list,
  });
});

// GET /api/v1/insights
app.get("/api/v1/insights", (req, res) => {
  const region_id = (req.query.region_id as string) || "all";
  const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : 2024;

  let projects = db.projects.filter((p) => p.tahun === tahun);
  if (region_id !== "all")
    projects = projects.filter((p) => p.region_id === region_id);

  // Risk scored projects
  const prioritized = projects
    .map((p) => {
      const repCount = db.reports.filter(
        (r) => r.project_id === p.id && r.status !== "ditolak",
      ).length;
      const gap = calculateGapIndicator(p, repCount);
      return {
        ...p,
        serapan_persen: calculateAbsorptionRate(p.realisasi, p.pagu),
        gap_indicator: gap,
        laporan_count: repCount,
      };
    })
    .sort((a, b) => b.gap_indicator.riskScore - a.gap_indicator.riskScore);

  // Automated rule-based narrative insights
  const lowSectors = db.budgets
    .filter(
      (b) =>
        b.tahun === tahun && (region_id === "all" || b.region_id === region_id),
    )
    .sort((a, b) => a.serapan_persen - b.serapan_persen);

  const highGapCount = prioritized.filter(
    (p) => p.gap_indicator.needsFieldVerification,
  ).length;

  res.json({
    status: "success",
    prioritized_projects: prioritized.slice(0, 15),
    rule_insights: [
      {
        kategori: "Serapan Sektor",
        ringkasan:
          lowSectors.length > 0
            ? `Sektor ${lowSectors[0].sector_nama} mencatat serapan paling rendah di angka ${lowSectors[0].serapan_persen}%.`
            : "Data serapan sedang dikompilasi.",
        tipe: "warning",
      },
      {
        kategori: "Indikator Kesenjangan",
        ringkasan: `Sebanyak ${highGapCount} proyek publik memiliki kesenjangan fisik vs keuangan signifikan (≥25 poin) dan perlu audit lapangan.`,
        tipe: highGapCount > 0 ? "danger" : "success",
      },
      {
        kategori: "Partisipasi Warga",
        ringkasan: `Terdapat ${db.reports.filter((r) => r.status === "selesai").length} dari ${db.reports.length} aduan publik yang telah berhasil diselesaikan instansi terkait.`,
        tipe: "info",
      },
    ],
  });
});

// GET /api/v1/compare
app.get("/api/v1/compare", (req, res) => {
  const regA = (req.query.region_a as string) || "reg-medan";
  const regB = (req.query.region_b as string) || "reg-deliserdang";
  const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : 2024;

  const result = toolBandingkanDaerah({
    daerah_a: regA,
    daerah_b: regB,
    tahun,
  });
  res.json({ status: "success", data: result });
});

// ==========================================
// AI REST ENDPOINTS (/api/ai/...)
// ==========================================

// POST /api/ai/chat (Tanya TERANG Chatbot)
app.post("/api/ai/chat", aiRateLimit, async (req, res) => {
  try {
    const { message } = req.body;
    if (typeof message !== "string" || message.length > 4000) {
      res.status(422).json({ status: "error", message: "Pesan harus berupa teks maksimal 4.000 karakter." });
      return;
    }
    if (!message.trim()) {
      res.status(422).json({ status: "error", message: "Pesan tidak boleh kosong." });
      return;
    }
    const answer = await askTanyaTerang(message);
    res.json({
      status: "success",
      ...answer,
    });
  } catch (err: any) {
    console.error("TERANG request failed:", err);
    res.status(500).json({ status: "error", message: "Permintaan belum dapat diproses. Silakan coba kembali." });
  }
});

// POST /api/ai/clarify-report
app.post("/api/ai/clarify-report", aiRateLimit, async (req, res) => {
  try {
    const { judul, deskripsi } = req.body;
    if (typeof judul !== "string" || typeof deskripsi !== "string" || judul.length > 180 || deskripsi.length > 5000) {
      res.status(422).json({ status: "error", message: "Judul dan deskripsi harus berupa teks; batasnya 180 dan 5.000 karakter." });
      return;
    }
    const result = await clarifyReportText({ judul, deskripsi });
    res.json({
      status: "success",
      data: result,
    });
  } catch (err: any) {
    console.error("TERANG request failed:", err);
    res.status(500).json({ status: "error", message: "Permintaan belum dapat diproses. Silakan coba kembali." });
  }
});

// POST /api/ai/narrative
app.post("/api/ai/narrative", aiRateLimit, async (req, res) => {
  try {
    const { region_id, tahun } = req.body;
    const result = await generateInsightNarrative({ region_id, tahun });
    res.json({
      status: "success",
      data: result,
    });
  } catch (err: any) {
    console.error("TERANG request failed:", err);
    res.status(500).json({ status: "error", message: "Permintaan belum dapat diproses. Silakan coba kembali." });
  }
});

// POST /api/ai/feedback
app.post("/api/ai/feedback", aiRateLimit, (req, res) => {
  const { nilai, fitur, komentar } = req.body;
  res.json({
    status: "success",
    message:
      "Terima kasih atas umpan balik Anda untuk penyempurnaan AI TERANG.",
  });
});

// ==========================================
// SUPERAGENT AUTONOMOUS ENDPOINTS (/api/agent/...)
// ==========================================

// GET /api/agent/status (Live SuperAgent state & logs)
app.get("/api/agent/status", (req, res) => {
  res.json({
    status: "success",
    autoPilotActive: db.agentAutoPilotActive,
    stats: db.agentStats,
    logs: db.agentLogs.slice(0, 50),
    kpis: db.getKPIStats(),
  });
});

// POST /api/agent/mission - SATU KLIK: menjalankan seluruh alur agen (data langsung -> pindai -> triase -> disposisi -> audit -> optimasi -> ringkasan)
app.post("/api/agent/mission", missionRateLimit, (req, res) => {
  if (process.env.AGENT_PUBLIC_RUN === "false" && !req.header("authorization")) {
    res.status(401).json({ status: "error", message: "Masuk sebagai pengelola untuk menjalankan SuperAgent." });
    return;
  }
  res.json({ status: "success", mission: startMission("manual") });
});

// GET /api/agent/mission - status langkah demi langkah (dipoll oleh antarmuka)
app.get("/api/agent/mission", (req, res) => {
  res.json({ status: "success", mission: getMissionState(), autoPilotActive: db.agentAutoPilotActive, stats: db.agentStats, logs: db.agentLogs.slice(0, 40) });
});

// GET /api/live/context - data lingkungan langsung (cuaca, gempa) beserta status tiap sumber
app.get("/api/live/context", async (req, res) => {
  try {
    res.json({ status: "success", data: await loadLiveContext() });
  } catch (err: any) {
    res.status(502).json({ status: "error", message: "Sumber data langsung tidak dapat dijangkau." });
  }
});

// POST /api/live/refresh - pemicu paksa pembaruan data langsung (dengan cooldown guard)
app.post("/api/live/refresh", async (req, res) => {
  try {
    const { source } = req.body || {};
    await forceRefreshLiveWorkers(source);
    res.json({ status: "success", message: "Sinkronisasi data langsung selesai.", data: await loadLiveContext() });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: "Gagal menyinkronkan data langsung." });
  }
});

// POST /api/agent/autopilot (Trigger 100% full scan)
app.post("/api/agent/autopilot", requireAdmin("super_admin", "verifikator"), aiRateLimit, async (req, res) => {
  try {
    const result = await runFullAutoPilotScan();
    res.json({
      status: "success",
      message: "Pemindaian & eksekusi SuperAgent 100% selesai.",
      data: result,
      logs: db.agentLogs.slice(0, 20),
    });
  } catch (err: any) {
    console.error("SuperAgent autopilot error:", err);
    res.status(500).json({ status: "error", message: "Gagal memproses eksekusi SuperAgent." });
  }
});

// POST /api/agent/auto-triage (Trigger auto-triage all pending reports)
app.post("/api/agent/auto-triage", requireAdmin("super_admin", "verifikator"), aiRateLimit, async (req, res) => {
  try {
    const result = await autoTriageAllPendingReports();
    res.json({
      status: "success",
      message: `${result.triaged_count} laporan aduan berhasil di-triase dan diverifikasi secara otomatis oleh SuperAgent.`,
      data: result,
    });
  } catch (err: any) {
    console.error("SuperAgent auto-triage error:", err);
    res.status(500).json({ status: "error", message: "Gagal memproses auto-triase SuperAgent." });
  }
});

// POST /api/agent/auto-dispatch (Trigger auto-dispatch agency response)
app.post("/api/agent/auto-dispatch", requireAdmin("super_admin", "verifikator"), aiRateLimit, async (req, res) => {
  try {
    const result = await autoDispatchAgencyNotice();
    res.json({
      status: "success",
      message: `${result.dispatched_count} nota dinas resmi berhasil diterbitkan secara otomatis.`,
      data: result,
    });
  } catch (err: any) {
    console.error("SuperAgent auto-dispatch error:", err);
    res.status(500).json({ status: "error", message: "Gagal memproses auto-dispatch SuperAgent." });
  }
});

// POST /api/agent/auto-optimize (Trigger budget auto-optimization)
app.post("/api/agent/auto-optimize", requireAdmin("super_admin", "verifikator"), aiRateLimit, async (req, res) => {
  try {
    const result = await autoOptimizeBudgetAllocation();
    res.json({
      status: "success",
      message: "Kalkulasi model optimasi APBD selesai.",
      data: result,
    });
  } catch (err: any) {
    console.error("SuperAgent auto-optimize error:", err);
    res.status(500).json({ status: "error", message: "Gagal mengoptimasi anggaran." });
  }
});

// POST /api/agent/toggle-autopilot
app.post("/api/agent/toggle-autopilot", requireAdmin("super_admin"), (req, res) => {
  const { active } = req.body;
  if (typeof active === "boolean") {
    db.agentAutoPilotActive = active;
  } else {
    db.agentAutoPilotActive = !db.agentAutoPilotActive;
  }
  db.addAgentLog({
    level: "info",
    module: "SUPERAGENT-CONTROL",
    message: `Mode Auto-Pilot 100% diubah menjadi: ${db.agentAutoPilotActive ? "AKTIF" : "NON-AKTIF"}.`,
  });
  res.json({
    status: "success",
    autoPilotActive: db.agentAutoPilotActive,
  });
});

// ==========================================
// ADMIN ENDPOINTS (/api/admin/...)
// ==========================================

// POST /api/admin/auth/login
app.post("/api/admin/auth/login", loginRateLimit, (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const user = DEMO_USERS[normalizedEmail];

  if (!user || typeof password !== "string" || password !== DEMO_PASSWORD) {
    res.status(401).json({
      status: "error",
      message: "Email atau kata sandi tidak valid. Gunakan akun demo TERANG.",
    });
    return;
  }

  res.json({
    status: "success",
    message: `Selamat datang, ${user.name}`,
    user,
    token: createAdminToken(user),
    expiresIn: 28800,
  });
});

// GET /api/admin/stats
app.get("/api/admin/stats", requireAdmin(), (req, res) => {
  const pending = db.reports.filter((r) => r.status === "diterima").length;
  const inProgress = db.reports.filter(
    (r) => r.status === "ditindaklanjuti",
  ).length;
  const verified = db.reports.filter((r) => r.status === "diverifikasi").length;
  const completed = db.reports.filter((r) => r.status === "selesai").length;

  res.json({
    status: "success",
    stats: {
      total_laporan: db.reports.length,
      menunggu_verifikasi: pending,
      diverifikasi: verified,
      ditindaklanjuti: inProgress,
      selesai: completed,
      rata_respon_hari: 2.1,
    },
    activity_logs: db.activityLogs.slice(0, 20),
  });
});

// POST /api/admin/reports/:id/verify
app.post("/api/admin/reports/:id/verify", requireAdmin("super_admin", "verifikator"), (req, res) => {
  const { catatan } = req.body;
  const adminUser = (req as any).adminUser;
  if (catatan !== undefined && (typeof catatan !== "string" || catatan.length > 2000)) {
    res.status(422).json({ status: "error", message: "Catatan verifikasi maksimal 2.000 karakter." });
    return;
  }
  const report = db.updateReportStatus({
    reportId: req.params.id,
    status: "diverifikasi",
    catatan:
      catatan ||
      "Laporan telah diverifikasi faktual dan memenuhi syarat administrasi.",
    petugas: adminUser.name,
    userEmail: adminUser.email,
    role: adminUser.role,
  });

  if (!report) {
    res
      .status(404)
      .json({ status: "error", message: "Laporan tidak ditemukan" });
    return;
  }
  res.json({ status: "success", data: report });
});

// POST /api/admin/reports/:id/reject
app.post("/api/admin/reports/:id/reject", requireAdmin("super_admin", "verifikator"), (req, res) => {
  const { alasan_tolak } = req.body;
  const adminUser = (req as any).adminUser;
  if (typeof alasan_tolak !== "string" || alasan_tolak.trim().length < 8 || alasan_tolak.length > 1000) {
    res
      .status(422)
      .json({ status: "error", message: "Alasan penolakan wajib diisi (8–1.000 karakter)." });
    return;
  }

  const report = db.updateReportStatus({
    reportId: req.params.id,
    status: "ditolak",
    alasanTolak: alasan_tolak,
    catatan: `Laporan ditolak: ${alasan_tolak}`,
    petugas: adminUser.name,
    userEmail: adminUser.email,
    role: adminUser.role,
  });

  if (!report) {
    res
      .status(404)
      .json({ status: "error", message: "Laporan tidak ditemukan" });
    return;
  }
  res.json({ status: "success", data: report });
});

// POST /api/admin/reports/:id/status
app.post("/api/admin/reports/:id/status", requireAdmin("super_admin", "verifikator", "instansi"), (req, res) => {
  const { status, catatan, foto_tindak_lanjut } = req.body;
  const adminUser = (req as any).adminUser;
  if (!["ditindaklanjuti", "selesai"].includes(status)) {
    res.status(422).json({ status: "error", message: "Status tindak lanjut tidak valid." });
    return;
  }
  if (catatan !== undefined && (typeof catatan !== "string" || catatan.length > 2000)) {
    res.status(422).json({ status: "error", message: "Catatan maksimal 2.000 karakter." });
    return;
  }
  const report = db.updateReportStatus({
    reportId: req.params.id,
    status,
    catatan: catatan || `Status laporan diperbarui menjadi ${status}.`,
    fotoTindakLanjut: typeof foto_tindak_lanjut === "string" && /^https:\/\//i.test(foto_tindak_lanjut) && foto_tindak_lanjut.length <= 1000 ? foto_tindak_lanjut : undefined,
    petugas: adminUser.name,
    userEmail: adminUser.email,
    role: adminUser.role,
  });

  if (!report) {
    res
      .status(404)
      .json({ status: "error", message: "Laporan tidak ditemukan" });
    return;
  }
  res.json({ status: "success", data: report });
});

// POST /api/admin/reports/:id/agency-response
app.post("/api/admin/reports/:id/agency-response", requireAdmin("super_admin", "instansi"), (req, res) => {
  const { instansi, pejabat, tanggapan } = req.body;
  const adminUser = (req as any).adminUser;
  if (typeof tanggapan !== "string" || !tanggapan.trim() || tanggapan.length > 5000 || String(instansi || "").length > 180 || String(pejabat || "").length > 180) {
    res
      .status(422)
      .json({ status: "error", message: "Tanggapan resmi wajib diisi." });
    return;
  }

  const report = db.addAgencyResponse({
    reportId: req.params.id,
    instansi: instansi || "Dinas PUPR Provinsi Sumatera Utara",
    pejabat: pejabat || "Kepala Bidang Pelaksanaan Jalan",
    tanggapan,
    userEmail: adminUser.email,
  });

  if (!report) {
    res
      .status(404)
      .json({ status: "error", message: "Laporan tidak ditemukan" });
    return;
  }
  res.json({ status: "success", data: report });
});

// POST /api/admin/import (CSV import via UI)
app.post("/api/admin/import", requireAdmin("super_admin"), (req, res) => {
  const { csvText, type } = req.body;
  if (typeof csvText !== "string" || !csvText.trim() || csvText.length > 8_000_000 || !["apbd", "proyek"].includes(type)) {
    res.status(422).json({
      status: "error",
      message: "Data CSV dan tipe import wajib disertakan.",
    });
    return;
  }

  // Temporary write to test/validate
  const tmpPath = path.join(process.cwd(), `tmp_${Date.now()}.csv`);
  try {
    fs.writeFileSync(tmpPath, csvText, "utf-8");
    const result = validateAndImportCSV(tmpPath, type);
    fs.unlinkSync(tmpPath);
    res.json({
      status: "success",
      message: `Impor berhasil: ${result.validRows} baris data berhasil dimasukkan.`,
      result,
    });
  } catch (err: any) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    res.status(400).json({ status: "error", message: err.message });
  }
});

// ==========================================
// VITE INTEGRATION & STATIC SERVING
// ==========================================

async function startServer() {
  if (!process.env.AUTH_SECRET) {
    console.warn("AUTH_SECRET belum diatur; sesi admin akan berakhir saat server dimulai ulang.");
  }
  if (!isProduction) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, "dist");
    app.use(
      express.static(distDir, {
        index: false,
        setHeaders: (res, filePath) => {
          // file hasil build (nama berhash) boleh di-cache lama; file lain selalu dicek ulang
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader(
              "Cache-Control",
              "public, max-age=31536000, immutable",
            );
          } else {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      }),
    );
    app.get("*", (req, res) => {
      // permintaan file (ada ekstensi) yang tidak ditemukan harus 404, bukan halaman HTML
      if (path.extname(req.path)) {
        res.status(404).send("Not found");
        return;
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  // Penjadwal otonom: menjalankan misi SuperAgent berkala selama Auto-Pilot aktif (minimal 60 detik agar tidak membebani API gratis)
  const intervalMs = Math.max(60_000, Number(process.env.SUPERAGENT_SCAN_INTERVAL_MS) || 300_000);
  if (process.env.SUPERAGENT_AUTOPILOT_DEFAULT === "false") db.agentAutoPilotActive = false;
  setInterval(() => {
    if (db.agentAutoPilotActive) startMission("scheduler");
  }, intervalMs).unref();

  app.listen(PORT, () => {
    console.log(
      `TERANG Server running on http://localhost:${PORT} in ${isProduction ? "production" : "development"} mode.`,
    );
  });
}

startServer();
