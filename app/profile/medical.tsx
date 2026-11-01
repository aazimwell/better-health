import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, ErrorView, Header, Input, Loading, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { getMedical, saveMedical } from '@/services/api';
import { friendlyError } from '@/lib/utils';
import { colors } from '@/theme';

export default function Medical() {
  const { profile } = useAuth();
  const { data, loading, error, reload } = useAsync(() => getMedical(profile!.id), [profile?.id], !!profile);
  const [f, setF] = useState({ existing_conditions: '', previous_treatments: '', allergies: '', medical_notes: '' });
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF({ existing_conditions: data.existing_conditions, previous_treatments: data.previous_treatments, allergies: data.allergies, medical_notes: data.medical_notes }); }, [data]);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    if (busy) return;
    setBusy(true); setMsg(null);
    try { await saveMedical(profile!.id, f); setMsg({ t: 'success', m: 'Medical history saved.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };

  return (
    <Screen keyboard>
      <Header title="Medical History" />
      <Text style={{ color: colors.textMuted, marginBottom: 14, fontSize: 12 }}>Private. Only you, the clinic admin and doctors treating you can see this.</Text>
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (
        <>
          {msg ? <Banner type={msg.t} text={msg.m} /> : null}
          <Input label="Existing conditions" multiline value={f.existing_conditions} onChangeText={set('existing_conditions')} />
          <Input label="Previous treatments" multiline value={f.previous_treatments} onChangeText={set('previous_treatments')} />
          <Input label="Allergies" multiline value={f.allergies} onChangeText={set('allergies')} />
          <Input label="Other medical notes" multiline value={f.medical_notes} onChangeText={set('medical_notes')} />
          <Button title="Save" onPress={save} loading={busy} />
        </>
      )}
    </Screen>
  );
}
