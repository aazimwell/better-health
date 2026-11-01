import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, EmptyState, ErrorView, Loading, SectionTitle, StatusBadge } from './ui';
import { useAsync } from '@/hooks/useAsync';
import { appointmentsInRange } from '@/services/api';
import { fmtTime, fullDoctorName, longDate, toISODate, todayISO } from '@/lib/utils';
import { colors } from '@/theme';
import type { Appointment } from '@/lib/types';

/** Today + next 14 days for the current doctor/assistant (RLS limits which rows come back). */
export function TodayView({ showDoctor }: { showDoctor?: boolean }) {
  const router = useRouter();
  const today = todayISO();
  const end = toISODate(new Date(Date.now() + 14 * 86400000));
  const { data, loading, error, reload } = useAsync(() => appointmentsInRange(today, end), [today]);
  useFocusEffect(useCallback(() => { reload(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps

  const live = (data ?? []).filter((a) => a.status === 'pending' || a.status === 'approved' || a.status === 'completed');
  const todays = live.filter((a) => a.appointment_date === today);
  const later = live.filter((a) => a.appointment_date > today && a.status !== 'completed');

  const card = (a: Appointment) => (
    <Card key={a.id} style={{ marginBottom: 10 }} onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: a.id } })}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 70 }}><Text style={{ fontWeight: '800', color: colors.primary, fontSize: 13 }}>{fmtTime(a.start_time)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>{a.patient?.full_name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.service?.name}{showDoctor ? ` · ${fullDoctorName(a.doctor?.full_name)}` : ''}</Text>
          {a.appointment_date !== today && <Text style={{ color: colors.textMuted, fontSize: 11 }}>{longDate(a.appointment_date)}</Text>}
        </View>
        <StatusBadge status={a.status} />
      </View>
    </Card>
  );

  if (loading && !data) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={reload} />;
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
        <Card style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{todays.length}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>Today</Text></Card>
        <Card style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{later.length}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>Next 14 days</Text></Card>
      </View>
      <SectionTitle title="Today's schedule" />
      {todays.length === 0 ? <EmptyState title="Nothing today" message="Your schedule for today is clear." /> : todays.map(card)}
      <SectionTitle title="Upcoming" />
      {later.length === 0 ? <Text style={{ color: colors.textMuted }}>No upcoming appointments.</Text> : later.map(card)}
    </>
  );
}
