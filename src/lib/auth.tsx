import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase, isConfigured } from './supabase';
import type { Profile, Role } from './types';
import { friendlyError } from './utils';

interface AuthCtx {
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string, opts?: { adminOnly?: boolean }) => Promise<void>;
  signUp: (a: { fullName: string; email: string; phone: string; password: string }) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export const isAdminRole = (r?: Role | null) => r === 'admin' || r === 'super_admin';

/** Where each role lands after login. */
export function homeFor(role: Role | null): string {
  switch (role) {
    case 'patient': return '/(patient)/home';
    case 'admin':
    case 'super_admin': return '/(admin)/dashboard';
    case 'doctor': return '/(doctor)/today';
    case 'assistant': return '/(assistant)/today';
    default: return '/(auth)/welcome';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Role is ALWAYS read from the database (profiles.role) — never from client input.
  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) { setProfile(null); return; }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (error) throw error;
    if (data && !data.is_active) {
      await supabase.auth.signOut();
      setProfile(null);
      throw new Error('This account has been deactivated. Please contact the clinic.');
    }
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    let live = true;
    if (!isConfigured) { setLoading(false); return; }
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!live) return;
        setSession(data.session);
        try { await loadProfile(data.session?.user.id); } catch { /* handled on login screen */ }
      })
      .catch(() => {})
      .finally(() => live && setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (event === 'SIGNED_OUT') { setProfile(null); return; }
      // defer: never call supabase inside the callback synchronously
      setTimeout(() => { loadProfile(sess?.user.id).catch(() => {}); }, 0);
    });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signIn: AuthCtx['signIn'] = async (email, password, opts) => {
    if (!isConfigured) throw new Error('Supabase is not configured yet. Add your keys to .env (see README).');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw new Error(friendlyError(error));
    const { data: prof, error: pErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    if (pErr || !prof) { await supabase.auth.signOut(); throw new Error('Could not load your profile. Please try again.'); }
    if (!prof.is_active) { await supabase.auth.signOut(); throw new Error('This account has been deactivated. Please contact the clinic.'); }
    if (opts?.adminOnly && !isAdminRole(prof.role)) {
      await supabase.auth.signOut();
      throw new Error('This account does not have admin access.');
    }
    setProfile(prof as Profile);
  };

  const signUp: AuthCtx['signUp'] = async ({ fullName, email, phone, password }) => {
    if (!isConfigured) throw new Error('Supabase is not configured yet. Add your keys to .env (see README).');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      // metadata is informational only; the DB trigger always creates role = patient
      options: { data: { full_name: fullName.trim(), phone: phone.trim(), terms_accepted: 'true' } },
    });
    if (error) throw new Error(friendlyError(error));
    return { needsConfirmation: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: Linking.createURL('reset-password'),
    });
    if (error) throw new Error(friendlyError(error));
  };
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(friendlyError(error));
  };

  const value = useMemo<AuthCtx>(() => ({
    session, profile, role: profile?.role ?? null, loading, configured: isConfigured,
    signIn, signUp, signOut, resetPassword, updatePassword,
    refreshProfile: () => loadProfile(session?.user.id),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [session, profile, loading, loadProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
