import type { Amenity, AmenityType, LatLng } from '../types';
import { haversineKm } from './geo';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const RADIUS_M = 1500;
const PER_CATEGORY = 3;

const GENERIC_NAME: Record<AmenityType, string> = {
  gym: 'Academia',
  market: 'Mercado',
  convenience: 'Loja de conveniência',
  health: 'Unidade de saúde',
};

const PRIMARY_CARE =
  /\bUBS\b|unidade b[aá]sica|posto de sa[uú]de|centro de sa[uú]de|sa[uú]de da fam[ií]lia|\bUSF\b|\bESF\b|\bUPA\b|\bAMA\b|pronto[- ]?(socorro|atendimento)|policl[ií]nica|hospital/i;
const NOT_A_CARE_UNIT =
  /coordenadoria|vigil[aâ]ncia|\buvis\b|supervis[aã]o|secretaria|regula[cç][aã]o|departamento|pavilh[aã]o|simula[cç][aã]o|\bbloco\b|estacionamento|oncolog|c[aâ]ncer|cirurgia|est[eé]tica|odonto|veterin/i;
const CLOSED = /fechad[oa]|closed|desativad[oa]|encerrad[oa]/i;

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const buildQuery = ([lat, lng]: LatLng) => {
  const around = `(around:${RADIUS_M},${lat},${lng})`;
  return `[out:json][timeout:25];
(
  nwr${around}["leisure"="fitness_centre"];
  nwr${around}["amenity"="gym"];
  nwr${around}["shop"~"^(supermarket|greengrocer)$"];
  nwr${around}["shop"="convenience"];
  nwr${around}["amenity"~"^(hospital|clinic)$"];
  nwr${around}["healthcare"~"^(hospital|clinic|centre)$"];
);
out tags center;`;
};

const classify = (t: Record<string, string>, name: string): AmenityType | null => {
  if (t.leisure === 'fitness_centre' || t.amenity === 'gym') return 'gym';
  if (t.shop === 'supermarket' || t.shop === 'greengrocer') return 'market';
  if (t.shop === 'convenience') return 'convenience';
  const isHospital = t.amenity === 'hospital' || t.healthcare === 'hospital';
  const isClinic = t.amenity === 'clinic' || t.healthcare === 'clinic' || t.healthcare === 'centre';
  if ((isHospital || isClinic) && name && !NOT_A_CARE_UNIT.test(name) && (isHospital || PRIMARY_CARE.test(name))) {
    return 'health';
  }
  return null;
};

export const toAmenities = (origin: LatLng, elements: OverpassElement[]): Amenity[] => {
  const byType: Record<AmenityType, Amenity[]> = { gym: [], market: [], convenience: [], health: [] };
  const seen = new Set<string>();

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = (tags.name ?? tags.brand ?? '').trim();
    const type = classify(tags, name);
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!type || lat === undefined || lon === undefined || CLOSED.test(name)) continue;

    if (name) {
      const key = `${type}:${name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }

    const coords: LatLng = [lat, lon];
    byType[type].push({
      type,
      name: name || GENERIC_NAME[type],
      coords,
      distanceKm: haversineKm(origin, coords),
      osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    });
  }

  return (Object.keys(byType) as AmenityType[])
    .flatMap((type) => {
      const list = byType[type].sort((a, b) => a.distanceKm - b.distanceKm);
      const named = list.filter((am) => am.name !== GENERIC_NAME[type]);
      const unnamed = list.filter((am) => am.name === GENERIC_NAME[type]);
      return [...named, ...unnamed].slice(0, PER_CATEGORY);
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    });
  });

interface FetchOptions {
  timeoutMs?: number;
  hedgeDelayMs?: number;
}

export const fetchOverpassElements = async (
  origin: LatLng,
  { timeoutMs = 45000, hedgeDelayMs = 5000 }: FetchOptions = {}
): Promise<OverpassElement[]> => {
  const query = buildQuery(origin);
  const all = new AbortController();
  const deadline = setTimeout(() => all.abort(), timeoutMs);
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };

  const attempt = async (url: string, index: number): Promise<OverpassElement[]> => {
    await sleep(index * hedgeDelayMs, all.signal);
    if (all.signal.aborted) throw new Error('cancelado');
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: `data=${encodeURIComponent(query)}`,
      signal: all.signal,
    });
    if (!res.ok) throw new Error(`${url} respondeu ${res.status}`);
    const json = (await res.json()) as { elements?: OverpassElement[]; remark?: string };
    if (json.remark && /timed out|runtime error/i.test(json.remark)) throw new Error(`${url}: ${json.remark}`);
    return json.elements ?? [];
  };

  try {
    return await Promise.any(ENDPOINTS.map(attempt));
  } finally {
    clearTimeout(deadline);
    all.abort();
  }
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'unidus:poi:v2:';

const memory = new Map<string, Promise<Amenity[]>>();
const cacheKey = ([lat, lng]: LatLng) => `${CACHE_PREFIX}${lat.toFixed(4)},${lng.toFixed(4)}`;

const readStored = (key: string): Amenity[] | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw) as { at: number; data: Amenity[] };
    return Date.now() - at < CACHE_TTL_MS ? data : null;
  } catch {
    return null;
  }
};

const writeStored = (key: string, data: Amenity[]) => {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
  }
};

export const fetchNearbyAmenities = (origin: LatLng): Promise<Amenity[]> => {
  const key = cacheKey(origin);
  const cached = memory.get(key);
  if (cached) return cached;

  const stored = readStored(key);
  if (stored) {
    const p = Promise.resolve(stored);
    memory.set(key, p);
    return p;
  }

  const request = fetchOverpassElements(origin, { timeoutMs: 75000, hedgeDelayMs: 10000 }).then((elements) => {
    const amenities = toAmenities(origin, elements);
    writeStored(key, amenities);
    return amenities;
  });

  memory.set(key, request);
  request.catch(() => memory.delete(key));
  return request;
};
