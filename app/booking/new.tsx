import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Banner, Button, Card, EmptyState, ErrorView, Header, Input, Loading, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { bookAppointment, getAvailableSlots, getSchedules, listDoctors, listServices } from '@/services/api';
import { WEEKDAYS, dayNum, dayShort, friendlyError, fmtTime, fullDoctorName, isoWeekday, longDate, money, monthShort, toISODate } from '@/lib/utils';
import { colors, radius } from '@/theme';

export default function NewBooking() {
  const router = useRouter();
  const p = useLocalSearchParams<{ serviceId?: string; doctorId?: string }>();
  const [serviceId, setServiceId] = useState(p.serviceId ?? '');
  const [doctorId, setDoctorId] = useState(p.doctorId ?? '');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const services = useAsync(listServices, []);
  const doctors = useAsync(() => listDoctors(), []);
  const schedules = useAsync(() => getSchedules(doctorId), [doctorId], !!doctorId);
  const slots = useAsync(() => getAvailableSlots(doctorId, date), [doctorId, date], !!doctorId && !!date);

  const workingDays = useMemo(() => new Set((schedules.data ?? []).map((s) => s.weekday)), [schedules.data]);
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);

  useEffect(() => { setDate(''); setStart(''); }, [doctorId]);
  useEffect(() => { setStart(''); }, [date]);

  const service = services.data?.find((x) => x.id === serviceId);
  const doctor = doctors.data?.find((x) => x.id === doctorId);
  const ready = !!service && !!doctor && !!date && !!start && reason.trim().length >= 3;

  const submit = async () => {
    if (busy || !ready) return;
    setErr(''); setBusy(true);
    try {
      // The database re-verifies doctor, slot, conflicts and duplicates inside one transaction.
      const appt = await bookAppointment({ service: serviceId, doctor: doctorId, date, start, reason: reason.trim(), notes: notes.trim() });
      router.replace({ pathname: '/confirmation/[id]', params: { id: appt.id } });
    } catch (e) {
      setErr(friendlyError(e));
      slots.reload(); // slot list may have changed
    } finally { setBusy(false); }
  };

  const Step = ({ n, title }: { n: number; title: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
      <View style={s.stepNum}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{n}</Text></View>
      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginLeft: 8 }}>{title}</Text>
    </View>
  );

  return (
    <Screen keyboard>
      <Header title="Book Appointment" />
      {err ? <Banner type="error" text={err} /> : null}

      <Step n={1} title="Select service" />
      {services.loading && !services.data ? <Loading /> : services.error ? <ErrorView message={services.error} onRetry={services.reload} /> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(services.data ?? []).map((sv) => (
            <Pressable key={sv.id} onPress={() => setServiceId(sv.id)} style={[s.pill, serviceId === sv.id && s.pillOn]}>
              <Text style={[s.pillTitle, serviceId === sv.id && { color: '#fff' }]} numberOfLines={1}>{sv.name}</Text>
              <Text style={[s.pillSub, serviceId === sv.id && { color: '#DCEBFF' }]}>{money(sv.price)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Step n={2} title="Select doctor" />
      {doctors.loading && !doctors.data ? <Loading /> : (doctors.data ?? []).length === 0 ? (
        <EmptyState kind="people" title="No doctors available" message="The clinic has not added any active doctors yet." />
      ) : (doctors.data ?? []).map((d) => (
        <Pressable key={d.id} onPress={() => setDoctorId(d.id)} style={[s.doc, doctorId === d.id && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
          <Avatar url={d.photo_url} seed={d.id} name={d.full_name} size={44} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{fullDoctorName(d.full_name)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{d.designation}</Text>
          </View>
          <Ionicons name={doctorId === d.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={colors.primary} />
        </Pressable>
      ))}

      <Step n={3} title="Select date" />
      {!doctorId ? <Text style={s.hint}>Choose a doctor first.</Text> : schedules.loading ? <Loading /> : workingDays.size === 0 ? (
        <Text style={s.hint}>This doctor has not set a working schedule yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {days.map((d) => {
            const iso = toISODate(d); const off = !workingDays.has(isoWeekday(d)); const on = date === iso;
            return (
              <Pressable key={iso} disabled={off} onPress={() => setDate(iso)} style={[s.day, on && s.dayOn, off && { opacity: 0.35 }]}>
                <Text style={[s.dayTxt, on && { color: '#DCEBFF' }]}>{dayShort(iso)}</Text>
                <Text style={[s.dayNum, on && { color: '#fff' }]}>{dayNum(iso)}</Text>
                <Text style={[s.dayTxt, on && { color: '#DCEBFF' }]}>{monthShort(iso)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Step n={4} title="Select time" />
      {!date ? <Text style={s.hint}>Choose a date to see available times.</Text> : slots.loading ? <Loading /> : slots.error ? (
        <ErrorView message={slots.error} onRetry={slots.reload} />
      ) : (slots.data ?? []).length === 0 ? (
        <Text style={s.hint}>No free time slots on this day. Please pick another date.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(slots.data ?? []).map((sl) => (
            <Pressable key={sl.slot_start} onPress={() => setStart(sl.slot_start)} style={[s.slot, start === sl.slot_start && s.slotOn]}>
              <Text style={[s.slotTxt, start === sl.slot_start && { color: '#fff' }]}>{fmtTime(sl.slot_start)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Step n={5} title="Reason for visit" />
      <Input placeholder="Describe your symptoms or reason for visit" multiline value={reason} onChangeText={setReason} />
      <Input label="Additional notes (optional)" placeholder="Anything else the clinic should know" multiline value={notes} onChangeText={setNotes} />

      {ready && (
        <Card style={{ marginTop: 4 }}>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 8 }}>Booking summary</Text>
          <Line k="Service" v={service!.name} />
          <Line k="Doctor" v={fullDoctorName(doctor!.full_name)} />
          <Line k="Date" v={longDate(date)} />
          <Line k="Time" v={fmtTime(start)} />
          <Line k="Fee from" v={money(service!.price)} />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
            This sends a request. Your appointment is only confirmed after the clinic approves it.
          </Text>
        </Card>
      )}
      <Button title="Submit Request" onPress={submit} loading={busy} disabled={!ready} style={{ marginTop: 16 }} />
    </Screen>
  );
}

const Line = ({ k, v }: { k: string; v: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
    <Text style={{ color: colors.textMuted }}>{k}</Text>
    <Text style={{ color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right', marginLeft: 12 }}>{v}</Text>
  </View>
);

const s = StyleSheet.create({
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pill: { backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, marginRight: 10, maxWidth: 200 },
  pillOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillTitle: { fontWeight: '700', color: colors.text, fontSize: 13 },
  pillSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  doc: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: 10, marginBottom: 8 },
  hint: { color: colors.textMuted, fontSize: 13 },
  day: { width: 58, paddingVertical: 10, borderRadius: radius.md, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', marginRight: 8 },
  dayOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayTxt: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  dayNum: { fontSize: 20, fontWeight: '800', color: colors.text },
  slot: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, marginRight: 8, marginBottom: 8 },
  slotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotTxt: { fontWeight: '700', color: colors.text, fontSize: 13 },
});
