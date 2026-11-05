import type { HouseRoutine } from '../types';

export const ROUTINE_OPTIONS = {
  gender: { mista: 'Mista', feminina: 'Feminina', masculina: 'Masculina' },
  vibe: { tranquila: 'Tranquila', equilibrada: 'Equilibrada', agitada: 'Agitada' },
  parties: { nunca: 'Não rolam', 'as-vezes': 'De vez em quando', frequentes: 'Frequentes' },
  visits: { livres: 'Livres', avisar: 'Avisando a casa', 'sem-pernoite': 'Sem pernoite' },
  cleaning: { escala: 'Escala entre moradores', diarista: 'Diarista', 'cada-um': 'Cada um cuida do seu' },
  bills: { igual: 'Divididas igualmente', 'por-quarto': 'Proporcional ao quarto', inclusas: 'Inclusas no aluguel' },
  smoking: { nao: 'Não', 'area-externa': 'Só na área externa', sim: 'Sim' },
} as const satisfies { [K in keyof HouseRoutine]?: Record<string, string> };

export const VIBE_HINT: Record<HouseRoutine['vibe'], string> = {
  tranquila: 'Casa silenciosa, foco nos estudos',
  equilibrada: 'Estudo durante a semana, convívio no fim de semana',
  agitada: 'Casa movimentada, bastante convívio',
};

export const EMPTY_ROUTINE: HouseRoutine = {
  residents: 4,
  gender: 'mista',
  vibe: 'equilibrada',
  quietHours: '22h às 7h',
  examWeekSilence: true,
  parties: 'as-vezes',
  visits: 'avisar',
  cleaning: 'escala',
  bills: 'igual',
  smoking: 'area-externa',
  pets: false,
  notes: '',
};

export const parseRoutine = (raw: unknown): HouseRoutine | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Partial<Record<keyof HouseRoutine, unknown>>;
  const pick = <K extends keyof typeof ROUTINE_OPTIONS>(key: K): HouseRoutine[K] =>
    (typeof r[key] === 'string' && (r[key] as string) in ROUTINE_OPTIONS[key]
      ? r[key]
      : EMPTY_ROUTINE[key]) as HouseRoutine[K];
  return {
    residents: typeof r.residents === 'number' && r.residents >= 1 && r.residents <= 30 ? Math.round(r.residents) : EMPTY_ROUTINE.residents,
    gender: pick('gender'),
    vibe: pick('vibe'),
    quietHours: typeof r.quietHours === 'string' ? r.quietHours.slice(0, 40) : '',
    examWeekSilence: r.examWeekSilence === true,
    parties: pick('parties'),
    visits: pick('visits'),
    cleaning: pick('cleaning'),
    bills: pick('bills'),
    smoking: pick('smoking'),
    pets: r.pets === true,
    notes: typeof r.notes === 'string' ? r.notes.slice(0, 300) : '',
  };
};
