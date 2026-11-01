import React, { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Banner, Button, Card, ErrorView, FormModal, Header, Input, Loading, Screen, SectionTitle, confirmAction } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { addBlockedTime, addSchedule, deleteBlockedTime, deleteSchedule, getDoctor, getSchedules, listBlockedTimes, listAppointments, saveDoctor, setRole } from '@/services/api';
import { pickCompressedImage, publicUrl, uploadImage } from '@/services/storage';
import { WEEKDAYS, fmtRange, friendlyError, fmtTime } from '@/lib/utils';
import { colors, radius } from '@/theme';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Admin: create/edit a doctor, photo, weekly schedule, blocked time, login account. Also used by doctors for their own record via RLS. */
export default function AdminDoctor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';
  const [docId, setDocId] = useState(isNew ? '' : id);
  const doc = useAsync(() => getDoctor(docId), [docId], !!docId);
  const sch = useAsync(() => getSchedules(docId), [docId], !!docId);
  const blocked = useAsync(() => listBlockedTimes(docId), [docId], !!docId);
  const hist = useAsync(async () => (await listAppointments({ doctorId: docId, limit: 10 })), [docId], !!docId);

  const [f, setF] = useState({ full_name: '', designation: '', bio: '', qualifications: '', university: '', specializations: '', experience_years: '0', consultation_fee: '0', is_active: true });
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [modal, setModal] = useState<null | 'sched' | 'block' | 'login'>(null);
  const [wd, setWd] = useState(1); const [st, setSt] = useState('09:00'); const [en, setEn] = useState('17:00'); const [sl, setSl] = useState('30');
  const [bDate, setBDate] = useState(''); const [bSt, setBSt] = useState('09:00'); const [bEn, setBEn] = useState('17:00'); const [bWhy, setBWhy] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const d = doc.data; if (!d) return;
    setPhoto(d.photo_url);
    setF({ full_name: d.full_name, designation: d.designation, bio: d.bio, qualifications: d.qualifications, university: d.university, specializations: d.specializations.join(', '), experience_years: String(d.experience_years), consultation_fee: String(d.consultation_fee), is_active: d.is_active });
  }, [doc.data]);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const note = (t: 'error' | 'success', m: string) => setMsg({ t, m });

  const save = async () => {
    if (busy) return;
    if (f.full_name.trim().length < 3) return note('error', 'Enter the doctor’s full name.');
    const exp = parseInt(f.experience_years, 10), fee = parseFloat(f.consultation_fee);
    if (isNaN(exp) || exp < 0 || isNaN(fee) || fee < 0) return note('error', 'Experience and fee must be valid numbers.');
    setBusy(true); setMsg(null);
    try {
      const newId = await saveDoctor({
        id: docId || undefined, full_name: f.full_name.trim(), designation: f.designation.trim(), bio: f.bio.trim(), qualifications: f.qualifications.trim(),
        university: f.university.trim(), specializations: f.specializations.split(',').map((x) => x.trim()).filter(Boolean), experience_years: exp, consultation_fee: fee, is_active: f.is_active,
      });
      if (!docId) { setDocId(newId); note('success', 'Doctor created. Now set a weekly schedule below so patients can book.'); }
      else { note('success', 'Doctor saved.'); doc.reload(); }
    } catch (e) { note('error', friendlyError(e)); } finally { setBusy(false); }
  };

  const changePhoto = async () => {
    if (!docId) return note('error', 'Save the doctor first, then upload a photo.');
    try {
      const uri = await pickCompressedImage(800); if (!uri) return;
      setBusy(true);
      const path = `${docId}/photo.jpg`;
      await uploadImage('doctor-photos', path, uri);
      const url = publicUrl('doctor-photos', path);
      await saveDoctor({ id: docId, full_name: f.full_name, photo_url: url });
      setPhoto(url); note('success', 'Photo uploaded.');
    } catch (e) { note('error', friendlyError(e)); } finally { setBusy(false); }
  };

  const addSched = async () => {
    if (!TIME.test(st) || !TIME.test(en) || en <= st) return note('error', 'Use 24-hour times like 09:00 and 17:00 (end after start).');
    const mins = parseInt(sl, 10); if (isNaN(mins) || mins < 10 || mins > 240) return note('error', 'Slot length must be 10–240 minutes.');
    setBusy(true);
    try { await addSchedule({ doctor_id: docId, weekday: wd, start_time: st, end_time: en, slot_minutes: mins }); setModal(null); sch.reload(); note('success', 'Schedule added.'); }
    catch (e) { note('error', /duplicate|unique/i.test(String((e as any)?.message)) ? 'That start time already exists for this day.' : friendlyError(e)); } finally { setBusy(false); }
  };
  const addBlock = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bDate) || !TIME.test(bSt) || !TIME.test(bEn) || bEn <= bSt) return note('error', 'Enter date as YYYY-MM-DD and valid times.');
    setBusy(true);
    try { await addBlockedTime({ doctor_id: docId, slot_date: bDate, start_time: bSt, end_time: bEn, reason: bWhy.trim() || undefined }); setModal(null); blocked.reload(); note('success', 'Time blocked.'); }
    catch (e) { note('error', friendlyError(e)); } finally { setBusy(false); }
  };
  const linkLogin = async () => {
    setBusy(true);
    try { await setRole(email.trim(), 'doctor', docId); setModal(null); doc.reload(); note('success', 'Login linked. The person now signs in with their normal account and lands on the Doctor dashboard.'); }
    catch (e) { note('error', friendlyError(e)); } finally { setBusy(false); }
  };

  const byDay = (w: number) => (sch.data ?? []).filter((x) => x.weekday === w);

  return (
    <Screen keyboard>
      <Header title={docId ? 'Edit Doctor' : 'New Doctor'} />
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      <View style={{ alignItems: 'center', marginBottom: 14 }}>
        <Avatar url={photo} seed={docId || 'new'} name={f.full_name} size={92} />
        <Pressable onPress={changePhoto} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Ionicons name="camera-outline" size={18} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 6 }}>Upload photo</Text>
        </Pressable>
      </View>
      {doc.loading && !!docId && !doc.data ? <Loading /> : doc.error ? <ErrorView message={doc.error} onRetry={doc.reload} /> : (
        <>
          <Input label="Full name" value={f.full_name} onChangeText={set('full_name')} />
          <Input label="Designation" placeholder="e.g. Senior Physiotherapist" value={f.designation} onChangeText={set('designation')} />
          <Input label="Biography" multiline value={f.bio} onChangeText={set('bio')} />
          <Input label="Qualifications" value={f.qualifications} onChangeText={set('qualifications')} />
          <Input label="University" value={f.university} onChangeText={set('university')} />
          <Input label="Specializations (comma separated)" value={f.specializations} onChangeText={set('specializations')} />
          <Input label="Years of experience" keyboardType="number-pad" value={f.experience_years} onChangeText={set('experience_years')} />
          <Input label="Consultation fee (৳)" keyboardType="decimal-pad" value={f.consultation_fee} onChangeText={set('consultation_fee')} />
          <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: colors.text }}>Active</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>Only active doctors can be booked</Text></View>
            <Switch value={f.is_active} onValueChange={(v) => setF((x) => ({ ...x, is_active: v }))} trackColor={{ true: colors.primary, false: '#CBD5E1' }} />
          </Card>
          <Button title={docId ? 'Save doctor' : 'Create doctor'} onPress={save} loading={busy} />

          {!!docId && (
            <>
              <SectionTitle title="Weekly schedule" />
              <Card>
                {WEEKDAYS.map((w, i) => (
                  <View key={w} style={{ flexDirection: 'row', paddingVertical: 6, alignItems: 'center' }}>
                    <Text style={{ width: 44, fontWeight: '700', color: colors.text }}>{w}</Text>
                    <View style={{ flex: 1 }}>
                      {byDay(i + 1).length === 0 ? <Text style={{ color: colors.textMuted }}>Off</Text> : byDay(i + 1).map((x) => (
                        <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 }}>
                          <Text style={{ color: colors.text }}>{fmtRange(x.start_time, x.end_time)} <Text style={{ color: colors.textMuted }}>({x.slot_minutes}m)</Text></Text>
                          <Pressable hitSlop={10} onPress={async () => { if (await confirmAction('Remove hours', 'Remove this working period?', 'Remove')) { try { await deleteSchedule(x.id); sch.reload(); } catch (e) { note('error', friendlyError(e)); } } }}>
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </Card>
              <Button title="Add working hours" variant="outline" icon="add" onPress={() => setModal('sched')} style={{ marginTop: 10 }} />

              <SectionTitle title="Blocked time / leave" />
              {(blocked.data ?? []).length === 0 ? <Text style={{ color: colors.textMuted }}>No blocked time.</Text> : (blocked.data ?? []).map((b: any) => (
                <Card key={b.id} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: colors.text }}>{b.slot_date}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{fmtTime(b.start_time)} – {fmtTime(b.end_time)} {b.reason ? `· ${b.reason}` : ''}</Text></View>
                  <Pressable hitSlop={10} onPress={async () => { try { await deleteBlockedTime(b.id); blocked.reload(); } catch (e) { note('error', friendlyError(e)); } }}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
                </Card>
              ))}
              <Button title="Block time" variant="outline" icon="ban" onPress={() => setModal('block')} style={{ marginTop: 6 }} />

              <SectionTitle title="Login account" />
              <Text style={{ color: colors.textMuted, marginBottom: 8, fontSize: 12 }}>{doc.data?.profile_id ? 'A login account is linked.' : 'Link an already-registered user so this doctor can sign in to the Doctor dashboard.'}</Text>
              <Button title="Link login by email" variant="outline" icon="link" onPress={() => setModal('login')} />

              <SectionTitle title="Recent appointments" />
              {(hist.data ?? []).length === 0 ? <Text style={{ color: colors.textMuted }}>None yet.</Text> : (hist.data ?? []).map((a) => (
                <Card key={a.id} style={{ marginBottom: 8 }} onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: a.id } })}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{a.patient?.full_name} · {a.service?.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.appointment_date} · {fmtTime(a.start_time)} · {a.status}</Text>
                </Card>
              ))}
            </>
          )}
        </>
      )}

      <FormModal visible={modal === 'sched'} title="Add working hours" onClose={() => setModal(null)}>
        <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 6 }}>Day</Text>
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          {WEEKDAYS.map((w, i) => (
            <Pressable key={w} onPress={() => setWd(i + 1)} style={{ flex: 1, marginRight: 4, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: wd === i + 1 ? colors.primary : '#F3F6FA' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: wd === i + 1 ? '#fff' : colors.text }}>{w}</Text>
            </Pressable>
          ))}
        </View>
        <Input label="Start (24h, HH:MM)" value={st} onChangeText={setSt} /><Input label="End (24h, HH:MM)" value={en} onChangeText={setEn} />
        <Input label="Slot length (minutes)" keyboardType="number-pad" value={sl} onChangeText={setSl} />
        <Button title="Add" onPress={addSched} loading={busy} />
      </FormModal>
      <FormModal visible={modal === 'block'} title="Block time" onClose={() => setModal(null)}>
        <Input label="Date (YYYY-MM-DD)" value={bDate} onChangeText={setBDate} /><Input label="From (HH:MM)" value={bSt} onChangeText={setBSt} /><Input label="To (HH:MM)" value={bEn} onChangeText={setBEn} />
        <Input label="Reason (optional)" value={bWhy} onChangeText={setBWhy} />
        <Button title="Block" onPress={addBlock} loading={busy} />
      </FormModal>
      <FormModal visible={modal === 'login'} title="Link login account" onClose={() => setModal(null)}>
        <Text style={{ color: colors.textMuted, marginBottom: 10 }}>The doctor must first register in the app with this email. Their role changes to Doctor.</Text>
        <Input label="Registered email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Button title="Link account" onPress={linkLogin} loading={busy} disabled={!email.trim()} />
      </FormModal>
    </Screen>
  );
}
