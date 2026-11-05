import type { OverpassElement } from '../lib/overpass';
import raw from './pois.json';

export interface PoiSnapshot {
  version: 2;
  generatedAt: string;
  source: string;
  radiusM: number;
  properties: Record<string, OverpassElement[]>;
}

const snapshot = raw as unknown as Partial<PoiSnapshot>;

export const snapshotElements = (propertyId: string): OverpassElement[] | null =>
  snapshot.version === 2 ? snapshot.properties?.[propertyId] ?? null : null;
