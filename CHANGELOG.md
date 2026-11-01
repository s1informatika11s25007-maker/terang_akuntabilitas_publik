# Changelog

## 1.3.0 - Light Professional + SuperAgent Sekali Klik

- Tema terang profesional di seluruh aplikasi (navbar, hero, footer, panel, modal); tidak ada lagi latar gelap.
- Navigasi lengkap: Beranda, SuperAgent, Dashboard, Proyek, Laporan Warga, Insight, Data, Tentang (sebelumnya hanya 2 menu sehingga halaman lain sulit dijangkau).
- **SuperAgent sekali klik** (`POST /api/agent/mission`): data langsung -> pindai proyek -> triase laporan -> disposisi -> eskalasi audit -> optimasi anggaran -> ringkasan eksekutif, dengan progres per langkah.
- **API gratis nyata tanpa kunci**: Open-Meteo (curah hujan 33 kab/kota), BMKG Open Data (gempa terkini), USGS (gempa 30 hari di Sumut). Setiap sumber berstatus Langsung / Cache / Offline; bila offline agen tetap berjalan dengan data internal.
- Penilaian proyek berbasis konteks: hujan ekstrem dapat menurunkan prioritas eskalasi; gempa M4+ dalam radius 100 km menambah catatan pemeriksaan struktural.
- Gerbang keyakinan pada triase: laporan dengan bukti kurang tidak diverifikasi otomatis, tetapi diteruskan ke verifikator manusia.
- Penjadwal Auto-Pilot sungguhan di server (`SUPERAGENT_SCAN_INTERVAL_MS`, minimal 60 detik).
- Rekomendasi realokasi anggaran kini dihitung dari data APBD, bukan angka tetap.
- Perbaikan bug: `require` di modul ESM membuat CSV APBD/proyek dan GeoJSON tidak pernah dimuat (aplikasi diam-diam memakai data cadangan). Kini 33 wilayah, 156 proyek, dan 1.188 baris anggaran dimuat dari `database/data`.
- Keamanan: endpoint agen yang mengubah data (`autopilot`, `auto-triage`, `auto-dispatch`, `auto-optimize`, `toggle-autopilot`) kini membutuhkan sesi pengelola; hanya `/api/agent/mission` yang publik (dibatasi laju, dapat dimatikan dengan `AGENT_PUBLIC_RUN=false`).
- Penghitung statistik agen dimulai dari nol (sebelumnya berisi angka contoh).

## 1.2.0 — Visual Experience Refresh

- Rebuilt the Beranda hero as an editorial civic-transparency experience with layered imagery, live metric cards, refined calls to action, and subtle ambient motion.
- Added dedicated premium page headers for Dashboard, Proyek, Laporan, Lacak, Insight, Data & Metodologi, and Tentang.
- Added scroll-triggered section reveals, staggered entrances, restrained floating details, card hover elevation, and keyboard-focus refinements.
- Added mobile-specific layouts and reduced-motion support so animations remain accessible.
- Preserved existing application data flows, filters, exports, maps, report tracking, and admin functionality.

# TERANG 1.1.0 — UI & Backend Refinement

## Interface
- Unified premium civic-tech visual system with a calmer navy/teal palette, stronger typography, improved page surfaces, form controls, tables, and maps.
- Improved spacing, responsive behavior, keyboard focus, skip navigation, reduced-motion handling, and mobile content gutters.
- Replaced decorative sparkle-heavy assistant visuals with simpler communication and utility icons.
- Added debounced catalogue search to reduce unnecessary API calls.

## Backend
- Added signed, expiring Bearer sessions and server-enforced role permissions for administrator actions.
- Bound audit identity to the authenticated session instead of trusting browser-supplied identity fields.
- Redacted reporter names and contact details from public report endpoints.
- Added validation for report submissions, moderation notes, agency responses, and CSV imports.
- Added per-IP request throttles for login and metered AI endpoints, plus basic security response headers.
- Added `.env.local` loading before server services are initialized.

## Operational notes
- Data storage is still in-memory for demo purposes; a persistent database is required for production.
- Configure `AUTH_SECRET`, `DEMO_PASSWORD`, and `GEMINI_API_KEY` outside version control.
