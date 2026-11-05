export const errorText = (err: unknown): string => {
  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown; statusCode?: unknown; error?: unknown };
    const base = typeof e.message === 'string' && e.message ? e.message : typeof e.error === 'string' ? e.error : '';
    const extra = [e.code, e.statusCode, e.details, e.hint].filter((x) => x !== undefined && x !== null && x !== '').join(' · ');
    if (base) return extra ? `${base} (${extra})` : base;
  }
  return String(err);
};

export class StageError extends Error {
  stage: string;
  constructor(stage: string, cause: unknown) {
    super(errorText(cause));
    this.name = 'StageError';
    this.stage = stage;
  }
}
