import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, Chip, ErrorView, Header, Input, Loading, Screen, SectionTitle, confirmAction } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { adminApplications, reviewAdminApplication, setRole } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/utils';
import { colors } from '@/theme';

/** Role changes are executed by SECURITY DEFINER functions; only a Super Admin can grant admin roles. */
export default function Roles() {
  const { role } = useAuth();
  const isSuper = role === 'super_admin';
  const apps = useAsync(adminApplications, [], isSuper);
  const [email, setEmail] = useState(''); const [r, setR] = useState('patient');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);

  const change = async () => {
    if (!(await confirmAction('Change role', `Set ${email} to "${r}"?`, 'Change', r !== 'patient' && r !== 'doctor'))) return;
    setBusy(true); setMsg(null);
    try { await setRole(email.trim(), r); setMsg({ t: 'success', m: 'Role updated.' }); setEmail(''); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  const review = async (id: string, ok: boolean) => {
    try { await reviewAdminApplication(id, ok); apps.reload(); setMsg({ t: 'success', m: ok ? 'Admin access granted.' : 'Application declined.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); }
  };

  return (
    <Screen keyboard>
      <Header title="Roles & Admin Access" />
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      <Card>
        <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 10 }}>Change a user's role</Text>
        <Input label="Registered email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          {['patient', 'assistant', ...(isSuper ? ['admin'] : [])].map((x) => <Chip key={x} label={x} active={r === x} onPress={() => setR(x)} />)}
        </View>
        <Button title="Apply role" onPress={change} loading={busy} disabled={!email.trim()} />
        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 8 }}>To make someone a doctor, use Doctors → Link login. You cannot change your own role.</Text>
      </Card>

      {isSuper && (
        <>
          <SectionTitle title="Pending admin applications" />
          {apps.loading && !apps.data ? <Loading /> : apps.error ? <ErrorView message={apps.error} onRetry={apps.reload} /> : (apps.data ?? []).length === 0 ? <Text style={{ color: colors.textMuted }}>No pending applications.</Text> : (apps.data ?? []).map((a: any) => (
            <Card key={a.id} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{a.profile?.full_name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.profile?.email}</Text>
              {a.message ? <Text style={{ color: colors.text, marginTop: 6 }}>{a.message}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Button title="Approve" variant="success" style={{ flex: 1, minHeight: 44 }} onPress={async () => { if (await confirmAction('Grant admin access', `Give ${a.profile?.full_name} full admin access?`, 'Grant')) review(a.id, true); }} />
                <Button title="Decline" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => review(a.id, false)} />
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
