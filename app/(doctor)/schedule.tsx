import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, ErrorView, FormModal, Header, Input, Loading, Screen, SectionTitle, confirmAction } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { addBlockedTime, addSchedule, deleteBlockedTime, deleteSchedule, getSchedules, listBlockedTimes } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { TAB_SPACE, WEEKDAYS, fmtRange, fmtTime, friendlyError } from '@/lib/utils';
import { colors } from '@/theme';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A doctor manages only their own hours and blocked time (RLS: doctor_id = my_doctor_id()). */
export default function DoctorSchedule() {
  const { profile } = useAuth();
  const me = useAsync(async () => {
    const { data, error } = await supabase.from('doctors').select('id,full_name').eq('profile_id', profile!.id).maybeSingle();
    if (error) throw error; return data;
  }, [profile?.id], !!profile);
  const docId = me.data?.id as string | undefined;
  const sch = useAsync(() => getSchedules(docId!), [docId], !!docId);
  const blocked = useAsync(() => listBlockedTimes(docId!), [docId], !!docId);

  const [modal, setModal] = useState<null | 'sched' | 'block'>(null);
  const [wd, setWd] = useState(1); const [st, setSt] = useState('09:00'); const [en, setEn] = useState('17:00'); const [sl, setSl] = useState('30');
  const [bDate, setBDate] = useState(''); const [bSt, setBSt] = useState('09:00'); const [bEn, setBEn] = useState('17:00'); const [bWhy, setBWhy] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);
  const byDay = (w: number) => (sch.data ?? []).filter((x) => x.weekday === w);

  const addS = async () => {
    if (!TIME.test(st) || !TIME.test(en) || en <= st) return setMsg({ t: 'error', m: 'Use 24-hour times like 09:00 – 17:00.' });
    setBusy(true);
    try { await addSchedule({ doctor_id: docId!, weekday: wd, start_time: st, end_time: en, slot_minutes: parseInt(sl, 10) || 30 }); setModal(null); sch.reload(); setMsg({ t: 'success', m: 'Hours added.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  const addB = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bDate) || !TIME.test(bSt) || !TIME.test(bEn) || bEn <= bSt) return setMsg({ t: 'error', m: 'Enter YYYY-MM-DD and valid times.' });
    setBusy(true);
    try { await addBlockedTime({ doctor_id: docId!, slot_date: bDate, start_time: bSt, end_time: bEn, reason: bWhy.trim() || undefined }); setModal(null); blocked.reload(); setMsg({ t: 'success', m: 'Time blocked.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };

  return (
    <Screen bottomSpace={TAB_SPACE} keyboard={false}>
      <Header title="My Schedule" back={false} />
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      {me.loading && !me.data ? <Loading /> : me.error ? <ErrorView message={me.error} onRetry={me.reload} /> : !docId ? (
        <Banner type="info" text="Your login is not linked to a doctor profile yet. Ask the clinic admin to link it." />
      ) : (
        <>
          <Card>
            {WEEKDAYS.map((w, i) => (
              <View key={w} style={{ flexDirection: 'row', paddingVertical: 6 }}>
                <Text style={{ width: 44, fontWeight: '700', color: colors.text }}>{w}</Text>
                <View style={{ flex: 1 }}>
                  {byDay(i + 1).length === 0 ? <Text style={{ color: colors.textMuted }}>Off</Text> : byDay(i + 1).map((x) => (
                    <View key={x.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={{ color: colors.text }}>{fmtRange(x.start_time, x.end_time)} <Text style={{ color: colors.textMuted }}>({x.slot_minutes}m)</Text></Text>
                      <Pressable hitSlop={10} onPress={async () => { if (await confirmAction('Remove hours', 'Remove this working period?', 'Remove')) { try { await deleteSchedule(x.id); sch.reload(); } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } } }}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </Card>
          <Button title="Add working hours" icon="add" variant="outline" onPress={() => setModal('sched')} style={{ marginTop: 10 }} />
          <SectionTitle title="Blocked time / leave" />
          {(blocked.data ?? []).length === 0 ? <Text style={{ color: colors.textMuted }}>None.</Text> : (blocked.data ?? []).map((b: any) => (
            <Card key={b.id} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: colors.text }}>{b.slot_date}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>{fmtTime(b.start_time)} – {fmtTime(b.end_time)} {b.reason ? `· ${b.reason}` : ''}</Text></View>
              <Pressable hitSlop={10} onPress={async () => { try { await deleteBlockedTime(b.id); blocked.reload(); } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } }}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
            </Card>
          ))}
          <Button title="Block time" icon="ban" variant="outline" onPress={() => setModal('block')} style={{ marginTop: 6 }} />
        </>
      )}
      <FormModal visible={modal === 'sched'} title="Add working hours" onClose={() => setModal(null)}>
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          {WEEKDAYS.map((w, i) => (
            <Pressable key={w} onPress={() => setWd(i + 1)} style={{ flex: 1, marginRight: 4, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: wd === i + 1 ? colors.primary : '#F3F6FA' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: wd === i + 1 ? '#fff' : colors.text }}>{w}</Text>
            </Pressable>
          ))}
        </View>
        <Input label="Start (HH:MM)" value={st} onChangeText={setSt} /><Input label="End (HH:MM)" value={en} onChangeText={setEn} /><Input label="Slot length (minutes)" keyboardType="number-pad" value={sl} onChangeText={setSl} />
        <Button title="Add" onPress={addS} loading={busy} />
      </FormModal>
      <FormModal visible={modal === 'block'} title="Block time" onClose={() => setModal(null)}>
        <Input label="Date (YYYY-MM-DD)" value={bDate} onChangeText={setBDate} /><Input label="From (HH:MM)" value={bSt} onChangeText={setBSt} /><Input label="To (HH:MM)" value={bEn} onChangeText={setBEn} /><Input label="Reason (optional)" value={bWhy} onChangeText={setBWhy} />
        <Button title="Block" onPress={addB} loading={busy} />
      </FormModal>
    </Screen>
  );
}
