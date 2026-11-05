import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useDialogs } from '../../lib/dialogs';
import { isSupabaseConfigured } from '../../lib/supabase';
import { createProfile } from '../../lib/db';
import { StageError, errorText } from '../../lib/errors';
import { ErrorNote, Field, inputClass, primaryButton } from '../ui/Dialog';

export const friendlyError = (err: unknown): string => {
  const msg = errorText(err);
  console.error('[UNIdus]', err);
  if (/rate limit|security purposes|only request this after/i.test(msg))
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if (/invalid email|unable to validate email/i.test(msg)) return 'Esse e-mail não parece válido.';
  if (/failed to fetch|network|load failed/i.test(msg)) return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  if (/exceeded the maximum allowed size|payload too large|413/i.test(msg))
    return 'Um dos arquivos passou do tamanho máximo permitido (50 MB).';
  const stage = err instanceof StageError ? `${err.stage}: ` : '';
  return `Algo deu errado. ${stage ? `Falhou ao ${stage}` : ''}Detalhe técnico: ${msg}`;
};

const LegalLink = ({ to, children }: { to: 'privacy' | 'terms'; children: ReactNode }) => {
  const { openDialog } = useDialogs();
  return (
    <button type="button" onClick={() => openDialog(to)} className="font-semibold text-[#204a87] underline underline-offset-2">
      {children}
    </button>
  );
};

const EmailStep = ({ intro }: { intro?: ReactNode }) => {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setState('sending');
    try {
      await sendMagicLink(email);
      setState('sent');
    } catch (err) {
      setError(friendlyError(err));
      setState('idle');
    }
  };

  if (state === 'sent') {
    return (
      <div className="text-center py-4">
        <span className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Mail className="w-7 h-7" />
        </span>
        <h3 className="font-bold text-lg text-[#112340] mb-1">Confira seu e-mail</h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          Enviamos um link de acesso para <strong className="text-[#112340]">{email}</strong>. Abra o link{' '}
          <strong>neste mesmo navegador</strong> para entrar. Não chegou? Olhe a caixa de spam.
        </p>
        <button type="button" onClick={() => setState('idle')} className="mt-5 text-sm font-semibold text-[#204a87] hover:underline">
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {intro}
      <Field label="Seu e-mail" hint="Sem senha: você recebe um link de acesso a cada login.">
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          className={inputClass}
        />
      </Field>
      {error && <ErrorNote>{error}</ErrorNote>}
      <button type="submit" disabled={state === 'sending'} className={`${primaryButton} w-full`}>
        {state === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        Enviar link de acesso
      </button>
      <p className="text-xs text-slate-500 leading-relaxed">
        Usamos seu e-mail só para o login e avisos sobre a sua conta. Ele nunca é mostrado a outros usuários. Saiba mais na{' '}
        <LegalLink to="privacy">Política de Privacidade</LegalLink>.
      </p>
    </form>
  );
};

const ProfileStep = () => {
  const { user, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState('');
  const [adult, setAdult] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      await createProfile(user.id, name);
      await refreshProfile();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-600">
        Falta pouco. Entrou como <strong className="text-[#112340]">{user?.email}</strong>.
      </p>
      <Field label="Como quer ser chamado(a)?" hint="Aparece para anunciantes e interessados com quem você conversar.">
        <input
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Ana Souza"
          className={inputClass}
        />
      </Field>

      <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" required checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#112340]" />
        <span>Tenho 18 anos ou mais.</span>
      </label>
      <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#112340]"
        />
        <span>
          Li e aceito os <LegalLink to="terms">Termos de Uso</LegalLink> e a{' '}
          <LegalLink to="privacy">Política de Privacidade</LegalLink>.
        </span>
      </label>

      <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 leading-relaxed">
        Ainda não tem 18 anos? Você pode navegar e comparar moradias à vontade, sem conta. Para fechar aluguel e criar conta,
        conte com seu responsável.
      </p>

      {error && <ErrorNote>{error}</ErrorNote>}
      <button type="submit" disabled={saving || !adult || !accepted} className={`${primaryButton} w-full`}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Criar minha conta
      </button>
      <button type="button" onClick={signOut} className="w-full text-sm text-slate-500 hover:text-[#112340]">
        Cancelar e sair
      </button>
    </form>
  );
};

interface AuthGateProps {
  children: ReactNode;
  intro?: ReactNode;
}

const AuthGate = ({ children, intro }: AuthGateProps) => {
  const { ready, user, profile } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
          Contas, anúncios e mensagens ainda não foram ativados neste site. Enquanto isso, você pode navegar e comparar
          moradias normalmente.
        </p>
      </div>
    );
  }

  if (!ready || (user && profile === undefined)) {
    return (
      <div className="flex justify-center py-10 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" aria-label="Carregando" />
      </div>
    );
  }

  if (!user) return <EmailStep intro={intro} />;
  if (!profile) return <ProfileStep />;
  return <>{children}</>;
};

export default AuthGate;
