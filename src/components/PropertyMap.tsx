import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GraduationCap, Home, type LucideProps } from 'lucide-react';
import type { Amenity, AmenityType, Campus, LatLng, Property } from '../types';
import { boundsCenteredOn, formatDistance, midpoint, walkingMinutes } from '../lib/geo';
import { AMENITY_META, AMENITY_ORDER } from './amenityMeta';

const NAVY = '#112340';
const AMBER = '#f59e0b';

const svg = (Icon: ComponentType<LucideProps>, size: number) =>
  renderToStaticMarkup(<Icon size={size} color="#fff" strokeWidth={2.25} aria-hidden />);

const teardropIcon = (Icon: ComponentType<LucideProps>, color: string, size: number) =>
  L.divIcon({
    className: 'unidus-pin',
    html: `<div class="unidus-pin__drop" style="--pin:${color};width:${size}px;height:${size}px">
             <span class="unidus-pin__glyph">${svg(Icon, Math.round(size * 0.46))}</span>
           </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size * 1.2],
    popupAnchor: [0, -size * 1.15],
  });

const dotIcon = (type: AmenityType) => {
  const { Icon, color } = AMENITY_META[type];
  return L.divIcon({
    className: 'unidus-pin',
    html: `<div class="unidus-dot" style="--pin:${color}">${svg(Icon, 14)}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const distanceLabelIcon = (text: string) =>
  L.divIcon({
    className: 'unidus-pin',
    html: `<div class="unidus-distance">${text}</div>`,
    iconSize: [0, 0],
  });

const HOME_ICON = teardropIcon(Home, NAVY, 44);
const CAMPUS_ICON = teardropIcon(GraduationCap, AMBER, 38);
const AMENITY_ICONS = Object.fromEntries(AMENITY_ORDER.map((t) => [t, dotIcon(t)])) as Record<AmenityType, L.DivIcon>;

const FitToProperty = ({ points }: { points: LatLng[] }) => {
  const map = useMap();

  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36], animate: false });
    };
    fit();
    const t = window.setTimeout(fit, 350);
    const ro = new ResizeObserver(() => fit());
    ro.observe(map.getContainer());
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [map, points]);

  return null;
};

interface PropertyMapProps {
  property: Property;
  campus?: Campus;
  amenities: Amenity[];
  loadingAmenities: boolean;
}

const PropertyMap = ({ property, campus, amenities, loadingAmenities }: PropertyMapProps) => {
  const [hidden, setHidden] = useState<Set<AmenityType>>(new Set());

  const toggle = (type: AmenityType) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  const fitPoints = useMemo(
    () =>
      boundsCenteredOn(property.coords, [
        ...(campus ? [campus.coords] : []),
        ...amenities.map((am) => am.coords),
      ]),
    [property, campus, amenities]
  );

  const presentTypes = AMENITY_ORDER.filter((t) => amenities.some((am) => am.type === t));
  const distanceText = formatDistance(property.distanceKm);
  const distanceLabel = useMemo(() => distanceLabelIcon(`${distanceText} até o campus`), [distanceText]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 isolate">
        <MapContainer
          center={property.coords}
          zoom={15}
          scrollWheelZoom
          className="absolute inset-0 h-full w-full"
          attributionControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToProperty points={fitPoints} />

          {campus && (
            <>
              <Polyline
                positions={[property.coords, campus.coords]}
                pathOptions={{ color: NAVY, weight: 3, opacity: 0.7, dashArray: '6 8', lineCap: 'round' }}
              />
              <Marker
                position={midpoint(property.coords, campus.coords)}
                icon={distanceLabel}
                interactive={false}
                keyboard={false}
                zIndexOffset={500}
              />
              <Marker position={campus.coords} icon={CAMPUS_ICON} zIndexOffset={800} title={campus.label}>
                <Popup>
                  <strong>{campus.label}</strong>
                  <br />
                  {distanceText} em linha reta · ~{walkingMinutes(property.distanceKm)} min a pé
                </Popup>
              </Marker>
            </>
          )}

          {amenities
            .filter((am) => !hidden.has(am.type))
            .map((am) => (
              <Marker key={am.osmUrl ?? `${am.type}-${am.name}`} position={am.coords} icon={AMENITY_ICONS[am.type]} title={am.name}>
                <Popup>
                  <strong>{am.name}</strong>
                  <br />
                  {AMENITY_META[am.type].label} · {formatDistance(am.distanceKm)} · ~{walkingMinutes(am.distanceKm)} min a pé
                  {am.osmUrl && (
                    <>
                      <br />
                      <a href={am.osmUrl} target="_blank" rel="noreferrer">
                        Ver no OpenStreetMap
                      </a>
                    </>
                  )}
                </Popup>
              </Marker>
            ))}

          <Marker position={property.coords} icon={HOME_ICON} zIndexOffset={1000} title={property.title}>
            <Popup>
              <strong>{property.title}</strong>
              <br />
              {property.neighborhood}
            </Popup>
          </Marker>
        </MapContainer>

        {campus && (
          <div className="pointer-events-none absolute top-3 left-3 z-[500] bg-white/95 backdrop-blur rounded-xl shadow-lg px-3.5 py-2.5 flex items-center gap-3 max-w-[calc(100%-1.5rem)]">
            <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">{campus.label}</p>
              <p className="text-sm font-bold text-[#112340]">
                {distanceText} <span className="font-medium text-slate-500">· ~{walkingMinutes(property.distanceKm)} min a pé</span>
              </p>
            </div>
          </div>
        )}

        {loadingAmenities && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] bg-white/95 backdrop-blur rounded-full shadow-md px-3.5 py-1.5 text-xs font-medium text-slate-600 flex items-center gap-2 whitespace-nowrap">
            <span className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-[#204a87] animate-spin" />
            Buscando pontos reais por perto… (até 1 min)
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#112340] text-white">
          <Home className="w-3.5 h-3.5" /> Moradia
        </span>
        {campus && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-100 text-amber-800">
            <GraduationCap className="w-3.5 h-3.5" /> Universidade
          </span>
        )}
        {presentTypes.map((type) => {
          const { label, color, Icon } = AMENITY_META[type];
          const off = hidden.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              aria-pressed={!off}
              title={off ? `Mostrar ${label.toLowerCase()}` : `Ocultar ${label.toLowerCase()}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${
                off ? 'border-slate-200 text-slate-400 bg-white line-through' : 'border-transparent text-slate-700 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: off ? '#cbd5e1' : color }}
              >
                <Icon className="w-2.5 h-2.5" strokeWidth={2.75} />
              </span>
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Pontos de interesse: dados reais do OpenStreetMap (mapa colaborativo, pode estar incompleto). Distâncias em
        linha reta; o trajeto pelas ruas costuma ser maior.
      </p>
    </div>
  );
};

export default PropertyMap;
