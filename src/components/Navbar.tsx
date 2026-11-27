import React, { useState } from 'react';
import { ShieldCheck, LogOut, ChevronDown, Menu, X, Activity, MessageSquare, Building2, Zap, User, Home, BarChart3, FolderKanban, FileText, LineChart, Database, Info } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: any;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenTanyaTerang: () => void;
}

const NAV_ITEMS = [
  { id: 'landing', label: 'Beranda', icon: Home },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'proyek', label: 'Proyek', icon: FolderKanban },
  { id: 'laporan', label: 'Laporan', icon: FileText },
  { id: 'insight', label: 'Insight', icon: LineChart },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'tentang', label: 'Tentang', icon: Info },
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

  const isActive = (id: string) => {
    if (id === 'landing') {
      return currentUser
        ? (currentView === 'admin' || currentView === 'dashboard')
        : currentView === 'landing';
    }
    return currentView === id || (id === 'laporan' && (currentView === 'lapor' || currentView === 'lacak'));
  };

  const handleHomeClick = () => {
    if (currentUser) {
      onNavigate(currentUser.role === 'warga' ? 'dashboard' : 'admin');
    } else {
      onNavigate('landing');
    }
  };

  const getRoleInfo = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          badgeCls: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
          btnLabel: 'Panel Utama',
          icon: Zap,
        };
      case 'verifikator':
        return {
          label: 'Inspektorat',
          badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
          btnLabel: 'Moderasi Aduan',
          icon: ShieldCheck,
        };
      case 'instansi':
        return {
          label: 'Dinas PUPR',
          badgeCls: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
          btnLabel: 'Tanggapan Instansi',
          icon: Building2,
        };
      default:
        return {
          label: 'Warga Publik',
          badgeCls: 'bg-teal-100 text-teal-800 border-teal-300 font-bold',
          btnLabel: 'Portal Pengaduan',
          icon: User,
        };
    }
  };

  const roleInfo = getRoleInfo(currentUser?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* BRAND LOGO & TITLE (FULL LEFT) */}
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-2.5 group shrink-0 text-left focus:outline-none cursor-pointer"
            aria-label="Beranda TERANG"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B7C8A] to-[#0FA3B1] flex items-center justify-center font-extrabold text-white text-base shadow-sm shadow-teal-900/20 group-hover:scale-105 transition-transform font-mono shrink-0">
              T
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold font-display tracking-tight text-slate-900 group-hover:text-[#0B7C8A] transition-colors">
                  TERANG
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-2xs animate-pulse" />
              </div>
              <span className="hidden sm:block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Portal Akuntabilitas Sumut
              </span>
            </div>
          </button>

          {/* DESKTOP NAVIGATION LINKS (MIDDLE - RAPI & BERJARAK PAS) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80" aria-label="Navigasi Utama">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.id);
              const targetView = item.id === 'landing' && currentUser ? (currentUser.role === 'warga' ? 'dashboard' : 'admin') : item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(targetView)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-[#0B7C8A] shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${active ? 'text-[#0B7C8A]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ACTION BUTTONS & USER SESSION (FULL RIGHT) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Agen Otonom Pill Button */}
            <button
              onClick={() => {
                if (currentView !== 'agent-automation') {
                  sessionStorage.setItem('terang_autorun', '1');
                }
                onNavigate('agent-automation');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                currentView === 'agent-automation'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0B7C8A] hover:bg-[#096A76] text-white'
              }`}
              title="Jalankan Agen Pengawasan Otonom"
            >
              <Activity className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
              <span className="hidden sm:inline whitespace-nowrap">Agen Otonom</span>
            </button>

            {/* Tanya AI Trigger */}
            <button
              onClick={onOpenTanyaTerang}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#0B7C8A] bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
              title="Tanya TERANG AI"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#0B7C8A] shrink-0" />
              <span>Tanya AI</span>
            </button>

            {/* USER PROFILE & DROPDOWN */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 transition-all cursor-pointer font-bold shadow-2xs"
                >
                  <div className="w-5 h-5 rounded-full bg-teal-100 text-[#0B7C8A] flex items-center justify-center font-bold text-[10px] shrink-0">
                    <RoleIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="max-w-[110px] sm:max-w-[140px] truncate text-slate-900 font-bold">
                    {currentUser.name}
                  </span>
                  <span className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${roleInfo.badgeCls}`}>
                    {roleInfo.label}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-2xl space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-extrabold text-slate-900 text-xs truncate">{currentUser.name}</p>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border shrink-0 ${roleInfo.badgeCls}`}>
                          {roleInfo.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => { onNavigate(currentUser.role === 'warga' ? 'dashboard' : 'admin'); setUserDropdownOpen(false); }}
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
                onClick={() => {
                  onNavigate('landing');
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 200);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B7C8A] hover:bg-[#096A76] text-white transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                Masuk / Daftar
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer ml-1"
              aria-label="Buka Menu Navigasi"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1 shadow-lg">
          {NAV_ITEMS.map((item) => {
            const targetView = item.id === 'landing' && currentUser ? (currentUser.role === 'warga' ? 'dashboard' : 'admin') : item.id;
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(targetView); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2.5 ${
                  isActive(item.id) ? 'bg-teal-50 text-[#0B7C8A] font-bold' : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <IconComp className={`w-4 h-4 ${isActive(item.id) ? 'text-[#0B7C8A]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
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
              <MessageSquare className="w-4 h-4 text-[#0B7C8A]" /> Tanya TERANG
            </button>
            {currentUser && (
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 text-red-600" /> Keluar Akun ({currentUser.name})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
