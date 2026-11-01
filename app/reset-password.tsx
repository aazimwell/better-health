import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Banner, Button, Header, Input, Loading, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';
import { friendlyError } from '@/lib/utils';

/** Opened from the password-reset email link (betterhealth://reset-password#access_token=…). */
export default function ResetPassword() {
  const router = useRouter();
  const { updatePassword, signOut } = useAuth();
  const url = Linking.useURL();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!url) return;
      const frag = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
      const p = new URLSearchParams(frag);
      const access_token = p.get('access_token');
      const refresh_token = p.get('refresh_token');
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (!error) setReady(true);
      }
      setChecked(true);
    })();
  }, [url]);

  const submit = async () => {
    if (busy) return;
    if (pw.length < 8) return setErr('Use at least 8 characters.');
    if (pw !== pw2) return setErr('Passwords do not match.');
    setErr(''); setBusy(true);
    try {
      await updatePassword(pw);
      await signOut();
      router.replace('/(auth)/login');
    } catch (e) { setErr(friendlyError(e)); } finally { setBusy(false); }
  };

  return (
    <Screen keyboard>
      <Header title="Choose a new password" back={false} />
      {!checked ? <Loading /> : !ready ? (
        <>
          <Banner type="error" text="This reset link is invalid or has expired. Request a new one." />
          <Button title="Back to login" onPress={() => router.replace('/(auth)/login')} />
        </>
      ) : (
        <>
          <Text style={{ color: colors.textMuted, marginBottom: 16 }}>Enter a new password for your account.</Text>
          {err ? <Banner type="error" text={err} /> : null}
          <Input label="New password" icon="lock-closed-outline" secure value={pw} onChangeText={setPw} />
          <Input label="Confirm password" icon="lock-closed-outline" secure value={pw2} onChangeText={setPw2} />
          <Button title="Update password" onPress={submit} loading={busy} />
        </>
      )}
    </Screen>
  );
}
