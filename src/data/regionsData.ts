export interface Region {
  id: string;
  nama: string;
  tipe: 'kabupaten' | 'kota';
  kode_bps: string;
  geojson_key: string;
  populasi: number;
  lat: number;
  lng: number;
  ibu_kota: string;
}

export const REGIONS: Region[] = [
  { id: 'reg-medan', nama: 'Kota Medan', tipe: 'kota', kode_bps: '1271', geojson_key: 'KOTA MEDAN', populasi: 2460858, lat: 3.5952, lng: 98.6722, ibu_kota: 'Medan' },
  { id: 'reg-deliserdang', nama: 'Kabupaten Deli Serdang', tipe: 'kabupaten', kode_bps: '1207', geojson_key: 'DELI SERDANG', populasi: 1931441, lat: 3.5552, lng: 98.8652, ibu_kota: 'Lubuk Pakam' },
  { id: 'reg-langkat', nama: 'Kabupaten Langkat', tipe: 'kabupaten', kode_bps: '1205', geojson_key: 'LANGKAT', populasi: 1030202, lat: 3.7388, lng: 98.2422, ibu_kota: 'Stabat' },
  { id: 'reg-binjai', nama: 'Kota Binjai', tipe: 'kota', kode_bps: '1275', geojson_key: 'KOTA BINJAI', populasi: 291842, lat: 3.6001, lng: 98.4854, ibu_kota: 'Binjai' },
  { id: 'reg-karo', nama: 'Kabupaten Karo', tipe: 'kabupaten', kode_bps: '1206', geojson_key: 'KARO', populasi: 404998, lat: 3.1252, lng: 98.4908, ibu_kota: 'Kabanjahe' },
  { id: 'reg-simalungun', nama: 'Kabupaten Simalungun', tipe: 'kabupaten', kode_bps: '1208', geojson_key: 'SIMALUNGUN', populasi: 990348, lat: 2.9622, lng: 99.0654, ibu_kota: 'Raya' },
  { id: 'reg-pematangsiantar', nama: 'Kota Pematangsiantar', tipe: 'kota', kode_bps: '1272', geojson_key: 'KOTA PEMATANG SIANTAR', populasi: 268254, lat: 2.9592, lng: 99.0687, ibu_kota: 'Pematangsiantar' },
  { id: 'reg-tebingtinggi', nama: 'Kota Tebing Tinggi', tipe: 'kota', kode_bps: '1276', geojson_key: 'KOTA TEBING TINGGI', populasi: 172838, lat: 3.3275, lng: 99.1625, ibu_kota: 'Tebing Tinggi' },
  { id: 'reg-serdangbedagai', nama: 'Kabupaten Serdang Bedagai', tipe: 'kabupaten', kode_bps: '1218', geojson_key: 'SERDANG BEDAGAI', populasi: 657490, lat: 3.4144, lng: 99.1248, ibu_kota: 'Sei Rampah' },
  { id: 'reg-asahan', nama: 'Kabupaten Asahan', tipe: 'kabupaten', kode_bps: '1209', geojson_key: 'ASAHAN', populasi: 769960, lat: 2.9842, lng: 99.6268, ibu_kota: 'Kisaran' },
  { id: 'reg-batubara', nama: 'Kabupaten Batu Bara', tipe: 'kabupaten', kode_bps: '1219', geojson_key: 'BATU BARA', populasi: 410678, lat: 3.1706, lng: 99.5342, ibu_kota: 'Lima Puluh' },
  { id: 'reg-tanjungbalai', nama: 'Kota Tanjungbalai', tipe: 'kota', kode_bps: '1274', geojson_key: 'KOTA TANJUNG BALAI', populasi: 176027, lat: 2.9664, lng: 99.8003, ibu_kota: 'Tanjungbalai' },
  { id: 'reg-labuhanbatu', nama: 'Kabupaten Labuhanbatu', tipe: 'kabupaten', kode_bps: '1210', geojson_key: 'LABUHANBATU', populasi: 493899, lat: 2.0964, lng: 100.0984, ibu_kota: 'Rantau Prapat' },
  { id: 'reg-labuhanbatuutara', nama: 'Kabupaten Labuhanbatu Utara', tipe: 'kabupaten', kode_bps: '1223', geojson_key: 'LABUHANBATU UTARA', populasi: 381994, lat: 2.3324, lng: 99.6412, ibu_kota: 'Aek Kanopan' },
  { id: 'reg-labuhanbatuselatan', nama: 'Kabupaten Labuhanbatu Selatan', tipe: 'kabupaten', kode_bps: '1222', geojson_key: 'LABUHANBATU SELATAN', populasi: 314094, lat: 1.8842, lng: 100.0872, ibu_kota: 'Kota Pinang' },
  { id: 'reg-toba', nama: 'Kabupaten Toba', tipe: 'kabupaten', kode_bps: '1212', geojson_key: 'TOBA', populasi: 206531, lat: 2.3854, lng: 99.0722, ibu_kota: 'Balige' },
  { id: 'reg-samosir', nama: 'Kabupaten Samosir', tipe: 'kabupaten', kode_bps: '1217', geojson_key: 'SAMOSIR', populasi: 136442, lat: 2.5894, lng: 98.7142, ibu_kota: 'Pangururan' },
  { id: 'reg-humbanghasundutan', nama: 'Kabupaten Humbang Hasundutan', tipe: 'kabupaten', kode_bps: '1216', geojson_key: 'HUMBANG HASUNDUTAN', populasi: 197751, lat: 2.2612, lng: 98.7512, ibu_kota: 'Dolok Sanggul' },
  { id: 'reg-tapanuliutara', nama: 'Kabupaten Tapanuli Utara', tipe: 'kabupaten', kode_bps: '1211', geojson_key: 'TAPANULI UTARA', populasi: 312758, lat: 2.0042, lng: 98.9664, ibu_kota: 'Tarutung' },
  { id: 'reg-tapanulitengah', nama: 'Kabupaten Tapanuli Tengah', tipe: 'kabupaten', kode_bps: '1201', geojson_key: 'TAPANULI TENGAH', populasi: 365177, lat: 1.8542, lng: 98.6854, ibu_kota: 'Pandan' },
  { id: 'reg-sibolga', nama: 'Kota Sibolga', tipe: 'kota', kode_bps: '1273', geojson_key: 'KOTA SIBOLGA', populasi: 89584, lat: 1.7412, lng: 98.7842, ibu_kota: 'Sibolga' },
  { id: 'reg-tapanuliselatan', nama: 'Kabupaten Tapanuli Selatan', tipe: 'kabupaten', kode_bps: '1203', geojson_key: 'TAPANULI SELATAN', populasi: 300911, lat: 1.5124, lng: 99.2312, ibu_kota: 'Sipirok' },
  { id: 'reg-padangsidimpuan', nama: 'Kota Padangsidimpuan', tipe: 'kota', kode_bps: '1277', geojson_key: 'KOTA PADANG SIDIMPUAN', populasi: 225105, lat: 1.3742, lng: 99.2712, ibu_kota: 'Padangsidimpuan' },
  { id: 'reg-padanglawas', nama: 'Kabupaten Padang Lawas', tipe: 'kabupaten', kode_bps: '1221', geojson_key: 'PADANG LAWAS', populasi: 261011, lat: 1.1524, lng: 99.8842, ibu_kota: 'Sibuhuan' },
  { id: 'reg-padanglawasutara', nama: 'Kabupaten Padang Lawas Utara', tipe: 'kabupaten', kode_bps: '1220', geojson_key: 'PADANG LAWAS UTARA', populasi: 260720, lat: 1.4824, lng: 99.6642, ibu_kota: 'Gunung Tua' },
  { id: 'reg-mandailingnatal', nama: 'Kabupaten Mandailing Natal', tipe: 'kabupaten', kode_bps: '1202', geojson_key: 'MANDAILING NATAL', populasi: 472886, lat: 0.8842, lng: 99.5542, ibu_kota: 'Panyabungan' },
  { id: 'reg-dairi', nama: 'Kabupaten Dairi', tipe: 'kabupaten', kode_bps: '1213', geojson_key: 'DAIRI', populasi: 312758, lat: 2.7542, lng: 98.3142, ibu_kota: 'Sidikalang' },
  { id: 'reg-pakpakbharat', nama: 'Kabupaten Pakpak Bharat', tipe: 'kabupaten', kode_bps: '1215', geojson_key: 'PAKPAK BHARAT', populasi: 53500, lat: 2.5712, lng: 98.2812, ibu_kota: 'Salak' },
  { id: 'reg-nias', nama: 'Kabupaten Nias', tipe: 'kabupaten', kode_bps: '1204', geojson_key: 'NIAS', populasi: 143319, lat: 1.1212, lng: 97.6212, ibu_kota: 'Gido' },
  { id: 'reg-gunungsitoli', nama: 'Kota Gunungsitoli', tipe: 'kota', kode_bps: '1278', geojson_key: 'KOTA GUNUNGSITOLI', populasi: 136017, lat: 1.2824, lng: 97.6142, ibu_kota: 'Gunungsitoli' },
  { id: 'reg-niasselatan', nama: 'Kabupaten Nias Selatan', tipe: 'kabupaten', kode_bps: '1214', geojson_key: 'NIAS SELATAN', populasi: 360531, lat: 0.7712, lng: 97.7512, ibu_kota: 'Teluk Dalam' },
  { id: 'reg-niasutara', nama: 'Kabupaten Nias Utara', tipe: 'kabupaten', kode_bps: '1224', geojson_key: 'NIAS UTARA', populasi: 147274, lat: 1.3312, lng: 97.3212, ibu_kota: 'Lotu' },
  { id: 'reg-niasbarat', nama: 'Kabupaten Nias Barat', tipe: 'kabupaten', kode_bps: '1225', geojson_key: 'NIAS BARAT', populasi: 89994, lat: 1.0542, lng: 97.4512, ibu_kota: 'Lahomi' },
];

export function getRegionById(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}

export function getRegionByName(name: string): Region | undefined {
  const clean = name.toLowerCase().replace(/^(kabupaten|kota|kab\.)\s*/, '').trim();
  return REGIONS.find((r) => {
    const rClean = r.nama.toLowerCase().replace(/^(kabupaten|kota|kab\.)\s*/, '').trim();
    return rClean === clean || r.nama.toLowerCase().includes(clean);
  });
}
