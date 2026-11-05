import { useEffect, useRef, useState } from 'react';
import { Home } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}

const SmartImage = ({ src, alt, className = '', imgClassName = '', eager = false }: SmartImageProps) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setStatus('loaded');
  }, [src]);

  return (
    <div className={`overflow-hidden bg-slate-100 ${className}`}>
      {status === 'loading' && <div className="absolute inset-0 shimmer animate-shimmer" />}
      {status === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#e8f0fe] via-white to-[#f0ede5] text-[#112340]/50 animate-fade-in">
          <Home className="w-10 h-10" />
          <span className="text-xs font-semibold tracking-wide uppercase">Fotos em breve</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`w-full h-full object-cover transition-[opacity,transform] duration-700 ease-out-expo ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
};

export default SmartImage;
