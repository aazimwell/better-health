import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Avatar, Button, Card, EmptyState, ErrorView, Header, Loading, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { listStaff } from '@/services/api';
import { fullDoctorName } from '@/lib/utils';
import { colors } from '@/theme';

export default function AdminDoctors() {
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(() => listStaff('doctor'), []);
  useFocusEffect(useCallback(() => { reload(); }, [])); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Screen onRefresh={reload} refreshing={loading && !!data}>
      <Header title="Doctors" right={undefined} />
      <Button title="Add doctor" icon="add" onPress={() => router.push({ pathname: '/admin/doctor/[id]', params: { id: 'new' } })} style={{ marginBottom: 14 }} />
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (data ?? []).length === 0 ? (
        <EmptyState kind="people" title="No doctors yet" message="Add your first doctor to open bookings." />
      ) : (data ?? []).map((d: any) => (
        <Card key={d.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push({ pathname: '/admin/doctor/[id]', params: { id: d.id } })}>
          <Avatar url={d.photo_url} seed={d.id} name={d.full_name} size={52} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>{fullDoctorName(d.full_name)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{d.designation}</Text>
            <Text style={{ color: d.profile_id ? colors.success : colors.textMuted, fontSize: 11, marginTop: 2 }}>{d.profile_id ? `Login: ${d.profile?.email ?? 'linked'}` : 'No login account linked'}</Text>
          </View>
          <View style={{ backgroundColor: d.is_active ? colors.successSoft : '#EEF1F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: d.is_active ? colors.success : colors.textMuted }}>{d.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
