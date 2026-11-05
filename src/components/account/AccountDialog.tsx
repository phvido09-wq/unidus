import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Download, Home, Loader2, Lock, LogOut, MessageCircle, Plus, Trash2, User } from 'lucide-react';
import Dialog, { ErrorNote, Field, inputClass, primaryButton, secondaryButton } from '../ui/Dialog';
import AuthGate, { friendlyError } from '../auth/AuthFlow';
import { Conversations } from '../messages/Messages';
import { useAuth } from '../../lib/auth';
import { useDialogs } from '../../lib/dialogs';
import { campusById } from '../../data/properties';
import {
  deleteListing,
  deleteMyAccount,
  exportMyData,
  formatAddress,
  getMyListings,
  updateProfileName,
  type ListingStatus,
  type MyListingRow,
} from '../../lib/db';

type Tab = 'listings' | 'messages' | 'data';

const STATUS: Record<ListingStatus, { label: string; className: string }> = {
  pending: { label: 'Em análise', className: 'bg-amber-100 text-amber-800' },
  published: { label: 'Publicado', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Não aprovado', className: 'bg-slate-200 text-slate-700' },
};

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`;

const mediaSummary = (media: MyListingRow['media']) => {
  const photos = media.filter((m) => m.kind === 'photo').length;
  const videos = media.length - photos;
  const parts = [`${photos} ${photos === 1 ? 'foto' : 'fotos'}`];
  if (videos) parts.push(`${videos} vídeo`);
  return parts.join(' · ');
};

const MyListings = () => {
  const { user } = useAuth();
  const { openDialog } = useDialogs();
  const [rows, setRows] = useState<MyListingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setRows(await getMyListings(user.id));
    } catch (err) {
      setError(friendlyError(err));
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (row: MyListingRow) => {
    if (!window.confirm(`Excluir o anúncio "${row.title}"? Fotos, vídeo e conversas sobre ele também serão apagados.`)) return;
    setBusyId(row.id);
    try {
      await deleteListing(row);
      await load();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!rows) {
    return (
      <div className="flex justify-center py-10 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" aria-label="Carregando anúncios" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">Você ainda não tem anúncios.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS[r.status].className}`}>
                    {STATUS[r.status].label}
                  </span>
                  <span className="text-xs text-slate-500">{r.tag}</span>
                </div>
                <p className="font-semibold text-[#112340] truncate">{r.title}</p>
                <p className="text-xs text-slate-500">
                  {r.neighborhood} · {campusById(r.campus_id)?.label} · {brl(r.price)}/mês
                </p>
                <p className="text-xs text-slate-500">{mediaSummary(r.media)}</p>
                {r.address && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500" title="Visível só para você e para a moderação">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-px text-emerald-600" />
                    <span>{formatAddress(r.address)}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(r)}
                disabled={busyId === r.id}
                aria-label={`Excluir anúncio ${r.title}`}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
              >
                {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => openDialog('listing')} className={`${secondaryButton} w-full`}>
        <Plus className="w-4 h-4" /> Novo anúncio
      </button>
    </div>
  );
};

const MyData = ({ onDeleted }: { onDeleted: () => void }) => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { openDialog } = useDialogs();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !profile) return null;

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateProfileName(user.id, name);
      await refreshProfile();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    setError(null);
    setExporting(true);
    try {
      const data = await exportMyData(user.id, user.email);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unidus-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setExporting(false);
    }
  };

  const removeAccount = async () => {
    setError(null);
    setDeleting(true);
    try {
      await deleteMyAccount(user.id);
      await signOut();
      onDeleted();
    } catch (err) {
      setError(friendlyError(err));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorNote>{error}</ErrorNote>}

      <section className="space-y-3">
        <h3 className="text-xs font-bold tracking-widest uppercase text-[#112340]">O que guardamos sobre você</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-slate-500">E-mail</dt>
          <dd className="text-[#112340] break-all">{user.email}</dd>
          <dt className="text-slate-500">Conta criada</dt>
          <dd className="text-[#112340]">{new Date(profile.created_at).toLocaleDateString('pt-BR')}</dd>
          <dt className="text-slate-500">Termos aceitos</dt>
          <dd className="text-[#112340]">
            versão {profile.terms_version}, em {new Date(profile.accepted_at).toLocaleDateString('pt-BR')}
          </dd>
        </dl>
        <p className="text-xs text-slate-500">
          Além disso: seus anúncios e mensagens. Detalhes na{' '}
          <button type="button" onClick={() => openDialog('privacy')} className="font-semibold text-[#204a87] underline">
            Política de Privacidade
          </button>
          .
        </p>
      </section>

      <form onSubmit={saveName} className="space-y-3">
        <Field label="Nome de exibição">
          <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <button type="submit" disabled={saving || name.trim() === profile.full_name} className={secondaryButton}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saved ? 'Salvo!' : 'Salvar nome'}
        </button>
      </form>

      <section className="space-y-2">
        <h3 className="text-xs font-bold tracking-widest uppercase text-[#112340]">Baixar meus dados</h3>
        <p className="text-sm text-slate-600">Um arquivo JSON com sua conta, perfil, anúncios e mensagens.</p>
        <button type="button" onClick={download} disabled={exporting} className={secondaryButton}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Baixar arquivo
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-red-100 bg-red-50/50 p-4">
        <h3 className="text-xs font-bold tracking-widest uppercase text-red-700">Excluir minha conta</h3>
        <p className="text-sm text-slate-700">
          Apaga <strong>de forma permanente</strong> sua conta, perfil, anúncios (com endereços, fotos e vídeos) e todas as
          conversas (inclusive as mensagens que outras pessoas trocaram com você). Não dá para desfazer.
        </p>
        <Field label='Digite "EXCLUIR" para confirmar'>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={inputClass} autoComplete="off" />
        </Field>
        <button
          type="button"
          onClick={removeAccount}
          disabled={confirmText.trim().toUpperCase() !== 'EXCLUIR' || deleting}
          className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:pointer-events-none"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Excluir conta definitivamente
        </button>
      </section>
    </div>
  );
};

const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'listings', label: 'Meus anúncios', Icon: Home },
  { id: 'messages', label: 'Mensagens', Icon: MessageCircle },
  { id: 'data', label: 'Meus dados', Icon: User },
];

const AccountContent = ({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) => {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('listings');

  return (
    <div>
      <div role="tablist" className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              tab === id ? 'bg-white text-[#112340] shadow-sm' : 'text-slate-500 hover:text-[#112340]'
            }`}
          >
            <Icon className="w-4 h-4 hidden sm:block" /> {label}
          </button>
        ))}
      </div>

      {tab === 'listings' && <MyListings />}
      {tab === 'messages' && <Conversations />}
      {tab === 'data' && <MyData onDeleted={onDeleted} />}

      <button
        type="button"
        onClick={async () => {
          await signOut();
          onClose();
        }}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-[#112340]"
      >
        <LogOut className="w-4 h-4" /> Sair
      </button>
    </div>
  );
};

const AccountDialog = ({ onClose }: { onClose: () => void }) => {
  const { profile } = useAuth();
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return (
      <Dialog title="Conta excluída" icon={<User className="w-5 h-5" />} onClose={onClose} size="sm">
        <div className="text-center py-2">
          <p className="text-sm text-slate-600 mb-5">Seus dados foram apagados. Obrigado por ter usado a UNIdus.</p>
          <button type="button" onClick={onClose} className={primaryButton}>
            Fechar
          </button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title={profile ? `Olá, ${profile.full_name.split(' ')[0]}` : 'Entrar na UNIdus'}
      subtitle={profile ? 'Sua conta' : 'Para anunciar e conversar com anunciantes.'}
      icon={<User className="w-5 h-5" />}
      onClose={onClose}
      size="md"
    >
      <AuthGate>
        <AccountContent onClose={onClose} onDeleted={() => setDeleted(true)} />
      </AuthGate>
    </Dialog>
  );
};

export default AccountDialog;
