import { BookOpen, Cigarette, Moon, PartyPopper, PawPrint, Receipt, Sparkles, UserPlus, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { ROUTINE_OPTIONS, VIBE_HINT } from '../data/houseRoutine';
import type { HouseRoutine } from '../types';

const VIBE_STYLE: Record<HouseRoutine['vibe'], string> = {
  tranquila: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  equilibrada: 'bg-[#e8f0fe] text-[#112340] border-[#d6e4fb]',
  agitada: 'bg-amber-50 text-amber-800 border-amber-100',
};

const Item = ({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) => (
  <div className="flex items-start gap-2.5">
    <span className="w-8 h-8 rounded-lg bg-slate-100 text-[#112340] flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4" />
    </span>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{label}</p>
      <p className="text-sm font-medium text-[#112340]">{value}</p>
    </div>
  </div>
);

const HouseRoutineSection = ({ routine }: { routine: HouseRoutine }) => (
  <section className="mb-6">
    <h3 className="text-xs font-bold tracking-widest uppercase text-[#112340] mb-3">Rotina da casa</h3>

    <div className={`rounded-xl border px-4 py-3 mb-4 ${VIBE_STYLE[routine.vibe]}`}>
      <p className="text-sm font-bold">
        Casa {ROUTINE_OPTIONS.vibe[routine.vibe].toLowerCase()} · {routine.residents}{' '}
        {routine.residents === 1 ? 'morador' : 'moradores'} · {ROUTINE_OPTIONS.gender[routine.gender].toLowerCase()}
      </p>
      <p className="text-xs opacity-80">{VIBE_HINT[routine.vibe]}</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
      <Item icon={Moon} label="Silêncio" value={routine.quietHours.trim() || 'Sem horário combinado'} />
      <Item icon={BookOpen} label="Semana de provas" value={routine.examWeekSilence ? 'Silêncio reforçado' : 'Rotina normal'} />
      <Item icon={PartyPopper} label="Festas" value={ROUTINE_OPTIONS.parties[routine.parties]} />
      <Item icon={UserPlus} label="Visitas" value={ROUTINE_OPTIONS.visits[routine.visits]} />
      <Item icon={Sparkles} label="Limpeza" value={ROUTINE_OPTIONS.cleaning[routine.cleaning]} />
      <Item icon={Receipt} label="Contas" value={ROUTINE_OPTIONS.bills[routine.bills]} />
      <Item icon={Cigarette} label="Fumar" value={ROUTINE_OPTIONS.smoking[routine.smoking]} />
      <Item icon={PawPrint} label="Pets" value={routine.pets ? 'Tem ou aceita' : 'Não'} />
    </div>

    {routine.notes.trim() && (
      <p className="mt-3 flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
        <Users className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
        <span className="whitespace-pre-wrap break-words">{routine.notes}</span>
      </p>
    )}
    <p className="mt-2 text-[11px] text-slate-400">Informado pelo anunciante. Confirme na visita e converse com os moradores.</p>
  </section>
);

export default HouseRoutineSection;
