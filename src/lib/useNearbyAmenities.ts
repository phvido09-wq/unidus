import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Amenity, Property } from '../types';
import { fetchNearbyAmenities, toAmenities } from './overpass';
import { snapshotElements } from '../data/poiSnapshot';
import { useAuth } from './auth';
import { saveListingPois } from './db';

export type NearbyStatus = 'loading' | 'ready' | 'error';

export const useNearbyAmenities = (property: Property) => {
  const { id, coords, source, storedAmenities } = property;
  const [lat, lng] = coords;
  const { isAdmin } = useAuth();

  const ready = useMemo(() => {
    if (storedAmenities) return storedAmenities;
    const elements = source === 'demo' ? snapshotElements(id) : null;
    return elements ? toAmenities([lat, lng], elements) : null;
  }, [id, source, storedAmenities, lat, lng]);

  const [attempt, setAttempt] = useState(0);
  const [live, setLive] = useState<{ status: NearbyStatus; amenities: Amenity[] }>({ status: 'loading', amenities: [] });
  const [savedForEveryone, setSavedForEveryone] = useState(false);

  useEffect(() => {
    if (ready) return;
    let active = true;
    setLive({ status: 'loading', amenities: [] });
    fetchNearbyAmenities([lat, lng])
      .then(async (amenities) => {
        if (!active) return;
        setLive({ status: 'ready', amenities });
        if (isAdmin && source === 'live') {
          try {
            await saveListingPois(id, amenities);
            if (active) setSavedForEveryone(true);
          } catch (err) {
            console.error('[UNIdus] não foi possível salvar os pontos próximos', err);
          }
        }
      })
      .catch(() => active && setLive({ status: 'error', amenities: [] }));
    return () => {
      active = false;
    };
  }, [ready, id, source, isAdmin, lat, lng, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return ready
    ? { status: 'ready' as NearbyStatus, amenities: ready, retry, savedForEveryone: false }
    : { ...live, retry, savedForEveryone };
};
