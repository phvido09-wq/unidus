export const MAX_PHOTOS = 10;
export const MAX_VIDEOS = 1;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_PHOTO_INPUT_BYTES = 30 * 1024 * 1024;
const MAX_PHOTO_SIDE = 1920;

export type MediaKind = 'photo' | 'video';

export interface PreparedMedia {
  id: string;
  kind: MediaKind;
  blob: Blob;
  ext: string;
  contentType: string;
  previewUrl: string;
  name: string;
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export const isVideoFile = (f: File) => f.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(f.name);
export const isImageFile = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name);

export const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export const preparePhoto = async (file: File): Promise<PreparedMedia> => {
  if (file.size > MAX_PHOTO_INPUT_BYTES) throw new Error(`"${file.name}" é muito grande (máx. 30 MB).`);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(
      `Não consegui abrir "${file.name}". Use JPG, PNG ou WebP (fotos HEIC do iPhone: em Ajustes → Câmera → Formatos, escolha "Mais compatível").`
    );
  }

  const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, 'image/webp', 0.82);
  let ext = 'webp';
  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
    ext = 'jpg';
  }
  if (!blob) throw new Error(`Não consegui processar "${file.name}".`);

  return {
    id: uid(),
    kind: 'photo',
    blob,
    ext,
    contentType: blob.type,
    previewUrl: URL.createObjectURL(blob),
    name: file.name,
  };
};

const CONTAINERS = new Set(['moov', 'udta', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf', 'meta', 'ilst', 'mvex', 'moof', 'traf']);
const LOCATION_BOXES = new Set(['©xyz', 'loci', 'XMP_']);
const XMP_UUID = 'be7acfcb97a942e89c71999491e3afac';

const fourcc = (v: DataView, p: number) =>
  String.fromCharCode(v.getUint8(p), v.getUint8(p + 1), v.getUint8(p + 2), v.getUint8(p + 3));

const neutralize = (bytes: Uint8Array, start: number, size: number, header: number) => {
  bytes.set([0x66, 0x72, 0x65, 0x65], start + 4);
  bytes.fill(0, start + header, start + size);
};

export const scrubMp4Location = (buffer: ArrayBuffer): number => {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let removed = 0;
  const locationKeyIdx = new Set<number>();

  const walk = (start: number, end: number, depth: number, parent: string) => {
    let p = start;
    while (p + 8 <= end) {
      let size = view.getUint32(p);
      const type = fourcc(view, p + 4);
      let header = 8;
      if (size === 1) {
        if (p + 16 > end) return;
        size = Number(view.getBigUint64(p + 8));
        header = 16;
      } else if (size === 0) {
        size = end - p;
      }
      if (size < header || p + size > end) return;

      if (LOCATION_BOXES.has(type)) {
        neutralize(bytes, p, size, header);
        removed++;
      } else if (type === 'uuid' && size >= header + 16) {
        let hex = '';
        for (let i = 0; i < 16; i++) hex += bytes[p + header + i].toString(16).padStart(2, '0');
        if (hex === XMP_UUID) {
          neutralize(bytes, p, size, header);
          removed++;
        }
      } else if (type === 'keys' && parent === 'meta') {
        let q = p + header + 8;
        let idx = 1;
        while (q + 8 <= p + size) {
          const entrySize = view.getUint32(q);
          if (entrySize < 8 || q + entrySize > p + size) break;
          let name = '';
          for (let i = q + 8; i < q + entrySize; i++) name += String.fromCharCode(bytes[i]);
          if (/location/i.test(name)) locationKeyIdx.add(idx);
          q += entrySize;
          idx++;
        }
      } else if (parent === 'ilst' && locationKeyIdx.has(view.getUint32(p + 4))) {
        neutralize(bytes, p, size, header);
        removed++;
      } else if (CONTAINERS.has(type) && depth < 12) {
        let childStart = p + header;
        if (type === 'meta' && childStart + 8 <= p + size && fourcc(view, childStart + 4) !== 'hdlr') childStart += 4;
        walk(childStart, p + size, depth + 1, type);
      }
      p += size;
    }
  };

  walk(0, buffer.byteLength, 0, '');
  return removed;
};

export const prepareVideo = async (file: File): Promise<PreparedMedia> => {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`O vídeo "${file.name}" tem ${formatBytes(file.size)}. O máximo é 50 MB: grave um vídeo mais curto ou em resolução menor.`);
  }
  const isWebm = /webm/i.test(file.type) || /\.webm$/i.test(file.name);
  const isMov = /quicktime/i.test(file.type) || /\.mov$/i.test(file.name);
  const contentType = isWebm ? 'video/webm' : isMov ? 'video/quicktime' : 'video/mp4';
  const ext = isWebm ? 'webm' : isMov ? 'mov' : 'mp4';

  let blob: Blob = file;
  if (!isWebm) {
    const buffer = await file.arrayBuffer();
    scrubMp4Location(buffer);
    blob = new Blob([buffer], { type: contentType });
  }

  return {
    id: uid(),
    kind: 'video',
    blob,
    ext,
    contentType,
    previewUrl: URL.createObjectURL(blob),
    name: file.name,
  };
};
