import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Share2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Building2,
  HelpCircle,
  X,
  Search,
} from 'lucide-react';
import { Region } from '../data/regionsData';
import { Sector } from '../data/sectorsData';
import { Project } from '../data/projectsData';

interface ReportFormViewProps {
  regions: Region[];
  sectors: Sector[];
  preselectedProject?: Project | null;
  onNavigateToTrack: (trackingCode: string) => void;
}

export const ReportFormView: React.FC<ReportFormViewProps> = ({
  regions,
  sectors,
  preselectedProject,
  onNavigateToTrack,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProject ? preselectedProject.id : '');
  const [isOtherLocation, setIsOtherLocation] = useState<boolean>(!preselectedProject);
  const [regionId, setRegionId] = useState<string>(preselectedProject ? preselectedProject.region_id : 'reg-medan');
  const [sectorId, setSectorId] = useState<string>(preselectedProject ? preselectedProject.sector_id : 'sec-pupr');
  const [kategori, setKategori] = useState<string>('jalan_rusak');

  const [judul, setJudul] = useState<string>('');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [lat, setLat] = useState<number>(preselectedProject ? preselectedProject.lat : 3.5952);
  const [lng, setLng] = useState<number>(preselectedProject ? preselectedProject.lng : 98.6722);
  const [alamat, setAlamat] = useState<string>(preselectedProject ? preselectedProject.lokasi_nama : '');
  const [namaPelapor, setNamaPelapor] = useState<string>('');
  const [kontak, setKontak] = useState<string>('');
  const [isAnonim, setIsAnonim] = useState<boolean>(false);
  const [honeypot, setHoneypot] = useState<string>('');

  // Photo uploads
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
  ]);

  // AI Assist & Submission States
  const [isClarifying, setIsClarifying] = useState(false);
  const [clarifySuccess, setClarifySuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Available projects for autocomplete
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [projectSearch, setProjectSearch] = useState('');

  useEffect(() => {
    fetch('/api/v1/projects')
      .then((r) => r.json())
      .then((data) => setAllProjects(data.data || []))
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (preselectedProject) {
      setSelectedProjectId(preselectedProject.id);
      setIsOtherLocation(false);
      setRegionId(preselectedProject.region_id);
      setSectorId(preselectedProject.sector_id);
      setLat(preselectedProject.lat);
      setLng(preselectedProject.lng);
      setAlamat(preselectedProject.lokasi_nama);
      setJudul(`Ketidaksesuaian pada ${preselectedProject.nama}`);
      setStep(1);
    }
  }, [preselectedProject]);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(4)));
          setLng(Number(pos.coords.longitude.toFixed(4)));
          setAlamat('Lokasi Terdeteksi GPS Perangkat');
        },
        () => {
          // Default to Medan center if denied
          setLat(3.5952);
          setLng(98.6722);
          setAlamat('Kota Medan (Default)');
        }
      );
    }
  };

  const handleAiClarify = async () => {
    if (!deskripsi || deskripsi.trim().length < 15) {
      setErrorMessage('Tuliskan draf deskripsi minimal 15 karakter sebelum menggunakan bantuan AI.');
      return;
    }
    setErrorMessage(null);
    setIsClarifying(true);
    try {
      const res = await fetch('/api/ai/clarify-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judul, deskripsi }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (data.data.judul_saran) setJudul(data.data.judul_saran);
        if (data.data.deskripsi_saran) setDeskripsi(data.data.deskripsi_saran);
        setClarifySuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsClarifying(false);
    }
  };

  const handleSubmitReport = async () => {
    if (honeypot) return; // bot detected
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        project_id: isOtherLocation ? null : selectedProjectId,
        region_id: regionId,
        sector_id: sectorId,
        kategori,
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        lat,
        lng,
        alamat: alamat || 'Lokasi Terdaftar',
        nama_pelapor: isAnonim ? 'Warga Anonim' : namaPelapor,
        kontak,
        is_anonim: isAnonim,
        foto_bukti: photos,
      };

      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSubmissionResult(data);
        setStep(4); // Success step
      } else {
        setErrorMessage(data.message || 'Gagal mengirim laporan. Pastikan seluruh kolom terisi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!submissionResult?.tracking_code) return;
    navigator.clipboard.writeText(submissionResult.tracking_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredProjects = allProjects.filter((p) =>
    p.nama.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.kode.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <span className="text-xs font-semibold text-[#0FA3B1] uppercase tracking-wider">Civic Reporting & Accountability</span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">Form Pengaduan Ketidaksesuaian Proyek</h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Laporan Anda diverifikasi langsung oleh Inspektorat Daerah dan terhubung transparan dengan paket anggaran proyek.
        </p>
      </div>

      {/* Enhanced 3 Step Wizard Progress Bar */}
      {step < 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 mb-8">
          <div className="flex items-center justify-between">
            {/* Step 1 */}
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step > 1 ? 'bg-emerald-600 text-white' :
                step === 1 ? 'bg-[#0B7C8A] text-white ring-4 ring-teal-500/20 font-extrabold' :
                'bg-slate-200 text-slate-500'
              }`}>
                {step > 1 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '1'}
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Langkah 1</span>
                <span className={`text-xs font-semibold ${step === 1 ? 'text-[#0B7C8A] font-bold' : 'text-slate-700'}`}>
                  Objek & Kategori
                </span>
              </div>
            </div>

            <div className={`flex-1 h-1 mx-3 rounded-full transition-colors ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 2 */}
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step > 2 ? 'bg-emerald-600 text-white' :
                step === 2 ? 'bg-[#0B7C8A] text-white ring-4 ring-teal-500/20 font-extrabold' :
                'bg-slate-200 text-slate-500'
              }`}>
                {step > 2 ? <CheckCircle2 className="w-5 h-5 text-white" /> : '2'}
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Langkah 2</span>
                <span className={`text-xs font-semibold ${step === 2 ? 'text-[#0B7C8A] font-bold' : 'text-slate-700'}`}>
                  Rincian & Foto
                </span>
              </div>
            </div>

            <div className={`flex-1 h-1 mx-3 rounded-full transition-colors ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

            {/* Step 3 */}
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step === 3 ? 'bg-[#0B7C8A] text-white ring-4 ring-teal-500/20 font-extrabold' :
                'bg-slate-200 text-slate-500'
              }`}>
                3
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Langkah 3</span>
                <span className={`text-xs font-semibold ${step === 3 ? 'text-[#0B7C8A] font-bold' : 'text-slate-700'}`}>
                  Tinjau & Kirim
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Honeypot field (hidden from users) */}
      <input
        type="text"
        name="company_website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      {/* STEP 1: Pilih Proyek & Kategori */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-display">Langkah 1: Identifikasi Objek Laporan</h3>

            {/* Opsi Terhubung Proyek vs Lokasi Lain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsOtherLocation(false)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  !isOtherLocation
                    ? 'border-[#0FA3B1] bg-teal-50/50 text-slate-900 shadow-xs ring-1 ring-[#0FA3B1]'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <div className="font-semibold text-xs mb-1 text-slate-900">Terhubung ke Proyek Resmi</div>
                <p className="text-[11px] text-slate-500">Pilih dari katalog 160+ paket proyek APBD terdaftar</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOtherLocation(true);
                  setSelectedProjectId('');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isOtherLocation
                    ? 'border-[#0FA3B1] bg-teal-50/50 text-slate-900 shadow-xs ring-1 ring-[#0FA3B1]'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <div className="font-semibold text-xs mb-1 text-slate-900">Lokasi Lain / Tanpa Proyek</div>
                <p className="text-[11px] text-slate-500">Jalan rusak, fasilitas umum, atau dugaan tanpa plang</p>
              </button>
            </div>

            {/* Autocomplete Project if linked */}
            {!isOtherLocation && (
              <div className="space-y-2 pt-2">
                <label className="block font-semibold text-slate-700">Pilih Paket Proyek Terdaftar</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Ketik nama proyek, daerah, atau kode (misal: Medan-Berastagi, SPAM...)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                  {filteredProjects.slice(0, 10).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setRegionId(p.region_id);
                        setSectorId(p.sector_id);
                        setLat(p.lat);
                        setLng(p.lng);
                        setAlamat(p.lokasi_nama);
                        setJudul(`Ketidaksesuaian pada ${p.nama}`);
                      }}
                      className={`p-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedProjectId === p.id ? 'bg-teal-50/70 border-l-2 border-[#0FA3B1]' : ''
                      }`}
                    >
                      <div className="font-semibold text-slate-800 text-xs">{p.nama}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{p.kode}</span>
                        <span>·</span>
                        <span>{p.region_nama}</span>
                        <span>·</span>
                        <span>Pagu: Rp {(p.pagu / 1e9).toFixed(1)} M</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daerah & Sektor (jika lokasi lain) */}
            {isOtherLocation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wilayah Kabupaten / Kota</label>
                  <select
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
                  >
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sektor Terkait</label>
                  <select
                    value={sectorId}
                    onChange={(e) => setSectorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
                  >
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Kategori Masalah */}
            <div className="space-y-2 pt-2">
              <label className="block font-semibold text-slate-700">Kategori Masalah Lapangan</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'jalan_rusak', label: 'Jalan / Jembatan Rusak' },
                  { id: 'proyek_mangkrak', label: 'Proyek Mangkrak / Terhenti' },
                  { id: 'kualitas_buruk', label: 'Kualitas Fisik Buruk' },
                  { id: 'tidak_sesuai_laporan', label: 'Tidak Sesuai Laporan Pemda' },
                  { id: 'masalah_lingkungan', label: 'Dampak Lingkungan / Drainase' },
                  { id: 'dugaan_penyimpangan', label: 'Dugaan Penyimpangan Pagu' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setKategori(cat.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all text-xs font-medium ${
                      kategori === cat.id
                        ? 'border-[#0FA3B1] bg-teal-50 text-teal-800'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                if (!isOtherLocation && !selectedProjectId) {
                  setErrorMessage('Pilih salah satu proyek terdaftar atau beralih ke "Lokasi Lain / Tanpa Proyek".');
                  return;
                }
                setErrorMessage(null);
                setStep(2);
              }}
              className="px-5 py-2.5 bg-[#0B7C8A] hover:bg-[#096A76] text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Lanjut ke Rincian</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Rincian & Bukti Foto */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-display">Langkah 2: Rincian Aduan & Bukti Faktual</h3>

            {/* Judul Laporan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Judul Laporan Singkat</label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Aspal Jalan Penghubung Balige Retak Parah Setelah 2 Bulan Selesai"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
              />
            </div>

            {/* Deskripsi & AI Clarify button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Deskripsi Kronologi Lapangan <span className="text-slate-400 font-normal">(Min. 30 Karakter)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAiClarify}
                  disabled={isClarifying || deskripsi.length < 15}
                  className="text-[11px] text-[#0FA3B1] hover:text-[#0c8a96] font-medium flex items-center gap-1 disabled:opacity-40"
                  title="Sempurnakan kalimat agar lebih objektif dan mudah ditindaklanjuti inspektorat"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isClarifying ? 'Menyempurnakan...' : 'Bantu Perjelas Laporan (AI)'}</span>
                </button>
              </div>

              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={4}
                placeholder="Jelaskan kondisi fisik yang Anda lihat, dampaknya bagi warga sekitar, dan sudah berapa lama kondisi tersebut terjadi..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none leading-relaxed"
              />

              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>{deskripsi.length} / 30 karakter minimal</span>
                {clarifySuccess && (
                  <span className="text-teal-600 font-medium">Kalimat disempurnakan dengan bantuan AI</span>
                )}
              </div>
            </div>

            {/* Lokasi Geografis & Geolocation */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Titik Lokasi & Alamat Spesifik</label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="text-[11px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Gunakan Lokasi Saya (GPS)</span>
                </button>
              </div>

              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Nama jalan, patokan terdekat, dusun/kelurahan, kecamatan"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none mb-2"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Latitude (Lintang)</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Longitude (Bujur)</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Upload Foto Bukti */}
            <div className="space-y-2 pt-2">
              <label className="block font-semibold text-slate-700">Foto Bukti Fisik Lapangan (1 - 3 Foto)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 h-24 group">
                    <img src={p} alt="Bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-xs"
                      aria-label="Hapus foto bukti"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Demo preset real-world photo attachment
                      const sampleBukti = [
                        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&auto=format&fit=crop&q=80',
                      ];
                      setPhotos([...photos, sampleBukti[photos.length % sampleBukti.length]]);
                    }}
                    className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:border-[#0FA3B1] hover:text-[#0FA3B1] transition-colors"
                  >
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">+ Tambah Foto</span>
                  </button>
                )}
              </div>
            </div>

            {/* Identitas Pelapor & Anonimitas */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonimCheck"
                  checked={isAnonim}
                  onChange={(e) => setIsAnonim(e.target.checked)}
                  className="rounded text-[#0FA3B1] focus:ring-[#0FA3B1]"
                />
                <label htmlFor="anonimCheck" className="font-semibold text-slate-800 cursor-pointer">
                  Laporkan secara Anonim (Nama tidak akan dicatat di database publik)
                </label>
              </div>

              {!isAnonim && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Nama Lengkap Pelapor</label>
                    <input
                      type="text"
                      value={namaPelapor}
                      onChange={(e) => setNamaPelapor(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Nomor WhatsApp / Kontak (Hanya untuk Verifikator)</label>
                    <input
                      type="text"
                      value={kontak}
                      onChange={(e) => setKontak(e.target.value)}
                      placeholder="0812xxxx (Terenkripsi, tidak pernah ditampilkan)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <button
              onClick={() => {
                if (!judul || judul.trim().length < 5) {
                  setErrorMessage('Judul laporan minimal 5 karakter.');
                  return;
                }
                if (!deskripsi || deskripsi.trim().length < 30) {
                  setErrorMessage('Deskripsi laporan minimal 30 karakter.');
                  return;
                }
                setErrorMessage(null);
                setStep(3);
              }}
              className="px-5 py-2.5 bg-[#0B7C8A] hover:bg-[#096A76] text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Tinjau Laporan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Tinjau & Kirim */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-sm text-slate-900 font-display">Langkah 3: Tinjauan Akhir Sebelum Mengirim</h3>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Judul Aduan</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{judul}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Kategori & Objek</span>
                <p className="font-medium text-slate-700 mt-0.5">
                  Kategori: <strong className="text-slate-900">{kategori.replace('_', ' ').toUpperCase()}</strong> · Wilayah: <strong className="text-slate-900">{regions.find((r) => r.id === regionId)?.nama}</strong>
                </p>
                {!isOtherLocation && selectedProjectId && (
                  <p className="text-teal-700 font-semibold mt-1">
                    Terhubung ke Proyek: {allProjects.find((p) => p.id === selectedProjectId)?.nama}
                  </p>
                )}
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Uraian Masalah</span>
                <p className="leading-relaxed text-slate-700 mt-0.5 whitespace-pre-wrap">{deskripsi}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Lokasi Geografis</span>
                <p className="text-slate-700 mt-0.5">{alamat} ({lat}, {lng})</p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block">Identitas Pelapor</span>
                <p className="text-slate-700 mt-0.5">
                  {isAnonim ? 'Dirahasiakan (Anonim)' : `${namaPelapor || 'Warga'} · Kontak tersimpan aman`}
                </p>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 p-3 rounded-lg text-teal-800 text-[11px]">
              Dengan menekan tombol "Kirim Laporan Resmi", Anda menyatakan data dan foto bukti yang dikirimkan adalah benar sesuai kondisi lapangan untuk ditindaklanjuti secara akuntabel.
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ubah Data</span>
            </button>
            <button
              onClick={handleSubmitReport}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#2E9E6B] hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Mendaftarkan Laporan...' : 'Kirim Laporan Resmi'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success Screen with Large Tracking Code */}
      {step === 4 && submissionResult && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-slate-900">Laporan Berhasil Didaftarkan!</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Laporan Anda telah masuk ke antrean verifikasi terpadu TERANG dan akan ditinjau oleh Inspektorat Daerah dalam 1-3 hari kerja.
            </p>
          </div>

          {/* Large Tracking Code Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Kode Pelacakan Resmi Anda</span>
            <div className="text-3xl font-mono font-extrabold text-[#0B2545] tracking-widest select-all">
              {submissionResult.tracking_code}
            </div>
            <p className="text-[11px] text-slate-500">
              Simpan kode ini untuk memantau perkembangan tindak lanjut dan foto perbaikan lapangan.
            </p>

            <div className="flex justify-center items-center gap-2 pt-2">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode'}</span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Laporan TERANG',
                      text: `Lacak laporan publik saya di TERANG dengan kode: ${submissionResult.tracking_code}`,
                      url: window.location.href,
                    });
                  } else {
                    copyToClipboard();
                  }
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan</span>
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap justify-center items-center gap-3">
            <button
              onClick={() => onNavigateToTrack(submissionResult.tracking_code)}
              className="px-6 py-2.5 bg-[#0FA3B1] hover:bg-[#0c8a96] text-white rounded-lg text-xs font-bold transition-colors"
            >
              Lacak Status Laporan Sekarang &rarr;
            </button>
            <button
              onClick={() => {
                setStep(1);
                setJudul('');
                setDeskripsi('');
                setSubmissionResult(null);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Kirim Aduan Lainnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
