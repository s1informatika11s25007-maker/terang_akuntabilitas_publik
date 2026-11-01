import { REGIONS } from './regionsData.js';

export interface GeoJsonFeature {
  type: 'Feature';
  properties: {
    id: string;
    nama: string;
    tipe: string;
    kode_bps: string;
    geojson_key: string;
    populasi: number;
    lat: number;
    lng: number;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

/**
 * Creates polygon coordinates around a center point for North Sumatra regency mapping
 */
function createRegionPolygon(lat: number, lng: number, scale: number = 0.18, seed: number = 1): number[][][] {
  const points: number[][] = [];
  const numVertices = 10;
  for (let i = 0; i <= numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI;
    // Organic wobble for natural boundary feel
    const wobble = 0.85 + Math.sin(angle * 3 + seed) * 0.15;
    const rLat = scale * 0.75 * wobble;
    const rLng = scale * 0.9 * wobble;
    const pLng = Number((lng + Math.cos(angle) * rLng).toFixed(4));
    const pLat = Number((lat + Math.sin(angle) * rLat).toFixed(4));
    points.push([pLng, pLat]);
  }
  return [points];
}

export const SUMUT_GEOJSON: GeoJsonCollection = {
  type: 'FeatureCollection',
  features: REGIONS.map((reg, idx) => {
    // City regions are more compact, regencies are wider
    const scale = reg.tipe === 'kota' ? 0.08 : 0.22;
    return {
      type: 'Feature',
      properties: {
        id: reg.id,
        nama: reg.nama,
        tipe: reg.tipe,
        kode_bps: reg.kode_bps,
        geojson_key: reg.geojson_key,
        populasi: reg.populasi,
        lat: reg.lat,
        lng: reg.lng,
      },
      geometry: {
        type: 'Polygon',
        coordinates: createRegionPolygon(reg.lat, reg.lng, scale, idx + 1),
      },
    };
  }),
};
