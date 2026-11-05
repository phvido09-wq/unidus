import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { amIAdmin, getMyProfile, type Profile } from './db';

interface AuthState {
  ready: boolean;
  user: User | null;
  profile: Profile | null | undefined;
  isAdmin: boolean;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(!supabase);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const user = session?.user ?? null;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(undefined);
      return;
    }
    try {
      setProfile(await getMyProfile(userId));
    } catch {
      setProfile(null);
    }
  }, [userId]);

  useEffect(() => {
    setProfile(undefined);
    refreshProfile();
  }, [refreshProfile]);

  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(false);
    if (userId) amIAdmin().then(setIsAdmin);
  }, [userId]);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) throw new Error('O login ainda não foi configurado neste site.');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}`, shouldCreateUser: true },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ ready, user, profile, isAdmin, sendMagicLink, signOut, refreshProfile }),
    [ready, user, profile, isAdmin, sendMagicLink, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
};
