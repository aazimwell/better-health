import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Card, ErrorView, Header, Loading, Screen, SectionTitle } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { dashboardStats, listAppointments, recentActivity } from '@/services/api';
import { useAuth } from '@/lib/auth';
import { TAB_SPACE, dayShort, fmtTime, timeAgo, todayISO } from '@/lib/utils';
import { colors, radius, shadow } from '@/theme';

type Icon = keyof typeof Ionicons.glyphMap;

export default function AdminDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const stats = useAsync(dashboardStats, []);
  const upcoming = useAsync(async () => (await listAppointments({ status: 'approved', limit: 5 })).filter((a) => a.appointment_date >= todayISO()).reverse(), []);
  const activity = useAsync(recentActivity, []);
  useFocusEffect(useCallback(() => { stats.reload(); upcoming.reload(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps
  const d = stats.data;

  const cards: { k: string; label: string; icon: Icon; color: string; bg: string; go?: string }[] = [
    { k: 'total_patients', label: 'Total Patients', icon: 'people', color: colors.primary, bg: colors.primarySoft, go: '/admin/patients' },
    { k: 'total_doctors', label: 'Total Doctors', icon: 'medkit', color: colors.success, bg: colors.successSoft, go: '/admin/doctors' },
    { k: 'total_assistants', label: 'Assistants', icon: 'people-circle', color: colors.purple, bg: colors.purpleSoft, go: '/admin/assistants' },
    { k: 'today', label: "Today's Appointments", icon: 'today', color: colors.orange, bg: colors.orangeSoft, go: '/(admin)/calendar' },
    { k: 'pending', label: 'Pending Requests', icon: 'hourglass', color: colors.warning, bg: colors.warningSoft, go: '/(admin)/requests' },
    { k: 'approved', label: 'Approved', icon: 'checkmark-circle', color: colors.success, bg: colors.successSoft },
    { k: 'completed', label: 'Completed', icon: 'checkmark-done', color: colors.primary, bg: colors.primarySoft },
    { k: 'cancelled', label: 'Cancelled', icon: 'close-circle', color: colors.danger, bg: colors.dangerSoft },
  ];
  const weekly: { day: string; count: number }[] = d?.weekly ?? [];
  const monthly: { month: string; count: number }[] = d?.monthly ?? [];
  const maxW = Math.max(1, ...weekly.map((x) => x.count));
  const maxM = Math.max(1, ...monthly.map((x) => x.count));

  return (
    <Screen bottomSpace={TAB_SPACE} onRefresh={() => { stats.reload(); upcoming.reload(); activity.reload(); }} refreshing={stats.loading && !!stats.data}>
      <Header title="Admin Dashboard" back={false} />
      <Text style={{ color: colors.textMuted, marginTop: -6, marginBottom: 14 }}>Welcome, {profile?.full_name?.split(' ')[0]}</Text>

      {stats.loading && !d ? <Loading /> : stats.error ? <ErrorView message={stats.error} onRetry={stats.reload} /> : (
        <>
          <View style={s.grid}>
            {cards.map((c) => (
              <Pressable key={c.k} style={s.stat} onPress={c.go ? () => router.push(c.go as any) : undefined}>
                <View style={[s.statIcon, { backgroundColor: c.bg }]}><Ionicons name={c.icon} size={20} color={c.color} /></View>
                <Text style={s.statNum}>{d?.[c.k] ?? 0}</Text>
                <Text style={s.statLabel}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <SectionTitle title="Quick actions" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {([
              ['Pending', 'mail-unread', '/(admin)/requests'], ['Reports', 'bar-chart', '/admin/reports'],
              ['Announce', 'megaphone', '/admin/announce'], ['Services', 'list', '/admin/services'],
            ] as [string, Icon, string][]).map(([l, i, p]) => (
              <Pressable key={l} onPress={() => router.push(p as any)} style={s.quick}>
                <Ionicons name={i} size={22} color={colors.primary} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, marginTop: 4 }}>{l}</Text>
              </Pressable>
            ))}
          </View>

          <SectionTitle title="Last 7 days" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110 }}>
              {weekly.map((w) => (
                <View key={w.day} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{w.count}</Text>
                  <View style={{ width: 18, height: Math.max(4, (w.count / maxW) * 70), backgroundColor: colors.primary, borderRadius: 6, marginTop: 2 }} />
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>{dayShort(w.day.slice(0, 10))}</Text>
                </View>
              ))}
            </View>
          </Card>
          <SectionTitle title="Last 6 months" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110 }}>
              {monthly.map((m) => (
                <View key={m.month} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{m.count}</Text>
                  <View style={{ width: 22, height: Math.max(4, (m.count / maxM) * 70), backgroundColor: colors.success, borderRadius: 6, marginTop: 2 }} />
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>{m.month}</Text>
                </View>
              ))}
            </View>
          </Card>

          <SectionTitle title="Upcoming appointments" action="Calendar" onAction={() => router.push('/(admin)/calendar')} />
          {(upcoming.data ?? []).length === 0 ? <Card><Text style={{ color: colors.textMuted }}>No upcoming approved appointments.</Text></Card> :
            (upcoming.data ?? []).map((a) => (
              <Card key={a.id} style={{ marginBottom: 8 }} onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: a.id } })}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{a.patient?.full_name} · {a.service?.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.appointment_date} · {fmtTime(a.start_time)}</Text>
              </Card>
            ))}

          <SectionTitle title="Recent activity" />
          <Card>
            {(activity.data ?? []).length === 0 ? <Text style={{ color: colors.textMuted }}>No activity yet.</Text> : (activity.data ?? []).slice(0, 8).map((x: any) => (
              <View key={x.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                <Text style={{ color: colors.text, textTransform: 'capitalize', flex: 1 }}>{String(x.action).replace(/_/g, ' ')}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{timeAgo(x.created_at)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  stat: { width: '48.5%', backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E6F0FB', ...shadow, shadowOpacity: 0.06 },
  statIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 8 },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  quick: { flex: 1, backgroundColor: '#fff', borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E6F0FB' },
});
