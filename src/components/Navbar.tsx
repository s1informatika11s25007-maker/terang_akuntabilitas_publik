import React, { useState } from 'react';
import { ShieldCheck, LogOut, ChevronDown, Menu, X, Activity, MessageSquare, Building2, Zap, User } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: any;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenTanyaTerang: () => void;
}

const NAV_ITEMS = [
  { id: 'landing', label: 'Beranda' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'proyek', label: 'Proyek' },
  { id: 'laporan', label: 'Laporan' },
  { id: 'insight', label: 'Insight' },
  { id: 'data', label: 'Data' },
  { id: 'tentang', label: 'Tentang' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenTanyaTerang,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (id: string) =>
    currentView === id || (id === 'laporan' && (currentView === 'lapor' || currentView === 'lacak'));

  const getRoleInfo = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          badgeCls: 'bg-purple-700 text-white border-purple-800 font-extrabold shadow-2xs',
          btnLabel: 'Panel Utama',
          icon: Zap,
        };
      case 'verifikator':
        return {
          label: 'Inspektorat',
          badgeCls: 'bg-emerald-700 text-white border-emerald-800 font-extrabold shadow-2xs',
          btnLabel: 'Moderasi Aduan',
          icon: ShieldCheck,
        };
      case 'instansi':
        return {
          label: 'Dinas PUPR',
          badgeCls: 'bg-blue-700 text-white border-blue-800 font-extrabold shadow-2xs',
          btnLabel: 'Tanggapan Instansi',
          icon: Building2,
        };
      default:
        return {
          label: 'Pengelola',
          badgeCls: 'bg-slate-700 text-white border-slate-800 font-extrabold shadow-2xs',
          btnLabel: 'Panel Pengelola',
          icon: User,
        };
    }
  };

  const roleInfo = getRoleInfo(currentUser?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs overflow-x-clip">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 xl:gap-3">
          {/* Brand Logo & Title */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 group shrink-0 text-left focus:outline-none cursor-pointer"
            aria-label="Beranda TERANG"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#0B7C8A] to-[#0FA3B1] flex items-center justify-center font-bold text-white text-base shadow-sm shadow-teal-900/20 group-hover:scale-105 transition-transform font-mono shrink-0">
              T
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold font-display tracking-tight text-slate-900 group-hover:text-[#0B7C8A] transition-colors">
                  TERANG
                </span>
                <div className="relative group/status flex items-center">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs animate-pulse cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover/status:flex flex-col items-center z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1" />
                    <div className="bg-slate-900 text-slate-100 text-[10px] font-mono py-1.5 px-3 rounded-xl whitespace-nowrap shadow-xl border border-slate-700/80">
                      <span className="text-emerald-400 font-bold">● Otonom Aktif</span> · Diperbarui 2 menit lalu (33 Kab/Kota)
                    </div>
                  </div>
                </div>
              </div>
              <span className="hidden xl:block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Akuntabilitas Publik · Sumut
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 shrink min-w-0" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-2 xl:px-2.5 py-1.5 rounded-lg text-[11px] xl:text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-[#0B7C8A] shadow-2xs font-bold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Admin Session */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Agen Otonom Button */}
            <button
              onClick={() => {
                if (currentView !== 'agent-automation') {
                  sessionStorage.setItem('terang_autorun', '1');
                }
                onNavigate('agent-automation');
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                currentView === 'agent-automation'
                  ? 'bg-emerald-600 text-white shadow-teal-900/10'
                  : 'bg-[#0B7C8A] hover:bg-[#096A76] text-white'
              }`}
              title="Jalankan seluruh alur Agen Pengawasan Otonom sekali klik"
            >
              <Activity className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="whitespace-nowrap">Agen Otonom</span>
            </button>

            {/* Tanya TERANG Trigger */}
            <button
              onClick={onOpenTanyaTerang}
              className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0B7C8A] bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors cursor-pointer"
              title="Pusat Informasi & Tanya Jawab TERANG"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#0B7C8A] shrink-0" />
              <span>Tanya TERANG</span>
            </button>

            {/* Dynamic Role Shortcut Button (Visible on wide screens) */}
            {currentUser && (
              <button
                onClick={() => onNavigate('admin')}
                className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap ${
                  currentView === 'admin'
                    ? 'bg-teal-700 text-white shadow-teal-900/10'
                    : 'bg-teal-50 hover:bg-teal-100 text-[#0B7C8A] border border-teal-200/90'
                }`}
                title="Buka panel kerja sesuai peran Anda"
              >
                <RoleIcon className="w-3.5 h-3.5 text-[#0B7C8A] shrink-0" />
                <span>{roleInfo.btnLabel}</span>
              </button>
            )}

            {/* Admin User Dropdown / Login */}
            {currentUser ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs bg-white text-slate-900 border border-slate-300 hover:border-slate-400 shadow-2xs transition-all cursor-pointer font-bold"
                >
                  <div className="w-5 h-5 rounded-full bg-teal-100 text-[#0B7C8A] flex items-center justify-center font-bold text-[10px] shrink-0">
                    <RoleIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="max-w-[80px] sm:max-w-[100px] xl:max-w-[140px] truncate text-slate-900 font-bold text-xs">
                    {currentUser.name}
                  </span>
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border shrink-0 ${roleInfo.badgeCls}`}>
                    {roleInfo.label}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/90 rounded-t-2xl space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-extrabold text-slate-900 text-xs leading-tight text-left">{currentUser.name}</p>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase shrink-0 border ${roleInfo.badgeCls}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono">{currentUser.email}</p>
                      {currentUser.instansi_name && (
                        <div className="text-[11px] text-[#0B7C8A] font-semibold flex items-center gap-1.5 pt-1.5 border-t border-slate-200/70">
                          <Building2 className="w-3.5 h-3.5 text-[#0B7C8A] shrink-0" />
                          <span>{currentUser.instansi_name}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { onNavigate('admin'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-900 font-bold flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <RoleIcon className="w-4 h-4 text-[#0B7C8A]" />
                        <span>{roleInfo.btnLabel}</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">&rarr;</span>
                    </button>
                    <button
                      onClick={() => { onLogout(); setUserDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden md:inline-flex px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
              >
                Masuk Pengelola
              </button>
            )}

            {/* Mobile Navigation Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Buka Menu Navigasi"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1 shadow-lg">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                isActive(item.id) ? 'bg-teal-50 text-[#0B7C8A] font-bold' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2.5 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                sessionStorage.setItem('terang_autorun', '1');
                onNavigate('agent-automation');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 text-sm font-bold text-white bg-[#0B7C8A] rounded-xl flex items-center justify-between shadow-xs"
            >
              <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-white" /> Agen Otonom</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono uppercase font-bold">1-Klik</span>
            </button>
            <button
              onClick={() => { onOpenTanyaTerang(); setMobileMenuOpen(false); }}
              className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-[#0B7C8A] bg-teal-50 rounded-xl flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Tanya TERANG (Pusat Informasi)
            </button>
            {currentUser ? (
              <>
                <button
                  onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <RoleIcon className="w-4 h-4 text-[#0B7C8A]" />
                    <span>{roleInfo.btnLabel}</span>
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-extrabold uppercase ${roleInfo.badgeCls}`}>
                    {roleInfo.label}
                  </span>
                </button>
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Keluar ({currentUser.name})
                </button>
              </>
            ) : (
              <button
                onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 rounded-xl"
              >
                Masuk Pengelola
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
