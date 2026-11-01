import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Banner, Button, Card, EmptyState, ErrorView, FormModal, Header, Input, Loading, Screen, confirmAction } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { listStaff, setRole, updateAssistant } from '@/services/api';
import { friendlyError } from '@/lib/utils';
import { colors } from '@/theme';

const PERMS = [
  { k: 'view_appointments', t: 'View appointments & schedules' },
  { k: 'manage_appointments', t: 'Reschedule, cancel & comment' },
  { k: 'view_patients', t: 'View patient profiles' },
  { k: 'notify_patients', t: 'Notify patients' },
];

export default function Assistants() {
  const { data, loading, error, reload } = useAsync(() => listStaff('assistant'), []);
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);

  const add = async () => {
    setBusy(true); setMsg(null);
    try { await setRole(email.trim(), 'assistant'); setOpen(false); setEmail(''); reload(); setMsg({ t: 'success', m: 'Assistant created. Adjust permissions below.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  const patch = async (id: string, p: any) => {
    try { await updateAssistant(id, p); reload(); } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); }
  };

  return (
    <Screen>
      <Header title="Assistants" />
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      <Button title="Add assistant" icon="add" onPress={() => setOpen(true)} style={{ marginBottom: 14 }} />
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (data ?? []).length === 0 ? (
        <EmptyState kind="people" title="No assistants" message="Add a registered user as an assistant." />
      ) : (data ?? []).map((a: any) => (
        <Card key={a.id} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}><Text style={{ fontWeight: '800', color: colors.text }}>{a.profile?.full_name}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.profile?.email}</Text></View>
            <Text style={{ marginRight: 8, color: colors.textMuted, fontSize: 12 }}>{a.is_active ? 'Active' : 'Off'}</Text>
            <Switch value={a.is_active} trackColor={{ true: colors.primary, false: '#CBD5E1' }}
              onValueChange={async (v) => { if (v || await confirmAction('Deactivate assistant', 'They will lose access immediately.', 'Deactivate')) patch(a.id, { is_active: v }); }} />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
          {PERMS.map((p) => (
            <View key={p.k} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ flex: 1, color: colors.text, fontSize: 13 }}>{p.t}</Text>
              <Switch value={!!a.permissions?.[p.k]} trackColor={{ true: colors.primary, false: '#CBD5E1' }}
                onValueChange={(v) => patch(a.id, { permissions: { ...a.permissions, [p.k]: v } })} />
            </View>
          ))}
        </Card>
      ))}
      <FormModal visible={open} title="Add assistant" onClose={() => setOpen(false)}>
        <Text style={{ color: colors.textMuted, marginBottom: 10 }}>The person must first register in the app with this email.</Text>
        <Input label="Registered email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Button title="Make assistant" onPress={add} loading={busy} disabled={!email.trim()} />
      </FormModal>
    </Screen>
  );
}
