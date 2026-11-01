import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, EmptyState, ErrorView, Loading, StatusBadge, Chip } from './ui';
import { useAsync } from '@/hooks/useAsync';
import { appointmentsInRange, listDoctors } from '@/services/api';
import { WEEKDAYS, fmtTime, fullDoctorName, monthTitle, toISODate, todayISO, longDate } from '@/lib/utils';
import { colors, radius } from '@/theme';
import { ScrollView } from 'react-native';

/** Appointment Management Calendar (Screen 08): month grid, Calendar/List toggle, daily schedule, filters. */
export function CalendarView({ lockDoctorId }: { lockDoctorId?: string }) {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [sel, setSel] = useState(todayISO());
  const [mode, setMode] = useState<'Calendar' | 'List'>('Calendar');
  // When locked (doctor role) the database already limits rows to the doctor's own appointments.
  const [doctorId, setDoctorId] = useState<string>('');
  const [status, setStatus] = useState('');

  const from = toISODate(new Date(year, month, 1, 12));
  const to = toISODate(new Date(year, month + 1, 0, 12));
  const docs = useAsync(() => listDoctors({ includeInactive: true }), [], !lockDoctorId);
  const { data, loading, error, reload } = useAsync(() => appointmentsInRange(from, to, { doctorId: doctorId || undefined, status: status || undefined }), [from, to, doctorId, status]);

  const byDate = useMemo(() => {
    const m: Record<string, number> = {};
    (data ?? []).forEach((a) => { if (a.status !== 'rejected') m[a.appointment_date] = (m[a.appointment_date] ?? 0) + 1; });
    return m;
  }, [data]);

  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const iso = (d: number) => toISODate(new Date(year, month, d, 12));
  const shift = (n: number) => { const d = new Date(year, month + n, 1); setYear(d.getFullYear()); setMonth(d.getMonth()); };
  const list = mode === 'Calendar' ? (data ?? []).filter((a) => a.appointment_date === sel) : (data ?? []);

  return (
    <View>
      <View style={s.toggle}>
        {(['Calendar', 'List'] as const).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[s.tbtn, mode === m && { backgroundColor: colors.primary }]}>
            <Text style={{ fontWeight: '700', color: mode === m ? '#fff' : colors.text }}>{m}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {!lockDoctorId && <Chip label="All doctors" active={!doctorId} onPress={() => setDoctorId('')} />}
        {!lockDoctorId && (docs.data ?? []).map((d) => <Chip key={d.id} label={fullDoctorName(d.full_name)} active={doctorId === d.id} onPress={() => setDoctorId(d.id)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {['', 'pending', 'approved', 'completed', 'cancelled', 'rejected'].map((st) => (
          <Chip key={st} label={st ? st[0].toUpperCase() + st.slice(1) : 'Any status'} active={status === st} onPress={() => setStatus(st)} />
        ))}
      </ScrollView>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16 }}>{monthTitle(year, month)}</Text>
          <View style={{ flexDirection: 'row' }}>
            <Pressable onPress={() => shift(-1)} hitSlop={10} style={{ marginRight: 18 }}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable>
            <Pressable onPress={() => shift(1)} hitSlop={10}><Ionicons name="chevron-forward" size={22} color={colors.text} /></Pressable>
          </View>
        </View>
        {mode === 'Calendar' && (
          <>
            <View style={{ flexDirection: 'row' }}>
              {['Sun', ...WEEKDAYS.slice(0, 6)].map((w) => <Text key={w} style={s.wk}>{w}</Text>)}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cells.map((d, i) => {
                if (!d) return <View key={i} style={s.cell} />;
                const k = iso(d); const on = k === sel; const isToday = k === todayISO();
                return (
                  <Pressable key={i} style={s.cell} onPress={() => setSel(k)}>
                    <View style={[s.dayDot, on && { backgroundColor: colors.primary }, !on && isToday && { borderWidth: 1.5, borderColor: colors.primary }]}>
                      <Text style={{ color: on ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>{d}</Text>
                    </View>
                    {byDate[k] ? <View style={[s.mark, on && { backgroundColor: colors.primary }]} /> : <View style={{ height: 5 }} />}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </Card>

      <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 10 }}>
        {mode === 'Calendar' ? (sel === todayISO() ? "Today's Schedule" : longDate(sel)) : `All appointments in ${monthTitle(year, month)}`}
      </Text>
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState title="No appointments" message="Nothing scheduled for this selection." />
      ) : list.map((a) => (
        <Card key={a.id} style={{ marginBottom: 10 }} onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: a.id } })}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 66 }}>
              <Text style={{ fontWeight: '800', color: colors.primary, fontSize: 12 }}>{fmtTime(a.start_time)}</Text>
              {mode === 'List' && <Text style={{ color: colors.textMuted, fontSize: 10 }}>{a.appointment_date.slice(5)}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>{a.patient?.full_name ?? 'Patient'}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>{a.service?.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>{fullDoctorName(a.doctor?.full_name)}</Text>
            </View>
            <StatusBadge status={a.status} />
          </View>
        </Card>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  toggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: radius.pill, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  tbtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.pill },
  wk: { width: `${100 / 7}%`, textAlign: 'center', color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success, marginTop: 1 },
});
