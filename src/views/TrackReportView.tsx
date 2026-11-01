import React, { useState, useEffect, useRef } from 'react';
import { PageMotion } from '../components/PageMotion';
import { PageHero } from '../components/PageHero';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
  Share2,
  MessageSquare,
  Camera,
  ArrowRight,
  Shield,
  FileCheck,
  Filter,
  ArrowLeft,
  ThumbsUp,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { CivicReport, REPORTS } from '../data/reportsData';

const BeforeAfterSlider: React.FC<{ beforeImg: string; afterImg: string }> = ({ beforeImg, afterImg }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    let pct = (x / rect.width) * 100;
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    setSliderPos(pct);
  };

  return (
    <div
      className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden select-none border border-slate-200 shadow-md cursor-ew-resize group"
      onMouseMove={(e) => {
        if (isDragging) handleMove(e.clientX, e.currentTarget.getBoundingClientRect());
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
      }}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
    >
      <img src={afterImg} alt="Kondisi Setelah Perbaikan" className="absolute inset-0 w-full h-full object-cover" />
      <span className="absolute bottom-3 right-3 bg-emerald-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md z-10 backdrop-blur-xs">
        ● SETELAH PERBAIKAN
      </span>

      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={beforeImg} alt="Kondisi Awal Laporan Warga" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: '100%' }} />
        <span className="absolute bottom-3 left-3 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md z-10 backdrop-blur-xs">
          ● SEBELUM (BUKTI WARGA)
        </span>
      </div>

      <div className="absolute top-0 bottom-0 w-1 bg-white shadow-xl z-20 flex items-center justify-center pointer-events-none" style={{ left: `${sliderPos}%` }}>
        <div className="w-8 h-8 rounded-full bg-white text-slate-800 shadow-xl border-2 border-[#0B7C8A] flex items-center justify-center text-xs font-extrabold group-hover:scale-110 transition-transform">
          ↔
        </div>
      </div>
    </div>
  );
};

interface TrackReportViewProps {
  initialTrackingCode?: string;
  onNavigateToReport?: () => void;
}

export const TrackReportView: React.FC<TrackReportViewProps> = ({
  initialTrackingCode = '',
  onNavigateToReport,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialTrackingCode);
  const [reportData, setReportData] = useState<CivicReport | null>(null);
  const [searchResults, setSearchResults] = useState<CivicReport[]>(REPORTS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<CivicReport[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial load: Fetch all reports or process initialTrackingCode
  useEffect(() => {
    handleLookup(initialTrackingCode, 'all');
  }, [initialTrackingCode]);

  // Handle outside click to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function for local filtering fallback (100% guarantee data is always available)
  const filterLocalReports = (term: string, st: string) => {
    let list = REPORTS;
    if (st !== 'all') {
      list = list.filter((r) => r.status === st);
    }
    if (!term) return { list, exactMatch: null, isExact: false };

    const q = term.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/g, '');

    const exact = list.find(
      (r) =>
        r.tracking_code.toLowerCase() === q ||
        r.id.toLowerCase() === q ||
        (cleanQ.length >= 4 && r.tracking_code.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanQ)
    );

    const matched = list
      .map((r) => {
        let score = 0;
        const tc = r.tracking_code.toLowerCase();
        const tcClean = tc.replace(/[^a-z0-9]/g, '');
        const id = r.id.toLowerCase();
        const judul = r.judul.toLowerCase();
        const deskripsi = r.deskripsi.toLowerCase();
        const reg = r.region_nama.toLowerCase();
        const sec = r.sector_nama.toLowerCase();

        if (tc === q || id === q || (cleanQ.length >= 4 && tcClean === cleanQ)) score += 100;
        else if (tc.includes(q) || id.includes(q) || (cleanQ.length >= 4 && tcClean.includes(cleanQ))) score += 80;

        if (judul.includes(q)) score += 60;
        if (reg.includes(q)) score += 40;
        if (sec.includes(q)) score += 30;
        if (deskripsi.includes(q)) score += 20;

        return { report: r, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const resList = matched.map((m) => m.report);
    const isExact = Boolean(exact) && (
      exact?.tracking_code.toLowerCase() === q ||
      (cleanQ.length >= 4 && exact?.tracking_code.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanQ)
    );

    return { list: resList.length > 0 ? resList : list, exactMatch: isExact ? exact : null, isExact };
  };

  // Instant Autocomplete search with debounce
  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const res = await fetch(`/api/v1/reports/track?q=${encodeURIComponent(term)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data && data.data.length > 0) {
            setSuggestions(data.data.slice(0, 5));
            setShowSuggestionsDropdown(true);
            setIsSearchingSuggestions(false);
            return;
          }
        }
      } catch (err) {
        // Fallback below
      }

      // Local autocomplete fallback
      const { list } = filterLocalReports(term, 'all');
      setSuggestions(list.slice(0, 5));
      setShowSuggestionsDropdown(list.length > 0);
      setIsSearchingSuggestions(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleLookup = async (queryToSearch?: string, filterStatusOverride?: string) => {
    const term = (queryToSearch !== undefined ? queryToSearch : searchTerm).trim();
    setShowSuggestionsDropdown(false);
    setLoading(true);
    setErrorMessage(null);
    setReportData(null);

    const st = filterStatusOverride !== undefined ? filterStatusOverride : statusFilter;

    try {
      const res = await fetch(`/api/v1/reports/track?q=${encodeURIComponent(term)}&status=${st}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.data && data.data.length > 0) {
          const list: CivicReport[] = data.data;
          setSearchResults(list);
          if (data.isExactMatch && data.exactMatch) {
            setReportData(data.exactMatch);
          }
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      // Fallback below
    } finally {
      setLoading(false);
    }

    // Fallback to local REPORTS data if API call is not available or returns empty
    const { list, exactMatch, isExact } = filterLocalReports(term, st);
    setSearchResults(list);

    if (isExact && exactMatch) {
      setReportData(exactMatch);
    } else if (term && list.length === 0) {
      setErrorMessage(`Laporan dengan kata kunci '${term}' tidak ditemukan. Menampilkan seluruh data laporan.`);
    }
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setReportData(null);
    setErrorMessage(null);
    handleLookup('', 'all');
  };

  const selectReportFromList = (report: CivicReport) => {
    setReportData(report);
    setShowSuggestionsDropdown(false);
  };

  // Timeline Step Status Helper
  const getStepState = (targetStep: string, currentStatus: string) => {
    const order = ['diterima', 'diverifikasi', 'ditindaklanjuti', 'selesai'];
    const curIdx = order.indexOf(currentStatus);
    const targetIdx = order.indexOf(targetStep);

    if (currentStatus === 'ditolak') {
      if (targetStep === 'diterima') return 'completed';
      if (targetStep === 'diverifikasi') return 'rejected';
      return 'pending';
    }

    if (curIdx >= targetIdx) return 'completed';
    if (curIdx === targetIdx - 1) return 'current';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ditindaklanjuti':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'diverifikasi':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'ditolak':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <PageMotion page="track" className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHero
        eyebrow="LAYANAN PELACAKAN · KODE TRG"
        title="Lacak perkembangan laporan"
        description="Cari dengan kode TRG, kata kunci, atau nama wilayah untuk melihat status dan jejak tindak lanjut laporan."
        icon={<Search className="w-6 h-6" />}
        compact
      />

      {/* Universal Search Bar with Live Autocomplete */}
      <div className="relative max-w-3xl mx-auto" ref={dropdownRef}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestionsDropdown(true);
                }}
                placeholder="Cari kode TRG-2026-F9A27D atau kata kunci 'pelebaran'..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2.5 text-xs font-medium focus:ring-2 focus:ring-[#0FA3B1] focus:bg-white focus:outline-none transition-all"
              />
              {isSearchingSuggestions && (
                <div className="absolute right-3 top-3">
                  <div className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#0B7C8A] hover:bg-[#096A76] text-white text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 shrink-0"
            >
              {loading ? 'Mencari...' : 'Cari Laporan'}
            </button>
          </form>

          {/* Quick Filter Chips & Popular Keywords */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5 text-slate-500">
              <span className="shrink-0 font-medium text-slate-600">Popular Kata Kunci:</span>
              {[
                { label: 'Pelebaran Jalan', query: 'pelebaran' },
                { label: 'Medan-Berastagi', query: 'Medan-Berastagi' },
                { label: 'TRG-2026-F9A27D', query: 'TRG-2026-F9A27D' },
                { label: 'Irigasi', query: 'irigasi' },
                { label: 'Deli Serdang', query: 'Deli Serdang' },
              ].map((item) => (
                <button
                  key={item.query}
                  type="button"
                  onClick={() => {
                    setSearchTerm(item.query);
                    setStatusFilter('all');
                    handleLookup(item.query, 'all');
                  }}
                  className="bg-slate-100 hover:bg-[#096A76] hover:text-white text-slate-700 px-2.5 py-1 rounded-md font-medium shrink-0 transition-all"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Instant Autocomplete Dropdown */}
        {showSuggestionsDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
            <div className="px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Rekomendasi Hasil Pencarian</span>
              <span>{suggestions.length} ditemukan</span>
            </div>
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSearchTerm(item.tracking_code);
                  selectReportFromList(item);
                }}
                className="w-full px-4 py-3 text-left hover:bg-teal-50/50 transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#0B2545] bg-slate-100 group-hover:bg-teal-100 px-1.5 py-0.5 rounded">
                      {item.tracking_code}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-[#0FA3B1] truncate">
                    {item.judul}
                  </h4>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                    <span>{item.region_nama}</span>
                    <span>·</span>
                    <span>{item.dukungan_count} Dukungan Warga</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0FA3B1] shrink-0 self-center transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center justify-between gap-3 max-w-3xl mx-auto shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleResetSearch}
            className="text-[11px] font-bold text-red-800 underline hover:text-red-900 shrink-0"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* CARDS LIST VIEW (Always displayed when not viewing single report detail) */}
      {!reportData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0FA3B1]" />
                <span>
                  {searchTerm.trim() ? `Hasil Pencarian (${searchResults.length})` : `Semua Laporan Publik (${searchResults.length})`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {searchTerm.trim() ? (
                  <>Menampilkan laporan yang relevan dengan kata kunci <strong className="text-slate-800">"{searchTerm}"</strong></>
                ) : (
                  <>Daftar laporan aduan masyarakat terkini dalam sistem TERANG</>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                {['all', 'diverifikasi', 'ditindaklanjuti', 'selesai'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      handleLookup(searchTerm, st);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium text-[11px] transition-all capitalize ${
                      statusFilter === st
                        ? 'bg-[#0B7C8A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st === 'all' ? 'Semua Status' : st}
                  </button>
                ))}
              </div>

              {searchTerm.trim() && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectReportFromList(item)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-400 transition-all p-5 space-y-4 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#0B2545] bg-slate-100 group-hover:bg-teal-100 px-2.5 py-1 rounded transition-colors">
                        {item.tracking_code}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0FA3B1] leading-snug font-display transition-colors">
                      {item.judul}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.deskripsi}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        {item.region_nama}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                        {item.dukungan_count} Suara Warga
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0FA3B1] group-hover:translate-x-0.5 transition-transform">
                    <span>Lihat Status & Timeline Lengkap</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Tidak ada laporan yang dapat ditampilkan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba setel ulang filter status atau masukkan kata kunci yang berbeda.
              </p>
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-4 py-2 bg-[#0B7C8A] text-white text-xs font-semibold rounded-lg hover:bg-[#096A76] transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tampilkan Semua Laporan</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SINGLE REPORT DETAILED TIMELINE VIEW */}
      {reportData && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Back button */}
          <button
            type="button"
            onClick={() => setReportData(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B2545] hover:text-[#0FA3B1] bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Kembali ke Daftar Laporan ({searchResults.length} laporan)</span>
          </button>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
            {/* Header Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-[#0B2545] bg-slate-100 px-2.5 py-1 rounded">
                    {reportData.tracking_code}
                  </span>
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase border ${getStatusBadge(reportData.status)}`}>
                    STATUS: {reportData.status}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display mt-2">{reportData.judul}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">{reportData.region_nama}</span>
                  <span>·</span>
                  <span>{reportData.sector_nama}</span>
                  <span>·</span>
                  <span>Diajukan {reportData.created_at}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 block">Dukungan Warga</span>
                <span className="text-xl font-bold font-mono text-slate-900">{reportData.dukungan_count} Suara</span>
              </div>
            </div>

            {/* Stepper Status Horizontal Progress Bar with Timestamps */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tahapan Penyelesaian</h3>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs pt-2">
                {[
                  { id: 'diterima', label: '1. Diterima', short: '1. Terima', date: reportData.created_at },
                  { id: 'diverifikasi', label: '2. Diverifikasi', short: '2. Verifikasi', date: reportData.updates[0]?.created_at || reportData.created_at },
                  { id: 'ditindaklanjuti', label: '3. Ditindaklanjuti', short: '3. Tindak', date: reportData.updates[1]?.created_at || '-' },
                  { id: 'selesai', label: '4. Selesai', short: '4. Selesai', date: reportData.updates[2]?.created_at || '-' },
                ].map((step) => {
                  const state = getStepState(step.id, reportData.status);
                  return (
                    <div key={step.id} className="space-y-1">
                      <div className={`h-2 rounded-full transition-all ${
                        state === 'completed' ? 'bg-[#2E9E6B]' :
                        state === 'current' ? 'bg-[#0FA3B1] animate-pulse ring-2 ring-teal-400/40' :
                        state === 'rejected' ? 'bg-red-500' : 'bg-slate-200'
                      }`} />
                      <span className={`text-[10px] sm:text-[11px] font-semibold block leading-tight ${
                        state === 'completed' ? 'text-emerald-700' :
                        state === 'current' ? 'text-teal-700 font-bold' :
                        state === 'rejected' ? 'text-red-700' : 'text-slate-400'
                      }`}>
                        <span className="sm:hidden">{step.short}</span>
                        <span className="hidden sm:inline">{step.label}</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 block truncate">
                        {state === 'completed' || state === 'current' ? step.date.slice(0, 10) : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deskripsi Laporan */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1 text-xs">
              <span className="font-bold text-slate-700 block">Deskripsi Aduan Warga:</span>
              <p className="text-slate-800 leading-relaxed">{reportData.deskripsi}</p>
            </div>

            {/* Vertical Detailed Timeline */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Riwayat & Catatan Penanganan Lapangan</h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {reportData.updates.map((upd) => (
                  <div key={upd.id} className="relative group text-xs">
                    {/* Dot */}
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-[#0FA3B1] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0FA3B1]" />
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{upd.petugas}</span>
                        <span>{upd.created_at}</span>
                      </div>
                      <div className="text-slate-800 leading-relaxed font-normal">
                        {upd.catatan}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Agency Response if available */}
            {reportData.agency_response && (
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-teal-800 font-bold">
                  <Building2 className="w-4 h-4 text-[#0FA3B1]" />
                  <span>Tanggapan Resmi Instansi Pengampu</span>
                </div>
                <div className="text-[11px] text-teal-900 font-semibold">
                  {reportData.agency_response.instansi} · {reportData.agency_response.pejabat}
                </div>
                <p className="text-slate-700 leading-relaxed pt-1 whitespace-pre-wrap">
                  "{reportData.agency_response.tanggapan}"
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Diterbitkan pada {reportData.agency_response.created_at} WIB
                </div>
              </div>
            )}

            {/* Photo Gallery Comparison: Warga vs Tindak Lanjut with Interactive Slider */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Galeri Foto Bukti Faktual & Komparasi</h3>
                {reportData.foto_tindak_lanjut && reportData.foto_tindak_lanjut.length > 0 && (
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    ↔ Geser Slider Komparasi
                  </span>
                )}
              </div>

              {reportData.foto_tindak_lanjut && reportData.foto_tindak_lanjut.length > 0 ? (
                <div className="space-y-2">
                  <BeforeAfterSlider
                    beforeImg={reportData.foto_bukti[0]}
                    afterImg={reportData.foto_tindak_lanjut[0]}
                  />
                  <p className="text-[11px] text-slate-500 text-center italic">
                    Geser garis pemisah di atas untuk melihat perubahan kondisi lokasi sebelum dan sesudah tindak lanjut.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Foto Bukti Awal */}
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      <span>Foto Bukti Aduan Awal (Warga)</span>
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100">
                      <img
                        src={reportData.foto_bukti[0]}
                        alt="Bukti Awal"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Foto Tindak Lanjut */}
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Foto Bukti Tindak Lanjut (Pemerintah)</span>
                    </span>
                    <div className="rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      <div className="p-4 text-center">
                        <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                        <span>Belum ada foto penyelesaian fisik yang diunggah dinas terkait.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageMotion>
  );
};
