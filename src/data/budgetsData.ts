import { REGIONS } from './regionsData.js';
import { SECTORS } from './sectorsData.js';

export interface BudgetRecord {
  id: string;
  region_id: string;
  region_nama: string;
  sector_id: string;
  sector_nama: string;
  tahun: number;
  pagu: number;
  realisasi: number;
  serapan_persen: number;
  sumber: 'PAD' | 'DAU' | 'DAK' | 'DBH';
}

// Generate deterministic realistic APBD data for 2022 - 2025
export const BUDGETS: BudgetRecord[] = [];

const YEARS = [2022, 2023, 2024, 2025];
const SOURCES: Array<'PAD' | 'DAU' | 'DAK' | 'DBH'> = ['PAD', 'DAU', 'DAK', 'DBH'];

// Baseline sector budget weights
const SECTOR_WEIGHTS: Record<string, number> = {
  'sec-pupr': 0.28,
  'sec-pendidikan': 0.22,
  'sec-kesehatan': 0.18,
  'sec-perkim': 0.10,
  'sec-pertanian': 0.08,
  'sec-perhubungan': 0.05,
  'sec-lingkungan': 0.04,
  'sec-sosial': 0.03,
  'sec-pariwisata': 0.02,
};

// Seed budgets
let idCounter = 1;
for (const reg of REGIONS) {
  // Region total APBD scale based on population and economic tier
  // Medan has ~6.5 Trillion, Deli Serdang ~4.2T, smaller reg ~1.1T - 1.8T
  const baseAPBD = Math.round((reg.populasi * 1800000 + 750000000000) / 10000000) * 10000000;

  for (const year of YEARS) {
    // Inflation / growth factor over years
    const growth = 1 + (year - 2022) * 0.045;
    const yearAPBD = Math.round(baseAPBD * growth);

    for (const sec of SECTORS) {
      const weight = SECTOR_WEIGHTS[sec.id] || 0.05;
      const pagu = Math.round((yearAPBD * weight) / 1000000) * 1000000;

      // Realistic realization: historically 74% to 94%
      // 2025 is current year, so ~68% - 84%
      let baseSerapan = 0.84;
      if (year === 2022) baseSerapan = 0.88;
      if (year === 2023) baseSerapan = 0.86;
      if (year === 2024) baseSerapan = 0.89;
      if (year === 2025) baseSerapan = 0.76;

      // Sector-specific variances (PUPR often lags due to land acquisition)
      const secMod = sec.id === 'sec-pupr' ? -0.06 : sec.id === 'sec-kesehatan' ? 0.04 : 0;
      // Region variance using charCode seed
      const regMod = ((reg.nama.charCodeAt(0) + reg.nama.charCodeAt(reg.nama.length - 1)) % 15 - 7) / 100;
      
      const rate = Math.min(0.98, Math.max(0.55, baseSerapan + secMod + regMod));
      const realisasi = Math.round(pagu * rate / 100000) * 100000;
      const serapan_persen = Number(((realisasi / pagu) * 100).toFixed(2));
      const sumber = SOURCES[(reg.populasi + year + sec.nama.length) % SOURCES.length];

      BUDGETS.push({
        id: `bgt-${idCounter++}`,
        region_id: reg.id,
        region_nama: reg.nama,
        sector_id: sec.id,
        sector_nama: sec.nama,
        tahun: year,
        pagu,
        realisasi,
        serapan_persen,
        sumber,
      });
    }
  }
}

export function filterBudgets(params: {
  tahun?: number;
  region_id?: string;
  sector_id?: string;
}): BudgetRecord[] {
  return BUDGETS.filter((b) => {
    if (params.tahun && b.tahun !== params.tahun) return false;
    if (params.region_id && params.region_id !== 'all' && b.region_id !== params.region_id) return false;
    if (params.sector_id && params.sector_id !== 'all' && b.sector_id !== params.sector_id) return false;
    return true;
  });
}
