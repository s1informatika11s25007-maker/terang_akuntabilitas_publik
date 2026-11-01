import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PageMotion } from '../components/PageMotion';
import { REGIONS } from '../data/regionsData';
import {
  Zap, CheckCircle2, Loader2, AlertTriangle, XCircle, Circle, CloudRain, Activity,
  ShieldCheck, FileText, Radio, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon, ExternalLink, MapPin, Search, X
} from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
  onSelectProject: (projectId: string) => void;
  onSelectReport: (code: string) => void;
  authToken?: string;
}

const regionName = (id: string) => REGIONS.find((r) => r.id === id)?.nama || id;

const STATE_STYLE: Record<string, string> = {
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cache: 'bg-amber-50 text-amber-700 border-amber-200',
  offline: 'bg-slate-100 text-slate-500 border-slate-200',
};
const STATE_LABEL: Record<string, string> = { live: 'Langsung', cache: 'Cache', offline: 'Offline' };

const KEPUTUSAN: Record<string, { label: string; cls: string }> = {
  'eskalasi-audit': { label: 'Eskalasi audit', cls: 'bg-red-50 text-red-700 border-red-200' },
  'pantau-cuaca': { label: 'Pantau (cuaca)', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  pantau: { label: 'Pantau', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function StepIcon({ status }: { status: string }) {
  if (status === 'running') return <Loader2 className="w-5 h-5 text-[#0B7C8A] mission-spinner" />;
  if (status === 'done') return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
  if (status === 'warn') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
  return <Circle className="w-5 h-5 text-slate-300" />;
}

export const AgentAutomationView: React.FC<Props> = ({ onNavigate, onSelectProject, authToken }) => {
  const [mission, setMission] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [autoPilot, setAutoPilot] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');
  const [directLive, setDirectLive] = useState<any>(null);
  const [showAllRain, setShowAllRain] = useState<boolean>(false);
  const [searchWorkerRegion, setSearchWorkerRegion] = useState<string>('');
  const [bmkgTab, setBmkgTab] = useState<'autogempa' | 'dirasakan' | 'm5'>('autogempa');
  const [selectedShakemapUrl, setSelectedShakemapUrl] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const fetchDirectLive = useCallback(async () => {
    try {
      const res = await fetch('/api/live/context');
      const json = await res.json();
      if (json.data) setDirectLive(json.data);
    } catch {
      /* silent */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/mission');
      const json = await res.json();
      setMission(json.mission);
      setLogs(json.logs || []);
      setStats(json.stats || null);
      setAutoPilot(!!json.autoPilotActive);
      return json.mission;
    } catch {
      setError('Tidak dapat terhubung ke server. Pastikan server berjalan.');
      return null;
    }
  }, []);

  const poll = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    const tick = async () => {
      const m = await load();
      if (m?.running) timer.current = window.setTimeout(tick, 800);
    };
    void tick();
  }, [load]);

  const run = useCallback(async () => {
    if (mission?.running) return;
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/agent/mission', { method: 'POST', headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setNotice(json.message || 'Agen Otonom sedang berjalan. Silakan tunggu sebentar.');
          return;
        }
        setError(json.message || 'Agen Otonom tidak dapat dijalankan.');
        return;
      }
      setMission(json.mission);
      poll();
    } catch {
      setError('Tidak dapat terhubung ke server.');
    }
  }, [authToken, poll, mission?.running]);

  useEffect(() => {
    void fetchDirectLive();
    let auto = false;
    try {
      auto = sessionStorage.getItem('terang_autorun') === '1';
      sessionStorage.removeItem('terang_autorun');
    } catch { /* penyimpanan dinonaktifkan */ }
    if (auto) void run();
    else poll();
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [run, poll, fetchDirectLive]);

  const toggleAutoPilot = async () => {
    setNotice('');
    if (!authToken) {
      setNotice('Masuk sebagai pengelola (super admin) untuk mengubah mode Auto-Pilot.');
      return;
    }
    const res = await fetch('/api/agent/toggle-autopilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ active: !autoPilot }),
    });
    const json = await res.json();
    if (!res.ok) setNotice(json.message || 'Tidak diizinkan.');
    else setAutoPilot(!!json.autoPilotActive);
  };

  const running = !!mission?.running;
  const finished = !!mission?.finishedAt;
  const live = mission?.live || directLive;

  const rainList = live?.rain ? (Object.values(live.rain) as any[]) : [];
  const sortedRain = [...rainList].sort((a, b) => b.past14mm - a.past14mm);

  // Filtering worker data by user query
  const query = searchWorkerRegion.trim().toLowerCase();
  const filteredRain = sortedRain.filter((r: any) => {
    if (!query) return true;
    const name = (r.regionNama || regionName(r.regionId)).toLowerCase();
    const desc = (r.weatherDesc || '').toLowerCase();
    return name.includes(query) || desc.includes(query);
  });
  const wettest = (query ? filteredRain : sortedRain).slice(0, 5);
  const displayRain = showAllRain || query ? filteredRain : wettest;

  return (
    <PageMotion page="agent-automation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Kepala halaman */}
      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#0B7C8A]">
            <Radio className="w-3.5 h-3.5" /> Agen Otonom · Pengawasan APBD Sumatera Utara
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">Satu klik, seluruh alur pengawasan berjalan.</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Agen menarik data cuaca dan gempa langsung dari BMKG, USGS, dan Open-Meteo melalui background worker independen, menilai proyek yang tertinggal dengan konteks lingkungan,
            memverifikasi laporan warga yang buktinya cukup, lalu menerbitkan disposisi. Kasus yang meragukan selalu diteruskan ke verifikator manusia.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 shrink-0 lg:w-64">
          <button
            onClick={run}
            disabled={running}
            className="px-6 py-4 rounded-2xl bg-[#0B7C8A] hover:bg-[#096A76] disabled:opacity-70 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-teal-900/10 transition-colors cursor-pointer"
          >
            {running ? <Loader2 className="w-5 h-5 mission-spinner" /> : <Activity className="w-5 h-5 text-white" />}
            {running ? 'Agen Otonom Bekerja...' : finished ? 'Jalankan Ulang' : 'Jalankan Agen Otonom'}
          </button>
          <div className="flex items-center justify-between text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-slate-600">Auto-Pilot Terjadwal</span>
            <button
              onClick={toggleAutoPilot}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                autoPilot ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {autoPilot ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>
        </div>
      </section>

      {(error || notice) && (
        <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          {error || notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Alur Otonom */}
        <section className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold font-display text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-[#0B7C8A]" /> Alur Pengawasan Otonom</h2>
          <ol className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {(mission?.steps || []).map((s: any, i: number) => {
              const isDone = s.status === 'done';
              const isRunning = s.status === 'running';
              return (
                <li key={s.id} className="relative group">
                  {/* Stepper Pipeline Dot & Connector */}
                  <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all bg-white z-10 ${
                    isDone ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
                    isRunning ? 'border-[#0B7C8A] bg-teal-50 text-[#0B7C8A] animate-pulse' :
                    'border-slate-300 text-slate-300'
                  }`}>
                    <StepIcon status={s.status} />
                  </div>

                  <div className={`rounded-2xl p-3.5 border transition-all ${
                    isRunning ? 'bg-teal-50/80 border-teal-200 shadow-xs' :
                    isDone ? 'bg-slate-50/80 border-slate-200/80' : 'bg-slate-50/30 border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{i + 1}. {s.label}</p>
                      {typeof s.durationMs === 'number' && <span className="text-[11px] text-slate-400 font-mono shrink-0">{(s.durationMs / 1000).toFixed(1)} dtk</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.detail}</p>
                  </div>
                </li>
              );
            })}
            {!mission && <li className="text-sm text-slate-500 px-3 py-6">Memuat status...</li>}
          </ol>
        </section>

        {/* Sumber data langsung & Background Worker Status */}
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2"><CloudRain className="w-4 h-4 text-[#0B7C8A]" /> Data langsung (Workers)</h2>
          </div>

          {!live && <p className="text-sm text-slate-500">Memuat status background workers...</p>}
          {live && (
            <>
              {/* Status 3 Worker API */}
              <ul className="space-y-2">
                {live.sources.map((s: any) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{s.nama}</p>
                      <p className="text-slate-500 truncate text-[11px]">{s.note}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${STATE_STYLE[s.state]}`}>{STATE_LABEL[s.state]}</span>
                  </li>
                ))}
              </ul>

              {/* Pencarian Daerah / Wilayah pada Worker Data */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <label htmlFor="search-worker-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Filter Wilayah / Daerah Worker
                </label>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="search-worker-input"
                    type="text"
                    value={searchWorkerRegion}
                    onChange={(e) => setSearchWorkerRegion(e.target.value)}
                    placeholder="Ketik nama kabupaten/kota (misal: Medan, Karo, Samosir)..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#0B7C8A] focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                  />
                  {searchWorkerRegion && (
                    <button
                      type="button"
                      onClick={() => setSearchWorkerRegion('')}
                      className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                      title="Bersihkan pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Open-Meteo Curah Hujan 33 Kab/Kota Sumut */}
              {sortedRain.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800">
                      Open-Meteo: Curah Hujan {query ? `("${searchWorkerRegion}")` : '14 Hari'} ({filteredRain.length} daerah)
                    </p>
                    {!query && (
                      <button
                        onClick={() => setShowAllRain(!showAllRain)}
                        className="text-[11px] font-semibold text-[#0B7C8A] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        {showAllRain ? 'Tutup' : 'Semua 33 Kab/Kota'} {showAllRain ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {displayRain.length === 0 && (
                      <li className="text-xs text-slate-400 py-2 text-center">Tidak ada wilayah sesuai kata kunci "{searchWorkerRegion}".</li>
                    )}
                    {displayRain.map((r: any) => (
                      <li key={r.regionId} className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <div className="min-w-0 truncate pr-2">
                          <span className="font-medium text-slate-800">{r.regionNama || regionName(r.regionId)}</span>
                          {r.weatherDesc && <span className="text-[10px] text-slate-500 block truncate">{r.weatherDesc} · 3 hari: {r.next3mm} mm</span>}
                        </div>
                        <span className="font-mono font-semibold text-slate-800 shrink-0 text-right">{r.past14mm} mm</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* BMKG Open Data TEWS & Autogempa */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800">BMKG Open Data (TEWS)</p>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                    <button onClick={() => setBmkgTab('autogempa')} className={`px-2 py-0.5 rounded-md cursor-pointer ${bmkgTab === 'autogempa' ? 'bg-white text-[#0B7C8A] shadow-xs' : 'text-slate-500'}`}>Terkini</button>
                    <button onClick={() => setBmkgTab('dirasakan')} className={`px-2 py-0.5 rounded-md cursor-pointer ${bmkgTab === 'dirasakan' ? 'bg-white text-[#0B7C8A] shadow-xs' : 'text-slate-500'}`}>Dirasakan ({live.bmkgDirasakan?.length || 0})</button>
                    <button onClick={() => setBmkgTab('m5')} className={`px-2 py-0.5 rounded-md cursor-pointer ${bmkgTab === 'm5' ? 'bg-white text-[#0B7C8A] shadow-xs' : 'text-slate-500'}`}>M≥5 ({live.bmkgM5?.length || 0})</button>
                  </div>
                </div>

                {bmkgTab === 'autogempa' && live.bmkgLatest && (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Gempa Terbaru TEWS BMKG</span>
                        <p className="font-bold text-slate-900 mt-0.5">{live.bmkgLatest.wilayah || live.bmkgLatest.place}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">{live.bmkgLatest.tanggal} {live.bmkgLatest.jam} · Kedalaman {live.bmkgLatest.kedalamanText || live.bmkgLatest.depthKm + ' km'}</p>
                      </div>
                      <span className="font-mono font-bold text-amber-700 text-sm bg-amber-100 px-2 py-0.5 rounded-lg shrink-0">M{live.bmkgLatest.magnitude}</span>
                    </div>

                    {live.bmkgLatest.dirasakan && (
                      <p className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-amber-100">
                        <strong className="text-amber-900">Skala MMI:</strong> {live.bmkgLatest.dirasakan}
                      </p>
                    )}

                    {live.bmkgLatest.shakemapUrl && (
                      <div className="pt-1 flex items-center gap-3">
                        <button
                          onClick={() => setSelectedShakemapUrl(live.bmkgLatest.shakemapUrl)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0B7C8A] bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Pratinjau Peta Shakemap BMKG
                        </button>
                        <a href={live.bmkgLatest.shakemapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800">
                          <ExternalLink className="w-3 h-3" /> Tab Baru
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {bmkgTab === 'dirasakan' && (
                  <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {(live.bmkgDirasakan || []).filter((q: any) => !query || (q.wilayah || q.place || '').toLowerCase().includes(query)).slice(0, 6).map((q: any) => (
                      <li key={q.id} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-slate-800 min-w-0 truncate">{q.wilayah || q.place}</span>
                          <span className="font-mono font-bold text-slate-800 shrink-0">M{q.magnitude}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{q.tanggal} {q.jam} {q.dirasakan ? `· ${q.dirasakan}` : ''}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {bmkgTab === 'm5' && (
                  <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {(live.bmkgM5 || []).filter((q: any) => !query || (q.wilayah || q.place || '').toLowerCase().includes(query)).slice(0, 6).map((q: any) => (
                      <li key={q.id} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-slate-800 min-w-0 truncate">{q.wilayah || q.place}</span>
                          <span className="font-mono font-bold text-red-600 shrink-0">M{q.magnitude}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{q.tanggal} {q.jam} · Potensi: {q.potensi || 'Tidak berpotensi tsunami'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* USGS Gempa Spasial Sumut */}
              {live.quakes && live.quakes.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-800 mb-2">USGS FDSN: Gempa 30 Hari Spasial Sumut</p>
                  <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {live.quakes.filter((q: any) => !query || (q.place || '').toLowerCase().includes(query)).slice(0, 4).map((q: any) => (
                      <li key={q.id} className="text-xs text-slate-600 flex items-start justify-between gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="min-w-0">
                          <span className="font-medium text-slate-800 block truncate">{q.place}</span>
                          <span className="text-[10px] text-slate-500">{new Date(q.time).toLocaleDateString('id-ID')} · Depth: {q.depthKm ? `${q.depthKm} km` : '-'}</span>
                        </div>
                        <span className="font-mono font-semibold text-slate-800 shrink-0 bg-slate-200/80 px-1.5 py-0.5 rounded text-[11px]">M{q.magnitude.toFixed(1)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Hasil */}
      {mission?.metrics && (
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            ['Proyek dipindai', mission.metrics.scannedProjects],
            ['Anomali', mission.metrics.anomalies],
            ['Eskalasi audit', mission.metrics.escalated],
            ['Laporan terverifikasi', mission.metrics.triaged],
            ['Ke verifikator', mission.metrics.needsHuman],
            ['Disposisi terbit', mission.metrics.dispatched],
            ['Potensi realokasi', mission.metrics.reallocation],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
              <p className="text-[11px] text-slate-500">{label}</p>
              <p className="text-lg font-bold font-mono text-slate-900 mt-1">{value as any}</p>
            </div>
          ))}
        </section>
      )}

      {mission?.brief && (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold font-display text-slate-900 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-[#0B7C8A]" /> Ringkasan eksekutif
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{mission.brief.driver === 'gemini' ? 'Gemini' : 'Template'}</span>
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">{mission.brief.text}</p>
        </section>
      )}

      {mission?.priorities?.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold font-display text-slate-900 mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#0B7C8A]" /> Proyek prioritas</h2>
          <p className="text-xs text-slate-500 mb-4">Keputusan agen berupa rekomendasi berbasis data; keputusan akhir tetap di tangan Inspektorat.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-semibold">Proyek</th>
                  <th className="py-2 pr-3 font-semibold">Deviasi</th>
                  <th className="py-2 pr-3 font-semibold">Keputusan</th>
                  <th className="py-2 font-semibold">Konteks &amp; alasan</th>
                </tr>
              </thead>
              <tbody>
                {mission.priorities.slice(0, 12).map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-3">
                      <button onClick={() => onSelectProject(p.id)} className="text-left font-semibold text-[#0B7C8A] hover:underline cursor-pointer">{p.nama}</button>
                      <p className="text-slate-500">{p.daerah}</p>
                    </td>
                    <td className="py-3 pr-3 font-mono text-slate-800 whitespace-nowrap">{p.gap}%</td>
                    <td className="py-3 pr-3"><span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${KEPUTUSAN[p.keputusan].cls}`}>{KEPUTUSAN[p.keputusan].label}</span></td>
                    <td className="py-3 text-slate-600 leading-relaxed">{p.alasan}<br /><span className="text-slate-400">{p.konteks}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {mission?.recommendations?.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold font-display text-slate-900 mb-3">Rekomendasi realokasi anggaran</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mission.recommendations.map((r: any, i: number) => (
              <li key={i} className="rounded-xl border border-slate-200 p-4 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 text-sm">{r.sector}</p>
                  <span className={`font-mono font-bold ${r.deltaPercent.startsWith('-') ? 'text-amber-600' : 'text-emerald-600'}`}>{r.deltaPercent}</span>
                </div>
                <p className="text-slate-500 mt-0.5">Serapan saat ini {r.currentAbsorption}</p>
                <p className="text-slate-600 mt-2 leading-relaxed">{r.rationale}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold font-display text-slate-900">Log aktivitas agen</h2>
          {stats && <span className="text-[11px] text-slate-500">{stats.totalScans} misi · {stats.autoTriaged} triase · {stats.autoDispatched} disposisi</span>}
        </div>
        <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {logs.length === 0 && <li className="text-sm text-slate-500">Belum ada aktivitas.</li>}
          {logs.map((l) => (
            <li key={l.id} className="text-xs flex gap-3 border-b border-slate-100 pb-1.5">
              <span className="font-mono text-slate-400 shrink-0">{String(l.timestamp).slice(11, 19)}</span>
              <span className="text-slate-700">{l.message}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-[11px] text-slate-500">
        Sumber data: Open-Meteo, BMKG Open Data, USGS. Bila suatu sumber tidak dapat dijangkau, agen tetap berjalan dengan data internal dan menandainya sebagai offline.{' '}
        <button onClick={() => onNavigate('data')} className="underline hover:text-slate-700 cursor-pointer">Lihat metodologi</button>
      </p>

      {/* Lightbox Modal Peta Shakemap BMKG */}
      {selectedShakemapUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-700 overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Peta Shakemap Guncangan BMKG TEWS</h3>
              </div>
              <button
                onClick={() => setSelectedShakemapUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 min-h-[300px]">
              <img
                src={selectedShakemapUrl}
                alt="Peta Shakemap Gempa BMKG"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Sumber: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG RI)</span>
              <a
                href={selectedShakemapUrl}
                target="_blank"
                rel="noreferrer"
                className="text-teal-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>Buka Gambar Asli</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </PageMotion>
  );
};
