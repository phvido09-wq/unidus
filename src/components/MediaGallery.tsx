import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import SmartImage from './SmartImage';

interface MediaGalleryProps {
  items: { kind: 'photo' | 'video'; url: string }[];
  alt: string;
  overlay?: ReactNode;
  className?: string;
}

const MediaGallery = ({ items, alt, overlay, className = '' }: MediaGalleryProps) => {
  const [index, setIndex] = useState(0);
  const current = items[Math.min(index, items.length - 1)];
  const go = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);

  return (
    <div className={className}>
      <div className="relative h-56 sm:h-72 lg:h-64 w-full bg-black">
        {current.kind === 'photo' ? (
          <>
            <SmartImage key={current.url} eager src={current.url} alt={`${alt} (${index + 1} de ${items.length})`} className="absolute inset-0" />
            {overlay}
          </>
        ) : (
          <video key={current.url} src={current.url} controls playsInline preload="metadata" className="absolute inset-0 w-full h-full object-contain">
            Seu navegador não reproduz este vídeo.
          </video>
        )}

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-[#112340] shadow flex items-center justify-center hover:bg-white active:scale-90 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próxima"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-[#112340] shadow flex items-center justify-center hover:bg-white active:scale-90 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="absolute top-4 right-16 sm:right-20 rounded-full bg-black/60 text-white text-xs font-semibold px-2.5 py-1">
              {index + 1}/{items.length}
            </span>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-7 pt-3">
          {items.map((m, i) => (
            <button
              key={m.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${m.kind === 'video' ? 'Vídeo' : 'Foto'} ${i + 1}`}
              aria-current={i === index}
              className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-slate-200 transition ${
                i === index ? 'ring-2 ring-[#204a87] ring-offset-1' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {m.kind === 'photo' ? (
                <img src={m.url} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <span className="absolute inset-0 bg-[#112340] text-white flex items-center justify-center">
                  <Play className="w-4 h-4" fill="currentColor" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
