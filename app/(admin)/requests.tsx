import React, { useCallback, useEffect } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Avatar, Card, EmptyState, ErrorView, Header, Loading, Screen, StatusBadge } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { pendingRequests } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { TAB_SPACE, fmtTime, fullDoctorName, longDate, timeAgo } from '@/lib/utils';
import { colors } from '@/theme';

/** Pending Requests — new patient bookings appear here live via Realtime. Approve/Reject happen on the detail screen. */
export default function Requests() {
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(pendingRequests, []);
  useFocusEffect(useCallback(() => { reload(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const ch = supabase.channel('pending-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen bottomSpace={TAB_SPACE} onRefresh={reload} refreshing={loading && !!data}>
      <Header title="Pending Requests" back={false} />
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (data ?? []).length === 0 ? (
        <EmptyState kind="bell" title="All caught up" message="New appointment requests will appear here automatically." />
      ) : (data ?? []).map((a) => (
        <Card key={a.id} style={{ marginBottom: 12 }} onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: a.id } })}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar path={a.patient?.avatar_url} name={a.patient?.full_name} size={46} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: '800', color: colors.text }}>{a.patient?.full_name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.patient?.phone}</Text>
            </View>
            <StatusBadge status={a.status} />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
          <Text style={{ color: colors.text, fontWeight: '700' }}>{a.service?.name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{fullDoctorName(a.doctor?.full_name)} · {longDate(a.appointment_date)} · {fmtTime(a.start_time)}</Text>
          <Text style={{ color: colors.text, fontSize: 12, marginTop: 6 }} numberOfLines={2}>“{a.patient_reason}”</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 6 }}>{a.booking_ref} · requested {timeAgo(a.created_at)} — tap to approve or reject</Text>
        </Card>
      ))}
    </Screen>
  );
}
