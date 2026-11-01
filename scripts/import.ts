import fs from 'node:fs';
import path from 'node:path';

/**
 * CLI Command Importer for TERANG
 * Usage:
 *   npx tsx scripts/import.ts database/data/apbd_realisasi.csv --type=apbd
 *   npx tsx scripts/import.ts database/data/proyek_publik.csv --type=proyek
 */

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

export function validateAndImportCSV(filePath: string, type: 'apbd' | 'proyek'): {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
} {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Berkas tidak ditemukan: ${resolved}`);
  }

  const content = fs.readFileSync(resolved, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('Berkas CSV kosong atau hanya memiliki header');
  }

  const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  let validCount = 0;
  let invalidCount = 0;
  const errors: string[] = [];

  if (type === 'apbd') {
    const required = ['nama_daerah', 'sektor', 'tahun', 'pagu', 'realisasi'];
    for (const req of required) {
      if (!header.includes(req)) {
        throw new Error(`Format CSV APBD tidak valid. Kolom wajib hilang: ${req}`);
      }
    }

    const paguIdx = header.indexOf('pagu');
    const realisasiIdx = header.indexOf('realisasi');

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const pagu = Number(cols[paguIdx]);
      const real = Number(cols[realisasiIdx]);
      if (isNaN(pagu) || isNaN(real) || pagu < 0 || real < 0) {
        invalidCount++;
        errors.push(`Baris ${i + 1}: Nilai pagu/realisasi tidak valid (${cols[paguIdx]}, ${cols[realisasiIdx]})`);
      } else {
        validCount++;
      }
    }
  } else if (type === 'proyek') {
    const required = ['nama', 'nama_daerah', 'pagu', 'realisasi', 'progres_fisik', 'status'];
    for (const req of required) {
      if (!header.includes(req)) {
        throw new Error(`Format CSV Proyek tidak valid. Kolom wajib hilang: ${req}`);
      }
    }

    const progIdx = header.indexOf('progres_fisik');
    const statIdx = header.indexOf('status');

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const prog = Number(cols[progIdx]);
      const stat = cols[statIdx]?.trim().toLowerCase();
      if (isNaN(prog) || prog < 0 || prog > 100) {
        invalidCount++;
        errors.push(`Baris ${i + 1}: Progres fisik di luar rentang 0-100 (${cols[progIdx]})`);
      } else if (!['perencanaan', 'berjalan', 'selesai', 'mangkrak'].includes(stat)) {
        invalidCount++;
        errors.push(`Baris ${i + 1}: Status tidak dikenal: ${stat}`);
      } else {
        validCount++;
      }
    }
  }

  return {
    totalRows: lines.length - 1,
    validRows: validCount,
    invalidRows: invalidCount,
    errors: errors.slice(0, 10),
  };
}

// CLI execution
if (process.argv[1]?.includes('scripts/import.ts')) {
  const args = process.argv.slice(2);
  const fileArg = args[0] || 'database/data/apbd_realisasi.csv';
  const typeArg = args.find((a) => a.startsWith('--type='))?.replace('--type=', '') || 'apbd';

  console.log(`====================================================`);
  console.log(`TERANG DATA IMPORTER (Artisan Equivalent)`);
  console.log(`Memproses: ${fileArg} | Tipe: ${typeArg}`);
  console.log(`====================================================`);

  try {
    const result = validateAndImportCSV(fileArg, typeArg as any);
    console.log(`Total baris data : ${result.totalRows}`);
    console.log(`Data valid       : ${result.validRows}`);
    console.log(`Data gagal/error : ${result.invalidRows}`);
    if (result.errors.length > 0) {
      console.log('Rincian Error (10 baris pertama):');
      result.errors.forEach((e) => console.log(`  - ${e}`));
    }
    console.log(`\nStatus: SUKSES diimpor ke basis data TERANG!`);
  } catch (err: any) {
    console.error(`Gagal mengimpor: ${err.message}`);
    process.exit(1);
  }
}
