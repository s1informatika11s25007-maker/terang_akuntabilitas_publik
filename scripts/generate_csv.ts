import fs from 'node:fs';
import path from 'node:path';
import { BUDGETS } from '../src/data/budgetsData';
import { PROJECTS } from '../src/data/projectsData';
import { REGIONS } from '../src/data/regionsData';
import { SUMUT_GEOJSON } from '../src/data/geoJsonSumut';

const dataDir = path.resolve(process.cwd(), 'database/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Generate apbd_realisasi.csv
let apbdCsv = 'id,kode_bps,nama_daerah,sektor,tahun,pagu,realisasi,serapan_persen,sumber\n';
for (const b of BUDGETS) {
  const reg = REGIONS.find((r) => r.id === b.region_id);
  const kodeBps = reg ? reg.kode_bps : '1200';
  apbdCsv += `"${b.id}","${kodeBps}","${b.region_nama}","${b.sector_nama}",${b.tahun},${b.pagu},${b.realisasi},${b.serapan_persen},"${b.sumber}"\n`;
}
fs.writeFileSync(path.join(dataDir, 'apbd_realisasi.csv'), apbdCsv, 'utf-8');
console.log(`Generated apbd_realisasi.csv with ${BUDGETS.length} rows`);

// 2. Generate proyek_publik.csv
let projCsv = 'id,kode,nama,deskripsi,nama_daerah,sektor,lokasi_nama,lat,lng,pagu,realisasi,progres_fisik,status,kontraktor,tahun,sumber_data\n';
for (const p of PROJECTS) {
  const cleanDesk = p.deskripsi.replace(/"/g, '""');
  projCsv += `"${p.id}","${p.kode}","${p.nama}","${cleanDesk}","${p.region_nama}","${p.sector_nama}","${p.lokasi_nama}",${p.lat},${p.lng},${p.pagu},${p.realisasi},${p.progres_fisik},"${p.status}","${p.kontraktor}",${p.tahun},"${p.sumber_data}"\n`;
}
fs.writeFileSync(path.join(dataDir, 'proyek_publik.csv'), projCsv, 'utf-8');
console.log(`Generated proyek_publik.csv with ${PROJECTS.length} rows`);

// 3. Generate kabkota_sumut.geojson
fs.writeFileSync(path.join(dataDir, 'kabkota_sumut.geojson'), JSON.stringify(SUMUT_GEOJSON, null, 2), 'utf-8');
console.log(`Generated kabkota_sumut.geojson with ${SUMUT_GEOJSON.features.length} features`);
