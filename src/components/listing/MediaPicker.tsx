import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, ShieldCheck, Star, Trash2, Video } from 'lucide-react';
import {
  MAX_PHOTOS,
  MAX_VIDEOS,
  isImageFile,
  isVideoFile,
  preparePhoto,
  prepareVideo,
  type PreparedMedia,
} from '../../lib/media';

interface MediaPickerProps {
  value: PreparedMedia[];
  onChange: (next: PreparedMedia[]) => void;
  disabled?: boolean;
}

const MediaPicker = ({ value, onChange, disabled }: MediaPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => () => latest.current.forEach((m) => URL.revokeObjectURL(m.previewUrl)), []);

  const photos = value.filter((m) => m.kind === 'photo').length;
  const videos = value.filter((m) => m.kind === 'video').length;

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    const problems: string[] = [];
    let photoSlots = MAX_PHOTOS - photos;
    let videoSlots = MAX_VIDEOS - videos;
    const accepted: File[] = [];

    for (const f of list) {
      if (isVideoFile(f)) {
        if (videoSlots-- > 0) accepted.push(f);
        else problems.push(`Só é possível enviar ${MAX_VIDEOS} vídeo por anúncio ("${f.name}" ficou de fora).`);
      } else if (isImageFile(f)) {
        if (photoSlots-- > 0) accepted.push(f);
        else problems.push(`Limite de ${MAX_PHOTOS} fotos atingido ("${f.name}" ficou de fora).`);
      } else {
        problems.push(`"${f.name}" não é uma foto nem um vídeo.`);
      }
    }

    setProcessing((n) => n + accepted.length);
    const prepared: PreparedMedia[] = [];
    for (const f of accepted) {
      try {
        prepared.push(isVideoFile(f) ? await prepareVideo(f) : await preparePhoto(f));
      } catch (err) {
        problems.push(err instanceof Error ? err.message : `Não consegui processar "${f.name}".`);
      } finally {
        setProcessing((n) => n - 1);
      }
    }

    setErrors(problems);
    if (prepared.length) onChange([...latest.current, ...prepared]);
  };

  const remove = (id: string) => {
    const item = value.find((m) => m.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    onChange(value.filter((m) => m.id !== id));
  };

  const makeCover = (id: string) => {
    const item = value.find((m) => m.id === id);
    if (item) onChange([item, ...value.filter((m) => m.id !== id)]);
  };

  const coverId = value.find((m) => m.kind === 'photo')?.id;

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-semibold text-[#112340] mb-1">
        Fotos e vídeo <span className="font-normal text-slate-500">· pelo menos 1 foto</span>
      </legend>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {value.map((m) => (
          <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
            {m.kind === 'photo' ? (
              <img src={m.previewUrl} alt={m.name} className="w-full h-full object-cover" />
            ) : (
              <>
                <video src={m.previewUrl} muted playsInline preload="metadata" className="w-full h-full object-cover bg-black" />
                <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5">
                  <Video className="w-3 h-3" /> Vídeo
                </span>
              </>
            )}
            {m.id === coverId && (
              <span className="absolute top-1.5 left-1.5 rounded-full bg-amber-400 text-[#112340] text-[10px] font-bold px-2 py-0.5">
                Capa
              </span>
            )}
            <div className="absolute top-1.5 right-1.5 flex gap-1">
              {m.kind === 'photo' && m.id !== coverId && (
                <button
                  type="button"
                  onClick={() => makeCover(m.id)}
                  aria-label={`Usar ${m.name} como capa`}
                  title="Usar como capa"
                  className="w-7 h-7 rounded-full bg-white/90 text-[#112340] flex items-center justify-center shadow hover:bg-white"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label={`Remover ${m.name}`}
                title="Remover"
                className="w-7 h-7 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow hover:bg-white"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: processing }).map((_, i) => (
          <div key={`p${i}`} className="aspect-square rounded-xl shimmer animate-shimmer flex items-center justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" aria-label="Processando arquivo" />
          </div>
        ))}

        {(photos < MAX_PHOTOS || videos < MAX_VIDEOS) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 text-slate-500 flex flex-col items-center justify-center gap-1 text-xs font-medium hover:border-[#204a87] hover:text-[#204a87] hover:bg-[#e8f0fe]/40 transition"
          >
            <ImagePlus className="w-6 h-6" />
            Adicionar
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,.mov,.heic"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <p className="text-xs text-slate-500">
        {photos}/{MAX_PHOTOS} fotos · {videos}/{MAX_VIDEOS} vídeo (até 50 MB). A primeira foto é a capa.
      </p>

      {errors.length > 0 && (
        <ul role="alert" className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs px-4 py-3 space-y-1">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-2 text-xs text-slate-600 bg-emerald-50/60 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
        <span>
          Para proteger seu endereço, removemos a <strong>localização GPS</strong> e os demais dados ocultos dos arquivos antes do
          envio. Evite mostrar a fachada com o número, placas de rua, documentos ou o rosto de outras pessoas.
        </span>
      </p>
    </fieldset>
  );
};

export default MediaPicker;
