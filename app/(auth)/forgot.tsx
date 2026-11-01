import React, { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Header, Input, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';
import { friendlyError, isEmail } from '@/lib/utils';

export default function Forgot() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!isEmail(email)) return setErr('Enter a valid email address.');
    setErr(''); setBusy(true);
    try { await resetPassword(email); setSent(true); }
    catch (e) { setErr(friendlyError(e)); } finally { setBusy(false); }
  };

  return (
    <Screen keyboard>
      <Header title="Reset Password" />
      <Text style={{ color: colors.textMuted, marginBottom: 18 }}>
        Enter your account email. We will send you a link to choose a new password.
      </Text>
      {err ? <Banner type="error" text={err} /> : null}
      {sent ? <Banner type="success" text="If an account exists for that email, a reset link is on its way. Check your inbox." /> : null}
      <Input label="Email" icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Button title={sent ? 'Send again' : 'Send reset link'} onPress={submit} loading={busy} />
    </Screen>
  );
}
