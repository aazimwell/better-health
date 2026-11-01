import React, { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Banner, Button, Header, Input, Screen } from '@/components/ui';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/supabase';
import { colors } from '@/theme';
import { friendlyError, isEmail } from '@/lib/utils';

/** Sign in with your normal account, then submit an application. A Super Admin must approve it. */
export default function AdminApply() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!isEmail(email) || !password) return setErr('Enter the email and password of your registered account.');
    setErr(''); setBusy(true);
    try {
      // Throw-away client (no persistence) so the app's own session/redirects are not affected.
      const tmp = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error } = await tmp.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      const { error: rpcErr } = await tmp.rpc('apply_for_admin', { p_message: msg });
      await tmp.auth.signOut();
      if (rpcErr) throw rpcErr;
      setDone(true);
    } catch (e) { setErr(friendlyError(e)); } finally { setBusy(false); }
  };

  return (
    <Screen keyboard>
      <Header title="Apply for Admin Access" />
      {done ? (
        <>
          <Banner type="success" text="Application submitted. A Super Admin will review it. You will be able to use Admin Login once approved." />
          <Button title="Back to start" onPress={() => router.replace('/(auth)/welcome')} />
        </>
      ) : (
        <>
          <Text style={{ color: colors.textMuted, marginBottom: 16 }}>Your application does not grant any access until a Super Admin approves it.</Text>
          {err ? <Banner type="error" text={err} /> : null}
          <Input label="Account email" icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Input label="Password" icon="lock-closed-outline" secure value={password} onChangeText={setPassword} />
          <Input label="Why do you need admin access?" multiline value={msg} onChangeText={setMsg} placeholder="Role at the clinic, reason…" />
          <Button title="Submit application" onPress={submit} loading={busy} />
        </>
      )}
    </Screen>
  );
}
