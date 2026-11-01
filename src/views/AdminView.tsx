import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  Clock,
  Building2,
  User,
  MessageSquare,
  Activity,
  ExternalLink,
  RefreshCw,
  Search,
  Bot,
  Zap,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { CivicReport } from '../data/reportsData';
import { Region } from '../data/regionsData';

interface AdminViewProps {
  currentUser: any;
  authToken: string;
  onLogout: () => void;
  onSelectReport: (code: string) => void;
  regions: Region[];
}

const getInitialTab = (role?: string) => {
  if (role === 'instansi') return 'instansi';
  return 'moderasi';
};

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  authToken,
  onLogout,
  onSelectReport,
  regions,
}) => {
  const [activeTab, setActiveTab] = useState<'moderasi' | 'instansi' | 'import' | 'logs'>(() =>
    getInitialTab(currentUser?.role)
  );
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [proofPhoto, setProofPhoto] = useState('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80');

  // Agency official response state
  const [agencyTanggapan, setAgencyTanggapan] = useState('');
  const [agencyPejabat, setAgencyPejabat] = useState('Ir. Hendra Lubis, M.Si');
  const [agencyInstansi, setAgencyInstansi] = useState('Dinas PUPR Provinsi Sumatera Utara');

  // Import CSV state
  const [csvText, setCsvText] = useState('');
  const [importType, setImportType] = useState<'apbd' | 'proyek'>('apbd');
  const [importResult, setImportResult] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [queueViewMode, setQueueViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    fetchStats();
    fetchReports();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${authToken}` } });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/reports');
      const data = await res.json();
      setReports(data.data || []);
      if (data.data && data.data.length > 0 && !selectedReport) {
        setSelectedReport(data.data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedReport) return;
    try {
      const res = await fetch(`/api/admin/reports/${selectedReport.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          catatan: actionNotes || 'Laporan telah diverifikasi faktual oleh tim verifikator.',
          petugas: currentUser.name,
          userEmail: currentUser.email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Laporan ${selectedReport.tracking_code} berhasil diverifikasi.`);
        setActionNotes('');
        fetchReports();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    if (!selectedReport || !rejectReason.trim()) {
      alert('Alasan penolakan wajib diisi secara objektif.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/reports/${selectedReport.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          alasan_tolak: rejectReason,
          userEmail: currentUser.email,
        }),
      });
      if (res.ok) {
        setSuccessMessage(`Laporan ${selectedReport.tracking_code} ditolak dengan alasan tercatat.`);
        setRejectReason('');
        fetchReports();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (status: 'ditindaklanjuti' | 'selesai') => {
    if (!selectedReport) return;
    try {
      const res = await fetch(`/api/admin/reports/${selectedReport.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          status,
          catatan: actionNotes || `Status laporan diperbarui ke tahap ${status}.`,
          foto_tindak_lanjut: status === 'selesai' ? proofPhoto : undefined,
          petugas: currentUser.name,
          userEmail: currentUser.email,
          role: currentUser.role,
        }),
      });
      if (res.ok) {
        setSuccessMessage(`Status laporan berhasil diubah menjadi ${status}.`);
        setActionNotes('');
        fetchReports();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAgencyResponse = async () => {
    if (!selectedReport || !agencyTanggapan.trim()) {
      alert('Tanggapan resmi instansi tidak boleh kosong.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/reports/${selectedReport.id}/agency-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          instansi: agencyInstansi,
          pejabat: agencyPejabat,
          tanggapan: agencyTanggapan,
          userEmail: currentUser.email,
        }),
      });
      if (res.ok) {
        setSuccessMessage(`Tanggapan resmi berhasil dipublikasikan pada timeline laporan.`);
        setAgencyTanggapan('');
        fetchReports();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ csvText, type: importType }),
      });
      const data = await res.json();
      setImportResult(data);
      if (res.ok) {
        fetchReports();
        fetchStats();
      }
    } catch (e: any) {
      setImportResult({ status: 'error', message: e.message });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSuperAgentAutoModerate = async () => {
    setLoading(true);
    try {
      await fetch('/api/agent/auto-triage', { method: 'POST' });
      await fetch('/api/agent/auto-dispatch', { method: 'POST' });
      setSuccessMessage('100% SuperAgent Auto-Moderation Berhasil: Seluruh aduan pending di-triase dan nota dinas diterbitkan otomatis!');
      fetchReports();
      fetchStats();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* SuperAgent Auto-Moderation Banner */}
      <div className="bg-gradient-to-br from-[#0E8FA0] to-[#2F6FDB] border border-teal-200/40 rounded-2xl p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/20 text-teal-50 rounded-xl border border-teal-500/40">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-50 uppercase tracking-wider">100% SUPERAGENT AUTO-MODERATION MODE</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">AKTIF</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              SuperAgent AI dapat menangani verifikasi aduan warga dan menerbitkan nota dinas otomatis 100% tanpa delay manual.
            </p>
          </div>
        </div>

        <button
          onClick={handleSuperAgentAutoModerate}
          disabled={loading}
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all whitespace-nowrap disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          <span>Jalankan Auto-Moderasi & Dispatch 100%</span>
        </button>
      </div>

      {/* Admin Header */}
      <div className="bg-[#0B7C8A] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-teal-50 uppercase tracking-wider">
              Mode Akses: {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white mt-1">Panel Kendali & Moderasi Terpadu</h1>
          <p className="text-xs text-slate-300">
            Masuk sebagai: <strong>{currentUser.name}</strong> ({currentUser.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchReports();
              fetchStats();
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
            title="Segarkan Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Keluar Sesi
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium">Menunggu Verifikasi</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 mt-0.5">
              {stats.stats.menunggu_verifikasi}
            </div>
          </div>
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium">Lolos Diverifikasi</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#0FA3B1] mt-0.5">
              {stats.stats.diverifikasi}
            </div>
          </div>
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium">Ditindaklanjuti</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-blue-600 mt-0.5">
              {stats.stats.ditindaklanjuti}
            </div>
          </div>
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium">Selesai Tuntas</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 mt-0.5">
              {stats.stats.selesai}
            </div>
          </div>
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-500 font-medium">Rata Respons Faktual</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-0.5">
              {stats.stats.rata_respon_hari} Hari
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
        {(currentUser.role === 'super_admin' || currentUser.role === 'verifikator') && (
          <button
            onClick={() => setActiveTab('moderasi')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
              activeTab === 'moderasi' ? 'bg-[#0B7C8A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🛡️ Antrean Moderasi
          </button>
        )}

        {(currentUser.role === 'super_admin' || currentUser.role === 'instansi') && (
          <button
            onClick={() => setActiveTab('instansi')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
              activeTab === 'instansi' ? 'bg-[#0B7C8A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🏛️ Tanggapan Resmi Instansi
          </button>
        )}

        {currentUser.role === 'super_admin' && (
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
              activeTab === 'import' ? 'bg-[#0B7C8A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📥 Impor CSV Data Baru
          </button>
        )}

        {currentUser.role === 'super_admin' && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg font-semibold transition-colors shrink-0 ${
              activeTab === 'logs' ? 'bg-[#0B7C8A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📋 Audit Trail Log
          </button>
        )}
      </div>

      {/* TAB 1: MODERASI LAPORAN */}
      {activeTab === 'moderasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List queue (left 5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs font-display">Antrean Laporan ({reports.length})</h3>
              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setQueueViewMode('cards')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    queueViewMode === 'cards' ? 'bg-white text-[#0B7C8A] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Kartu
                </button>
                <button
                  onClick={() => setQueueViewMode('table')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    queueViewMode === 'table' ? 'bg-white text-[#0B7C8A] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Tabel Ringkas
                </button>
              </div>
            </div>

            {queueViewMode === 'cards' ? (
              <div className="space-y-2 max-h-[300px] lg:max-h-[550px] overflow-y-auto pr-1">
                {reports.map((rep) => {
                  const isSelected = selectedReport?.id === rep.id;
                  const urg = rep.ai_urgensi || 3;
                  const urgBadgeCls =
                    urg === 5 ? 'bg-red-100 text-red-800 border-red-300 font-bold' :
                    urg >= 3 ? 'bg-amber-100 text-amber-800 border-amber-300 font-semibold' :
                    'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium';

                  return (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReport(rep)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                        isSelected
                          ? 'border-[#0FA3B1] bg-teal-50/50 shadow-xs ring-1 ring-[#0FA3B1]/30'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-700 text-[11px]">{rep.tracking_code}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rep.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' :
                          rep.status === 'ditindaklanjuti' ? 'bg-blue-100 text-blue-800' :
                          rep.status === 'diverifikasi' ? 'bg-teal-100 text-teal-800' :
                          rep.status === 'ditolak' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rep.status}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-900 line-clamp-1">{rep.judul}</p>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                        <span className="truncate max-w-[150px]">{rep.region_nama}</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] ${urgBadgeCls}`}>
                          Urgensi AI: {urg}/5
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Compact Table View for High-Volume Triaging */
              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px] lg:max-h-[550px] text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5">Kode</th>
                      <th className="py-2 px-2.5">Judul Laporan</th>
                      <th className="py-2 px-2.5 text-center">Urgensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((rep) => {
                      const isSelected = selectedReport?.id === rep.id;
                      const urg = rep.ai_urgensi || 3;
                      const urgBadgeCls =
                        urg === 5 ? 'bg-red-100 text-red-800 font-bold' :
                        urg >= 3 ? 'bg-amber-100 text-amber-800 font-semibold' :
                        'bg-emerald-100 text-emerald-800 font-medium';

                      return (
                        <tr
                          key={rep.id}
                          onClick={() => setSelectedReport(rep)}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-teal-50/80 font-semibold text-[#0B7C8A]' : ''
                          }`}
                        >
                          <td className="py-2 px-2.5 font-mono text-[10px] text-slate-600">{rep.tracking_code}</td>
                          <td className="py-2 px-2.5 truncate max-w-[180px] text-slate-800">{rep.judul}</td>
                          <td className="py-2 px-2.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${urgBadgeCls}`}>
                              L{urg}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Report Detail & Actions (right 7 cols) */}
          {selectedReport && (
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs text-slate-700">
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[#0B2545]">{selectedReport.tracking_code}</span>
                  <span className="text-slate-400 text-[11px]">{selectedReport.created_at}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900">{selectedReport.judul}</h3>
                <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedReport.deskripsi}
                </p>
                <div className="flex items-center gap-2 text-slate-500 text-[11px] pt-1">
                  <span>Lokasi: {selectedReport.alamat}</span>
                  <span>·</span>
                  <span>Pelapor: {selectedReport.is_anonim ? 'Warga Anonim' : selectedReport.nama_pelapor}</span>
                </div>
              </div>

              {/* AI Triage Suggestions */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-teal-700 font-bold">
                  <Activity className="w-4 h-4 text-[#0FA3B1]" />
                  <span>Rekomendasi Auto-Triase AI TERANG</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Estimasi Urgensi: <strong>Level {selectedReport.ai_urgensi || 3}/5</strong> · Kategori yang Disarankan: <strong>{selectedReport.kategori.replace('_', ' ')}</strong>
                </p>
                {selectedReport.ai_dupe_of && (
                  <div className="text-red-600 font-semibold text-[11px] bg-red-50 p-2 rounded border border-red-200">
                    Peringatan Duplikat: Terindikasi mirip dengan laporan terdahulu #{selectedReport.ai_dupe_of} dalam radius 200 meter.
                  </div>
                )}
              </div>

              {/* Actions Form */}
              <div className="space-y-4 pt-2">
                <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-xs">
                  Eksekusi Aksi Moderasi
                </h4>

                <div>
                  <label className="block text-slate-600 mb-1">Catatan Verifikasi / Tindak Lanjut (Tampil di Timeline Publik)</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={2}
                    placeholder="Tuliskan catatan hasil pemeriksaan faktual atau instruksi kepada instansi dinas..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#0FA3B1] focus:outline-none"
                  />
                </div>

                {/* Action Buttons based on status */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {(currentUser.role === 'super_admin' || currentUser.role === 'verifikator') && <button
                    onClick={handleVerify}
                    className="px-4 py-2 bg-[#0FA3B1] hover:bg-[#0c8a96] text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verifikasi Laporan</span>
                  </button>}

                  <button
                    onClick={() => handleUpdateStatus('ditindaklanjuti')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Tandai Ditindaklanjuti</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('selesai')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Tandai Selesai Tuntas</span>
                  </button>
                </div>

                {/* Reject Section */}
                {(currentUser.role === 'super_admin' || currentUser.role === 'verifikator') && <div className="p-3 bg-red-50/60 rounded-xl border border-red-200 space-y-2 pt-3">
                  <span className="font-semibold text-red-900 block text-xs">Tolak Laporan (Wajib Alasan Rasional)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Alasan tolak (contoh: Lokasi bukan kewenangan jalan provinsi/APBD)"
                      className="flex-1 bg-white border border-red-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    />
                    <button
                      onClick={handleReject}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shrink-0"
                    >
                      Tolak
                    </button>
                  </div>
                </div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INSTANSI TANGGAPAN RESMI */}
      {activeTab === 'instansi' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs max-w-2xl mx-auto">
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-display">Tanggapan Resmi Instansi Pemerintah Daerah</h3>
            <p className="text-slate-500 mt-1">
              Pernyataan resmi yang Anda terbitkan akan langsung muncul di timeline publik pelacakan warga.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pilih Laporan Target</label>
              <select
                value={selectedReport?.id}
                onChange={(e) => setSelectedReport(reports.find((r) => r.id === e.target.value) || null)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.tracking_code} - {r.judul.slice(0, 50)}... ({r.region_nama})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instansi Pengampu</label>
                <input
                  type="text"
                  value={agencyInstansi}
                  onChange={(e) => setAgencyInstansi(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pejabat / Penanggung Jawab</label>
                <input
                  type="text"
                  value={agencyPejabat}
                  onChange={(e) => setAgencyPejabat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pernyataan Tanggapan Resmi</label>
              <textarea
                value={agencyTanggapan}
                onChange={(e) => setAgencyTanggapan(e.target.value)}
                rows={4}
                placeholder="Jelaskan langkah teknis, jadwal perbaikan lapangan, atau instruksi kontraktual yang telah diambil..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs leading-relaxed"
              />
            </div>

            <button
              onClick={handleAgencyResponse}
              className="w-full py-2.5 bg-[#0B7C8A] hover:bg-[#096A76] text-white rounded-lg font-bold transition-colors"
            >
              Kirim Tanggapan Resmi ke Publik
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT CSV UI */}
      {activeTab === 'import' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs max-w-3xl mx-auto">
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-display">Impor & Validasi Berkas CSV Baru</h3>
            <p className="text-slate-500 mt-1">
              Impor data APBD atau Proyek Publik langsung melalui antarmuka web dengan validasi kolom otomatis
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="font-semibold text-slate-700">Tipe Data Impor:</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importType"
                  value="apbd"
                  checked={importType === 'apbd'}
                  onChange={() => setImportType('apbd')}
                />
                <span>APBD & Realisasi</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importType"
                  value="proyek"
                  checked={importType === 'proyek'}
                  onChange={() => setImportType('proyek')}
                />
                <span>Katalog Proyek Publik</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tempelkan Konten CSV (Termasuk Header)</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                placeholder={
                  importType === 'apbd'
                    ? 'nama_daerah,sektor,tahun,pagu,realisasi\nKota Medan,Pendidikan,2024,1430000000000,1258400000000'
                    : 'nama,nama_daerah,pagu,realisasi,progres_fisik,status\nPelebaran Jalan Medan,Kota Medan,45000000000,40000000000,80,berjalan'
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono leading-relaxed"
              />
            </div>

            <button
              onClick={handleImportCsv}
              disabled={isImporting || !csvText.trim()}
              className="px-6 py-2.5 bg-[#0FA3B1] hover:bg-[#0c8a96] text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isImporting ? 'Memvalidasi & Memasukkan Data...' : 'Mulai Proses Impor'}</span>
            </button>

            {importResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                importResult.status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="font-bold">{importResult.message}</div>
                {importResult.result && (
                  <div className="text-[11px] pt-1">
                    Total: {importResult.result.totalRows} baris · Berhasil: {importResult.result.validRows} baris · Gagal: {importResult.result.invalidRows} baris
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL & ACTIVITY LOGS */}
      {activeTab === 'logs' && stats && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 font-display">Log Aktivitas & Audit Trail Sistem</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Pengguna</th>
                  <th className="py-2.5 px-3">Peran</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Rincian Subjek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.activity_logs?.map((act: any) => (
                  <tr key={act.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{act.created_at}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{act.user_email}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">
                        {act.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{act.aksi}</td>
                    <td className="py-2.5 px-3 text-slate-600">{act.subjek}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
