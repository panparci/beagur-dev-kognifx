export type IndonesiaRegion = {
  label: string;
  latitude: number;
  longitude: number;
};

/** Kota/kabupaten utama di Indonesia — dipakai form guru & fallback geocoding peta. */
export const INDONESIA_REGIONS: IndonesiaRegion[] = [
  { label: 'Aceh — Banda Aceh', latitude: 5.5483, longitude: 95.3238 },
  { label: 'Sumatera Utara — Medan', latitude: 3.5952, longitude: 98.6722 },
  { label: 'Sumatera Barat — Padang', latitude: -0.9471, longitude: 100.4172 },
  { label: 'Riau — Pekanbaru', latitude: 0.5071, longitude: 101.4478 },
  { label: 'Kepulauan Riau — Batam', latitude: 1.1301, longitude: 104.0530 },
  { label: 'Jambi — Jambi', latitude: -1.6101, longitude: 103.6131 },
  { label: 'Sumatera Selatan — Palembang', latitude: -2.9761, longitude: 104.7754 },
  { label: 'Bangka Belitung — Pangkalpinang', latitude: -2.1316, longitude: 106.1169 },
  { label: 'Bengkulu — Bengkulu', latitude: -3.7928, longitude: 102.2608 },
  { label: 'Lampung — Bandar Lampung', latitude: -5.4292, longitude: 105.2625 },
  { label: 'DKI Jakarta', latitude: -6.2088, longitude: 106.8456 },
  { label: 'Jawa Barat — Bandung', latitude: -6.9175, longitude: 107.6191 },
  { label: 'Jawa Barat — Bogor', latitude: -6.5971, longitude: 106.8060 },
  { label: 'Jawa Barat — Cirebon', latitude: -6.7320, longitude: 108.5523 },
  { label: 'Jawa Tengah — Semarang', latitude: -6.9667, longitude: 110.4167 },
  { label: 'Jawa Tengah — Solo', latitude: -7.5755, longitude: 110.8243 },
  { label: 'DI Yogyakarta', latitude: -7.7956, longitude: 110.3695 },
  { label: 'Jawa Timur — Surabaya', latitude: -7.2575, longitude: 112.7521 },
  { label: 'Jawa Timur — Malang', latitude: -7.9666, longitude: 112.6326 },
  { label: 'Banten — Serang', latitude: -6.1200, longitude: 106.1503 },
  { label: 'Bali — Denpasar', latitude: -8.6705, longitude: 115.2126 },
  { label: 'NTB — Mataram', latitude: -8.5833, longitude: 116.1167 },
  { label: 'NTT — Kupang', latitude: -10.1772, longitude: 123.6070 },
  { label: 'Kalimantan Barat — Pontianak', latitude: -0.0263, longitude: 109.3425 },
  { label: 'Kalimantan Tengah — Palangka Raya', latitude: -2.2100, longitude: 113.9200 },
  { label: 'Kalimantan Selatan — Banjarmasin', latitude: -3.3186, longitude: 114.5944 },
  { label: 'Kalimantan Timur — Samarinda', latitude: -0.5022, longitude: 117.1536 },
  { label: 'Kalimantan Timur — Balikpapan', latitude: -1.2379, longitude: 116.8529 },
  { label: 'Kalimantan Utara — Tarakan', latitude: 3.3274, longitude: 117.5785 },
  { label: 'Sulawesi Utara — Manado', latitude: 1.4748, longitude: 124.8421 },
  { label: 'Sulawesi Tengah — Palu', latitude: -0.8999, longitude: 119.8707 },
  { label: 'Sulawesi Selatan — Makassar', latitude: -5.1477, longitude: 119.4327 },
  { label: 'Sulawesi Tenggara — Kendari', latitude: -3.9985, longitude: 122.5130 },
  { label: 'Sulawesi Barat — Mamuju', latitude: -2.6726, longitude: 118.8860 },
  { label: 'Gorontalo', latitude: 0.5435, longitude: 123.0585 },
  { label: 'Maluku — Ambon', latitude: -3.6554, longitude: 128.1908 },
  { label: 'Maluku Utara — Ternate', latitude: 0.7900, longitude: 127.3848 },
  { label: 'Papua Barat — Manokwari', latitude: -0.8611, longitude: 134.0620 },
  { label: 'Papua — Jayapura', latitude: -2.5337, longitude: 140.7181 },
  { label: 'Papua — Merauke', latitude: -8.4961, longitude: 140.3949 },
];

/** Alias nama lama / singkat dari data seed → label canonical form guru. */
const REGION_ALIASES: Record<string, string> = {
  jakarta: 'DKI Jakarta',
  'dki jakarta': 'DKI Jakarta',
  bandung: 'Jawa Barat — Bandung',
  bogor: 'Jawa Barat — Bogor',
  cirebon: 'Jawa Barat — Cirebon',
  surabaya: 'Jawa Timur — Surabaya',
  malang: 'Jawa Timur — Malang',
  semarang: 'Jawa Tengah — Semarang',
  solo: 'Jawa Tengah — Solo',
  yogyakarta: 'DI Yogyakarta',
  jogja: 'DI Yogyakarta',
  medan: 'Sumatera Utara — Medan',
  padang: 'Sumatera Barat — Padang',
  pekanbaru: 'Riau — Pekanbaru',
  batam: 'Kepulauan Riau — Batam',
  palembang: 'Sumatera Selatan — Palembang',
  lampung: 'Lampung — Bandar Lampung',
  'bandar lampung': 'Lampung — Bandar Lampung',
  denpasar: 'Bali — Denpasar',
  bali: 'Bali — Denpasar',
  mataram: 'NTB — Mataram',
  kupang: 'NTT — Kupang',
  pontianak: 'Kalimantan Barat — Pontianak',
  banjarmasin: 'Kalimantan Selatan — Banjarmasin',
  samarinda: 'Kalimantan Timur — Samarinda',
  balikpapan: 'Kalimantan Timur — Balikpapan',
  manado: 'Sulawesi Utara — Manado',
  makassar: 'Sulawesi Selatan — Makassar',
  palu: 'Sulawesi Tengah — Palu',
  kendari: 'Sulawesi Tenggara — Kendari',
  mamuju: 'Sulawesi Barat — Mamuju',
  'sulawesi barat': 'Sulawesi Barat — Mamuju',
  ambon: 'Maluku — Ambon',
  ternate: 'Maluku Utara — Ternate',
  jayapura: 'Papua — Jayapura',
  merauke: 'Papua — Merauke',
  manokwari: 'Papua Barat — Manokwari',
  aceh: 'Aceh — Banda Aceh',
  'banda aceh': 'Aceh — Banda Aceh',
};

const regionLookup = new Map<string, IndonesiaRegion>();

for (const region of INDONESIA_REGIONS) {
  regionLookup.set(normalizeRegionKey(region.label), region);
  const short = region.label.split(' — ').pop();
  if (short) {
    regionLookup.set(normalizeRegionKey(short), region);
  }
}

export function normalizeRegionKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function findRegionByLabel(label: string): IndonesiaRegion | undefined {
  const key = normalizeRegionKey(label);
  const aliasTarget = REGION_ALIASES[key];
  if (aliasTarget) {
    return regionLookup.get(normalizeRegionKey(aliasTarget));
  }
  return regionLookup.get(key);
}

export function resolveRegionCoords(
  region?: string,
  latitude?: number | null,
  longitude?: number | null,
): { latitude: number; longitude: number; region: string } | null {
  const trimmedRegion = region?.trim() || '';
  const canonical = trimmedRegion ? findRegionByLabel(trimmedRegion)?.label ?? trimmedRegion : '';

  if (latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude, region: canonical };
  }
  if (!trimmedRegion) return null;
  const match = findRegionByLabel(trimmedRegion);
  if (!match) return null;
  return { latitude: match.latitude, longitude: match.longitude, region: match.label };
}
