import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, FormModal, Loading } from './ui';
import { useAsync } from '@/hooks/useAsync';
import { getAvailableSlots, getSchedules, listDoctors, rescheduleAppointment } from '@/services/api';
import { dayNum, dayShort, fmtTime, friendlyError, fullDoctorName, isoWeekday, monthShort, toISODate } from '@/lib/utils';
import { colors, radius } from '@/theme';
import type { Appointment } from '@/lib/types';

/** Admin/assistant: change date, time and (optionally) doctor. The database re-checks availability. */
export function RescheduleModal({ appt, visible, onClose, onDone }: { appt: Appointment; visible: boolean; onClose: () => void; onDone: () => void }) {
  const [doctorId, setDoctorId] = useState(appt.doctor_id);
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const doctors = useAsync(() => listDoctors(), [], visible);
  const sched = useAsync(() => getSchedules(doctorId), [doctorId], visible);
  const slots = useAsync(() => getAvailableSlots(doctorId, date, appt.id), [doctorId, date], visible && !!date);
  const work = useMemo(() => new Set((sched.data ?? []).map((x) => x.weekday)), [sched.data]);
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);

  useEffect(() => { setDate(''); setStart(''); }, [doctorId]);
  useEffect(() => { setStart(''); }, [date]);

  const save = async () => {
    if (busy || !date || !start) return;
    setBusy(true); setErr('');
    try {
      await rescheduleAppointment(appt.id, date, start, doctorId !== appt.doctor_id ? doctorId : undefined);
      onDone();
    } catch (e) { setErr(friendlyError(e)); slots.reload(); } finally { setBusy(false); }
  };

  return (
    <FormModal visible={visible} title="Reschedule / change doctor" onClose={onClose}>
      {err ? <Banner type="error" text={err} /> : null}
      <Text style={s.l}>Doctor</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(doctors.data ?? []).map((d) => (
          <Pressable key={d.id} onPress={() => setDoctorId(d.id)} style={[s.chip, doctorId === d.id && s.on]}>
            <Text style={[s.t, doctorId === d.id && { color: '#fff' }]}>{fullDoctorName(d.full_name)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={s.l}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {days.map((d) => {
          const iso = toISODate(d); const off = !work.has(isoWeekday(d));
          return (
            <Pressable key={iso} disabled={off} onPress={() => setDate(iso)} style={[s.day, date === iso && s.on, off && { opacity: 0.35 }]}>
              <Text style={[s.dt, date === iso && { color: '#DCEBFF' }]}>{dayShort(iso)}</Text>
              <Text style={[s.dn, date === iso && { color: '#fff' }]}>{dayNum(iso)}</Text>
              <Text style={[s.dt, date === iso && { color: '#DCEBFF' }]}>{monthShort(iso)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={s.l}>Time</Text>
      {!date ? <Text style={{ color: colors.textMuted }}>Pick a date.</Text> : slots.loading ? <Loading /> : (slots.data ?? []).length === 0 ? (
        <Text style={{ color: colors.textMuted }}>No free slots that day.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(slots.data ?? []).map((sl) => (
            <Pressable key={sl.slot_start} onPress={() => setStart(sl.slot_start)} style={[s.chip, start === sl.slot_start && s.on]}>
              <Text style={[s.t, start === sl.slot_start && { color: '#fff' }]}>{fmtTime(sl.slot_start)}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Button title="Save new time" onPress={save} loading={busy} disabled={!date || !start} style={{ marginTop: 18 }} />
    </FormModal>
  );
}

const s = StyleSheet.create({
  l: { fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff', marginRight: 8, marginBottom: 8 },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
  t: { fontWeight: '700', color: colors.text, fontSize: 13 },
  day: { width: 56, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff', alignItems: 'center', marginRight: 8 },
  dt: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  dn: { fontSize: 18, fontWeight: '800', color: colors.text },
});
