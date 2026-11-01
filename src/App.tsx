/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TanyaTerangModal } from './components/TanyaTerangModal';
import { AuthModal } from './components/AuthModal';

import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { ProjectsView } from './views/ProjectsView';
import { ReportFormView } from './views/ReportFormView';
import { TrackReportView } from './views/TrackReportView';
import { PublicReportsView } from './views/PublicReportsView';
import { InsightView } from './views/InsightView';
import { DataMethodologyView } from './views/DataMethodologyView';
import { AboutView } from './views/AboutView';
import { AdminView } from './views/AdminView';
import { AgentAutomationView } from './views/AgentAutomationView';

import { REGIONS, Region } from './data/regionsData';
import { SECTORS, Sector } from './data/sectorsData';
import { BUDGETS } from './data/budgetsData';
import { PROJECTS, Project } from './data/projectsData';
import { REPORTS, CivicReport } from './data/reportsData';
import { TransparencyScoreResult } from './lib/calculations';

function computeInitialKpis() {
  const yearBudgets = BUDGETS.filter((b) => b.tahun === 2024);
  const totalPagu = yearBudgets.reduce((a, c) => a + c.pagu, 0);
  const totalReal = yearBudgets.reduce((a, c) => a + c.realisasi, 0);
  const avgSerapan = totalPagu > 0 ? Number(((totalReal / totalPagu) * 100).toFixed(1)) : 87.6;
  const totalProjects = PROJECTS.length;
  const totalReports = REPORTS.length;
  const completedReports = REPORTS.filter((r) => r.status === 'selesai' || r.status === 'ditindaklanjuti' || r.status === 'diverifikasi').length;

  return {
    totalPagu: totalPagu || 56068458000000,
    avgSerapan: avgSerapan || 87.6,
    totalProjects: totalProjects || 156,
    totalReports: totalReports || 52,
    completedReports: completedReports || 32,
    avgResponseDays: 2.1,
  };
}

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [regions, setRegions] = useState<Region[]>(REGIONS);
  const [sectors, setSectors] = useState<Sector[]>(SECTORS);

  // Auth & Session
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('terang_token') || '');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('terang_user');
      return localStorage.getItem('terang_token') && saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('terang_user');
      localStorage.removeItem('terang_token');
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTanyaTerangOpen, setIsTanyaTerangOpen] = useState(false);

  // Cross-page navigation helpers
  const [preselectedProject, setPreselectedProject] = useState<Project | null>(null);
  const [targetTrackingCode, setTargetTrackingCode] = useState<string>('');
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);

  // Aggregated data for landing page
  const [landingData, setLandingData] = useState<{
    kpis: any;
    highGapProjects: Project[];
    recentReports: CivicReport[];
    transparencyScores: Array<{ region: Region; scores: TransparencyScoreResult }>;
  }>({
    kpis: computeInitialKpis(),
    highGapProjects: [],
    recentReports: [],
    transparencyScores: [],
  });

  // Central Route Guard helper
  const checkRouteAccess = (view: string, user: any): boolean => {
    const protectedViews = ['admin'];
    if (protectedViews.includes(view)) {
      return !!user;
    }
    return true;
  };

  useEffect(() => {
    // Initial fetch of regions, scores, and landing data
    fetchInitialData();

    // Hash sync with Route Guard
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && ['landing', 'agent-automation', 'dashboard', 'proyek', 'lapor', 'lacak', 'laporan', 'insight', 'data', 'tentang', 'admin'].includes(hash)) {
        if (!checkRouteAccess(hash, currentUser)) {
          setIsAuthModalOpen(true);
          setCurrentView('landing');
          window.location.hash = 'landing';
          return;
        }
        setCurrentView(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentUser]);

  const fetchInitialData = async () => {
    try {
      const [resKpis, resPrj, resRep, resScores] = await Promise.all([
        fetch('/api/v1/kpis'),
        fetch('/api/v1/projects?tahun=2024&filter=gap'),
        fetch('/api/v1/reports?status=diverifikasi'),
        fetch('/api/v1/transparency-scores?tahun=2024'),
      ]);

      const dataKpis = await resKpis.json();
      const dataPrj = await resPrj.json();
      const dataRep = await resRep.json();
      const dataScores = await resScores.json();

      setLandingData((prev) => ({
        ...prev,
        kpis: dataKpis.kpis || prev.kpis,
        highGapProjects: dataPrj.data || [],
        recentReports: dataRep.data || [],
        transparencyScores: dataScores.data || [],
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (view: string) => {
    if (!checkRouteAccess(view, currentUser)) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
    if (window.location.hash.replace('#', '') !== view) {
      window.location.hash = view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReportFormWithProject = (project: Project) => {
    setPreselectedProject(project);
    handleNavigate('lapor');
  };

  const handleSelectReport = (code: string) => {
    setTargetTrackingCode(code);
    handleNavigate('lacak');
  };

  const handleSelectProject = (projectId: string) => {
    setTargetProjectId(projectId);
    handleNavigate('proyek');
  };

  const handleLogout = () => {
    localStorage.removeItem('terang_user');
    localStorage.removeItem('terang_token');
    setAuthToken('');
    setCurrentUser(null);
    if (currentView === 'admin') {
      handleNavigate('landing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6FA] text-slate-800 font-sans selection:bg-[#0FA3B1]/20 selection:text-[#0B2545]">
      <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenTanyaTerang={() => setIsTanyaTerangOpen(true)}
      />

      {/* Main Content View Port */}
      <main id="main-content" className="flex-1 pb-12 sm:pb-6 page-main">
        {currentView === 'landing' && (
          <LandingView
            onNavigate={handleNavigate}
            kpis={landingData.kpis}
          />
        )}

        {currentView === 'agent-automation' && (
          <AgentAutomationView
            authToken={authToken}
            onNavigate={handleNavigate}
            onSelectProject={handleSelectProject}
            onSelectReport={handleSelectReport}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            regions={regions}
            sectors={sectors}
            onSelectProject={handleSelectProject}
          />
        )}

        {currentView === 'proyek' && (
          <ProjectsView
            regions={regions}
            sectors={sectors}
            onOpenReportFormWithProject={handleOpenReportFormWithProject}
            onSelectReport={handleSelectReport}
            initialProjectId={targetProjectId}
          />
        )}

        {currentView === 'lapor' && (
          <ReportFormView
            regions={regions}
            sectors={sectors}
            preselectedProject={preselectedProject}
            onNavigateToTrack={(code) => {
              setTargetTrackingCode(code);
              handleNavigate('lacak');
            }}
          />
        )}

        {currentView === 'lacak' && (
          <TrackReportView
            initialTrackingCode={targetTrackingCode}
            onNavigateToReport={() => handleNavigate('lapor')}
          />
        )}

        {currentView === 'laporan' && (
          <PublicReportsView
            regions={regions}
            onSelectReport={handleSelectReport}
          />
        )}

        {currentView === 'insight' && (
          <InsightView
            regions={regions}
            onSelectProject={handleSelectProject}
          />
        )}

        {currentView === 'data' && <DataMethodologyView />}

        {currentView === 'tentang' && <AboutView />}

        {currentView === 'admin' && (
          currentUser ? (
            <AdminView
              currentUser={currentUser}
              authToken={authToken}
              onLogout={handleLogout}
              onSelectReport={handleSelectReport}
              regions={regions}
            />
          ) : (
            <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
              <h2 className="text-xl font-bold font-display text-slate-900">Perlu Masuk Akun</h2>
              <p className="text-xs text-slate-500">
                Silakan masuk dengan salah satu akun demo untuk mengakses panel kendali administrator dan moderasi aduan.
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-5 py-2.5 bg-[#0B7C8A] text-white rounded-lg text-xs font-semibold hover:bg-[#096A76] transition-colors"
              >
                Pilih Akun Demo &rarr;
              </button>
            </div>
          )
        )}
      </main>

      {/* Floating Tanya TERANG launcher in bottom corner (Desktop) */}
      <button
        onClick={() => setIsTanyaTerangOpen(true)}
        className="hidden sm:flex fixed bottom-6 right-6 z-40 bg-[#0B7C8A] hover:bg-[#096A76] text-white p-3.5 rounded-full shadow-lg shadow-teal-900/20 items-center gap-2 transition-all hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B7C8A] cursor-pointer"
        title="Tanya TERANG (Pusat Informasi & Tanya Jawab)"
        aria-label="Buka Pusat Informasi Tanya TERANG"
      >
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-emerald-300 absolute -top-0.5 -right-0.5 animate-ping" />
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <span className="text-xs font-bold tracking-tight pr-1">Tanya TERANG</span>
      </button>

      {/* Mobile Floating Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-2xl p-1.5 shadow-2xl flex items-center justify-around text-[10px] font-semibold">
        <button
          onClick={() => handleNavigate('landing')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentView === 'landing' ? 'text-teal-400 font-bold bg-white/10' : 'text-slate-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Beranda</span>
        </button>

        <button
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentView === 'dashboard' ? 'text-teal-400 font-bold bg-white/10' : 'text-slate-400 hover:text-white'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
          </svg>
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => {
            sessionStorage.setItem('terang_autorun', '1');
            handleNavigate('agent-automation');
          }}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            currentView === 'agent-automation' ? 'text-emerald-400 font-bold bg-emerald-500/20 border border-emerald-500/40' : 'text-teal-300 font-bold bg-teal-500/20'
          }`}
        >
          <svg className="w-4 h-4 mb-0.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Otonom</span>
        </button>

        <button
          onClick={() => setIsTanyaTerangOpen(true)}
          className="flex flex-col items-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 mb-0.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>Tanya</span>
        </button>
      </div>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Interactive Modals */}
      <TanyaTerangModal
        isOpen={isTanyaTerangOpen}
        onClose={() => setIsTanyaTerangOpen(false)}
        onNavigate={handleNavigate}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user, token) => {
          localStorage.setItem('terang_user', JSON.stringify(user));
          localStorage.setItem('terang_token', token);
          setAuthToken(token);
          setCurrentUser(user);
          handleNavigate('admin');
        }}
      />
    </div>
  );
}
