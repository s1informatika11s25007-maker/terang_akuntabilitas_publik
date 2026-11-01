/**
 * Core business logic and calculations for TERANG platform
 * (Transparansi, Evaluasi, Respons, Akuntabilitas Nusantara)
 */

export interface ProjectData {
  id: string;
  pagu: number;
  realisasi: number;
  progres_fisik: number;
  status: 'perencanaan' | 'berjalan' | 'selesai' | 'mangkrak';
  lat?: number;
  lng?: number;
}

export interface ReportItem {
  id: string;
  tracking_code: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  lat: number;
  lng: number;
  status: 'diterima' | 'diverifikasi' | 'ditindaklanjuti' | 'selesai' | 'ditolak';
  created_at: string;
  verified_at?: string;
  completed_at?: string;
}

/**
 * Serapan (%) = (Realisasi / Pagu) * 100
 */
export function calculateAbsorptionRate(realisasi: number, pagu: number): number {
  if (!pagu || pagu <= 0) return 0;
  const rate = (realisasi / pagu) * 100;
  return Number(Math.min(Math.max(rate, 0), 100).toFixed(2));
}

export type GapLevel = 'Rendah' | 'Sedang' | 'Tinggi';

export interface GapIndicatorResult {
  needsFieldVerification: boolean;
  level: GapLevel;
  financialProgress: number;
  physicalProgress: number;
  progressDelta: number;
  verifiedReportCount: number;
  riskScore: number; // 0 - 100
  reasons: string[];
}

/**
 * Indikator Kesenjangan Proyek:
 * Tandai "Perlu Verifikasi Lapangan" bila:
 * (status = 'selesai' ATAU realisasi >= 90%) DAN
 * (jumlah laporan terverifikasi >= 3 ATAU progres_fisik jauh di bawah progres keuangan, selisih >= 25 poin)
 */
export function calculateGapIndicator(
  project: ProjectData,
  verifiedReportCount: number = 0
): GapIndicatorResult {
  const financialProgress = calculateAbsorptionRate(project.realisasi, project.pagu);
  const physicalProgress = Math.max(0, Math.min(100, project.progres_fisik || 0));
  const progressDelta = Number((financialProgress - physicalProgress).toFixed(2));

  const reasons: string[] = [];
  const isHighFinancialOrCompleted = project.status === 'selesai' || financialProgress >= 90;
  const hasMultipleReports = verifiedReportCount >= 3;
  const hasSeverePhysicalLag = progressDelta >= 25;

  let needsFieldVerification = false;
  if (isHighFinancialOrCompleted && (hasMultipleReports || hasSeverePhysicalLag)) {
    needsFieldVerification = true;
  }

  if (project.status === 'mangkrak') {
    needsFieldVerification = true;
    reasons.push('Proyek berstatus mangkrak');
  }

  if (hasSeverePhysicalLag) {
    reasons.push(`Kesenjangan progres fisik terlambat ${progressDelta}% dari serapan keuangan`);
  }

  if (hasMultipleReports) {
    reasons.push(`Terdapat ${verifiedReportCount} laporan warga terverifikasi`);
  }

  if (isHighFinancialOrCompleted && physicalProgress < 70 && project.status === 'selesai') {
    reasons.push('Proyek dilaporkan selesai namun progres fisik di bawah 70%');
  }

  // Calculate composite risk score 0 - 100
  let riskScore = 0;
  if (progressDelta > 0) {
    riskScore += Math.min(progressDelta * 1.5, 45);
  }
  riskScore += Math.min(verifiedReportCount * 12, 35);
  if (project.status === 'mangkrak') riskScore += 25;
  if (project.status === 'selesai' && physicalProgress < 85) riskScore += 20;
  riskScore = Math.min(Math.round(riskScore), 100);

  let level: GapLevel = 'Rendah';
  if (riskScore >= 60 || (needsFieldVerification && progressDelta >= 30)) {
    level = 'Tinggi';
  } else if (riskScore >= 30 || needsFieldVerification || verifiedReportCount >= 1) {
    level = 'Sedang';
  }

  return {
    needsFieldVerification,
    level,
    financialProgress,
    physicalProgress,
    progressDelta,
    verifiedReportCount,
    riskScore,
    reasons,
  };
}

export interface TransparencyScoreResult {
  skor_total: number; // 0 - 100
  skor_kelengkapan: number; // 0 - 40
  skor_respons: number; // 0 - 30
  skor_penyelesaian: number; // 0 - 30
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
}

/**
 * Skor Transparansi daerah (0-100) =
 * 40% kelengkapan data proyek (kolom terisi) +
 * 30% kecepatan respons (rata-rata hari dari diterima ke diverifikasi/ditindaklanjuti) +
 * 30% rasio laporan selesai.
 *
 * @param completenessRatio 0.0 to 1.0 (proporsi kolom terisi pada proyek)
 * @param avgResponseDays rata-rata hari tanggap (ideal <= 3 hari = nilai penuh 30)
 * @param completionRatio 0.0 to 1.0 (rasio laporan selesai / total laporan terverifikasi)
 */
export function calculateTransparencyScore(
  completenessRatio: number,
  avgResponseDays: number,
  completionRatio: number
): TransparencyScoreResult {
  // 1. Skor kelengkapan: max 40
  const normCompleteness = Math.min(Math.max(completenessRatio, 0), 1);
  const skor_kelengkapan = Number((normCompleteness * 40).toFixed(1));

  // 2. Skor respons: max 30.
  // 1-3 hari: 30 poin. > 14 hari: mendekati 0.
  let skor_respons = 0;
  if (avgResponseDays <= 0) {
    skor_respons = 25; // default reasonable benchmark
  } else if (avgResponseDays <= 3) {
    skor_respons = 30;
  } else if (avgResponseDays <= 7) {
    skor_respons = 30 - ((avgResponseDays - 3) / 4) * 10; // 30 down to 20
  } else if (avgResponseDays <= 14) {
    skor_respons = 20 - ((avgResponseDays - 7) / 7) * 12; // 20 down to 8
  } else {
    skor_respons = Math.max(2, 8 - (avgResponseDays - 14) * 0.5);
  }
  skor_respons = Number(Math.min(Math.max(skor_respons, 0), 30).toFixed(1));

  // 3. Skor penyelesaian: max 30
  const normCompletion = Math.min(Math.max(completionRatio, 0), 1);
  const skor_penyelesaian = Number((normCompletion * 30).toFixed(1));

  const skor_total = Number(
    Math.min(100, Math.max(0, skor_kelengkapan + skor_respons + skor_penyelesaian)).toFixed(1)
  );

  let grade: 'A' | 'B' | 'C' | 'D' | 'E' = 'C';
  if (skor_total >= 85) grade = 'A';
  else if (skor_total >= 70) grade = 'B';
  else if (skor_total >= 55) grade = 'C';
  else if (skor_total >= 40) grade = 'D';
  else grade = 'E';

  return {
    skor_total,
    skor_kelengkapan,
    skor_respons,
    skor_penyelesaian,
    grade,
  };
}

/**
 * Haversine distance in meters between two lat/lng coordinates
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Simple word-token Jaccard / Cosine similarity for Indonesian text
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const words1 = new Set(
    text1
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const words2 = new Set(
    text2
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  return Number((intersection / union).toFixed(2));
}

/**
 * Deteksi duplikat laporan:
 * Kemiripan teks + radius <= 200m + kategori sama
 */
export function detectDuplicateReport(
  newReport: { judul: string; deskripsi: string; kategori: string; lat: number; lng: number },
  existingReports: Array<{ id: string; tracking_code: string; judul: string; deskripsi: string; kategori: string; lat: number; lng: number }>,
  radiusMeters: number = 200
): { isDuplicate: boolean; matchedReport?: { id: string; tracking_code: string; distance: number; textSimilarity: number } } {
  for (const report of existingReports) {
    if (report.kategori.toLowerCase() !== newReport.kategori.toLowerCase()) continue;

    const distance = calculateDistanceMeters(newReport.lat, newReport.lng, report.lat, report.lng);
    if (distance <= radiusMeters) {
      const combined1 = `${newReport.judul} ${newReport.deskripsi}`;
      const combined2 = `${report.judul} ${report.deskripsi}`;
      const textSimilarity = calculateTextSimilarity(combined1, combined2);

      // If within 200m and shares > 35% text keywords or has very close distance <= 50m
      if (textSimilarity >= 0.35 || distance <= 50) {
        return {
          isDuplicate: true,
          matchedReport: {
            id: report.id,
            tracking_code: report.tracking_code,
            distance,
            textSimilarity,
          },
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Generate unique tracking code format TRG-2026-XXXXXX
 */
export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TRG-2026-${randomPart}`;
}

/**
 * Validate tracking code pattern
 */
export function isValidTrackingCode(code: string): boolean {
  return /^TRG-2026-[A-Z0-9]{6}$/.test(code.trim().toUpperCase());
}
