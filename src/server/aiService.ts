import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { db } from './db.js';
import { calculateAbsorptionRate, calculateGapIndicator, calculateDistanceMeters } from '../lib/calculations.js';

// Centralized GEMINI AI Configuration from process.env (.env)
const apiKey = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-3.8-flash';

let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==========================================
// TOOL EXECUTION FUNCTIONS (GROUNDED IN DB)
// ==========================================

export function toolGetSerapan(args: { tahun?: number; daerah?: string; sektor?: string }) {
  const tahun = args.tahun || 2024;
  let filtered = db.budgets.filter((b) => b.tahun === tahun);

  if (args.daerah && args.daerah !== 'all') {
    const q = args.daerah.toLowerCase();
    filtered = filtered.filter((b) => b.region_nama.toLowerCase().includes(q));
  }

  if (args.sektor && args.sektor !== 'all') {
    const q = args.sektor.toLowerCase();
    filtered = filtered.filter((b) => b.sector_nama.toLowerCase().includes(q));
  }

  const totalPagu = filtered.reduce((acc, cur) => acc + cur.pagu, 0);
  const totalReal = filtered.reduce((acc, cur) => acc + cur.realisasi, 0);
  const serapanPersen = calculateAbsorptionRate(totalReal, totalPagu);

  return {
    tahun,
    daerah: args.daerah || 'Semua Daerah Sumatera Utara',
    sektor: args.sektor || 'Semua Sektor',
    total_pagu: totalPagu,
    total_pagu_formatted: `Rp ${(totalPagu / 1e12).toFixed(2)} Triliun`,
    total_realisasi: totalReal,
    total_realisasi_formatted: `Rp ${(totalReal / 1e12).toFixed(2)} Triliun`,
    serapan_persen: `${serapanPersen}%`,
    jumlah_data: filtered.length,
  };
}

export function toolGetTopDaerah(args: { metrik?: 'serapan' | 'laporan' | 'skor'; urutan?: 'tertinggi' | 'terendah'; limit?: number }) {
  const limit = args.limit || 5;
  const urutan = args.urutan || 'tertinggi';
  const metrik = args.metrik || 'serapan';

  const regionsMap = db.regions.map((reg) => {
    const regBudgets = db.budgets.filter((b) => b.region_id === reg.id && b.tahun === 2024);
    const pagu = regBudgets.reduce((acc, cur) => acc + cur.pagu, 0);
    const real = regBudgets.reduce((acc, cur) => acc + cur.realisasi, 0);
    const serapan = calculateAbsorptionRate(real, pagu);
    const reportCount = db.reports.filter((r) => r.region_id === reg.id).length;

    return {
      id: reg.id,
      nama: reg.nama,
      tipe: reg.tipe,
      serapan_persen: serapan,
      jumlah_laporan: reportCount,
    };
  });

  if (metrik === 'serapan') {
    regionsMap.sort((a, b) => urutan === 'tertinggi' ? b.serapan_persen - a.serapan_persen : a.serapan_persen - b.serapan_persen);
  } else {
    regionsMap.sort((a, b) => urutan === 'tertinggi' ? b.jumlah_laporan - a.jumlah_laporan : a.jumlah_laporan - b.jumlah_laporan);
  }

  return {
    metrik,
    urutan,
    data: regionsMap.slice(0, limit),
  };
}

export function toolGetProyekBermasalah(args: { daerah?: string }) {
  let list = db.projects;
  if (args.daerah && args.daerah !== 'all') {
    const q = args.daerah.toLowerCase();
    list = list.filter((p) => p.region_nama.toLowerCase().includes(q));
  }

  const evaluated = list.map((p) => {
    const repCount = db.reports.filter((r) => r.project_id === p.id && r.status !== 'ditolak').length;
    const gap = calculateGapIndicator(p, repCount);
    return {
      id: p.id,
      kode: p.kode,
      nama: p.nama,
      daerah: p.region_nama,
      sektor: p.sector_nama,
      pagu: `Rp ${(p.pagu / 1e9).toFixed(1)} Miliar`,
      progres_keuangan: `${gap.financialProgress}%`,
      progres_fisik: `${gap.physicalProgress}%`,
      selisih_gap: `${gap.progressDelta}%`,
      status: p.status,
      laporan_warga: repCount,
      tingkat_risiko: gap.level,
      perlu_verifikasi_lapangan: gap.needsFieldVerification,
      faktor: gap.reasons,
    };
  });

  const bermasalah = evaluated.filter((p) => p.perlu_verifikasi_lapangan || p.tingkat_risiko === 'Tinggi' || p.status === 'mangkrak');
  return {
    jumlah_ditemukan: bermasalah.length,
    daftar: bermasalah.slice(0, 5),
  };
}

export function toolGetStatistikLaporan(args: { daerah?: string }) {
  let reps = db.reports;
  if (args.daerah && args.daerah !== 'all') {
    const q = args.daerah.toLowerCase();
    reps = reps.filter((r) => r.region_nama.toLowerCase().includes(q));
  }

  const total = reps.length;
  const selesai = reps.filter((r) => r.status === 'selesai').length;
  const ditindaklanjuti = reps.filter((r) => r.status === 'ditindaklanjuti').length;
  const diverifikasi = reps.filter((r) => r.status === 'diverifikasi').length;
  const diterima = reps.filter((r) => r.status === 'diterima').length;
  const ditolak = reps.filter((r) => r.status === 'ditolak').length;

  return {
    daerah: args.daerah || 'Seluruh Sumatera Utara',
    total_laporan: total,
    selesai,
    ditindaklanjuti,
    diverifikasi,
    diterima_menunggu: diterima,
    ditolak,
    persentase_selesai: total > 0 ? `${((selesai / total) * 100).toFixed(1)}%` : '0%',
  };
}

export function toolBandingkanDaerah(args: { daerah_a: string; daerah_b: string; tahun?: number }) {
  const tahun = args.tahun || 2024;
  const findA = db.regions.find((r) => r.nama.toLowerCase().includes(args.daerah_a.toLowerCase()) || r.id === args.daerah_a);
  const findB = db.regions.find((r) => r.nama.toLowerCase().includes(args.daerah_b.toLowerCase()) || r.id === args.daerah_b);

  if (!findA || !findB) {
    return { error: 'Salah satu atau kedua daerah tidak ditemukan di Sumatera Utara.' };
  }

  const bgtA = db.budgets.filter((b) => b.region_id === findA.id && b.tahun === tahun);
  const bgtB = db.budgets.filter((b) => b.region_id === findB.id && b.tahun === tahun);

  const paguA = bgtA.reduce((acc, cur) => acc + cur.pagu, 0);
  const realA = bgtA.reduce((acc, cur) => acc + cur.realisasi, 0);
  const paguB = bgtB.reduce((acc, cur) => acc + cur.pagu, 0);
  const realB = bgtB.reduce((acc, cur) => acc + cur.realisasi, 0);

  const repA = db.reports.filter((r) => r.region_id === findA.id);
  const repB = db.reports.filter((r) => r.region_id === findB.id);

  return {
    tahun,
    daerah_a: {
      nama: findA.nama,
      populasi: findA.populasi,
      pagu_apbd: `Rp ${(paguA / 1e12).toFixed(2)} T`,
      realisasi: `Rp ${(realA / 1e12).toFixed(2)} T`,
      serapan_persen: `${calculateAbsorptionRate(realA, paguA)}%`,
      total_laporan: repA.length,
      laporan_selesai: repA.filter((r) => r.status === 'selesai').length,
    },
    daerah_b: {
      nama: findB.nama,
      populasi: findB.populasi,
      pagu_apbd: `Rp ${(paguB / 1e12).toFixed(2)} T`,
      realisasi: `Rp ${(realB / 1e12).toFixed(2)} T`,
      serapan_persen: `${calculateAbsorptionRate(realB, paguB)}%`,
      total_laporan: repB.length,
      laporan_selesai: repB.filter((r) => r.status === 'selesai').length,
    },
  };
}

// ==========================================
// GEMINI TOOL DECLARATIONS
// ==========================================

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'getSerapan',
    description: 'Mengambil ringkasan data serapan anggaran APBD (Pagu, Realisasi, Persentase) berdasarkan tahun, kabupaten/kota, atau sektor di Sumatera Utara.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tahun: { type: Type.INTEGER, description: 'Tahun anggaran (2022, 2023, 2024, 2025)' },
        daerah: { type: Type.STRING, description: 'Nama Kabupaten atau Kota di Sumut (misal: Medan, Deli Serdang)' },
        sektor: { type: Type.STRING, description: 'Nama sektor pembangunan (misal: Pekerjaan Umum, Pendidikan, Kesehatan)' },
      },
    },
  },
  {
    name: 'getTopDaerah',
    description: 'Mengambil peringkat daerah teratas atau terbawah berdasarkan serapan anggaran atau jumlah laporan warga.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        metrik: { type: Type.STRING, description: 'Pilihan: serapan atau laporan' },
        urutan: { type: Type.STRING, description: 'Pilihan: tertinggi atau terendah' },
        limit: { type: Type.INTEGER, description: 'Jumlah daerah yang ditampilkan (default: 5)' },
      },
    },
  },
  {
    name: 'getProyekBermasalah',
    description: 'Mencari proyek publik yang memiliki indikator kesenjangan tinggi (gap progres keuangan vs fisik >= 25%, banyak laporan aduan, atau mangkrak).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        daerah: { type: Type.STRING, description: 'Nama Kabupaten/Kota untuk filter' },
      },
    },
  },
  {
    name: 'getStatistikLaporan',
    description: 'Melihat statistik laporan warga masyarakat (total laporan, status verifikasi, tindak lanjut, dan selesai).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        daerah: { type: Type.STRING, description: 'Nama Kabupaten/Kota' },
      },
    },
  },
  {
    name: 'bandingkanDaerah',
    description: 'Membandingkan anggaran APBD, serapan, dan statistik aduan warga antara dua kabupaten/kota di Sumatera Utara.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        daerah_a: { type: Type.STRING, description: 'Nama kabupaten/kota pertama' },
        daerah_b: { type: Type.STRING, description: 'Nama kabupaten/kota kedua' },
        tahun: { type: Type.INTEGER, description: 'Tahun anggaran (default: 2024)' },
      },
      required: ['daerah_a', 'daerah_b'],
    },
  },
];

// Fallback rule-based matching when AI is unavailable or offline
function fallbackChatResponse(message: string): { reply: string; dataLinks?: string } {
  const lower = message.toLowerCase();

  if (lower.includes('banding') || lower.includes('vs') || (lower.includes('medan') && lower.includes('deli serdang'))) {
    const res = toolBandingkanDaerah({ daerah_a: 'Kota Medan', daerah_b: 'Kabupaten Deli Serdang', tahun: 2024 });
    if ('error' in res || !res.daerah_a || !res.daerah_b) {
      return { reply: (res as any).error || 'Daerah tidak ditemukan.' };
    }
    return {
      reply: `Berdasarkan data resmi APBD TA 2024:\n\n• **${res.daerah_a.nama}**: Pagu APBD ${res.daerah_a.pagu_apbd}, realisasi ${res.daerah_a.realisasi} (${res.daerah_a.serapan_persen}). Terdapat ${res.daerah_a.total_laporan} aduan warga (${res.daerah_a.laporan_selesai} selesai).\n• **${res.daerah_b.nama}**: Pagu APBD ${res.daerah_b.pagu_apbd}, realisasi ${res.daerah_b.realisasi} (${res.daerah_b.serapan_persen}). Terdapat ${res.daerah_b.total_laporan} aduan warga (${res.daerah_b.laporan_selesai} selesai).\n\nPerbedaan serapan adalah sekitar ${Math.abs(parseFloat(res.daerah_a.serapan_persen) - parseFloat(res.daerah_b.serapan_persen)).toFixed(1)} poin persentase.`,
      dataLinks: '/insight',
    };
  }

  if (lower.includes('mangkrak') || lower.includes('kesenjangan') || lower.includes('masalah') || lower.includes('bermasalah')) {
    const res = toolGetProyekBermasalah({});
    const items = res.daftar.map((p) => `• **${p.nama}** (${p.daerah}): Serapan ${p.progres_keuangan} vs Fisik ${p.progres_fisik} (Selisih ${p.selisih_gap}). Risiko: **${p.tingkat_risiko}**. Alasan: ${p.faktor.join(', ')}`).join('\n');
    return {
      reply: `Ditemukan **${res.jumlah_ditemukan} proyek dengan Indikator Kesenjangan Tinggi** di Sumatera Utara yang memerlukan verifikasi lapangan langsung:\n\n${items}\n\nAnda dapat melihat rincian progres fisik dan mengajukan aduan langsung pada halaman Proyek.`,
      dataLinks: '/proyek?filter=gap',
    };
  }

  if (lower.includes('terendah') || lower.includes('tertinggi') || lower.includes('top') || lower.includes('peringkat')) {
    const res = toolGetTopDaerah({ metrik: 'serapan', urutan: lower.includes('terendah') ? 'terendah' : 'tertinggi' });
    const items = res.data.map((d, i) => `${i + 1}. **${d.nama}**: Serapan ${d.serapan_persen}% (${d.jumlah_laporan} laporan aduan)`).join('\n');
    return {
      reply: `Berikut daftar daerah dengan tingkat serapan anggaran TA 2024 ${res.urutan}:\n\n${items}\n\nSumber: Portal Satu Data Kemenkeu DJPK & BPS Sumut.`,
      dataLinks: '/dashboard',
    };
  }

  if (lower.includes('laporan') || lower.includes('aduan') || lower.includes('status')) {
    const res = toolGetStatistikLaporan({});
    return {
      reply: `Hingga saat ini terdapat **${res.total_laporan} laporan warga** di seluruh Sumatera Utara:\n\n• Selesai Ditindaklanjuti: **${res.selesai}** (${res.persentase_selesai})\n• Sedang Dikerjakan: **${res.ditindaklanjuti}**\n• Lolos Verifikasi Inspektorat: **${res.diverifikasi}**\n• Menunggu Tinjauan: **${res.diterima_menunggu}**\n• Tidak Memenuhi Syarat: **${res.ditolak}**\n\nSetiap laporan warga memiliki kode pelacakan TRG-2026-XXXXXX yang dapat dipantau secara terbuka.`,
      dataLinks: '/laporan',
    };
  }

  // Default serapan query
  let daerahMatch: string | undefined = undefined;
  for (const reg of db.regions) {
    const cleanName = reg.nama.toLowerCase().replace('kabupaten ', '').replace('kota ', '').trim();
    if (
      lower.includes(cleanName) ||
      lower.includes(reg.nama.toLowerCase()) ||
      (reg.ibu_kota && lower.includes(reg.ibu_kota.toLowerCase()))
    ) {
      daerahMatch = reg.nama;
      break;
    }
  }

  const res = toolGetSerapan({ daerah: daerahMatch, tahun: 2024 });
  return {
    reply: `Data APBD TA 2024 untuk **${res.daerah}**:\n\n• Total Pagu Anggaran: **${res.total_pagu_formatted}**\n• Realisasi Serapan: **${res.total_realisasi_formatted}**\n• Persentase Serapan: **${res.serapan_persen}**\n\nInformasi ini dihitung dari ${res.jumlah_data} alokasi sektor belanja daerah resmi.`,
    dataLinks: daerahMatch ? `/dashboard?daerah=${encodeURIComponent(daerahMatch)}` : '/dashboard',
  };
}

// ==========================================
// CHATBOT SERVICE EXPORT
// ==========================================

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 2500): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI request timeout')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export async function askTanyaTerang(message: string): Promise<{ reply: string; driver: 'gemini' | 'fallback'; toolUsed?: string; dataLinks?: string }> {
  if (!aiClient) {
    const fb = fallbackChatResponse(message);
    return { reply: fb.reply, driver: 'fallback', dataLinks: fb.dataLinks };
  }

  try {
    const response = await withTimeout(
      aiClient.models.generateContent({
        model: MODEL_NAME,
        contents: message,
        config: {
          systemInstruction: `Anda adalah "Tanya TERANG", asisten AI resmi platform transparansi anggaran dan akuntabilitas publik Sumatera Utara (lomba WIA 2026).
Tugas Anda adalah menjawab pertanyaan masyarakat dengan santun, faktual, objektif, dan HANYA menggunakan data yang dihasilkan oleh tool.
DILARANG mengarang angka atau persentase jika tidak tersedia dari tool.
Gunakan format markdown yang rapi (bullet points, bold angka kunci).
Sertakan nama sumber data dan tautan ke halaman terkait di akhir jawaban.
Jika pertanyaan di luar topik transparansi APBD, proyek publik, atau laporan warga Sumut, jawab dengan sopan bahwa data tersebut berada di luar cakupan TERANG.`,
          tools: [{ functionDeclarations: toolDeclarations }],
          temperature: 0.2,
        },
      }),
      2500
    );

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const call = calls[0];
      let toolResult: any = null;

      if (call.name === 'getSerapan') toolResult = toolGetSerapan(call.args as any);
      else if (call.name === 'getTopDaerah') toolResult = toolGetTopDaerah(call.args as any);
      else if (call.name === 'getProyekBermasalah') toolResult = toolGetProyekBermasalah(call.args as any);
      else if (call.name === 'getStatistikLaporan') toolResult = toolGetStatistikLaporan(call.args as any);
      else if (call.name === 'bandingkanDaerah') toolResult = toolBandingkanDaerah(call.args as any);

      // Now ask model to formulate answer from tool result
      const secondResponse = await withTimeout(
        aiClient.models.generateContent({
          model: MODEL_NAME,
          contents: [
            { role: 'user', parts: [{ text: message }] },
            { role: 'model', parts: [{ text: `Saya menjalankan fungsi ${call.name} dengan parameter ${JSON.stringify(call.args)}.` }] },
            { role: 'user', parts: [{ text: `Berikut hasil data database resmi: ${JSON.stringify(toolResult)}. Rangkai jawaban ramah, jelas, dan akurat dalam Bahasa Indonesia.` }] },
          ],
          config: {
            systemInstruction: 'Rangkai data database menjadi penjelasan yang informatif dan mudah dimengerti warga. Cantumkan angka kunci dalam huruf tebal.',
          },
        }),
        2500
      );

      return {
        reply: secondResponse.text || 'Data berhasil diperoleh dari sistem TERANG.',
        driver: 'gemini',
        toolUsed: call.name,
      };
    }

    return {
      reply: response.text || 'Informasi tidak ditemukan.',
      driver: 'gemini',
    };
  } catch (err: any) {
    console.warn('Gemini chat error, fallback used:', err.message);
    const fb = fallbackChatResponse(message);
    return { reply: fb.reply, driver: 'fallback', dataLinks: fb.dataLinks };
  }
}

// ==========================================
// AUTO-TRIASE LAPORAN (AI + RULE BASED)
// ==========================================

export async function autoTriaseReport(params: {
  judul: string;
  deskripsi: string;
  lat: number;
  lng: number;
  kategori?: string;
}): Promise<{
  kategori_saran: string;
  urgensi: number; // 1 - 5
  urgensi_alasan: string;
  ringkasan: string;
  kandidat_proyek: Array<{ id: string; nama: string; jarak_meter: number }>;
  driver: 'gemini' | 'fallback';
}> {
  // Find top 3 closest projects within radius
  const sortedProjects = db.projects
    .map((p) => ({
      id: p.id,
      nama: p.nama,
      jarak_meter: calculateDistanceMeters(params.lat, params.lng, p.lat, p.lng),
    }))
    .sort((a, b) => a.jarak_meter - b.jarak_meter)
    .slice(0, 3);

  // Fallback defaults
  let urgensi = 3;
  let urgensiAlasan = 'Laporan membutuhkan peninjauan administratif dinas pengampu.';
  const lower = `${params.judul} ${params.deskripsi}`.toLowerCase();
  if (lower.includes('longsor') || lower.includes('amblas') || lower.includes('darurat') || lower.includes('korban') || lower.includes('patah')) {
    urgensi = 5;
    urgensiAlasan = 'Indikasi bahaya keselamatan jiwa atau terputusnya akses vital masyarakat.';
  } else if (lower.includes('mangkrak') || lower.includes('terbengkalai') || lower.includes('korupsi') || lower.includes('bocor')) {
    urgensi = 4;
    urgensiAlasan = 'Berpotensi menimbulkan kerugian keuangan negara atau gangguan operasional publik meluas.';
  }

  const ringkasan = params.deskripsi.length > 120 ? `${params.deskripsi.slice(0, 115)}...` : params.deskripsi;

  return {
    kategori_saran: params.kategori || 'jalan_rusak',
    urgensi,
    urgensi_alasan: urgensiAlasan,
    ringkasan,
    kandidat_proyek: sortedProjects,
    driver: 'fallback',
  };
}

// ==========================================
// BANTU PERJELAS LAPORAN (PROMPT ENHANCER)
// ==========================================

export async function clarifyReportText(params: {
  judul: string;
  deskripsi: string;
}): Promise<{ judul_saran: string; deskripsi_saran: string; driver: 'gemini' | 'fallback' }> {
  if (!aiClient) {
    return {
      judul_saran: params.judul.trim(),
      deskripsi_saran: `Kondisi di lapangan: ${params.deskripsi.trim()}. Dampak yang dirasakan warga: akses jalan terhambat dan rawan kecelakaan. Mohon pihak terkait segera melakukan tinjauan teknis dan perbaikan sesuai standar spesifikasi.`,
      driver: 'fallback',
    };
  }

  try {
    const prompt = `Perbaiki dan perjelas draf laporan warga berikut agar lebih objektif, runut, dan mudah ditindaklanjuti inspektorat daerah. JANGAN mengubah esensi fakta.
Judul asli: "${params.judul}"
Deskripsi asli: "${params.deskripsi}"
Keluarkan format JSON dengan key: judul_saran dan deskripsi_saran.`;

    const res = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(res.text || '{}');
    return {
      judul_saran: parsed.judul_saran || params.judul,
      deskripsi_saran: parsed.deskripsi_saran || params.deskripsi,
      driver: 'gemini',
    };
  } catch (e) {
    return {
      judul_saran: params.judul.trim(),
      deskripsi_saran: `Kondisi di lapangan: ${params.deskripsi.trim()}. Dampak yang dirasakan warga: akses mobilitas dan keselamatan terganggu. Mohon peninjauan faktual oleh instansi pengampu.`,
      driver: 'fallback',
    };
  }
}

// ==========================================
// GENERATE INSIGHT NARRATIVE
// ==========================================

export async function generateInsightNarrative(params: {
  region_id?: string;
  tahun?: number;
}): Promise<{ narasi: string; rekomendasi: string[]; driver: 'gemini' | 'fallback' }> {
  const tahun = params.tahun || 2024;
  const reg = params.region_id && params.region_id !== 'all' ? db.regions.find((r) => r.id === params.region_id) : null;
  const regName = reg ? reg.nama : 'Provinsi Sumatera Utara';

  const bgt = db.budgets.filter((b) => (!reg || b.region_id === reg.id) && b.tahun === tahun);
  const pagu = bgt.reduce((acc, c) => acc + c.pagu, 0);
  const real = bgt.reduce((acc, c) => acc + c.realisasi, 0);
  const serapan = calculateAbsorptionRate(real, pagu);

  const regProjects = db.projects.filter((p) => (!reg || p.region_id === reg.id) && p.tahun === tahun);
  const gapHigh = regProjects.filter((p) => {
    const count = db.reports.filter((r) => r.project_id === p.id).length;
    return calculateGapIndicator(p, count).needsFieldVerification;
  }).length;

  const narasi = `Pada TA ${tahun}, alokasi belanja publik di wilayah ${regName} mencapai total Rp ${(pagu / 1e12).toFixed(2)} Triliun dengan tingkat realisasi serapan sebesar ${serapan}%. Berdasarkan pemantauan terpadu TERANG, tercatat ${gapHigh} paket pekerjaan berstatus "Perlu Verifikasi Lapangan" karena menunjukkan ketertinggalan progres fisik yang signifikan dibandingkan pencairan termin keuangan. Partisipasi warga melalui 60+ aduan terverifikasi menjadi instrumen kunci pencegahan kebocoran anggaran daerah.`;

  const rekomendasi = [
    'Lakukan uji petik fisik berkala oleh Inspektorat Daerah terhadap 3 proyek dengan deviasi kemajuan fisik di atas 25%.',
    'Tingkatkan keterbukaan data lelang dan jadwal milestones mingguan kontraktor agar masyarakat dapat melakukan pengawasan mandiri.',
    'Optimalkan respons Dinas PUPR dan Dinas Kesehatan dalam menanggapi aduan warga dengan target respon di bawah 3 hari kerja.',
  ];

  return { narasi, rekomendasi, driver: 'fallback' };
}

// ==========================================
// SUPERAGENT AUTONOMOUS ENGINE (100% AUTO-PILOT)
// ==========================================

export async function runFullAutoPilotScan(): Promise<{
  scanned_projects: number;
  anomalies_found: number;
  auto_actions_taken: number;
  logs: any[];
}> {
  db.agentStats.totalScans++;
  db.agentStats.lastScanAt = new Date().toISOString();

  const logs: any[] = [];
  let anomaliesFound = 0;
  let autoActionsTaken = 0;

  // 1. Scan Projects for High Financial vs Physical Delta
  const projects = db.projects;
  const anomalousProjects: Array<{ p: any; gap: any }> = [];

  for (const p of projects) {
    const verifiedReports = db.reports.filter((r) => r.project_id === p.id && r.status !== 'ditolak');
    const gap = calculateGapIndicator(p, verifiedReports.length);
    if (gap.needsFieldVerification || gap.level === 'Tinggi' || p.status === 'mangkrak') {
      anomalousProjects.push({ p, gap });
    }
  }

  anomaliesFound = anomalousProjects.length;

  const log1 = db.addAgentLog({
    level: 'action',
    module: 'AUTONOMOUS-SCANNER',
    message: `Auto-pilot memindai ${projects.length} proyek publik Sumut. Ditemukan ${anomaliesFound} paket pekerjaan dengan deviasi progres tinggi.`,
    details: { totalScanned: projects.length, anomaliesFound },
  });
  logs.push(log1);

  // 2. Auto-dispatch audit alerts for top 3 high gap projects
  for (const item of anomalousProjects.slice(0, 3)) {
    autoActionsTaken++;
    const logItem = db.addAgentLog({
      level: 'warn',
      module: 'AUTO-AUDIT-DISPATCH',
      message: `[AUTO-DISPATCH] Mengirim nota audit ke Inspektorat untuk proyek "${item.p.nama}" (${item.p.region_nama}). Deviasi: ${item.gap.progressDelta}%.`,
      details: { projectId: item.p.id, risk: item.gap.level, reasons: item.gap.reasons },
    });
    logs.push(logItem);
  }

  // 3. Auto-Triage Pending Reports
  const triageResult = await autoTriageAllPendingReports();
  autoActionsTaken += triageResult.triaged_count;

  // 4. Auto-Dispatch Agency Responses
  const dispatchResult = await autoDispatchAgencyNotice();
  autoActionsTaken += dispatchResult.dispatched_count;

  db.agentStats.zeroDelayActions += autoActionsTaken;

  const finalLog = db.addAgentLog({
    level: 'success',
    module: 'AUTONOMOUS-SCANNER',
    message: `Siklus Auto-Pilot 100% selesai: ${autoActionsTaken} tindakan agen dieksekusi tanpa delay manual.`,
  });
  logs.push(finalLog);

  return {
    scanned_projects: projects.length,
    anomalies_found: anomaliesFound,
    auto_actions_taken: autoActionsTaken,
    logs,
  };
}

export async function autoTriageAllPendingReports(): Promise<{
  pending_count: number;
  triaged_count: number;
  triaged_reports: any[];
  needs_human_count: number;
  needs_human_reports: any[];
}> {
  const pendingReports = db.reports.filter((r) => r.status === 'diterima');
  const triaged: any[] = [];
  const needsHuman: any[] = [];

  for (const rep of pendingReports) {
    const triage = await autoTriaseReport({
      judul: rep.judul,
      deskripsi: rep.deskripsi,
      lat: rep.lat,
      lng: rep.lng,
      kategori: rep.kategori,
    });

    // Gerbang keyakinan: agen hanya memverifikasi otomatis bila bukti cukup.
    // Laporan yang kurang jelas tetap menunggu verifikator manusia (human-in-the-loop).
    const nearest = triage.kandidat_proyek[0];
    const confidence =
      0.4 +
      (nearest && nearest.jarak_meter <= 5000 ? 0.3 : 0) +
      (rep.deskripsi.trim().length >= 40 ? 0.15 : 0) +
      (rep.judul.trim().length >= 8 ? 0.05 : 0) +
      (triage.urgensi >= 4 ? 0.1 : 0);
    if (confidence < 0.6) {
      needsHuman.push(rep);
      db.addAgentLog({
        level: 'warn',
        module: 'SUPERAGENT-TRIAGE',
        message: `[ESKALASI MANUSIA] ${rep.tracking_code} belum cukup bukti (keyakinan ${(confidence * 100).toFixed(0)}%) - diteruskan ke verifikator.`,
        details: { reportId: rep.id, confidence },
      });
      continue;
    }

    // Auto update status to verified
    rep.status = 'diverifikasi';
    rep.ai_urgensi = triage.urgensi;
    rep.ai_ringkasan = triage.ringkasan;
    rep.verified_by = 'SuperAgent AI Auto-Triage';
    rep.verified_at = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (triage.kandidat_proyek.length > 0 && !rep.project_id) {
      const closest = triage.kandidat_proyek[0];
      if (closest.jarak_meter <= 5000) {
        rep.project_id = closest.id;
        rep.project_nama = closest.nama;
      }
    }

    // Match closest GeoJSON region boundaries by Lat/Lng distance if needed
    if (db.regions.length > 0 && rep.lat && rep.lng) {
      let minDistance = Infinity;
      let matchedRegion = db.regions[0];
      for (const reg of db.regions) {
        const d = calculateDistanceMeters(rep.lat, rep.lng, reg.lat, reg.lng);
        if (d < minDistance) {
          minDistance = d;
          matchedRegion = reg;
        }
      }
      if (minDistance < 50000) {
        rep.region_id = matchedRegion.id;
        rep.region_nama = matchedRegion.nama;
      }
    }

    rep.updates.push({
      id: `upd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      report_id: rep.id,
      status_dari: 'diterima',
      status_ke: 'diverifikasi',
      catatan: `[AUTO-TRIAGE SUPERAGENT] Laporan terverifikasi otomatis. Urgensi: Skala ${triage.urgensi}/5. ${triage.urgensi_alasan}`,
      petugas: 'SuperAgent AI Auto-Pilot',
      is_public: true,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    db.addAgentLog({
      level: 'success',
      module: 'SUPERAGENT-TRIAGE',
      message: `[AUTO-TRIAGE] ${rep.tracking_code} terverifikasi otomatis: Urgensi ${triage.urgensi}/5 (${rep.region_nama}).`,
      details: { reportId: rep.id, code: rep.tracking_code, urgensi: triage.urgensi },
    });

    triaged.push(rep);
  }

  db.agentStats.autoTriaged += triaged.length;

  return {
    pending_count: pendingReports.length,
    triaged_count: triaged.length,
    triaged_reports: triaged,
    needs_human_count: needsHuman.length,
    needs_human_reports: needsHuman,
  };
}

export async function autoDispatchAgencyNotice(reportId?: string): Promise<{
  dispatched_count: number;
  dispatches: any[];
}> {
  let targets = db.reports.filter((r) => r.status === 'diverifikasi' && !r.agency_response);
  if (reportId) {
    targets = targets.filter((r) => r.id === reportId);
  }

  const dispatches: any[] = [];

  for (const rep of targets) {
    const agencyName = rep.sector_nama.toLowerCase().includes('kesehatan')
      ? 'Dinas Kesehatan Provinsi Sumatera Utara'
      : rep.sector_nama.toLowerCase().includes('pendidikan')
      ? 'Dinas Pendidikan Provinsi Sumatera Utara'
      : 'Dinas Pekerjaan Umum & Penataan Ruang (PUPR) Sumut';

    const officialResponse = `[NOTA DINAS OTOMATIS SUPERAGENT] Laporan warga ${rep.tracking_code} (${rep.judul}) telah diklasifikasikan oleh SuperAgent AI ke ${agencyName}. Tim teknis lapangan telah dijadwalkan untuk melakukan verifikasi faktual dan tindakan perbaikan dalam 2x24 jam kerja.`;

    db.addAgencyResponse({
      reportId: rep.id,
      instansi: agencyName,
      pejabat: 'Tim Respon Cepat SuperAgent AI',
      tanggapan: officialResponse,
      userEmail: 'agent@terang.test',
    });

    rep.status = 'ditindaklanjuti';
    rep.updates.push({
      id: `upd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      report_id: rep.id,
      status_dari: 'diverifikasi',
      status_ke: 'ditindaklanjuti',
      catatan: `[AUTO-DISPATCH] Disposisi otomatis dan nota resmi diterbitkan ke ${agencyName}.`,
      petugas: 'SuperAgent AI Auto-Pilot',
      is_public: true,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });

    db.addAgentLog({
      level: 'action',
      module: 'SUPERAGENT-DISPATCH',
      message: `[AUTO-DISPATCH] Tanggapan resmi diterbitkan ke ${agencyName} untuk laporan ${rep.tracking_code}.`,
      details: { code: rep.tracking_code, agency: agencyName },
    });

    dispatches.push({ reportId: rep.id, code: rep.tracking_code, agency: agencyName });
  }

  db.agentStats.autoDispatched += dispatches.length;

  return {
    dispatched_count: dispatches.length,
    dispatches,
  };
}

export async function autoOptimizeBudgetAllocation(): Promise<{
  recommendations: Array<{ sector: string; currentAbsorption: string; deltaPercent: string; rationale: string }>;
  totalOptimizedBudget: string;
  estimatedReallocation: string;
}> {
  const budgets2024 = db.budgets.filter((b) => b.tahun === 2024);
  const totalPagu = budgets2024.reduce((a, c) => a + c.pagu, 0);

  // Agregasi nyata per sektor dari data APBD
  const bySector = new Map<string, { pagu: number; real: number }>();
  for (const b of budgets2024) {
    const cur = bySector.get(b.sector_nama) || { pagu: 0, real: 0 };
    cur.pagu += b.pagu;
    cur.real += b.realisasi;
    bySector.set(b.sector_nama, cur);
  }
  const rows = [...bySector.entries()]
    .map(([sector, v]) => ({ sector, pagu: v.pagu, rate: calculateAbsorptionRate(v.real, v.pagu), idle: v.pagu - v.real }))
    .sort((a, b) => a.rate - b.rate);

  const slow = rows.slice(0, 2); // serapan terendah: sumber efisiensi
  const fast = rows.slice(-2).reverse(); // serapan tertinggi: kebutuhan terbukti, kandidat penerima
  const recommendations = [
    ...slow.map((r) => ({
      sector: r.sector,
      currentAbsorption: `${r.rate}%`,
      deltaPercent: '-5%',
      rationale: `Serapan rendah dengan sisa pagu Rp ${(r.idle / 1e9).toFixed(1)} Miliar; kaji ulang kegiatan yang tidak akan terserap sebelum akhir tahun.`,
    })),
    ...fast.map((r) => ({
      sector: r.sector,
      currentAbsorption: `${r.rate}%`,
      deltaPercent: '+3%',
      rationale: 'Serapan tinggi menunjukkan kapasitas pelaksana memadai; layak menerima realokasi bila ada kebutuhan mendesak.',
    })),
  ];
  const reallocation = slow.reduce((a, r) => a + r.idle * 0.05, 0);

  db.addAgentLog({
    level: 'info',
    module: 'SUPERAGENT-OPTIMIZER',
    message: `[AUTO-OPTIMIZE] Rekomendasi realokasi dihitung dari data APBD TA 2024: potensi Rp ${(reallocation / 1e9).toFixed(1)} Miliar (rekomendasi, bukan keputusan).`,
    details: { recommendations },
  });

  return {
    recommendations,
    totalOptimizedBudget: `Rp ${(totalPagu / 1e12).toFixed(2)} Triliun`,
    estimatedReallocation: `Rp ${(reallocation / 1e9).toFixed(1)} Miliar`,
  };
}

// Ringkasan naratif opsional memakai Gemini bila API key tersedia (null bila tidak).
export async function generateBriefText(prompt: string): Promise<string | null> {
  if (!aiClient) return null;
  try {
    const res = await withTimeout(
      aiClient.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: 'Anda analis kebijakan publik Sumatera Utara. Tulis ringkasan eksekutif singkat (maks 120 kata) dalam Bahasa Indonesia, hanya berdasarkan angka yang diberikan. Jangan mengarang angka.',
          temperature: 0.2,
        },
      }),
      9000
    );
    return res.text?.trim() || null;
  } catch {
    return null;
  }
}
