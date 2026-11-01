import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SUMUT_GEOJSON } from '../data/geoJsonSumut';
import { Project } from '../data/projectsData';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface LeafletMapProps {
  selectedMetric: 'serapan' | 'laporan' | 'skor';
  selectedRegionId?: string;
  onSelectRegion?: (regionId: string) => void;
  projects?: Project[];
  onSelectProject?: (projectId: string) => void;
  regionMetrics?: Record<string, { serapan: number; laporan: number; skor: number }>;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  selectedMetric,
  selectedRegionId,
  onSelectRegion,
  projects = [],
  onSelectProject,
  regionMetrics = {},
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Helper color for metric
  const getColor = (value: number, metric: 'serapan' | 'laporan' | 'skor') => {
    if (metric === 'serapan') {
      if (value >= 88) return '#2E9E6B'; // green
      if (value >= 80) return '#0FA3B1'; // teal
      if (value >= 72) return '#F5A623'; // amber
      return '#D64545'; // red
    }
    if (metric === 'skor') {
      if (value >= 80) return '#2E9E6B';
      if (value >= 70) return '#0FA3B1';
      if (value >= 55) return '#F5A623';
      return '#D64545';
    }
    // laporan count
    if (value >= 5) return '#D64545';
    if (value >= 3) return '#F5A623';
    if (value >= 1) return '#0FA3B1';
    return '#94A3B8';
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center of North Sumatra (approx 2.4° N, 99.0° E)
      const map = L.map(mapContainerRef.current, {
        center: [2.35, 98.85],
        zoom: 8,
        minZoom: 6,
        maxZoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Remove existing GeoJSON layer if any
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    // Add GeoJSON Choropleth
    const geoJsonLayer = L.geoJSON(SUMUT_GEOJSON as any, {
      style: (feature: any) => {
        const regId = feature?.properties?.id;
        const metrics = regionMetrics[regId] || { serapan: 78, laporan: 2, skor: 70 };
        const val = metrics[selectedMetric];
        const isSelected = selectedRegionId === regId;

        return {
          fillColor: getColor(val, selectedMetric),
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
          color: isSelected ? '#0B2545' : '#FFFFFF',
          fillOpacity: isSelected ? 0.75 : 0.55,
        };
      },
      onEachFeature: (feature: any, layer: L.Layer) => {
        const props = feature.properties;
        const metrics = regionMetrics[props.id] || { serapan: 78, laporan: 2, skor: 70 };
        const val = metrics[selectedMetric];

        let displayVal = `${metrics.serapan}%`;
        if (selectedMetric === 'laporan') displayVal = `${metrics.laporan} aduan`;
        if (selectedMetric === 'skor') displayVal = `${metrics.skor} / 100`;

        const badgeColor = getColor(val, selectedMetric);
        const tooltipHtml = `
          <div style="background-color: rgba(11, 37, 69, 0.95); backdrop-filter: blur(8px); color: #FFFFFF; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); font-family: system-ui, sans-serif; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); min-width: 150px;">
            <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px; border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
              <span>${props.nama}</span>
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${badgeColor};"></span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px;">
              <span style="color: #94A3B8;">${selectedMetric === 'serapan' ? 'Serapan APBD' : selectedMetric === 'laporan' ? 'Total Laporan' : 'Skor Transparansi'}</span>
              <strong style="font-family: monospace; font-size: 12px; color: ${badgeColor};">${displayVal}</strong>
            </div>
            ${selectedMetric === 'serapan' ? `
            <div style="width: 100%; background: rgba(255,255,255,0.15); height: 5px; border-radius: 9999px; overflow: hidden;">
              <div style="width: ${Math.min(100, metrics.serapan)}%; background: ${badgeColor}; height: 100%;"></div>
            </div>` : ''}
          </div>
        `;

        layer.bindTooltip(tooltipHtml, { sticky: true, direction: 'auto', className: 'leaflet-glass-tooltip' });

        layer.on({
          click: () => {
            if (onSelectRegion) onSelectRegion(props.id);
          },
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({ fillOpacity: 0.85, weight: 2.5 });
          },
          mouseout: (e) => {
            geoJsonLayer.resetStyle(e.target);
          },
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;

    // Render project markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      const displayedProjects = projects.slice(0, 45); // top prominent markers to prevent clutter
      displayedProjects.forEach((proj) => {
        let pinColor = '#3B82F6';
        if (proj.status === 'selesai') pinColor = '#2E9E6B';
        if (proj.status === 'mangkrak') pinColor = '#D64545';
        if (proj.status === 'berjalan') pinColor = '#F5A623';

        const marker = L.circleMarker([proj.lat, proj.lng], {
          radius: 6,
          fillColor: pinColor,
          color: '#FFFFFF',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        });

        const popupContent = document.createElement('div');
        popupContent.className = 'text-xs text-slate-800';
        popupContent.innerHTML = `
          <div class="font-bold text-slate-900 text-xs mb-1">${proj.nama}</div>
          <div class="text-[11px] text-slate-500 mb-1.5">${proj.region_nama} · Sektor ${proj.sector_nama}</div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-slate-600">Pagu:</span>
            <span class="font-mono font-semibold">Rp ${(proj.pagu / 1e9).toFixed(1)} M</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-slate-600">Progres Fisik:</span>
            <span class="font-mono font-semibold text-teal-700">${proj.progres_fisik}%</span>
          </div>
          <button id="btn-proj-${proj.id}" class="w-full py-1 text-center bg-[#0B7C8A] text-white rounded font-medium hover:bg-[#096A76] transition-colors text-[11px]">
            Lihat Rincian Proyek
          </button>
        `;

        popupContent.querySelector(`#btn-proj-${proj.id}`)?.addEventListener('click', () => {
          if (onSelectProject) onSelectProject(proj.id);
        });

        marker.bindPopup(popupContent);
        markersLayerRef.current?.addLayer(marker);
      });
    }

    // Handle container resize & orientation changes for mobile devices
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedMetric, selectedRegionId, projects, regionMetrics]);

  return (
    <div className="relative w-full h-[360px] sm:h-[480px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full touch-pan-x touch-pan-y" />

      {/* Floating Legend - Collapsible on Mobile, always clear on Desktop */}
      <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-24px)] sm:max-w-xs">
        {/* Mobile toggle button */}
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 text-[11px] font-semibold text-slate-800"
        >
          <Layers className="w-3.5 h-3.5 text-[#0FA3B1]" />
          <span>Legenda Peta</span>
          {isLegendOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>

        {/* Legend Content */}
        <div className={`${isLegendOpen ? 'block' : 'hidden'} sm:block mt-1 sm:mt-0 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200 text-xs animate-in fade-in`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-900 text-[11px]">
              {selectedMetric === 'serapan' && 'Legenda Serapan APBD'}
              {selectedMetric === 'laporan' && 'Legenda Aduan Warga'}
              {selectedMetric === 'skor' && 'Legenda Skor Transparansi'}
            </span>
            <button
              onClick={() => setIsLegendOpen(false)}
              className="sm:hidden text-slate-400 hover:text-slate-600 p-0.5"
            >
              &times;
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: '#2E9E6B' }}></span>
              <span className="text-slate-600 truncate">
                {selectedMetric === 'serapan' ? 'Tinggi (≥ 88%)' : selectedMetric === 'skor' ? 'Baik (≥ 80)' : '0 aduan'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: '#0FA3B1' }}></span>
              <span className="text-slate-600 truncate">
                {selectedMetric === 'serapan' ? 'Sedang (80-87%)' : selectedMetric === 'skor' ? 'Sedang (70-79)' : '1 - 2 aduan'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: '#F5A623' }}></span>
              <span className="text-slate-600 truncate">
                {selectedMetric === 'serapan' ? 'Waspada (72-79%)' : selectedMetric === 'skor' ? 'Cukup (55-69)' : '3 - 4 aduan'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: '#D64545' }}></span>
              <span className="text-slate-600 truncate">
                {selectedMetric === 'serapan' ? 'Kritis (< 72%)' : selectedMetric === 'skor' ? 'Rendah (< 55)' : '≥ 5 aduan'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
