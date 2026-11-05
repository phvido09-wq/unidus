import { Users } from 'lucide-react';
import { Field, inputClass } from '../ui/Dialog';
import { ROUTINE_OPTIONS, VIBE_HINT } from '../../data/houseRoutine';
import type { HouseRoutine } from '../../types';

const Choice = <K extends keyof typeof ROUTINE_OPTIONS>({
  label,
  field,
  value,
  onChange,
}: {
  label: string;
  field: K;
  value: string;
  onChange: (v: HouseRoutine[K]) => void;
}) => (
  <div>
    <span className="block text-sm font-semibold text-[#112340] mb-1.5">{label}</span>
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {Object.entries(ROUTINE_OPTIONS[field]).map(([key, text]) => {
        const on = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(key as HouseRoutine[K])}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
              on ? 'bg-[#112340] text-white border-[#112340]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {text}
          </button>
        );
      })}
    </div>
  </div>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[#112340]" />
    {label}
  </label>
);

interface RoutineFieldsProps {
  value: HouseRoutine;
  onChange: (next: HouseRoutine) => void;
}

const RoutineFields = ({ value, onChange }: RoutineFieldsProps) => {
  const set = <K extends keyof HouseRoutine>(key: K, v: HouseRoutine[K]) => onChange({ ...value, [key]: v });

  return (
    <fieldset className="rounded-2xl border border-slate-200 p-4 space-y-4">
      <legend className="px-1 text-sm font-semibold text-[#112340] inline-flex items-center gap-1.5">
        <Users className="w-4 h-4" /> Rotina da casa
      </legend>
      <p className="text-xs text-slate-600 -mt-1">
        Ajuda quem procura a achar uma casa com o mesmo ritmo. Descreva <strong>a casa, não as pessoas</strong>: nada de nomes,
        cursos, idade ou outras informações dos moradores.
      </p>

      <div className="grid sm:grid-cols-[140px_1fr] gap-4 items-start">
        <Field label="Moradores hoje">
          <input
            type="number"
            min={1}
            max={30}
            required
            inputMode="numeric"
            value={value.residents}
            onChange={(e) => set('residents', Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Choice label="A casa é" field="gender" value={value.gender} onChange={(v) => set('gender', v)} />
      </div>

      <div>
        <Choice label="Clima da casa" field="vibe" value={value.vibe} onChange={(v) => set('vibe', v)} />
        <p className="text-xs text-slate-500 mt-1">{VIBE_HINT[value.vibe]}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 items-start">
        <Field label="Horário de silêncio" hint="Deixe em branco se não houver.">
          <input
            maxLength={40}
            value={value.quietHours}
            onChange={(e) => set('quietHours', e.target.value)}
            placeholder="Ex.: 22h às 7h"
            className={inputClass}
          />
        </Field>
        <div className="sm:pt-8">
          <Toggle label="Silêncio reforçado em semana de provas" checked={value.examWeekSilence} onChange={(v) => set('examWeekSilence', v)} />
        </div>
      </div>

      <Choice label="Festas em casa" field="parties" value={value.parties} onChange={(v) => set('parties', v)} />
      <Choice label="Visitas" field="visits" value={value.visits} onChange={(v) => set('visits', v)} />
      <Choice label="Limpeza" field="cleaning" value={value.cleaning} onChange={(v) => set('cleaning', v)} />
      <Choice label="Contas" field="bills" value={value.bills} onChange={(v) => set('bills', v)} />
      <Choice label="Fumar" field="smoking" value={value.smoking} onChange={(v) => set('smoking', v)} />
      <Toggle label="Tem ou aceita pets" checked={value.pets} onChange={(v) => set('pets', v)} />

      <Field label="Outros combinados (opcional)" hint={`${value.notes.length}/300 · Ex.: cozinha livre até 23h, mercado dividido no mês.`}>
        <textarea
          maxLength={300}
          rows={2}
          value={value.notes}
          onChange={(e) => set('notes', e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </Field>
    </fieldset>
  );
};

export default RoutineFields;
