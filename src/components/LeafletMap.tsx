import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SUMUT_GEOJSON } from '../data/geoJsonSumut';
import { Project } from '../data/projectsData';

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
    return '#2E9E6B';
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center of North Sumatra (approx 2.35° N, 98.85° E)
      const map = L.map(mapContainerRef.current, {
        center: [2.35, 98.85],
        zoom: 8,
        minZoom: 6,
        maxZoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      // Official Leaflet / OpenStreetMap Tile Server
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;

    // Update GeoJSON Layer
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const onEachFeature = (feature: any, layer: L.Layer) => {
      const props = feature.properties || {};
      const regId = props.id || props.KABKOTA || '';
      const regName = props.nama || props.NAME_2 || 'Kabupaten/Kota';

      // Determine metric value
      let value = 0;
      let unit = '';
      const customMetric = regionMetrics[regId];

      if (customMetric) {
        value = customMetric[selectedMetric] || 0;
      } else {
        // Mocked defaults if not computed
        if (selectedMetric === 'serapan') value = props.serapan || 84.5;
        else if (selectedMetric === 'laporan') value = props.laporan || 2;
        else if (selectedMetric === 'skor') value = props.skor || 75;
      }

      if (selectedMetric === 'serapan') unit = '%';
      else if (selectedMetric === 'laporan') unit = ' aduan';
      else if (selectedMetric === 'skor') unit = ' / 100';

      const isSelected = selectedRegionId && selectedRegionId === regId;

      // Popup Content
      const popupHtml = `
        <div class="p-2 text-xs font-sans text-slate-800">
          <strong class="text-sm font-bold block text-slate-900 mb-1">${regName}</strong>
          <div class="flex items-center gap-1.5 my-1">
            <span class="text-slate-500 font-medium">Status ${selectedMetric}:</span>
            <span class="font-bold text-[#0FA3B1] font-mono">${value}${unit}</span>
          </div>
          <p class="text-[10px] text-slate-500 mt-1.5 border-t border-slate-100 pt-1">Klik wilayah untuk memfilter dashboard</p>
        </div>
      `;

      layer.bindPopup(popupHtml);

      // Event handlers
      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({
            weight: 3,
            color: '#0FA3B1',
            fillOpacity: 0.8,
          });
        },
        mouseout: (e) => {
          if (geoJsonLayerRef.current) {
            geoJsonLayerRef.current.resetStyle(e.target);
          }
        },
        click: () => {
          if (onSelectRegion && regId) {
            onSelectRegion(regId);
          }
        },
      });
    };

    const geoJsonLayer = L.geoJSON(SUMUT_GEOJSON as any, {
      style: (feature) => {
        const props = feature?.properties || {};
        const regId = props.id || '';
        let val = 80;

        if (regionMetrics[regId]) {
          val = regionMetrics[regId][selectedMetric] || 0;
        } else {
          if (selectedMetric === 'serapan') val = props.serapan || 84.5;
          else if (selectedMetric === 'laporan') val = props.laporan || 2;
          else if (selectedMetric === 'skor') val = props.skor || 75;
        }

        const isSelected = selectedRegionId && selectedRegionId === regId;

        return {
          fillColor: getColor(val, selectedMetric),
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
          color: isSelected ? '#0B2545' : '#FFFFFF',
          dashArray: isSelected ? '' : '2',
          fillOpacity: isSelected ? 0.85 : 0.65,
        };
      },
      onEachFeature,
    }).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;

    // Update Project Markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      projects.forEach((proj) => {
        if (!proj.lat || !proj.lng) return;

        // Create custom SVG marker icon
        const markerHtml = `
          <div class="relative group cursor-pointer">
            <div class="w-5 h-5 rounded-full bg-[#0FA3B1] border-2 border-white shadow-md flex items-center justify-center transform transition-transform hover:scale-125">
              <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-project-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([proj.lat, proj.lng], { icon: customIcon });

        const projPopup = `
          <div class="p-2 text-xs font-sans text-slate-800 max-w-xs">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 inline-block mb-1">
              ${proj.status.toUpperCase()}
            </span>
            <strong class="text-xs font-bold block text-slate-900 mb-1">${proj.nama}</strong>
            <p class="text-[11px] text-slate-600 line-clamp-2 mb-1.5">${proj.deskripsi || ''}</p>
            <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
              <span>Pagu: Rp ${(proj.pagu / 1e9).toFixed(1)} M</span>
              <span class="font-bold text-teal-700">Fisik: ${proj.progres_fisik}%</span>
            </div>
          </div>
        `;

        marker.bindPopup(projPopup);

        marker.on('click', () => {
          if (onSelectProject) {
            onSelectProject(proj.id);
          }
        });

        markersLayerRef.current?.addLayer(marker);
      });
    }

    // Auto fit bounds if single region is selected
    if (selectedRegionId && SUMUT_GEOJSON) {
      const feat = (SUMUT_GEOJSON.features as any[]).find(
        (f) => (f.properties?.id || f.properties?.KABKOTA) === selectedRegionId
      );
      if (feat) {
        const tempLayer = L.geoJSON(feat);
        map.fitBounds(tempLayer.getBounds(), { padding: [30, 30], maxZoom: 11 });
      }
    }

    // Handle map resize observer for crisp rendering
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedMetric, selectedRegionId, projects, regionMetrics]);

  return (
    <div className="relative w-full h-[340px] sm:h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-[#E8EEF4]">
      <div
        ref={mapContainerRef}
        className="w-full h-full touch-pan-x touch-pan-y bg-[#E8EEF4]"
        style={{ backgroundColor: '#E8EEF4' }}
      />
    </div>
  );
};
