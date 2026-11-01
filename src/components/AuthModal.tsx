import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, Building2, Lock, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('admin@terang.test');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (overrideEmail?: string) => {
    const targetEmail = overrideEmail || email;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setError(data.message || 'Login gagal.');
      }
    } catch (e: any) {
      setError(e.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-[#0B7C8A] text-white px-6 py-4 flex items-center justify-between border-b border-teal-700/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0FA3B1]" />
            <h3 className="font-bold text-sm font-display text-white">Masuk Akun Pengelola TERANG</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Pilih salah satu akun demo untuk menguji hak akses role-based (super admin, verifikator inspektorat, atau instansi dinas terkait):
          </p>

          <div className="space-y-1.5">
            <label htmlFor="terang-demo-password" className="block text-xs font-semibold text-slate-700">Kata sandi akun demo</label>
            <input
              id="terang-demo-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Quick Role Login Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleLogin('admin@terang.test')}
              disabled={loading}
              className="w-full p-3 rounded-xl border border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 text-left transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 group-hover:text-purple-700">Super Admin</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-200 text-purple-900 font-bold">Akses Penuh</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">admin@terang.test</div>
                <div className="text-[10px] text-purple-600 mt-0.5">Akses: Moderasi, Tanggapan, Impor CSV & Audit Log</div>
              </div>
              <span className="text-[11px] text-purple-600 font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>

            <button
              onClick={() => handleLogin('verifikator@terang.test')}
              disabled={loading}
              className="w-full p-3 rounded-xl border border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 group-hover:text-emerald-700">Verifikator Inspektorat</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-200 text-emerald-900 font-bold">Verifikasi Aduan</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">verifikator@terang.test</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Akses: Moderasi Aduan & Validasi Faktual</div>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>

            <button
              onClick={() => handleLogin('instansi@terang.test')}
              disabled={loading}
              className="w-full p-3 rounded-xl border border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 text-left transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 group-hover:text-blue-700">Instansi Dinas PUPR</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-200 text-blue-900 font-bold">Tanggapan Resmi</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">instansi@terang.test</div>
                <div className="text-[10px] text-blue-600 mt-0.5">Akses: Penerbitan Tanggapan Resmi Instansi</div>
              </div>
              <span className="text-[11px] text-blue-600 font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 text-[11px] text-slate-400 text-center">
            Gunakan kata sandi yang dikonfigurasi pengelola server. Sesi berlaku selama 8 jam.
          </div>
        </div>
      </div>
    </div>
  );
};
