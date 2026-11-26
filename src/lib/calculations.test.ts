import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAbsorptionRate,
  calculateGapIndicator,
  calculateTransparencyScore,
  calculateDistanceMeters,
  calculateTextSimilarity,
  detectDuplicateReport,
  generateTrackingCode,
  isValidTrackingCode,
  validateReportStatusTransition,
  ReportStatus,
} from './calculations';
import { db, InvalidStatusTransitionError } from '../server/db';

test('calculateAbsorptionRate: returns accurate percentage bounded 0-100', () => {
  assert.equal(calculateAbsorptionRate(850000000, 1000000000), 85.0);
  assert.equal(calculateAbsorptionRate(0, 1000000000), 0);
  assert.equal(calculateAbsorptionRate(1200000000, 1000000000), 100);
  assert.equal(calculateAbsorptionRate(500000, 0), 0);
});

test('calculateGapIndicator: flags Perlu Verifikasi Lapangan when delta >= 25', () => {
  const result = calculateGapIndicator(
    {
      id: 'prj-1',
      pagu: 1000000000,
      realisasi: 950000000, // 95%
      progres_fisik: 60, // delta = 35% >= 25
      status: 'berjalan',
    },
    0
  );

  assert.equal(result.needsFieldVerification, true);
  assert.equal(result.financialProgress, 95);
  assert.equal(result.physicalProgress, 60);
  assert.equal(result.progressDelta, 35);
  assert.equal(result.level, 'Tinggi');
});

test('calculateGapIndicator: flags completed project with >= 3 verified reports', () => {
  const result = calculateGapIndicator(
    {
      id: 'prj-2',
      pagu: 500000000,
      realisasi: 500000000, // 100%
      progres_fisik: 100, // delta = 0
      status: 'selesai',
    },
    4 // >= 3 reports
  );

  assert.equal(result.needsFieldVerification, true);
  assert.equal(result.verifiedReportCount, 4);
});

test('calculateTransparencyScore: computes composite score and grade', () => {
  const score = calculateTransparencyScore(0.95, 2.5, 0.9);
  // kelengkapan: 0.95 * 40 = 38
  // respons: 2.5 <= 3 -> 30
  // penyelesaian: 0.9 * 30 = 27
  // total: 95 -> Grade A
  assert.equal(score.skor_kelengkapan, 38);
  assert.equal(score.skor_respons, 30);
  assert.equal(score.skor_penyelesaian, 27);
  assert.equal(score.skor_total, 95);
  assert.equal(score.grade, 'A');
});

test('calculateDistanceMeters: computes accurate distances in meters', () => {
  // Medan Merdeka Walk (-3.5913, 98.6756) to Pajak Ikan Lama (-3.5920, 98.6760) ~100m
  const dist = calculateDistanceMeters(3.5913, 98.6756, 3.592, 98.676);
  assert.ok(dist > 0 && dist < 200, `Expected ~100m distance, got ${dist}`);
});

test('calculateTextSimilarity: matches Indonesian keywords correctly', () => {
  const sim = calculateTextSimilarity(
    'Jalan rusak parah dan berlubang di jalan gatot subroto',
    'Jalan berlubang besar dan aspal rusak parah di gatot subroto'
  );
  assert.ok(sim >= 0.5, `Expected similarity >= 0.5, got ${sim}`);
});

test('detectDuplicateReport: flags nearby similar report within 200m radius', () => {
  const existing = [
    {
      id: 'rep-1',
      tracking_code: 'TRG-2026-X1Y2Z3',
      kategori: 'jalan_rusak',
      judul: 'Jalan Gatot Subroto Berlubang Bahayakan Pengendara',
      deskripsi: 'Aspal amblas sedalam 20cm dekat simpang barat',
      lat: 3.585,
      lng: 98.67,
    },
  ];

  const duplicate = detectDuplicateReport(
    {
      kategori: 'jalan_rusak',
      judul: 'Ada lubang aspal rusak di Gatot Subroto',
      deskripsi: 'Aspal amblas parah di jalan gatot subroto dekat simpang',
      lat: 3.5851, // within ~20m
      lng: 98.6701,
    },
    existing,
    200
  );

  assert.equal(duplicate.isDuplicate, true);
  assert.equal(duplicate.matchedReport?.tracking_code, 'TRG-2026-X1Y2Z3');
});

test('generateTrackingCode: produces valid TRG-2026-XXXXXX string', () => {
  const code = generateTrackingCode();
  assert.ok(isValidTrackingCode(code), `Generated code ${code} should match format`);
  assert.equal(isValidTrackingCode('INVALID-CODE'), false);
  assert.equal(isValidTrackingCode('TRG-2025-123456'), false);
});

test('validateReportStatusTransition: allows only valid report state transitions', () => {
  const validPairs: Array<[ReportStatus, ReportStatus]> = [
    ['diterima', 'diverifikasi'],
    ['diterima', 'ditolak'],
    ['diverifikasi', 'ditindaklanjuti'],
    ['ditindaklanjuti', 'selesai'],
  ];

  for (const [from, to] of validPairs) {
    const res = validateReportStatusTransition(from, to);
    assert.equal(res.valid, true, `Expected ${from} -> ${to} to be valid`);
  }

  const invalidPairs: Array<[ReportStatus, ReportStatus]> = [
    ['diterima', 'diterima'],
    ['diterima', 'ditindaklanjuti'],
    ['diterima', 'selesai'],
    ['diverifikasi', 'diterima'],
    ['diverifikasi', 'diverifikasi'],
    ['diverifikasi', 'ditolak'],
    ['diverifikasi', 'selesai'],
    ['ditindaklanjuti', 'diterima'],
    ['ditindaklanjuti', 'diverifikasi'],
    ['ditindaklanjuti', 'ditolak'],
    ['ditindaklanjuti', 'ditindaklanjuti'],
    ['selesai', 'diterima'],
    ['selesai', 'diverifikasi'],
    ['selesai', 'ditindaklanjuti'],
    ['selesai', 'ditolak'],
    ['selesai', 'selesai'],
    ['ditolak', 'diterima'],
    ['ditolak', 'diverifikasi'],
    ['ditolak', 'ditindaklanjuti'],
    ['ditolak', 'selesai'],
    ['ditolak', 'ditolak'],
  ];

  for (const [from, to] of invalidPairs) {
    const res = validateReportStatusTransition(from, to);
    assert.equal(res.valid, false, `Expected ${from} -> ${to} to be invalid`);
    assert.ok(res.message && res.message.length > 0);
  }
});

test('db.updateReportStatus: enforces valid transitions and throws 409 on invalid transitions', () => {
  const initialReportsCount = db.reports.length;
  const initialLogsCount = db.activityLogs.length;

  const { report: createdA } = db.createReport({
    region_id: 'reg-medan',
    sector_id: 'sec-pupr',
    kategori: 'jalan_rusak',
    judul: 'Uji State Machine Jalur Normal',
    deskripsi: 'Deskripsi uji coba transisi status laporan warga yang lengkap.',
    lat: 3.5952,
    lng: 98.6722,
    alamat: 'Medan',
  });

  const { report: createdB } = db.createReport({
    region_id: 'reg-medan',
    sector_id: 'sec-pupr',
    kategori: 'jalan_rusak',
    judul: 'Uji State Machine Jalur Tolak',
    deskripsi: 'Deskripsi uji coba transisi penolakan laporan warga yang lengkap.',
    lat: 3.5952,
    lng: 98.6722,
    alamat: 'Medan',
  });

  try {
    // Invalid jump: diterima -> selesai
    assert.throws(
      () =>
        db.updateReportStatus({
          reportId: createdA.id,
          status: 'selesai',
          catatan: 'Loncat',
          petugas: 'Tester',
          userEmail: 'admin@terang.test',
          role: 'super_admin',
        }),
      (err: any) => err instanceof InvalidStatusTransitionError && err.statusCode === 409
    );

    // Valid chain: diterima -> diverifikasi -> ditindaklanjuti -> selesai
    const verified = db.updateReportStatus({
      reportId: createdA.id,
      status: 'diverifikasi',
      catatan: 'Verifikasi ok',
      petugas: 'Verifikator',
      userEmail: 'verifikator@terang.test',
      role: 'verifikator',
    });
    assert.equal(verified?.status, 'diverifikasi');

    // Invalid: diverifikasi -> ditolak
    assert.throws(
      () =>
        db.updateReportStatus({
          reportId: createdA.id,
          status: 'ditolak',
          catatan: 'Tolak terlambat',
          petugas: 'Verifikator',
          userEmail: 'verifikator@terang.test',
          role: 'verifikator',
        }),
      (err: any) => err instanceof InvalidStatusTransitionError && err.statusCode === 409
    );

    const followedUp = db.updateReportStatus({
      reportId: createdA.id,
      status: 'ditindaklanjuti',
      catatan: 'Sedang dikerjakan',
      petugas: 'Instansi',
      userEmail: 'instansi@terang.test',
      role: 'instansi',
    });
    assert.equal(followedUp?.status, 'ditindaklanjuti');

    const completed = db.updateReportStatus({
      reportId: createdA.id,
      status: 'selesai',
      catatan: 'Selesai',
      petugas: 'Instansi',
      userEmail: 'instansi@terang.test',
      role: 'instansi',
    });
    assert.equal(completed?.status, 'selesai');

    // Invalid from terminal state selesai
    assert.throws(
      () =>
        db.updateReportStatus({
          reportId: createdA.id,
          status: 'ditindaklanjuti',
          catatan: 'Mundur',
          petugas: 'Instansi',
          userEmail: 'instansi@terang.test',
          role: 'instansi',
        }),
      (err: any) => err instanceof InvalidStatusTransitionError && err.statusCode === 409
    );

    // Valid: diterima -> ditolak, then terminal
    const rejected = db.updateReportStatus({
      reportId: createdB.id,
      status: 'ditolak',
      alasanTolak: 'Lokasi tidak ditemukan di wilayah terdaftar',
      catatan: 'Ditolak',
      petugas: 'Verifikator',
      userEmail: 'verifikator@terang.test',
      role: 'verifikator',
    });
    assert.equal(rejected?.status, 'ditolak');

    assert.throws(
      () =>
        db.updateReportStatus({
          reportId: createdB.id,
          status: 'diverifikasi',
          catatan: 'Buka kembali',
          petugas: 'Verifikator',
          userEmail: 'verifikator@terang.test',
          role: 'verifikator',
        }),
      (err: any) => err instanceof InvalidStatusTransitionError && err.statusCode === 409
    );
  } finally {
    db.cancelPendingSave();
    db.reports = db.reports.filter((r) => r.id !== createdA.id && r.id !== createdB.id);
    if (db.activityLogs.length > initialLogsCount) {
      db.activityLogs.splice(0, db.activityLogs.length - initialLogsCount);
    }
    assert.equal(db.reports.length, initialReportsCount);
  }
});
