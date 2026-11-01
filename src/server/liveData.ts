import { db } from './db.js';
import { calculateDistanceMeters } from '../lib/calculations.js';

/**
 * TERANG Live Data Service - Dedicated Background Workers:
 *  - Worker 1: Open-Meteo (Curah Hujan & Cuaca 33 Kab/Kota Sumut) - Interval 30 Menit
 *  - Worker 2: USGS FDSN (Gempa M >= 3.5 Spasial Sumut 30 Hari) - Interval 10 Menit
 *  - Worker 3: BMKG Open Data TEWS (Autogempa, Gempa Dirasakan, Gempa M5+) - Interval 3 Menit
 *
 * Semua worker berjalan di latar belakang secara otonom. Pemanggilan `loadLiveContext()`
 * akan mengambil data dari memori cache secara instan (0 ms) tanpa memboroskan HTTP GET
 * sehingga API publik bebas dari pemblokiran (rate-limit / IP block).
 */

export type SourceState = 'live' | 'cache' | 'offline';

export interface SourceStatus {
  id: 'open-meteo' | 'bmkg' | 'usgs';
  nama: string;
  url: string;
  state: SourceState;
  fetchedAt: string | null;
  nextScheduledAt?: string | null;
  errorCount: number;
  note?: string;
}

export interface RainInfo {
  regionId: string;
  regionNama: string;
  past14mm: number;
  next3mm: number;
  maxDayMm: number;
  weatherCode: number;
  weatherDesc: string;
  tempMax: number | null;
  tempMin: number | null;
  windMax: number | null;
  elevation: number | null;
  dailyTime: string[];
  precipitationSum: number[];
  latitude: number;
  longitude: number;
}

export interface QuakeInfo {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lng: number;
  depthKm: number | null;
  time: string;
  source: 'USGS' | 'BMKG';
  tsunami?: number;
  sig?: number;
  magType?: string;
  url?: string;
  detailUrl?: string;
  status?: string;
  title?: string;
}

export interface BmkgQuakeInfo extends QuakeInfo {
  tanggal?: string;
  jam?: string;
  dateTime?: string;
  coordinates?: string;
  lintang?: string;
  bujur?: string;
  kedalamanText?: string;
  wilayah?: string;
  potensi?: string;
  dirasakan?: string;
  shakemap?: string;
  shakemapUrl?: string;
}

export interface LiveContext {
  generatedAt: string;
  sources: SourceStatus[];
  rain: Record<string, RainInfo>;
  quakes: QuakeInfo[];
  bmkgLatest: BmkgQuakeInfo | null;
  bmkgDirasakan: BmkgQuakeInfo[];
  bmkgM5: BmkgQuakeInfo[];
}

// Bounding box geospasial Sumatera Utara
const SUMUT_BBOX = { minLat: 0.3, maxLat: 4.4, minLng: 96.8, maxLng: 100.5 };

const WMO_WEATHER_CODES: Record<number, string> = {
  0: 'Cerah',
  1: 'Cerah Berawan',
  2: 'Berawan',
  3: 'Sangat Berawan',
  45: 'Kabut',
  48: 'Kabut Rime',
  51: 'Gerimis Ringan',
  53: 'Gerimis Sedang',
  55: 'Gerimis Lebat',
  61: 'Hujan Ringan',
  63: 'Hujan Sedang',
  65: 'Hujan Lebat',
  80: 'Hujan Lokal Ringan',
  81: 'Hujan Lokal Sedang',
  82: 'Hujan Lokal Lebat',
  95: 'Badai Petir',
  96: 'Badai Petir & Es',
};

function getWeatherDesc(code: number): string {
  return WMO_WEATHER_CODES[code] || `Kode Cuaca ${code}`;
}

function inSumut(lat: number, lng: number): boolean {
  return lat >= SUMUT_BBOX.minLat && lat <= SUMUT_BBOX.maxLat && lng >= SUMUT_BBOX.minLng && lng <= SUMUT_BBOX.maxLng;
}

// Helper perkakas fetch dengan timeout & AbortController
async function fetchJsonWithTimeout(url: string, timeoutMs = 10000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TERANG-Sumut/1.3 (Hackathon Civic-Tech Public Oversight)',
      },
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// =========================================================
// STORE STORAGE HASIL WORKER
// =========================================================

interface OpenMeteoState {
  status: SourceStatus;
  rain: Record<string, RainInfo>;
  lastFetchedAt: number | null;
}

interface UsgsState {
  status: SourceStatus;
  quakes: QuakeInfo[];
  lastFetchedAt: number | null;
}

interface BmkgState {
  status: SourceStatus;
  latest: BmkgQuakeInfo | null;
  dirasakan: BmkgQuakeInfo[];
  m5: BmkgQuakeInfo[];
  lastFetchedAt: number | null;
}

const openMeteoStore: OpenMeteoState = {
  status: {
    id: 'open-meteo',
    nama: 'Open-Meteo (Curah Hujan & Cuaca 33 Daerah Sumut)',
    url: 'https://api.open-meteo.com/v1/forecast',
    state: 'offline',
    fetchedAt: null,
    errorCount: 0,
    note: 'Inisialisasi worker...',
  },
  rain: {},
  lastFetchedAt: null,
};

const usgsStore: UsgsState = {
  status: {
    id: 'usgs',
    nama: 'USGS FDSN (Gempa 30 Hari Spasial Sumut M≥3.5)',
    url: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
    state: 'offline',
    fetchedAt: null,
    errorCount: 0,
    note: 'Inisialisasi worker...',
  },
  quakes: [],
  lastFetchedAt: null,
};

const bmkgStore: BmkgState = {
  status: {
    id: 'bmkg',
    nama: 'BMKG Open Data (Autogempa Realtime TEWS)',
    url: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
    state: 'offline',
    fetchedAt: null,
    errorCount: 0,
    note: 'Inisialisasi worker...',
  },
  latest: null,
  dirasakan: [],
  m5: [],
  lastFetchedAt: null,
};

// Cooldown minimum antar pemanggilan manual agar aman (30 detik)
const MANUAL_REFRESH_COOLDOWN_MS = 30_000;

// =========================================================
// WORKER 1: OPEN-METEO WORKER (Interval 30 Menit)
// =========================================================
const OPEN_METEO_INTERVAL_MS = 30 * 60_000;
let openMeteoTimer: NodeJS.Timeout | null = null;

async function runOpenMeteoWorker(): Promise<void> {
  const regions = db.regions;
  if (!regions || regions.length === 0) return;

  const lats = regions.map((r) => r.lat).join(',');
  const lngs = regions.map((r) => r.lng).join(',');
  const url = `${openMeteoStore.status.url}?latitude=${lats}&longitude=${lngs}&daily=precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&past_days=14&forecast_days=3&timezone=Asia%2FJakarta`;

  try {
    const rawData = await fetchJsonWithTimeout(url, 12000);
    const list = Array.isArray(rawData) ? rawData : [rawData];
    const newRainMap: Record<string, RainInfo> = {};

    list.forEach((item: any, i: number) => {
      const region = regions[i];
      if (!region) return;

      const precipVals: number[] = (item?.daily?.precipitation_sum || []).map((v: any) => (typeof v === 'number' ? v : 0));
      const times: string[] = Array.isArray(item?.daily?.time) ? item.daily.time : [];
      const weatherCodes: number[] = (item?.daily?.weather_code || []).map((v: any) => (typeof v === 'number' ? v : 0));
      const tempMaxArr: number[] = (item?.daily?.temperature_2m_max || []).map((v: any) => (typeof v === 'number' ? v : 0));
      const tempMinArr: number[] = (item?.daily?.temperature_2m_min || []).map((v: any) => (typeof v === 'number' ? v : 0));
      const windMaxArr: number[] = (item?.daily?.wind_speed_10m_max || []).map((v: any) => (typeof v === 'number' ? v : 0));

      if (precipVals.length >= 15) {
        const past = precipVals.slice(0, 14);
        const next = precipVals.slice(14);
        const latestCode = weatherCodes[14] ?? weatherCodes[weatherCodes.length - 1] ?? 0;

        newRainMap[region.id] = {
          regionId: region.id,
          regionNama: region.nama,
          past14mm: Math.round(past.reduce((a, c) => a + c, 0) * 10) / 10,
          next3mm: Math.round(next.reduce((a, c) => a + c, 0) * 10) / 10,
          maxDayMm: Math.round(Math.max(...precipVals) * 10) / 10,
          weatherCode: latestCode,
          weatherDesc: getWeatherDesc(latestCode),
          tempMax: tempMaxArr.length ? Math.max(...tempMaxArr) : null,
          tempMin: tempMinArr.length ? Math.min(...tempMinArr) : null,
          windMax: windMaxArr.length ? Math.max(...windMaxArr) : null,
          elevation: Number(item?.elevation) || null,
          dailyTime: times,
          precipitationSum: precipVals,
          latitude: Number(item?.latitude) || region.lat,
          longitude: Number(item?.longitude) || region.lng,
        };
      }
    });

    const parsedCount = Object.keys(newRainMap).length;
    openMeteoStore.rain = newRainMap;
    openMeteoStore.lastFetchedAt = Date.now();
    openMeteoStore.status.state = parsedCount > 0 ? 'live' : 'offline';
    openMeteoStore.status.fetchedAt = new Date().toISOString();
    openMeteoStore.status.nextScheduledAt = new Date(Date.now() + OPEN_METEO_INTERVAL_MS).toISOString();
    openMeteoStore.status.errorCount = 0;
    openMeteoStore.status.note = `${parsedCount} dari ${regions.length} kabupaten/kota Sumut terupdate`;
  } catch (err: any) {
    openMeteoStore.status.errorCount += 1;
    if (openMeteoStore.lastFetchedAt) {
      openMeteoStore.status.state = 'cache';
      openMeteoStore.status.note = `Memakai data ter-cache. Gagal sinkronkan: ${err?.message || 'timeout'}`;
    } else {
      openMeteoStore.status.state = 'offline';
      openMeteoStore.status.note = `Tidak dapat dihubungi (${err?.message || 'error'})`;
    }
  }
}

// =========================================================
// WORKER 2: USGS EARTHQUAKE WORKER (Interval 10 Menit)
// =========================================================
const USGS_INTERVAL_MS = 10 * 60_000;
let usgsTimer: NodeJS.Timeout | null = null;

async function runUsgsWorker(): Promise<void> {
  const start = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const url = `${usgsStore.status.url}?format=geojson&starttime=${start}&minmagnitude=3.5&minlatitude=${SUMUT_BBOX.minLat}&maxlatitude=${SUMUT_BBOX.maxLat}&minlongitude=${SUMUT_BBOX.minLng}&maxlongitude=${SUMUT_BBOX.maxLng}&orderby=time&limit=50`;

  try {
    const data = await fetchJsonWithTimeout(url, 10000);
    const quakes: QuakeInfo[] = (data?.features || [])
      .map((f: any) => ({
        id: String(f.id),
        magnitude: Number(f.properties?.mag ?? 0),
        place: String(f.properties?.place || 'Sumatera Utara'),
        lng: Number(f.geometry?.coordinates?.[0]),
        lat: Number(f.geometry?.coordinates?.[1]),
        depthKm: f.geometry?.coordinates?.[2] ?? null,
        time: new Date(f.properties?.time || Date.now()).toISOString(),
        source: 'USGS' as const,
        tsunami: Number(f.properties?.tsunami ?? 0),
        sig: Number(f.properties?.sig ?? 0),
        magType: String(f.properties?.magType || ''),
        url: String(f.properties?.url || ''),
        detailUrl: String(f.properties?.detail || ''),
        status: String(f.properties?.status || ''),
        title: String(f.properties?.title || ''),
      }))
      .filter((q: QuakeInfo) => Number.isFinite(q.lat) && Number.isFinite(q.lng));

    usgsStore.quakes = quakes;
    usgsStore.lastFetchedAt = Date.now();
    usgsStore.status.state = 'live';
    usgsStore.status.fetchedAt = new Date().toISOString();
    usgsStore.status.nextScheduledAt = new Date(Date.now() + USGS_INTERVAL_MS).toISOString();
    usgsStore.status.errorCount = 0;
    usgsStore.status.note = `${quakes.length} kejadian gempa M≥3.5 dalam 30 hari di Sumut`;
  } catch (err: any) {
    usgsStore.status.errorCount += 1;
    if (usgsStore.lastFetchedAt) {
      usgsStore.status.state = 'cache';
      usgsStore.status.note = `Memakai data ter-cache. Gagal sinkronkan: ${err?.message || 'error'}`;
    } else {
      usgsStore.status.state = 'offline';
      usgsStore.status.note = `Tidak dapat dihubungi (${err?.message || 'error'})`;
    }
  }
}

// =========================================================
// WORKER 3: BMKG TEWS WORKER (Interval 3 Menit)
// =========================================================
const BMKG_INTERVAL_MS = 3 * 60_000;
let bmkgTimer: NodeJS.Timeout | null = null;

function parseBmkgItem(g: any): BmkgQuakeInfo | null {
  if (!g) return null;
  const [lat, lng] = String(g.Coordinates || '').split(',').map((s) => Number(s.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const shakemapName = g.Shakemap ? String(g.Shakemap).trim() : undefined;
  const shakemapUrl = shakemapName ? `https://data.bmkg.go.id/DataMKG/TEWS/${shakemapName}` : undefined;

  return {
    id: `bmkg-${g.DateTime || g.Tanggal}-${g.Jam}`.replace(/\s+/g, '-'),
    magnitude: Number(g.Magnitude || 0),
    place: String(g.Wilayah || 'Wilayah Indonesia'),
    lat,
    lng,
    depthKm: Number.parseFloat(String(g.Kedalaman)) || null,
    time: String(g.DateTime || `${g.Tanggal} ${g.Jam}`),
    source: 'BMKG',
    tanggal: String(g.Tanggal || ''),
    jam: String(g.Jam || ''),
    dateTime: String(g.DateTime || ''),
    coordinates: String(g.Coordinates || ''),
    lintang: String(g.Lintang || ''),
    bujur: String(g.Bujur || ''),
    kedalamanText: String(g.Kedalaman || ''),
    wilayah: String(g.Wilayah || ''),
    potensi: String(g.Potensi || ''),
    dirasakan: String(g.Dirasakan || ''),
    shakemap: shakemapName,
    shakemapUrl,
  };
}

async function runBmkgWorker(): Promise<void> {
  const urlAuto = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';
  const urlDirasakan = 'https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json';
  const urlM5 = 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json';

  try {
    const [autoRes, dirasakanRes, m5Res] = await Promise.allSettled([
      fetchJsonWithTimeout(urlAuto, 8000),
      fetchJsonWithTimeout(urlDirasakan, 8000),
      fetchJsonWithTimeout(urlM5, 8000),
    ]);

    let latest: BmkgQuakeInfo | null = null;
    if (autoRes.status === 'fulfilled' && autoRes.value?.Infogempa?.gempa) {
      latest = parseBmkgItem(autoRes.value.Infogempa.gempa);
    }

    const dirasakanList: BmkgQuakeInfo[] = [];
    if (dirasakanRes.status === 'fulfilled' && Array.isArray(dirasakanRes.value?.Infogempa?.gempa)) {
      dirasakanRes.value.Infogempa.gempa.forEach((g: any) => {
        const item = parseBmkgItem(g);
        if (item) dirasakanList.push(item);
      });
    }

    const m5List: BmkgQuakeInfo[] = [];
    if (m5Res.status === 'fulfilled' && Array.isArray(m5Res.value?.Infogempa?.gempa)) {
      m5Res.value.Infogempa.gempa.forEach((g: any) => {
        const item = parseBmkgItem(g);
        if (item) m5List.push(item);
      });
    }

    bmkgStore.latest = latest;
    bmkgStore.dirasakan = dirasakanList;
    bmkgStore.m5 = m5List;
    bmkgStore.lastFetchedAt = Date.now();
    bmkgStore.status.state = latest || dirasakanList.length ? 'live' : 'offline';
    bmkgStore.status.fetchedAt = new Date().toISOString();
    bmkgStore.status.nextScheduledAt = new Date(Date.now() + BMKG_INTERVAL_MS).toISOString();
    bmkgStore.status.errorCount = 0;
    bmkgStore.status.note = latest
      ? `Autogempa M${latest.magnitude} (${latest.tanggal} ${latest.jam}) - ${dirasakanList.length} gempa dirasakan terdata`
      : 'Format data BMKG tidak sesuai';
  } catch (err: any) {
    bmkgStore.status.errorCount += 1;
    if (bmkgStore.lastFetchedAt) {
      bmkgStore.status.state = 'cache';
      bmkgStore.status.note = `Memakai data ter-cache. Gagal sinkronkan BMKG: ${err?.message || 'error'}`;
    } else {
      bmkgStore.status.state = 'offline';
      bmkgStore.status.note = `BMKG tidak dapat dihubungi (${err?.message || 'error'})`;
    }
  }
}

// =========================================================
// INISIALISASI ATOMIK BACKGROUND WORKERS
// =========================================================
let workersStarted = false;

export function initLiveWorkers(): void {
  if (workersStarted) return;
  workersStarted = true;

  // Jalankan segera saat server boot
  void runOpenMeteoWorker();
  void runUsgsWorker();
  void runBmkgWorker();

  // Jadwalkan interval berulang secara aman
  openMeteoTimer = setInterval(() => { void runOpenMeteoWorker(); }, OPEN_METEO_INTERVAL_MS);
  usgsTimer = setInterval(() => { void runUsgsWorker(); }, USGS_INTERVAL_MS);
  bmkgTimer = setInterval(() => { void runBmkgWorker(); }, BMKG_INTERVAL_MS);

  if (openMeteoTimer.unref) openMeteoTimer.unref();
  if (usgsTimer.unref) usgsTimer.unref();
  if (bmkgTimer.unref) bmkgTimer.unref();
}

// Jalankan otomatis saat modul dimuat pertama kali
initLiveWorkers();

// Pemanggilan paksa refresh manual (dengan cooldown guard)
export async function forceRefreshLiveWorkers(sourceId?: 'open-meteo' | 'usgs' | 'bmkg'): Promise<void> {
  const now = Date.now();
  const promises: Promise<void>[] = [];

  if (!sourceId || sourceId === 'open-meteo') {
    if (!openMeteoStore.lastFetchedAt || now - openMeteoStore.lastFetchedAt > MANUAL_REFRESH_COOLDOWN_MS) {
      promises.push(runOpenMeteoWorker());
    }
  }
  if (!sourceId || sourceId === 'usgs') {
    if (!usgsStore.lastFetchedAt || now - usgsStore.lastFetchedAt > MANUAL_REFRESH_COOLDOWN_MS) {
      promises.push(runUsgsWorker());
    }
  }
  if (!sourceId || sourceId === 'bmkg') {
    if (!bmkgStore.lastFetchedAt || now - bmkgStore.lastFetchedAt > MANUAL_REFRESH_COOLDOWN_MS) {
      promises.push(runBmkgWorker());
    }
  }

  if (promises.length) await Promise.all(promises);
}

// =========================================================
// AKSES DATA UTAMA UNTUK SUPERAGENT DAN FRONTEND API
// =========================================================

/** Memuat konteks lingkungan real-time dari memori cache worker secara instan (0 ms) */
export async function loadLiveContext(): Promise<LiveContext> {
  // Jika karena alasan tertentu cache masih kosong (misal baru pertama kali menyala), jalankan sekali secara sinkron
  if (!openMeteoStore.lastFetchedAt) await runOpenMeteoWorker();
  if (!usgsStore.lastFetchedAt) await runUsgsWorker();
  if (!bmkgStore.lastFetchedAt) await runBmkgWorker();

  const quakes = [...usgsStore.quakes];

  // Gabungkan autogempa BMKG jika berada di Sumut dan belum tercantum di USGS
  if (
    bmkgStore.latest &&
    inSumut(bmkgStore.latest.lat, bmkgStore.latest.lng) &&
    !quakes.some((q) => Math.abs(new Date(q.time).getTime() - new Date(bmkgStore.latest!.time).getTime()) < 120_000)
  ) {
    quakes.unshift(bmkgStore.latest);
  }

  return {
    generatedAt: new Date().toISOString(),
    sources: [openMeteoStore.status, usgsStore.status, bmkgStore.status],
    rain: openMeteoStore.rain,
    quakes,
    bmkgLatest: bmkgStore.latest,
    bmkgDirasakan: bmkgStore.dirasakan,
    bmkgM5: bmkgStore.m5,
  };
}

export interface ProjectEnvContext {
  rain14mm: number | null;
  rainNext3mm: number | null;
  maxDayMm: number | null;
  weatherDesc: string | null;
  nearbyQuakes: number;
  strongestQuake: number | null;
  weatherVerdict: 'cuaca-ekstrem' | 'cuaca-normal' | 'tidak-diketahui';
  note: string;
}

/** Evaluasi dampak cuaca dan gempa bumi di sekitar suatu lokasi proyek */
export function projectEnvContext(project: { region_id: string; lat: number; lng: number }, ctx: LiveContext): ProjectEnvContext {
  const rain = ctx.rain[project.region_id];
  const near = ctx.quakes.filter((q) => calculateDistanceMeters(project.lat, project.lng, q.lat, q.lng) <= 100_000 && q.magnitude >= 4);
  const strongest = near.length ? Math.max(...near.map((q) => q.magnitude)) : null;

  let verdict: ProjectEnvContext['weatherVerdict'] = 'tidak-diketahui';
  const parts: string[] = [];

  if (rain) {
    verdict = rain.past14mm >= 150 ? 'cuaca-ekstrem' : 'cuaca-normal';
    parts.push(`hujan 14 hari terakhir ${rain.past14mm} mm (${rain.weatherDesc})`);
    if (rain.next3mm >= 60) parts.push(`prakiraan 3 hari ke depan ${rain.next3mm} mm`);
  } else {
    parts.push('data cuaca tidak tersedia');
  }

  if (near.length) parts.push(`${near.length} gempa M≥4 dalam radius 100 km (maks M${strongest})`);

  return {
    rain14mm: rain ? rain.past14mm : null,
    rainNext3mm: rain ? rain.next3mm : null,
    maxDayMm: rain ? rain.maxDayMm : null,
    weatherDesc: rain ? rain.weatherDesc : null,
    nearbyQuakes: near.length,
    strongestQuake: strongest,
    weatherVerdict: verdict,
    note: parts.join('; '),
  };
}
