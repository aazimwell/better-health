import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar, Card, EmptyState, ErrorView, Header, Loading, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { doctorIdsWorkingOn, listDoctors } from '@/services/api';
import { fullDoctorName, isoWeekday } from '@/lib/utils';
import { colors, radius } from '@/theme';

export default function Doctors() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useAsync(async () => {
    const [d, ids] = await Promise.all([listDoctors(), doctorIdsWorkingOn(isoWeekday())]);
    return d.map((x) => ({ ...x, today: ids.includes(x.id) }));
  }, []);
  const list = (data ?? []).filter((d) => !q.trim() || (d.full_name + d.designation + d.specializations.join(' ')).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Screen onRefresh={reload} refreshing={loading && !!data}>
      <Header title="Our Doctors" />
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search by name or specialization" placeholderTextColor="#9FB0C6" style={{ flex: 1, marginLeft: 8, color: colors.text }} />
      </View>
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : list.length === 0 ? (
        <EmptyState kind="people" title="No doctors found" message={q ? 'Try a different search.' : 'The clinic has not added doctors yet.'} />
      ) : list.map((d) => (
        <Card key={d.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: d.id } })}>
          <Avatar url={d.photo_url} seed={d.id} name={d.full_name} size={60} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '800', color: colors.text, fontSize: 15 }}>{fullDoctorName(d.full_name)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{d.designation}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Ionicons name="star" size={13} color="#F5A524" />
              <Text style={{ fontSize: 12, color: colors.text, marginLeft: 3, fontWeight: '600' }}>{d.rating_count ? d.rating_avg.toFixed(1) : 'New'}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>{d.experience_years}+ yrs</Text>
              <Pressable style={{ marginLeft: 8, backgroundColor: d.today ? colors.successSoft : '#EEF1F5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: d.today ? colors.success : colors.textMuted }}>{d.today ? 'Available Today' : 'Not today'}</Text>
              </Pressable>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      ))}
    </Screen>
  );
}
