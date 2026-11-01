import { db } from './db.js';
import { calculateGapIndicator } from '../lib/calculations.js';
import {
  autoDispatchAgencyNotice,
  autoOptimizeBudgetAllocation,
  autoTriageAllPendingReports,
  generateBriefText,
} from './aiService.js';
import { loadLiveContext, projectEnvContext, LiveContext } from './liveData.js';

export type StepStatus = 'pending' | 'running' | 'done' | 'warn' | 'error';

export interface MissionStep {
  id: 'ingest' | 'scan' | 'triage' | 'dispatch' | 'audit' | 'optimize' | 'brief';
  label: string;
  status: StepStatus;
  detail: string;
  durationMs?: number;
}

export interface PriorityProject {
  id: string;
  nama: string;
  daerah: string;
  risiko: string;
  gap: number;
  keputusan: 'eskalasi-audit' | 'pantau-cuaca' | 'pantau';
  alasan: string;
  konteks: string;
}

export interface MissionState {
  running: boolean;
  runId: number;
  trigger: 'manual' | 'scheduler';
  startedAt: string | null;
  finishedAt: string | null;
  steps: MissionStep[];
  live: LiveContext | null;
  priorities: PriorityProject[];
  metrics: {
    scannedProjects: number;
    anomalies: number;
    escalated: number;
    triaged: number;
    needsHuman: number;
    dispatched: number;
    reallocation: string;
  } | null;
  brief: { text: string; driver: 'gemini' | 'template' } | null;
  recommendations: Array<{ sector: string; currentAbsorption: string; deltaPercent: string; rationale: string }>;
}

const STEP_DEFS: Array<Pick<MissionStep, 'id' | 'label'>> = [
  { id: 'ingest', label: 'Sinkronisasi data real-time (Open-Meteo, USGS, BMKG TEWS Workers)' },
  { id: 'scan', label: 'Pindai proyek & nilai risiko berbasis cuaca/gempa' },
  { id: 'triage', label: 'Triase laporan warga (dengan gerbang keyakinan)' },
  { id: 'dispatch', label: 'Terbitkan disposisi & nota dinas ke instansi' },
  { id: 'audit', label: 'Eskalasi nota audit ke Inspektorat' },
  { id: 'optimize', label: 'Hitung rekomendasi realokasi anggaran' },
  { id: 'brief', label: 'Susun ringkasan eksekutif' },
];

function freshState(runId: number, trigger: 'manual' | 'scheduler'): MissionState {
  return {
    running: true,
    runId,
    trigger,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    steps: STEP_DEFS.map((s) => ({ ...s, status: 'pending', detail: 'Menunggu' })),
    live: null,
    priorities: [],
    metrics: null,
    brief: null,
    recommendations: [],
  };
}

let state: MissionState = {
  running: false,
  runId: 0,
  trigger: 'manual',
  startedAt: null,
  finishedAt: null,
  steps: STEP_DEFS.map((s) => ({ ...s, status: 'pending', detail: 'Belum dijalankan' })),
  live: null,
  priorities: [],
  metrics: null,
  brief: null,
  recommendations: [],
};

export function getMissionState(): MissionState {
  return state;
}

async function runStep<T>(id: MissionStep['id'], fn: () => Promise<{ detail: string; warn?: boolean; value: T }>): Promise<T | null> {
  const step = state.steps.find((s) => s.id === id)!;
  step.status = 'running';
  step.detail = 'Sedang berjalan...';
  const t0 = Date.now();
  try {
    const out = await fn();
    step.status = out.warn ? 'warn' : 'done';
    step.detail = out.detail;
    step.durationMs = Date.now() - t0;
    return out.value;
  } catch (e: any) {
    step.status = 'error';
    step.detail = `Gagal: ${e?.message || 'kesalahan tak terduga'}. Langkah berikutnya tetap dilanjutkan.`;
    step.durationMs = Date.now() - t0;
    db.addAgentLog({ level: 'warn', module: 'SUPERAGENT-MISSION', message: `Langkah ${id} gagal: ${e?.message || 'error'}` });
    return null;
  }
}

/** Menjalankan seluruh alur agen sekali jalan. Aman dipanggil berulang: bila sedang berjalan, dikembalikan status yang ada. */
export function startMission(trigger: 'manual' | 'scheduler' = 'manual'): MissionState {
  if (state.running) return state;
  state = freshState(state.runId + 1, trigger);
  void executeMission();
  return state;
}

async function executeMission() {
  const runId = state.runId;
  db.agentStats.totalScans++;
  db.agentStats.lastScanAt = new Date().toISOString();
  db.addAgentLog({ level: 'action', module: 'SUPERAGENT-MISSION', message: `Misi #${runId} dimulai (${state.trigger === 'manual' ? 'sekali klik' : 'terjadwal'}).` });

  // 1. Data langsung
  const live = await runStep('ingest', async () => {
    const ctx = await loadLiveContext();
    const ok = ctx.sources.filter((s) => s.state !== 'offline').length;
    return {
      value: ctx,
      warn: ok < ctx.sources.length,
      detail: `${ok}/${ctx.sources.length} sumber aktif - ${Object.keys(ctx.rain).length} daerah cuaca, ${ctx.quakes.length} gempa di Sumut (30 hari).${ok < ctx.sources.length ? ' Sumber yang offline diabaikan, analisis memakai data internal.' : ''}`,
    };
  });
  state.live = live;
  const ctx: LiveContext = live || { generatedAt: new Date().toISOString(), sources: [], rain: {}, quakes: [], bmkgLatest: null, bmkgDirasakan: [], bmkgM5: [] };

  // 2. Pindai proyek + konteks lingkungan
  const priorities = await runStep('scan', async () => {
    const list: PriorityProject[] = [];
    for (const p of db.projects) {
      const reps = db.reports.filter((r) => r.project_id === p.id && r.status !== 'ditolak').length;
      const gap = calculateGapIndicator(p, reps);
      if (!(gap.needsFieldVerification || gap.level === 'Tinggi' || p.status === 'mangkrak')) continue;
      const env = projectEnvContext(p, ctx);
      let keputusan: PriorityProject['keputusan'] = 'eskalasi-audit';
      let alasan = 'Deviasi progres tinggi tanpa penjelasan lingkungan - perlu uji petik.';
      if (env.weatherVerdict === 'cuaca-ekstrem' && p.status !== 'mangkrak') {
        keputusan = 'pantau-cuaca';
        alasan = 'Curah hujan ekstrem dapat menjelaskan sebagian keterlambatan; dipantau dan diverifikasi ulang setelah cuaca membaik.';
      } else if (env.nearbyQuakes > 0) {
        alasan = 'Ada gempa M≥4 di sekitar lokasi; periksa kemungkinan kerusakan struktural selain deviasi progres.';
      } else if (env.weatherVerdict === 'tidak-diketahui') {
        keputusan = 'pantau';
        alasan = 'Data cuaca tidak tersedia; ditandai untuk pemantauan, bukan eskalasi otomatis.';
      }
      list.push({
        id: p.id,
        nama: p.nama,
        daerah: p.region_nama,
        risiko: gap.level,
        gap: gap.progressDelta,
        keputusan,
        alasan,
        konteks: env.note,
      });
    }
    list.sort((a, b) => Number(b.keputusan === 'eskalasi-audit') - Number(a.keputusan === 'eskalasi-audit') || b.gap - a.gap);
    const esc = list.filter((x) => x.keputusan === 'eskalasi-audit').length;
    return { value: list, detail: `${db.projects.length} proyek dipindai - ${list.length} anomali, ${esc} diprioritaskan untuk audit, ${list.length - esc} dipantau (konteks cuaca/data).` };
  });
  state.priorities = priorities || [];

  // 3. Triase laporan
  const triage = await runStep('triage', async () => {
    const r = await autoTriageAllPendingReports();
    return {
      value: r,
      warn: r.needs_human_count > 0,
      detail: `${r.pending_count} laporan menunggu - ${r.triaged_count} terverifikasi otomatis, ${r.needs_human_count} diteruskan ke verifikator manusia (bukti kurang).`,
    };
  });

  // 4. Disposisi
  const dispatch = await runStep('dispatch', async () => {
    const r = await autoDispatchAgencyNotice();
    return { value: r, detail: `${r.dispatched_count} nota dinas/disposisi diterbitkan ke instansi terkait.` };
  });

  // 5. Audit eskalasi
  const escalated = await runStep('audit', async () => {
    const top = state.priorities.filter((x) => x.keputusan === 'eskalasi-audit').slice(0, 5);
    for (const t of top) {
      db.addAgentLog({
        level: 'warn',
        module: 'AUTO-AUDIT-DISPATCH',
        message: `[NOTA AUDIT] Inspektorat diminta uji petik "${t.nama}" (${t.daerah}). Deviasi ${t.gap}%. ${t.konteks}`,
        details: { projectId: t.id, risk: t.risiko },
      });
    }
    return { value: top.length, detail: top.length ? `${top.length} proyek prioritas dieskalasi ke Inspektorat.` : 'Tidak ada proyek yang memenuhi syarat eskalasi.' };
  });

  // 6. Optimasi
  const opt = await runStep('optimize', async () => {
    const r = await autoOptimizeBudgetAllocation();
    return { value: r, detail: `${r.recommendations.length} rekomendasi realokasi dihitung dari data APBD (potensi ${r.estimatedReallocation}).` };
  });
  state.recommendations = opt?.recommendations || [];

  // 7. Ringkasan eksekutif
  const metrics = {
    scannedProjects: db.projects.length,
    anomalies: state.priorities.length,
    escalated: escalated || 0,
    triaged: triage?.triaged_count || 0,
    needsHuman: triage?.needs_human_count || 0,
    dispatched: dispatch?.dispatched_count || 0,
    reallocation: opt?.estimatedReallocation || '-',
  };
  state.metrics = metrics;
  const brief = await runStep('brief', async () => {
    const offline = state.live?.sources.filter((s) => s.state === 'offline').map((s) => s.nama) || [];
    const template = `Misi #${runId}: ${metrics.scannedProjects} proyek dipindai, ${metrics.anomalies} anomali, ${metrics.escalated} dieskalasi ke Inspektorat. ${metrics.triaged} laporan warga diverifikasi otomatis, ${metrics.needsHuman} menunggu verifikator manusia, ${metrics.dispatched} disposisi terbit. Potensi realokasi anggaran ${metrics.reallocation} (rekomendasi).${offline.length ? ` Catatan: sumber ${offline.join(', ')} tidak dapat dijangkau sehingga tidak dipakai.` : ''}`;
    const ai = await generateBriefText(`Ringkas hasil misi pengawasan APBD Sumut berikut menjadi paragraf eksekutif: ${template}`);
    return { value: { text: ai || template, driver: (ai ? 'gemini' : 'template') as 'gemini' | 'template' }, detail: ai ? 'Ringkasan disusun oleh Gemini dari angka hasil misi.' : 'Ringkasan disusun dari template (Gemini tidak aktif).' };
  });
  state.brief = brief;

  db.agentStats.zeroDelayActions += metrics.triaged + metrics.dispatched + metrics.escalated;
  state.running = false;
  state.finishedAt = new Date().toISOString();
  db.addAgentLog({ level: 'success', module: 'SUPERAGENT-MISSION', message: `Misi #${runId} selesai: ${metrics.triaged} triase, ${metrics.dispatched} disposisi, ${metrics.escalated} eskalasi audit.` });
}
