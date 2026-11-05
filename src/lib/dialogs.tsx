import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type MainDialog = 'login' | 'account' | 'listing';
export type LegalDoc = 'privacy' | 'terms';

const HASH_TO_DOC: Record<string, LegalDoc> = { '#privacidade': 'privacy', '#termos': 'terms' };

interface DialogsState {
  main: MainDialog | null;
  legal: LegalDoc | null;
  openDialog: (name: MainDialog | LegalDoc) => void;
  closeMain: () => void;
  closeLegal: () => void;
}

const DialogsContext = createContext<DialogsState | null>(null);

const isLegal = (name: string): name is LegalDoc => name === 'privacy' || name === 'terms';

export const DialogsProvider = ({ children }: { children: ReactNode }) => {
  const [main, setMain] = useState<MainDialog | null>(null);
  const [legal, setLegal] = useState<LegalDoc | null>(() => HASH_TO_DOC[window.location.hash] ?? null);

  useEffect(() => {
    const onHash = () => {
      const doc = HASH_TO_DOC[window.location.hash];
      if (doc) setLegal(doc);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const value = useMemo<DialogsState>(
    () => ({
      main,
      legal,
      openDialog: (name) => (isLegal(name) ? setLegal(name) : setMain(name)),
      closeMain: () => setMain(null),
      closeLegal: () => {
        setLegal(null);
        if (HASH_TO_DOC[window.location.hash]) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      },
    }),
    [main, legal]
  );

  return <DialogsContext.Provider value={value}>{children}</DialogsContext.Provider>;
};

export const useDialogs = () => {
  const ctx = useContext(DialogsContext);
  if (!ctx) throw new Error('useDialogs precisa estar dentro de <DialogsProvider>.');
  return ctx;
};
