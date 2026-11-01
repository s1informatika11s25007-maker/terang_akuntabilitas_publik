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
} from './calculations';

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
