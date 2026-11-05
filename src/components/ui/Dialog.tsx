import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DialogProps {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  layer?: 'base' | 'top';
}

const WIDTH = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

const openStack: string[] = [];

const Dialog = ({ title, subtitle, onClose, children, size = 'md', icon, layer = 'base' }: DialogProps) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openStack.push(titleId);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || openStack[openStack.length - 1] !== titleId) return;
      e.stopPropagation();
      onCloseRef.current();
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey, true);
    closeRef.current?.focus();
    return () => {
      openStack.splice(openStack.indexOf(titleId), 1);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [titleId]);

  return createPortal(
    <div className={`fixed inset-0 ${layer === 'top' ? 'z-[3100]' : 'z-[3000]'} flex items-end sm:items-center justify-center sm:p-4`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-[#112340]/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <div
        className={`relative w-full ${WIDTH[size]} bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-modal-in max-h-[92dvh] flex flex-col`}
      >
        <header className="flex items-start gap-3 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-slate-100">
          {icon && (
            <span className="w-10 h-10 rounded-xl bg-[#e8f0fe] text-[#112340] flex items-center justify-center flex-shrink-0">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1 pr-8">
            <h2 id={titleId} className="text-lg sm:text-xl font-bold text-[#112340] leading-tight">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-[#112340] flex items-center justify-center hover:bg-slate-200 hover:rotate-90 active:scale-90 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#204a87]"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Dialog;

export const Field = ({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) => (
  <label className="block">
    <span className="block text-sm font-semibold text-[#112340] mb-1.5">{label}</span>
    {children}
    {hint && !error && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
    {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
  </label>
);

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#112340] placeholder:text-slate-400 focus:outline-none focus:border-[#204a87] focus:ring-2 focus:ring-[#204a87]/20 transition disabled:bg-slate-50 disabled:text-slate-500';

export const primaryButton =
  'inline-flex items-center justify-center gap-2 bg-[#112340] text-white px-5 py-3 rounded-xl font-medium hover:bg-[#1a365d] active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none';

export const secondaryButton =
  'inline-flex items-center justify-center gap-2 border border-slate-200 text-[#112340] px-5 py-3 rounded-xl font-medium hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none';

export const ErrorNote = ({ children }: { children: ReactNode }) => (
  <p role="alert" className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3">
    {children}
  </p>
);
