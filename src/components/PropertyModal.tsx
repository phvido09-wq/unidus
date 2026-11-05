import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, GraduationCap, Heart, MapPin, MessageCircle, RefreshCw, X } from 'lucide-react';
import SmartImage from './SmartImage';
import MediaGallery from './MediaGallery';
import HouseRoutineSection from './HouseRoutineSection';
import type { Campus, Property } from '../types';
import { formatDistance, walkingMinutes } from '../lib/geo';
import { useNearbyAmenities } from '../lib/useNearbyAmenities';
import { AMENITY_META } from './amenityMeta';
import AuthGate from './auth/AuthFlow';
import { ContactAdvertiser } from './messages/Messages';

const PropertyMap = lazy(() => import('./PropertyMap'));

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

interface PropertyModalProps {
  property: Property;
  campus?: Campus;
  favorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}

const PropertyModal = ({ property, campus, favorite, onToggleFavorite, onClose }: PropertyModalProps) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const nearby = useNearbyAmenities(property);
  const [contactOpen, setContactOpen] = useState(false);
  const titleId = `property-modal-title-${property.id}`;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const total = property.price + property.estimatedBills;

  const photoOverlay = (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <span className="pointer-events-none absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#112340] shadow-sm">
        {property.tag}
      </span>
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center gap-1.5 text-white text-sm font-medium">
        <MapPin className="w-4 h-4" /> {property.neighborhood}
        {campus && <span className="opacity-80">· {campus.city}</span>}
      </div>
    </>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-[#112340]/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-6xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-modal-in max-h-[92dvh] sm:max-h-[90dvh] lg:h-[min(90dvh,760px)] flex flex-col">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[1100] w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-md text-[#112340] flex items-center justify-center hover:bg-white hover:rotate-90 active:scale-90 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204a87]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          <div className="lg:overflow-y-auto lg:border-r border-slate-100">
            {property.media && property.media.length > 0 ? (
              <MediaGallery items={property.media} alt={property.title} overlay={photoOverlay} />
            ) : (
              <div className="relative h-56 sm:h-72 lg:h-64 w-full">
                <SmartImage eager src={property.image} alt={property.title} className="absolute inset-0" />
                {photoOverlay}
              </div>
            )}

            <div className="p-5 sm:p-7">
              <p className="text-xs font-medium text-slate-500 mb-1">{property.type}</p>
              <h2 id={titleId} className="text-2xl sm:text-3xl font-bold text-[#112340] leading-tight mb-3">
                {property.title}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">{property.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {property.features.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> {f}
                  </span>
                ))}
              </div>

              <div className="bg-[#f7f7f5] rounded-2xl p-4 mb-6">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-2xl text-[#112340]">{brl(property.price)}</span>
                    <span className="text-sm text-slate-500 font-medium">/ mês</span>
                  </div>
                  {property.estimatedBills > 0 && (
                    <span className="text-sm text-slate-600">
                      Total estimado <strong className="text-[#112340]">{brl(total)}</strong>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {property.estimatedBills > 0
                    ? `+ ${brl(property.estimatedBills)} estimados em contas (luz, água, internet, gás).`
                    : 'Contas inclusas (confirme com o anunciante).'}
                </p>
              </div>

              {campus && (
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </span>
                  <p className="text-sm text-slate-600">
                    <strong className="text-[#112340]">{formatDistance(property.distanceKm)}</strong> da {campus.label}
                    <span className="text-slate-400"> · ~{walkingMinutes(property.distanceKm)} min a pé</span>
                  </p>
                </div>
              )}

              {property.houseRoutine && <HouseRoutineSection routine={property.houseRoutine} />}

              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="text-xs font-bold tracking-widest uppercase text-[#112340]">No entorno</h3>
                <span className="text-[11px] text-slate-400">Fonte: OpenStreetMap</span>
              </div>

              {nearby.savedForEveryone && (
                <p className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium px-3 py-2">
                  <Check className="w-4 h-4" /> Moderação: pontos salvos. Agora aparecem na hora para todos os visitantes.
                </p>
              )}

              {nearby.status === 'loading' && (
                <p className="text-xs text-slate-500 mb-1">Buscando no OpenStreetMap… pode levar até 1 minuto.</p>
              )}
              {nearby.status === 'loading' && (
                <ul className="divide-y divide-slate-100 mb-6" aria-busy="true" aria-label="Carregando pontos próximos">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="flex items-center gap-3 py-2.5">
                      <span className="w-8 h-8 rounded-full shimmer animate-shimmer flex-shrink-0" />
                      <span className="flex-1 h-3.5 rounded shimmer animate-shimmer" />
                      <span className="w-12 h-3.5 rounded shimmer animate-shimmer" />
                    </li>
                  ))}
                </ul>
              )}

              {nearby.status === 'error' && (
                <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  <span>O serviço de mapas (OpenStreetMap) está lento agora. Tente de novo em alguns minutos.</span>
                  <button
                    type="button"
                    onClick={nearby.retry}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 font-semibold text-[#204a87] hover:text-[#112340]"
                  >
                    <RefreshCw className="w-4 h-4" /> Tentar de novo
                  </button>
                </div>
              )}

              {nearby.status === 'ready' && nearby.amenities.length === 0 && (
                <p className="mb-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  Nenhuma academia, mercado, conveniência ou unidade de saúde cadastrada no OpenStreetMap num raio de
                  1,5 km. Vale conferir o bairro pessoalmente.
                </p>
              )}

              {nearby.status === 'ready' && nearby.amenities.length > 0 && (
                <ul className="divide-y divide-slate-100 mb-6">
                  {nearby.amenities.map((am) => {
                    const { Icon, color, label } = AMENITY_META[am.type];
                    return (
                      <li key={am.osmUrl ?? `${am.type}-${am.name}`}>
                        <a
                          href={am.osmUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group/poi flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#112340] truncate group-hover/poi:text-[#204a87]">
                              {am.name}
                            </p>
                            <p className="text-xs text-slate-500">{label}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-[#112340]">{formatDistance(am.distanceKm)}</p>
                            <p className="text-xs text-slate-400">~{walkingMinutes(am.distanceKm)} min</p>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setContactOpen((v) => !v)}
                  aria-expanded={contactOpen}
                  aria-controls={`${titleId}-contact`}
                  className="flex-1 bg-[#112340] text-white px-5 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#1a365d] active:scale-[0.98] transition-all"
                >
                  <MessageCircle className="w-4 h-4" /> Falar com o anunciante
                </button>
                <button
                  type="button"
                  onClick={onToggleFavorite}
                  aria-pressed={favorite}
                  className={`px-5 py-3 rounded-xl font-medium border flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    favorite ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 text-[#112340] hover:bg-slate-50'
                  }`}
                >
                  <Heart key={favorite ? 'on' : 'off'} className={`w-4 h-4 ${favorite ? 'animate-pop' : ''}`} fill={favorite ? 'currentColor' : 'none'} />
                  {favorite ? 'Salvo' : 'Salvar'}
                </button>
              </div>

              {contactOpen && (
                <section id={`${titleId}-contact`} className="mt-4 rounded-2xl border border-slate-200 p-4 animate-fade-up">
                  <h3 className="font-bold text-[#112340] mb-3">Falar com o anunciante</h3>
                  {property.source === 'demo' ? (
                    <ContactAdvertiser property={property} />
                  ) : (
                    <AuthGate
                      intro={
                        <p className="text-sm text-slate-600">
                          Entre com seu e-mail para mandar mensagem. O anunciante verá só seu nome, nunca seu e-mail.
                        </p>
                      }
                    >
                      <ContactAdvertiser property={property} />
                    </AuthGate>
                  )}
                </section>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:pt-16 h-[440px] sm:h-[480px] lg:h-full bg-white">
            <Suspense fallback={<div className="h-full rounded-2xl shimmer animate-shimmer" />}>
              <PropertyMap
                property={property}
                campus={campus}
                amenities={nearby.amenities}
                loadingAmenities={nearby.status === 'loading'}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PropertyModal;
