import { useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, Home, Loader2, Lock, ShieldAlert } from 'lucide-react';
import Dialog, { ErrorNote, Field, inputClass, primaryButton, secondaryButton } from '../ui/Dialog';
import AuthGate, { friendlyError } from '../auth/AuthFlow';
import { CAMPUSES } from '../../data/properties';
import { createListing, type ListingAddress, type NewListing } from '../../lib/db';
import { lookupCep, maskCep, onlyDigits } from '../../lib/cep';
import { useAuth } from '../../lib/auth';
import type { PreparedMedia } from '../../lib/media';
import MediaPicker from './MediaPicker';
import RoutineFields from './RoutineFields';
import { EMPTY_ROUTINE } from '../../data/houseRoutine';
import { useDialogs } from '../../lib/dialogs';
import type { HouseRoutine, PropertyTag } from '../../types';

const TAGS: PropertyTag[] = ['Quarto individual', 'Quarto em república', 'Apartamento', 'Kitnet / Studio'];

const FEATURE_OPTIONS = [
  'Mobiliado',
  'Wi-Fi',
  'Contas inclusas',
  'Lavanderia',
  'Portaria 24h',
  'Aceita pets',
  'Vaga de garagem',
  'Bicicletário',
  'Mesa de estudos',
  'Perto do metrô/ônibus',
];

const CONTACT_IN_TEXT = /(\d[\s.-]?){8,}|@\w|\b[\w.+-]+@[\w-]+\.\w+/;

const EMPTY: NewListing = {
  tag: 'Quarto individual',
  title: '',
  room_type: '',
  campus_id: '',
  neighborhood: '',
  description: '',
  features: [],
  price: 0,
  estimated_bills: 0,
};

const EMPTY_ADDRESS: ListingAddress = { cep: '', street: '', number: '', complement: '', city: '', state: '' };

const ListingForm = ({ onDone }: { onDone: () => void }) => {
  const [form, setForm] = useState<NewListing>(EMPTY);
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { openDialog } = useDialogs();

  const set = <K extends keyof NewListing>(key: K, value: NewListing[K]) => setForm((f) => ({ ...f, [key]: value }));
  const { user } = useAuth();
  const [routine, setRoutine] = useState<HouseRoutine>(EMPTY_ROUTINE);
  const isRepublic = form.tag === 'Quarto em república';
  const [media, setMedia] = useState<PreparedMedia[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const [address, setAddress] = useState<ListingAddress>(EMPTY_ADDRESS);
  const [cepState, setCepState] = useState<'idle' | 'loading' | 'notfound' | 'offline'>('idle');
  const setAddr = <K extends keyof ListingAddress>(key: K, value: ListingAddress[K]) =>
    setAddress((a) => ({ ...a, [key]: value }));

  const onCepChange = async (value: string) => {
    const masked = maskCep(value);
    setAddr('cep', masked);
    if (onlyDigits(masked).length !== 8) {
      setCepState('idle');
      return;
    }
    setCepState('loading');
    try {
      const found = await lookupCep(masked);
      if (!found) {
        setCepState('notfound');
        return;
      }
      setCepState('idle');
      setAddress((a) => ({
        ...a,
        street: found.street || a.street,
        city: found.city || a.city,
        state: found.state || a.state,
      }));
      if (found.neighborhood) set('neighborhood', found.neighborhood);
    } catch {
      setCepState('offline');
    }
  };
  const toggleFeature = (f: string) =>
    set('features', form.features.includes(f) ? form.features.filter((x) => x !== f) : [...form.features, f]);

  const hasContactInText = CONTACT_IN_TEXT.test(`${form.title} ${form.description} ${isRepublic ? routine.notes : ''}`);

  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const chosenCampus = CAMPUSES.find((c) => c.id === form.campus_id);
  const campusMismatch =
    chosenCampus && address.city.trim() && norm(chosenCampus.city) !== norm(address.city)
      ? `Atenção: o ${chosenCampus.label} fica em ${chosenCampus.city}, e o imóvel em ${address.city}. Confira o campus.`
      : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (hasContactInText) {
      setError('Tire telefone, e-mail ou @ do texto. Os interessados falam com você pelo chat da UNIdus.');
      return;
    }
    if (!media.some((m) => m.kind === 'photo')) {
      setError('Adicione pelo menos uma foto do imóvel.');
      return;
    }
    if (!user) return;
    setSaving(true);
    setProgress(null);
    try {
      await createListing(
        user.id,
        {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          house_routine: isRepublic ? { ...routine, quietHours: routine.quietHours.trim(), notes: routine.notes.trim() } : null,
        },
        { ...address, cep: onlyDigits(address.cep) },
        media,
        (done, total) => setProgress({ done, total })
      );
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <span className="mx-auto mb-4 w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock className="w-7 h-7" />
        </span>
        <h3 className="font-bold text-lg text-[#112340] mb-1">Anúncio enviado para análise</h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6">
          Conferimos cada anúncio antes de publicar, para proteger quem procura moradia. Acompanhe o status em{' '}
          <strong>Minha conta → Meus anúncios</strong>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" className={secondaryButton} onClick={() => openDialog('account')}>
            Ver meus anúncios
          </button>
          <button type="button" className={primaryButton} onClick={onDone}>
            <CheckCircle2 className="w-4 h-4" /> Concluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Tipo de moradia">
          <select value={form.tag} onChange={(e) => set('tag', e.target.value as PropertyTag)} className={inputClass}>
            {TAGS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Campus mais próximo" error={campusMismatch}>
          <select required value={form.campus_id} onChange={(e) => set('campus_id', e.target.value)} className={inputClass}>
            <option value="" disabled>
              Selecione o campus
            </option>
            {CAMPUSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Título do anúncio">
        <input
          required
          minLength={5}
          maxLength={80}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Ex.: Quarto claro a 10 min da UNICAMP"
          className={inputClass}
        />
      </Field>

      <Field label="Composição" hint="Quartos e moradores.">
        <input
          required
          minLength={3}
          maxLength={80}
          value={form.room_type}
          onChange={(e) => set('room_type', e.target.value)}
          placeholder="Ex.: Quarto mobiliado · 3 moradores"
          className={inputClass}
        />
      </Field>

      {isRepublic && <RoutineFields value={routine} onChange={setRoutine} />}

      <fieldset className="rounded-2xl border border-slate-200 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold text-[#112340]">Endereço do imóvel</legend>
        <p className="flex items-start gap-2 text-xs text-slate-600 -mt-1">
          <Lock className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>
            <strong>Fica privado.</strong> No site aparecem só o bairro e um ponto aproximado no mapa. O endereço completo é
            visto apenas por você e pela moderação; para visitas, você o envia pelo chat a quem quiser.
          </span>
        </p>

        <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[180px_1fr] gap-4 items-start">
          <Field
            label="CEP"
            hint={cepState === 'loading' ? 'Buscando endereço…' : 'Preenche rua, bairro e cidade.'}
            error={
              cepState === 'notfound'
                ? 'CEP não encontrado. Confira ou preencha à mão.'
                : cepState === 'offline'
                  ? 'Não deu para consultar o CEP agora. Preencha à mão.'
                  : null
            }
          >
            <input
              required
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="\d{5}-?\d{3}"
              value={address.cep}
              onChange={(e) => onCepChange(e.target.value)}
              placeholder="00000-000"
              className={inputClass}
            />
          </Field>
          <div className="hidden sm:block" />
        </div>

        <div className="grid sm:grid-cols-[1fr_120px] gap-4">
          <Field label="Rua">
            <input
              required
              minLength={2}
              maxLength={120}
              autoComplete="address-line1"
              value={address.street}
              onChange={(e) => setAddr('street', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Número">
            <input
              required
              maxLength={10}
              value={address.number}
              onChange={(e) => setAddr('number', e.target.value)}
              placeholder="Ex.: 120"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Complemento (opcional)">
            <input
              maxLength={60}
              autoComplete="address-line2"
              value={address.complement}
              onChange={(e) => setAddr('complement', e.target.value)}
              placeholder="Ex.: apto 42, bloco B"
              className={inputClass}
            />
          </Field>
          <Field label="Bairro" hint="Este aparece no anúncio.">
            <input
              required
              minLength={2}
              maxLength={60}
              value={form.neighborhood}
              onChange={(e) => set('neighborhood', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-[1fr_90px] gap-4">
          <Field label="Cidade">
            <input
              required
              minLength={2}
              maxLength={60}
              autoComplete="address-level2"
              value={address.city}
              onChange={(e) => setAddr('city', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="UF">
            <input
              required
              minLength={2}
              maxLength={2}
              autoComplete="address-level1"
              value={address.state}
              onChange={(e) => setAddr('state', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              placeholder="SP"
              className={`${inputClass} uppercase`}
            />
          </Field>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Aluguel (R$/mês)">
          <input
            required
            type="number"
            min={100}
            max={20000}
            step={10}
            inputMode="numeric"
            value={form.price || ''}
            onChange={(e) => set('price', Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Contas estimadas (R$/mês)" hint="0 se estiverem inclusas.">
          <input
            required
            type="number"
            min={0}
            max={5000}
            step={10}
            inputMode="numeric"
            value={form.estimated_bills}
            onChange={(e) => set('estimated_bills', Number(e.target.value))}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Descrição"
        hint={`${form.description.length}/1500 · Conte a rotina da casa, regras e o que está incluso.`}
        error={hasContactInText ? 'Não inclua telefone, e-mail ou @: o contato acontece pelo chat da UNIdus.' : null}
      >
        <textarea
          required
          minLength={20}
          maxLength={1500}
          rows={5}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <fieldset>
        <legend className="text-sm font-semibold text-[#112340] mb-2">Diferenciais</legend>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => {
            const on = form.features.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                aria-pressed={on}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                  on ? 'bg-[#112340] text-white border-[#112340]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </fieldset>

      <MediaPicker value={media} onChange={setMedia} disabled={saving} />

      <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#204a87]" />
        <p>
          Não inclua dados de outras pessoas (nome de moradores, fotos com rostos, documentos). A moderação usa o endereço para
          conferir o imóvel e marcar um ponto aproximado no mapa. Fotos e vídeo ficam privados até o anúncio ser aprovado.
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={authorized}
          onChange={(e) => setAuthorized(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#112340]"
        />
        <span>Declaro que sou responsável por este imóvel ou tenho autorização para anunciá-lo, e que as informações são verdadeiras.</span>
      </label>

      {error && <ErrorNote>{error}</ErrorNote>}

      <button type="submit" disabled={saving || !authorized} className={`${primaryButton} w-full`}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Home className="w-4 h-4" />}
        {progress ? `Enviando arquivos… ${progress.done} de ${progress.total}` : saving ? 'Enviando…' : 'Enviar para análise'}
      </button>
    </form>
  );
};

const ListingDialog = ({ onClose }: { onClose: () => void }) => (
  <Dialog
    title="Anunciar moradia"
    subtitle="Grátis. Todo anúncio passa por análise antes de aparecer no site."
    icon={<Home className="w-5 h-5" />}
    onClose={onClose}
    size="lg"
  >
    <AuthGate intro={<p className="text-sm text-slate-600">Entre com seu e-mail para anunciar. Leva menos de um minuto.</p>}>
      <ListingForm onDone={onClose} />
    </AuthGate>
  </Dialog>
);

export default ListingDialog;
