import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Chip, EmptyState, ErrorView, Header, Loading, Screen } from '@/components/ui';
import { ServiceArt } from '@/components/illustrations';
import { useAsync } from '@/hooks/useAsync';
import { listDoctors, listServices } from '@/services/api';
import { CATEGORIES, TAB_SPACE, fullDoctorName, money } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import { colors, radius, shadow } from '@/theme';

export default function Book() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>(params.category && CATEGORIES.includes(params.category as any) ? params.category : 'All');
  const services = useAsync(listServices, []);
  const doctors = useAsync(() => listDoctors(), []);

  // honour a category passed from the home screen even when this tab is already mounted
  React.useEffect(() => { if (params.category) setCat(params.category); }, [params.category]);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => (services.data ?? []).filter((s) =>
    (cat === 'All' || s.category === cat) &&
    (!query || s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query) || s.category.toLowerCase().includes(query)),
  ), [services.data, cat, query]);
  const matchedDoctors = useMemo(() => !query ? [] : (doctors.data ?? []).filter((d) =>
    d.full_name.toLowerCase().includes(query) || d.designation.toLowerCase().includes(query) ||
    d.specializations.some((x) => x.toLowerCase().includes(query))), [doctors.data, query]);

  return (
    <Screen bottomSpace={TAB_SPACE} onRefresh={() => { services.reload(); doctors.reload(); }} refreshing={services.loading && !!services.data}>
      <Header title="Book Appointment" back={false} />
      <View style={s.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search services, doctors or conditions…" placeholderTextColor="#9FB0C6" style={s.searchInput} />
        {q ? <Pressable onPress={() => setQ('')} hitSlop={10}><Ionicons name="close-circle" size={18} color={colors.textMuted} /></Pressable> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginBottom: 4 }}>
        {['All', ...CATEGORIES].map((c) => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />)}
      </ScrollView>

      {matchedDoctors.length > 0 && (
        <>
          <Text style={s.h}>Doctors</Text>
          {matchedDoctors.map((d) => (
            <Pressable key={d.id} style={s.card} onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: d.id } })}>
              <Avatar url={d.photo_url} seed={d.id} name={d.full_name} size={52} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.title}>{fullDoctorName(d.full_name)}</Text>
                <Text style={s.desc}>{d.designation}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </>
      )}

      <Text style={s.h}>Our Services</Text>
      {services.loading && !services.data ? <Loading /> : services.error ? <ErrorView message={services.error} onRetry={services.reload} /> :
        filtered.length === 0 ? (
          <EmptyState kind="search" title="No services found" message={query ? 'Try a different search or category.' : 'The clinic has not added services in this category yet.'} />
        ) : filtered.map((sv) => (
          <Pressable key={sv.id} style={s.card} onPress={() => router.push({ pathname: '/booking/new', params: { serviceId: sv.id } })}>
            <ServiceArt category={sv.category} size={64} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.title} numberOfLines={1}>{sv.name}</Text>
              <Text style={s.desc} numberOfLines={1}>{sv.description}</Text>
              <Text style={s.price}>From {money(sv.price)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, height: 50, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.text },
  h: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.lg, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E6F0FB', ...shadow, shadowOpacity: 0.07 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  desc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 13, fontWeight: '800', color: colors.primary, marginTop: 6 },
});
