import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, EmptyState, ErrorView, Header, Loading, Screen, StatusBadge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { myAppointments } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { TAB_SPACE, dayNum, dayShort, fmtRange, fullDoctorName, longDate, monthShort, todayISO } from '@/lib/utils';
import { colors, radius } from '@/theme';
import type { Appointment } from '@/lib/types';

const TABS = ['Upcoming', 'Past', 'Cancelled'] as const;

export default function Appointments() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Upcoming');
  const { data, loading, error, reload } = useAsync(() => myAppointments(profile!.id), [profile?.id], !!profile);

  useFocusEffect(useCallback(() => { reload(); }, [profile?.id])); // eslint-disable-line react-hooks/exhaustive-deps

  // live status updates (e.g. admin approves while the screen is open)
  useEffect(() => {
    if (!profile) return;
    const ch = supabase.channel(`appts-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `patient_id=eq.${profile.id}` }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = todayISO();
  const groups = useMemo(() => {
    const all = data ?? [];
    return {
      Upcoming: all.filter((a) => (a.status === 'pending' || a.status === 'approved') && a.appointment_date >= today)
        .sort((a, b) => (a.appointment_date + a.start_time).localeCompare(b.appointment_date + b.start_time)),
      Past: all.filter((a) => a.status === 'completed' || (a.status === 'approved' && a.appointment_date < today)),
      Cancelled: all.filter((a) => a.status === 'cancelled' || a.status === 'rejected' || (a.status === 'pending' && a.appointment_date < today)),
    } as Record<(typeof TABS)[number], Appointment[]>;
  }, [data, today]);
  const list = groups[tab];

  return (
    <Screen bottomSpace={TAB_SPACE} onRefresh={reload} refreshing={loading && !!data}>
      <Header title="My Appointments" back={false} />
      <View style={s.tabs}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]}>
            <Text style={[s.tabTxt, tab === t && { color: '#fff' }]}>{t}{groups[t].length ? ` (${groups[t].length})` : ''}</Text>
          </Pressable>
        ))}
      </View>

      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState title={tab === 'Upcoming' ? 'No upcoming appointments' : tab === 'Past' ? 'No past appointments' : 'Nothing cancelled'}
          message={tab === 'Upcoming' ? 'Book a visit and it will appear here.' : undefined}
          action={tab === 'Upcoming' ? <Button title="Book Appointment" onPress={() => router.push('/(patient)/book')} style={{ paddingHorizontal: 28 }} /> : undefined} />
      ) : list.map((a) => (
        <Card key={a.id} style={{ marginBottom: 12 }} onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: a.id } })}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={s.date}>
              <Text style={s.dateDay}>{dayShort(a.appointment_date)}</Text>
              <Text style={s.dateNum}>{dayNum(a.appointment_date)}</Text>
              <Text style={s.dateDay}>{monthShort(a.appointment_date)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: '800', color: colors.text, fontSize: 15 }} numberOfLines={1}>{a.service?.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{fullDoctorName(a.doctor?.full_name)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 4 }}>{fmtRange(a.start_time, a.end_time)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <StatusBadge status={a.status} />
            {a.status === 'completed' && a.completed_at ? <Text style={{ fontSize: 11, color: colors.textMuted }}>Completed {longDate(a.completed_at.slice(0, 10))}</Text> : null}
          </View>
          {a.status === 'rejected' && (
            <View style={s.reject}>
              <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>Reason: {a.rejection_reason}</Text>
              {a.admin_comment ? <Text style={{ color: colors.text, fontSize: 12, marginTop: 2 }}>Clinic comment: {a.admin_comment}</Text> : null}
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: radius.pill, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  tabOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabTxt: { fontWeight: '700', color: colors.text, fontSize: 13 },
  date: { width: 54, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center' },
  dateDay: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  dateNum: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 26 },
  reject: { marginTop: 10, backgroundColor: colors.dangerSoft, borderRadius: radius.sm, padding: 10 },
});
