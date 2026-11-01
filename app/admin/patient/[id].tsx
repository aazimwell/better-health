import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Banner, Button, Card, ErrorView, Header, Input, Loading, Screen, SectionTitle, StatusBadge, confirmAction } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { addPatientNote, getMedical, getPatient, listAppointments, patientNotes, setPatientActive } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { friendlyError, fmtTime, timeAgo } from '@/lib/utils';
import { colors } from '@/theme';

export default function PatientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile: me } = useAuth();
  const prof = useAsync(async () => { const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single(); if (error) throw error; return data as any; }, [id]);
  const pat = useAsync(() => getPatient(id), [id]);
  const med = useAsync(() => getMedical(id), [id]);
  const appts = useAsync(async () => (await listAppointments({ limit: 100 })).filter((a) => a.patient_id === id), [id]);
  const notes = useAsync(() => patientNotes(id), [id]);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (prof.loading && !prof.data) return <Screen scroll={false}><Loading /></Screen>;
  if (prof.error || !prof.data) return <Screen><Header title="Patient" /><ErrorView message={prof.error ?? 'Not found'} onRetry={prof.reload} /></Screen>;
  const p = prof.data; const d = pat.data;

  const toggle = async (v: boolean) => {
    if (!v && !(await confirmAction('Deactivate patient', 'This patient will no longer be able to log in or book appointments.', 'Deactivate'))) return;
    try { await setPatientActive(id, v); prof.reload(); setMsg({ t: 'success', m: v ? 'Patient activated.' : 'Patient deactivated.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); }
  };
  const addNote = async () => {
    if (busy || !note.trim()) return;
    setBusy(true);
    try { await addPatientNote(id, me!.id, note.trim()); setNote(''); notes.reload(); setMsg({ t: 'success', m: 'Note added.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  const L = ({ k, v }: { k: string; v?: string | null }) => !v ? null : (
    <View style={{ paddingVertical: 5 }}><Text style={{ color: colors.textMuted, fontSize: 11 }}>{k}</Text><Text style={{ color: colors.text, fontWeight: '600' }}>{v}</Text></View>
  );

  return (
    <Screen keyboard>
      <Header title="Patient Profile" />
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar path={p.avatar_url} name={p.full_name} size={64} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontWeight: '800', fontSize: 17, color: colors.text }}>{p.full_name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{p.email}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{p.phone}</Text>
        </View>
      </Card>
      <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: colors.text }}>Account active</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>Inactive patients cannot log in</Text></View>
        <Switch value={p.is_active} onValueChange={toggle} trackColor={{ true: colors.primary, false: '#CBD5E1' }} />
      </Card>

      <SectionTitle title="Details" />
      <Card>
        <L k="Date of birth" v={d?.date_of_birth} /><L k="Gender" v={d?.gender} /><L k="Address" v={d?.address} />
        <L k="Emergency contact" v={d?.emergency_contact_name ? `${d.emergency_contact_name} ${d.emergency_contact_phone ?? ''}` : null} />
        <L k="Insurance" v={d?.insurance_provider ? `${d.insurance_provider} ${d.insurance_number ?? ''}` : null} />
        <L k="Registered" v={new Date(p.created_at).toLocaleDateString()} />
      </Card>

      <SectionTitle title="Medical history" />
      <Card>
        {med.data ? (<><L k="Conditions" v={med.data.existing_conditions} /><L k="Previous treatments" v={med.data.previous_treatments} /><L k="Allergies" v={med.data.allergies} /><L k="Notes" v={med.data.medical_notes} />
          {!med.data.existing_conditions && !med.data.previous_treatments && !med.data.allergies && !med.data.medical_notes && <Text style={{ color: colors.textMuted }}>Nothing recorded.</Text>}</>) : <Text style={{ color: colors.textMuted }}>Not available.</Text>}
      </Card>

      <SectionTitle title="Appointment history" />
      {(appts.data ?? []).length === 0 ? <Card><Text style={{ color: colors.textMuted }}>No appointments.</Text></Card> : (appts.data ?? []).map((a) => (
        <Card key={a.id} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: a.id } })}>
          <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: colors.text }}>{a.service?.name}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.appointment_date} · {fmtTime(a.start_time)}</Text></View>
          <StatusBadge status={a.status} />
        </Card>
      ))}

      <SectionTitle title="Internal notes (staff only)" />
      <Input multiline value={note} onChangeText={setNote} placeholder="Add an administrative note…" />
      <Button title="Add note" variant="outline" onPress={addNote} loading={busy} disabled={!note.trim()} />
      {(notes.data ?? []).map((n: any) => (
        <Card key={n.id} style={{ marginTop: 8 }}><Text style={{ color: colors.text }}>{n.note}</Text><Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>{timeAgo(n.created_at)}</Text></Card>
      ))}
    </Screen>
  );
}
