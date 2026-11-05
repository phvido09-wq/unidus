import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, Inbox, Loader2, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getMyMessages, sendMessage, type MessageRow } from '../../lib/db';
import { friendlyError } from '../auth/AuthFlow';
import { ErrorNote, inputClass, primaryButton } from '../ui/Dialog';
import type { Property } from '../../types';

const SAFETY_TIP =
  'Nunca pague sinal ou envie documentos antes de visitar o imóvel e conferir o contrato. Combine a visita em horário e local seguros.';

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const Composer = ({
  listingId,
  recipientId,
  placeholder,
  onSent,
}: {
  listingId: string;
  recipientId: string;
  placeholder: string;
  onSent: () => void;
}) => {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    setSending(true);
    try {
      await sendMessage(listingId, recipientId, body);
      setBody('');
      onSent();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        required
        maxLength={2000}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} resize-y`}
      />
      {error && <ErrorNote>{error}</ErrorNote>}
      <button type="submit" disabled={sending || !body.trim()} className={`${primaryButton} w-full sm:w-auto`}>
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Enviar
      </button>
    </form>
  );
};

export const ContactAdvertiser = ({ property }: { property: Property }) => {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);

  if (property.source === 'demo' || !property.ownerId) {
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        Este é um <strong>anúncio ilustrativo</strong> da UNIdus: não existe um anunciante real para receber mensagens. Nos
        anúncios reais, a conversa acontece aqui mesmo.
      </p>
    );
  }

  if (user?.id === property.ownerId) {
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        Este anúncio é seu. As mensagens de interessados aparecem em <strong>Minha conta → Mensagens</strong>.
      </p>
    );
  }

  if (sent) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        <p>
          Mensagem enviada! A resposta do anunciante aparece em <strong>Minha conta → Mensagens</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        O anunciante verá seu <strong>nome</strong> e a sua mensagem. Seu e-mail continua privado.
      </p>
      <Composer
        listingId={property.id}
        recipientId={property.ownerId}
        placeholder="Olá! Tenho interesse no quarto. Ainda está disponível? Podemos combinar uma visita?"
        onSent={() => setSent(true)}
      />
      <p className="flex items-start gap-2 text-xs text-slate-500">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-500" /> {SAFETY_TIP}
      </p>
    </div>
  );
};

interface Conversation {
  key: string;
  listingId: string;
  listingTitle: string;
  otherId: string;
  otherName: string;
  messages: MessageRow[];
  last: MessageRow;
}

const groupConversations = (rows: MessageRow[], myId: string): Conversation[] => {
  const map = new Map<string, Conversation>();
  for (const m of rows) {
    const mine = m.sender_id === myId;
    const otherId = mine ? m.recipient_id : m.sender_id;
    const key = `${m.listing_id}:${otherId}`;
    const otherName = mine ? m.recipient_name : m.sender_name;
    const conv = map.get(key) ?? {
      key,
      listingId: m.listing_id,
      listingTitle: m.listing?.title ?? 'Anúncio removido',
      otherId,
      otherName: otherName || 'Usuário',
      messages: [],
      last: m,
    };
    conv.messages.push(m);
    conv.last = m;
    if (!mine && m.sender_name) conv.otherName = m.sender_name;
    map.set(key, conv);
  }
  return [...map.values()].sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
};

export const Conversations = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<MessageRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await getMyMessages());
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const conversations = useMemo(() => (rows && user ? groupConversations(rows, user.id) : []), [rows, user]);
  const open = conversations.find((c) => c.key === openKey);

  if (error) {
    return (
      <div className="space-y-3">
        <ErrorNote>{error}</ErrorNote>
        <button type="button" onClick={load} className="text-sm font-semibold text-[#204a87] inline-flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" /> Tentar de novo
        </button>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="flex justify-center py-10 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" aria-label="Carregando mensagens" />
      </div>
    );
  }

  if (open && user) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setOpenKey(null)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#204a87] hover:text-[#112340]"
        >
          <ArrowLeft className="w-4 h-4" /> Todas as conversas
        </button>
        <div>
          <p className="font-bold text-[#112340]">{open.otherName}</p>
          <p className="text-xs text-slate-500">Sobre: {open.listingTitle}</p>
        </div>
        <ol className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {open.messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                    mine ? 'bg-[#112340] text-white rounded-br-md' : 'bg-slate-100 text-[#112340] rounded-bl-md'
                  }`}
                >
                  {m.body}
                  <span className={`block text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-slate-400'}`}>
                    {formatWhen(m.created_at)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        {open.listingTitle !== 'Anúncio removido' && (
          <Composer listingId={open.listingId} recipientId={open.otherId} placeholder="Escreva sua resposta…" onSent={load} />
        )}
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-500" /> {SAFETY_TIP}
        </p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">Nenhuma conversa ainda.</p>
        <p className="text-xs mt-1">Abra um anúncio real e use “Falar com o anunciante”.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button type="button" onClick={load} className="text-xs font-semibold text-[#204a87] inline-flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {conversations.map((c) => (
          <li key={c.key}>
            <button
              type="button"
              onClick={() => setOpenKey(c.key)}
              className="w-full text-left py-3 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-[#112340] truncate">{c.otherName}</span>
                <span className="text-[11px] text-slate-400 flex-shrink-0">{formatWhen(c.last.created_at)}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">Sobre: {c.listingTitle}</p>
              <p className="text-sm text-slate-600 truncate mt-0.5">
                {c.last.sender_id === user?.id ? 'Você: ' : ''}
                {c.last.body}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
