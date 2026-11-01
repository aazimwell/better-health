import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, EmptyState, ErrorView, Loading, Screen } from '@/components/ui';
import { DoctorHero } from '@/components/illustrations';
import { useAsync } from '@/hooks/useAsync';
import { doctorReviews, getDoctor, getSchedules } from '@/services/api';
import { WEEKDAYS, fmtRange, fullDoctorName, isoWeekday, money, timeAgo } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { colors, radius, shadow } from '@/theme';

export default function DoctorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const doc = useAsync(() => getDoctor(id), [id]);
  const sch = useAsync(() => getSchedules(id), [id]);
  const rev = useAsync(() => doctorReviews(id), [id]);

  if (doc.loading && !doc.data) return <Screen scroll={false}><Loading /></Screen>;
  if (doc.error || !doc.data) return <Screen><ErrorView message={doc.error ?? 'Doctor not found'} onRetry={doc.reload} /></Screen>;
  const d = doc.data;
  const todayW = isoWeekday();
  const byDay = (w: number) => (sch.data ?? []).filter((x) => x.weekday === w);
  const availableToday = byDay(todayW).length > 0 && d.is_active;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen edges={[]} padded={false}>
        <View>
          <DoctorHero seed={d.id} width={400} height={210} />
          <SafeAreaView edges={['top']} style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.back}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={s.sheet}>
          <View style={s.avatarWrap}><Avatar url={d.photo_url} seed={d.id} name={d.full_name} size={76} /></View>
          <Text style={s.name}>{fullDoctorName(d.full_name)}</Text>
          <Text style={s.desig}>{d.designation || 'Physiotherapist'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="star" size={16} color="#F5A524" />
            <Text style={{ fontWeight: '700', color: colors.text, marginLeft: 4 }}>{d.rating_count ? d.rating_avg.toFixed(1) : '—'}</Text>
            <Text style={{ color: colors.textMuted, marginLeft: 4, fontSize: 12 }}>({d.rating_count} reviews)</Text>
            <View style={s.sep} />
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 12 }}>{d.experience_years}+ Years Experience</Text>
          </View>
          {!!d.bio && <Text style={s.bio}>{d.bio}</Text>}

          <View style={s.facts}>
            <Fact icon="ribbon-outline" title={d.qualifications || '—'} sub="Qualification" />
            <Fact icon="school-outline" title={d.university || '—'} sub="University" />
            <Fact icon="calendar-outline" title={availableToday ? 'Available' : 'Not today'} sub="Today" good={availableToday} />
          </View>

          {d.specializations.length > 0 && (
            <>
              <Text style={s.h}>Specializations</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {d.specializations.map((x) => <View key={x} style={s.tag}><Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>{x}</Text></View>)}
              </View>
            </>
          )}

          <Text style={s.h}>Working Hours</Text>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            {WEEKDAYS.map((w, i) => {
              const works = byDay(i + 1).length > 0; const isToday = todayW === i + 1;
              return (
                <View key={w} style={[s.dayChip, works && { backgroundColor: colors.primarySoft, borderColor: colors.primary }, isToday && { backgroundColor: colors.primary }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isToday ? '#fff' : works ? colors.primary : '#A6B4C8' }}>{w}</Text>
                </View>
              );
            })}
          </View>
          {sch.loading ? <Loading /> : (sch.data ?? []).length === 0 ? (
            <Text style={{ color: colors.textMuted }}>Working hours have not been set yet.</Text>
          ) : WEEKDAYS.map((w, i) => byDay(i + 1).length > 0 && (
            <View key={w} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
              <Text style={{ color: colors.textMuted, width: 50 }}>{w}</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{byDay(i + 1).map((x) => fmtRange(x.start_time, x.end_time)).join('  ·  ')}</Text>
            </View>
          ))}

          {d.consultation_fee > 0 && <Text style={{ color: colors.textMuted, marginTop: 10 }}>Consultation fee: <Text style={{ color: colors.text, fontWeight: '700' }}>{money(d.consultation_fee)}</Text></Text>}

          {(rev.data ?? []).length > 0 && (
            <>
              <Text style={s.h}>Patient Reviews</Text>
              {(rev.data ?? []).slice(0, 3).map((r: any, i: number) => (
                <Card key={i} style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#F5A524', fontWeight: '800' }}>{'★'.repeat(r.rating)}<Text style={{ color: '#D5DEE9' }}>{'★'.repeat(5 - r.rating)}</Text></Text>
                  {!!r.comment && <Text style={{ color: colors.text, marginTop: 4 }}>{r.comment}</Text>}
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>{timeAgo(r.created_at)}</Text>
                </Card>
              ))}
            </>
          )}

          {role === 'patient' && d.is_active ? (
            <Button title="Book Appointment" onPress={() => router.push({ pathname: '/booking/new', params: { doctorId: d.id } })} style={{ marginTop: 20 }} />
          ) : !d.is_active ? <Text style={{ color: colors.danger, marginTop: 16, textAlign: 'center' }}>This doctor is currently not accepting appointments.</Text> : null}
        </View>
      </Screen>
    </View>
  );
}

function Fact({ icon, title, sub, good }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; good?: boolean }) {
  return (
    <View style={s.fact}>
      <Ionicons name={icon} size={20} color={good ? colors.success : colors.primary} />
      <Text style={{ fontWeight: '700', color: good ? colors.success : colors.text, fontSize: 12, marginTop: 6, textAlign: 'center' }} numberOfLines={2}>{title}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  back: { margin: 14, width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  sheet: { marginTop: -28, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 44, minHeight: 500, ...shadow },
  avatarWrap: { position: 'absolute', top: -38, left: 20, borderRadius: 40, borderWidth: 4, borderColor: '#fff', backgroundColor: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  desig: { color: colors.textMuted, marginTop: 2 },
  sep: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 10 },
  bio: { color: colors.textMuted, lineHeight: 20, marginTop: 14 },
  facts: { flexDirection: 'row', marginTop: 16, gap: 10 },
  fact: { flex: 1, alignItems: 'center', backgroundColor: colors.bgLight, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 10 },
  h: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 10 },
  tag: { backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, marginRight: 8, marginBottom: 8 },
  dayChip: { flex: 1, marginRight: 5, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: '#F3F6FA', borderWidth: 1, borderColor: 'transparent' },
});
