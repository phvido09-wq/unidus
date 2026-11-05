import type { LatLng } from '../types';

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export const haversineKm = ([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};

export const formatDistance = (km: number): string =>
  km < 1
    ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`
    : `${km.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;

export const walkingMinutes = (km: number): number => Math.max(1, Math.round(((km * 1.3) / 4.8) * 60));

export const midpoint = ([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): LatLng => [(lat1 + lat2) / 2, (lng1 + lng2) / 2];

export const boundsCenteredOn = (center: LatLng, points: LatLng[]): LatLng[] => [
  center,
  ...points,
  ...points.map(([lat, lng]): LatLng => [2 * center[0] - lat, 2 * center[1] - lng]),
];
