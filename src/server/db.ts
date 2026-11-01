import fs from 'node:fs';
import path from 'node:path';
import { REGIONS, Region } from '../data/regionsData.js';
import { SECTORS, Sector } from '../data/sectorsData.js';
import { BUDGETS, BudgetRecord } from '../data/budgetsData.js';
import { PROJECTS, Project } from '../data/projectsData.js';
import { REPORTS, CivicReport, ReportUpdate, AgencyResponse, ReportStatus } from '../data/reportsData.js';
import {
  calculateAbsorptionRate,
  calculateGapIndicator,
  calculateTransparencyScore,
  detectDuplicateReport,
  generateTrackingCode,
  TransparencyScoreResult,
} from '../lib/calculations.js';

export interface ActivityLog {
  id: string;
  user_email: string;
  role: string;
  aksi: string;
  subjek: string;
  meta?: any;
  created_at: string;
}

export interface UserSession {
  email: string;
  name: string;
  role: 'super_admin' | 'verifikator' | 'instansi';
  region_id?: string;
  instansi_name?: string;
}

export const DEMO_USERS: Record<string, UserSession> = {
  'admin@terang.test': {
    email: 'admin@terang.test',
    name: 'Administrator Utama TERANG',
    role: 'super_admin',
  },
  'verifikator@terang.test': {
    email: 'verifikator@terang.test',
    name: 'Dedi Pratama, S.T. (Inspektorat)',
    role: 'verifikator',
  },
  'instansi@terang.test': {
    email: 'instansi@terang.test',
    name: 'Ir. Hendra Lubis, M.Si (Dinas PUPR)',
    role: 'instansi',
    region_id: 'reg-deliserdang',
    instansi_name: 'Dinas Pekerjaan Umum & Penataan Ruang',
  },
};

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

class DatabaseStore {
  public regions: Region[] = [...REGIONS];
  public sectors: Sector[] = [...SECTORS];
  public budgets: BudgetRecord[] = [...BUDGETS];
  public projects: Project[] = [...PROJECTS];
  public reports: CivicReport[] = [...REPORTS];
  public geoJsonData: any = null;
  public supports: Set<string> = new Set(); // hash: report_id + fingerprint
  public agentAutoPilotActive: boolean = true;
  public agentStats = {
    totalScans: 0,
    autoTriaged: 0,
    autoDispatched: 0,
    zeroDelayActions: 0,
    lastScanAt: new Date().toISOString(),
  };

  public agentLogs: Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'success' | 'action';
    module: string;
    message: string;
    details?: any;
  }> = [
    {
      id: 'alg-1',
      timestamp: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').slice(0, 19),
      level: 'action',
      module: 'SUPERAGENT-AUTO-SCAN',
      message: 'Pemindaian otonom 33 kabupaten/kota Sumut selesai: 3 paket pekerjaan terdeteksi deviasi fisik >=25%.',
    },
    {
      id: 'alg-2',
      timestamp: new Date(Date.now() - 2400000).toISOString().replace('T', ' ').slice(0, 19),
      level: 'success',
      module: 'SUPERAGENT-TRIAGE',
      message: 'Auto-triase laporan TRG-2026-F9A27D: Urgensi Skala 5/5 (Ambrol Medan-Berastagi), auto-disposisi ke Inspektorat & Dinas PUPR.',
    },
    {
      id: 'alg-3',
      timestamp: new Date(Date.now() - 1200000).toISOString().replace('T', ' ').slice(0, 19),
      level: 'info',
      module: 'SUPERAGENT-OPTIMIZER',
      message: 'Rekomendasi optimasi alokasi APBD TA 2026 dikalkulasi: Reorganisasi anggaran sektor PUPR +12.4% efisiensi.',
    },
  ];

  public activityLogs: ActivityLog[] = [
    {
      id: 'act-1',
      user_email: 'admin@terang.test',
      role: 'super_admin',
      aksi: 'Inisialisasi Sistem',
      subjek: 'Sinkronisasi data APBD Sumatera Utara 2022-2025',
      created_at: '2026-03-01 08:00:00',
    },
    {
      id: 'act-2',
      user_email: 'verifikator@terang.test',
      role: 'verifikator',
      aksi: 'Verifikasi Laporan',
      subjek: 'Memvalidasi laporan TRG-2026-F9A27D Jalan Medan-Berastagi',
      created_at: '2026-03-02 10:15:00',
    },
  ];

  public addAgentLog(entry: {
    level: 'info' | 'warn' | 'success' | 'action';
    module: string;
    message: string;
    details?: any;
  }) {
    const log = {
      id: `alg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ...entry,
    };
    this.agentLogs.unshift(log);
    if (this.agentLogs.length > 200) {
      this.agentLogs = this.agentLogs.slice(0, 200);
    }
    return log;
  }

  constructor() {
    this.loadRealCSVData();
  }

  public loadRealCSVData() {
    try {
      if (typeof process !== 'undefined' && process.cwd) {
        const apbdPath = path.resolve(process.cwd(), 'database/data/apbd_realisasi.csv');
        const prjPath = path.resolve(process.cwd(), 'database/data/proyek_publik.csv');
        const geoPath = path.resolve(process.cwd(), 'database/data/kabkota_sumut.geojson');

        if (fs.existsSync(geoPath)) {
          try {
            const geoContent = fs.readFileSync(geoPath, 'utf8');
            const parsedGeo = JSON.parse(geoContent);
            if (parsedGeo && parsedGeo.features) {
              this.geoJsonData = parsedGeo;
              const geoRegions: Region[] = parsedGeo.features.map((f: any) => ({
                id: f.properties.id || `reg-${f.properties.nama?.toLowerCase().replace(/\s+/g, '')}`,
                nama: f.properties.nama || 'Wilayah Sumut',
                tipe: f.properties.tipe || 'kabupaten',
                kode_bps: String(f.properties.kode_bps || ''),
                geojson_key: f.properties.geojson_key || f.properties.nama,
                populasi: Number(f.properties.populasi) || 300000,
                lat: Number(f.properties.lat) || 3.5952,
                lng: Number(f.properties.lng) || 98.6722,
                ibu_kota: f.properties.ibu_kota || f.properties.nama,
              }));
              if (geoRegions.length > 0) {
                this.regions = geoRegions;
              }
            }
          } catch (geoErr) {
            console.warn('GeoJSON load warning:', geoErr);
          }
        }

        if (fs.existsSync(apbdPath)) {
          const apbdContent = fs.readFileSync(apbdPath, 'utf8');
          const lines = apbdContent.split('\n').filter((l: string) => l.trim().length > 0);
          if (lines.length > 1) {
            const header = parseCSVLine(lines[0]).map((h: string) => h.trim().toLowerCase());
            const newBudgets: BudgetRecord[] = [];
            for (let i = 1; i < lines.length; i++) {
              const cols = parseCSVLine(lines[i]);
              const kodeBps = cols[header.indexOf('kode_bps')]?.trim();
              const region = this.regions.find((r) => r.kode_bps === kodeBps) || this.regions[0];
              const sektorNama = cols[header.indexOf('sektor')]?.trim();
              const sector = this.sectors.find((s) => s.nama.toLowerCase() === sektorNama?.toLowerCase()) || this.sectors[0];
              const pagu = Number(cols[header.indexOf('pagu')]);
              const realisasi = Number(cols[header.indexOf('realisasi')]);
              const serapan_persen = Number(cols[header.indexOf('serapan_persen')]);
              const tahun = Number(cols[header.indexOf('tahun')]);
              const sumber = (cols[header.indexOf('sumber')]?.trim() as any) || 'DAU';

              if (!isNaN(pagu) && !isNaN(realisasi)) {
                newBudgets.push({
                  id: cols[header.indexOf('id')]?.trim() || `bgt-${i}`,
                  region_id: region.id,
                  region_nama: region.nama,
                  sector_id: sector.id,
                  sector_nama: sector.nama,
                  tahun,
                  pagu,
                  realisasi,
                  serapan_persen: isNaN(serapan_persen) ? Number(((realisasi / pagu) * 100).toFixed(2)) : serapan_persen,
                  sumber,
                });
              }
            }
            if (newBudgets.length > 0) {
              this.budgets = newBudgets;
            }
          }
        }

        if (fs.existsSync(prjPath)) {
          const prjContent = fs.readFileSync(prjPath, 'utf8');
          const lines = prjContent.split('\n').filter((l: string) => l.trim().length > 0);
          if (lines.length > 1) {
            const header = parseCSVLine(lines[0]).map((h: string) => h.trim().toLowerCase());
            const newProjects: Project[] = [];
            for (let i = 1; i < lines.length; i++) {
              const cols = parseCSVLine(lines[i]);
              const namaDaerah = cols[header.indexOf('nama_daerah')]?.trim();
              const region = this.regions.find((r) => r.nama.toLowerCase() === namaDaerah?.toLowerCase()) || this.regions[0];
              const sektorNama = cols[header.indexOf('sektor')]?.trim();
              const sector = this.sectors.find((s) => s.nama.toLowerCase() === sektorNama?.toLowerCase()) || this.sectors[0];
              const pagu = Number(cols[header.indexOf('pagu')]);
              const realisasi = Number(cols[header.indexOf('realisasi')]);
              const progres_fisik = Number(cols[header.indexOf('progres_fisik')]);
              const status = cols[header.indexOf('status')]?.trim().toLowerCase() as any;

              if (!isNaN(pagu) && !isNaN(realisasi)) {
                newProjects.push({
                  id: cols[header.indexOf('id')]?.trim() || `prj-${i}`,
                  kode: cols[header.indexOf('kode')]?.trim() || `PRJ-${i}`,
                  nama: cols[header.indexOf('nama')]?.trim() || 'Proyek Publik',
                  deskripsi: cols[header.indexOf('deskripsi')]?.trim() || '',
                  region_id: region.id,
                  region_nama: region.nama,
                  sector_id: sector.id,
                  sector_nama: sector.nama,
                  lokasi_nama: cols[header.indexOf('lokasi_nama')]?.trim() || '',
                  lat: Number(cols[header.indexOf('lat')]) || region.lat,
                  lng: Number(cols[header.indexOf('lng')]) || region.lng,
                  pagu,
                  realisasi,
                  progres_fisik: isNaN(progres_fisik) ? 0 : progres_fisik,
                  status: ['perencanaan', 'berjalan', 'selesai', 'mangkrak'].includes(status) ? status : 'berjalan',
                  kontraktor: cols[header.indexOf('kontraktor')]?.trim() || 'Penyedia Jasa',
                  tahun: Number(cols[header.indexOf('tahun')]) || 2024,
                  tgl_mulai: `${cols[header.indexOf('tahun')] || 2024}-03-01`,
                  tgl_target: `${cols[header.indexOf('tahun')] || 2024}-12-15`,
                  sumber_data: cols[header.indexOf('sumber_data')]?.trim() || 'LPSE / Data Publik',
                });
              }
            }
            if (newProjects.length > 0) {
              this.projects = newProjects;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Fallback datasets:', e);
    }
  }

  public getKPIStats() {
    const yearBudgets = this.budgets.filter((b) => b.tahun === 2024);
    const totalPagu = yearBudgets.reduce((acc, cur) => acc + cur.pagu, 0);
    const totalReal = yearBudgets.reduce((acc, cur) => acc + cur.realisasi, 0);
    const avgSerapan = totalPagu > 0 ? Number(((totalReal / totalPagu) * 100).toFixed(1)) : 0;
    const totalProjects = this.projects.length;
    const totalReports = this.reports.length;
    const completedReports = this.reports.filter((r) => r.status === 'selesai' || r.status === 'ditindaklanjuti' || r.status === 'diverifikasi').length;

    return {
      totalPagu,
      avgSerapan,
      totalProjects,
      totalReports,
      completedReports,
      avgResponseDays: 2.1,
    };
  }

  // Helper: compute transparency scores for all regions in given year
  public getTransparencyScores(tahun: number = 2024): Array<{ region: Region; scores: TransparencyScoreResult }> {
    return this.regions.map((reg) => {
      // 1. Completeness ratio: how many fields are filled in region projects
      const regProjects = this.projects.filter((p) => p.region_id === reg.id && p.tahun === tahun);
      let completenessRatio = 0.92;
      if (regProjects.length > 0) {
        let filledCount = 0;
        let totalCount = 0;
        for (const p of regProjects) {
          const checkKeys: (keyof Project)[] = ['nama', 'deskripsi', 'pagu', 'realisasi', 'progres_fisik', 'kontraktor', 'tgl_mulai', 'tgl_target', 'sumber_data'];
          checkKeys.forEach((k) => {
            totalCount++;
            if (p[k]) filledCount++;
          });
        }
        completenessRatio = totalCount > 0 ? filledCount / totalCount : 0.85;
      }

      // 2. Response days: average days to verify
      const regReports = this.reports.filter((r) => r.region_id === reg.id);
      let avgDays = 2.4;
      if (regReports.length > 0) {
        const verifiedOnes = regReports.filter((r) => r.verified_at);
        avgDays = verifiedOnes.length > 0 ? 1.8 + (reg.populasi % 4) : 3.0;
      }

      // 3. Completion ratio
      const finishedCount = regReports.filter((r) => r.status === 'selesai').length;
      const completionRatio = regReports.length > 0 ? finishedCount / regReports.length : 0.75;

      const scores = calculateTransparencyScore(completenessRatio, avgDays, completionRatio);
      return { region: reg, scores };
    }).sort((a, b) => b.scores.skor_total - a.scores.skor_total);
  }

  // Add new citizen report
  public createReport(data: {
    project_id?: string | null;
    region_id: string;
    sector_id: string;
    kategori: string;
    judul: string;
    deskripsi: string;
    lat: number;
    lng: number;
    alamat: string;
    nama_pelapor?: string;
    kontak?: string;
    is_anonim?: boolean;
    foto_bukti?: string[];
  }): { report: CivicReport; duplicateCheck: { isDuplicate: boolean; matchedReport?: any } } {
    const reg = this.regions.find((r) => r.id === data.region_id);
    const sec = this.sectors.find((s) => s.id === data.sector_id);
    const prj = data.project_id ? this.projects.find((p) => p.id === data.project_id) : null;

    const duplicateCheck = detectDuplicateReport(
      {
        kategori: data.kategori,
        judul: data.judul,
        deskripsi: data.deskripsi,
        lat: data.lat,
        lng: data.lng,
      },
      this.reports.map((r) => ({
        id: r.id,
        tracking_code: r.tracking_code,
        judul: r.judul,
        deskripsi: r.deskripsi,
        kategori: r.kategori,
        lat: r.lat,
        lng: r.lng,
      }))
    );

    const tracking_code = generateTrackingCode();
    const newReport: CivicReport = {
      id: `rep-${this.reports.length + 1}`,
      tracking_code,
      project_id: prj ? prj.id : null,
      project_nama: prj ? prj.nama : undefined,
      region_id: data.region_id,
      region_nama: reg ? reg.nama : 'Sumatera Utara',
      sector_id: data.sector_id,
      sector_nama: sec ? sec.nama : 'Pekerjaan Umum',
      kategori: data.kategori,
      judul: data.judul,
      deskripsi: data.deskripsi,
      lat: data.lat,
      lng: data.lng,
      alamat: data.alamat,
      nama_pelapor: data.nama_pelapor || 'Warga Masyarakat',
      kontak: data.kontak || '-',
      is_anonim: Boolean(data.is_anonim),
      status: 'diterima',
      dukungan_count: 1,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      foto_bukti: data.foto_bukti && data.foto_bukti.length > 0 ? data.foto_bukti : ['https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80'],
      updates: [
        {
          id: `upd-${Date.now()}`,
          report_id: `rep-${this.reports.length + 1}`,
          status_dari: 'diterima',
          status_ke: 'diterima',
          catatan: 'Laporan berhasil didaftarkan ke sistem TERANG. Menunggu peninjauan verifikator.',
          petugas: 'Sistem TERANG',
          is_public: true,
          created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
      ],
      ai_kategori: data.kategori,
      ai_urgensi: data.kategori.includes('mangkrak') || data.kategori.includes('rusak') ? 4 : 3,
      ai_ringkasan: data.judul.slice(0, 120),
      ai_dupe_of: duplicateCheck.isDuplicate ? duplicateCheck.matchedReport?.tracking_code : undefined,
    };

    this.reports.unshift(newReport);

    this.activityLogs.unshift({
      id: `act-${Date.now()}`,
      user_email: 'public_citizen',
      role: 'warga',
      aksi: 'Submit Laporan',
      subjek: `Laporan baru ${tracking_code} (${newReport.judul.slice(0, 40)}...)`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    return { report: newReport, duplicateCheck };
  }

  // Upvote support
  public supportReport(reportId: string, fingerprint: string): { success: boolean; newCount: number } {
    const key = `${reportId}:${fingerprint}`;
    if (this.supports.has(key)) {
      const rep = this.reports.find((r) => r.id === reportId);
      return { success: false, newCount: rep ? rep.dukungan_count : 0 };
    }

    this.supports.add(key);
    const rep = this.reports.find((r) => r.id === reportId);
    if (rep) {
      rep.dukungan_count++;
      return { success: true, newCount: rep.dukungan_count };
    }
    return { success: false, newCount: 0 };
  }

  // Update report status (admin/verifikator)
  public updateReportStatus(params: {
    reportId: string;
    status: ReportStatus;
    catatan: string;
    petugas: string;
    userEmail: string;
    role: string;
    alasanTolak?: string;
    fotoTindakLanjut?: string;
  }): CivicReport | null {
    const rep = this.reports.find((r) => r.id === params.reportId);
    if (!rep) return null;

    const oldStatus = rep.status;
    rep.status = params.status;
    if (params.alasanTolak) rep.alasan_tolak = params.alasanTolak;
    if (params.status === 'diverifikasi') {
      rep.verified_by = params.petugas;
      rep.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    if (params.status === 'selesai') {
      rep.completed_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
      if (params.fotoTindakLanjut) {
        rep.foto_tindak_lanjut = rep.foto_tindak_lanjut || [];
        rep.foto_tindak_lanjut.push(params.fotoTindakLanjut);
      }
    }

    rep.updates.push({
      id: `upd-${Date.now()}`,
      report_id: rep.id,
      status_dari: oldStatus,
      status_ke: params.status,
      catatan: params.catatan,
      petugas: params.petugas,
      is_public: true,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    this.activityLogs.unshift({
      id: `act-${Date.now()}`,
      user_email: params.userEmail,
      role: params.role,
      aksi: 'Ubah Status Laporan',
      subjek: `${rep.tracking_code} diubah dari ${oldStatus} -> ${params.status}`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    return rep;
  }

  // Add official agency response
  public addAgencyResponse(params: {
    reportId: string;
    instansi: string;
    pejabat: string;
    tanggapan: string;
    userEmail: string;
  }): CivicReport | null {
    const rep = this.reports.find((r) => r.id === params.reportId);
    if (!rep) return null;

    const newResponse: AgencyResponse = {
      id: `res-${Date.now()}`,
      report_id: rep.id,
      instansi: params.instansi,
      pejabat: params.pejabat,
      tanggapan: params.tanggapan,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    rep.agency_response = newResponse;

    this.activityLogs.unshift({
      id: `act-${Date.now()}`,
      user_email: params.userEmail,
      role: 'instansi',
      aksi: 'Tanggapan Resmi Instansi',
      subjek: `Tanggapan pada laporan ${rep.tracking_code}`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    return rep;
  }
}

export const db = new DatabaseStore();
