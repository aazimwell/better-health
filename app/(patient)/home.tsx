import React, { useCallback } from 'react';
import { Dimensions, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Avatar, Button, Card, EmptyState, Screen, SectionTitle, StatusBadge } from '@/components/ui';
import { HeroIllustration, ProgressBannerArt, ServiceArt } from '@/components/illustrations';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/notifications';
import { useAsync } from '@/hooks/useAsync';
import { doctorIdsWorkingOn, listBanners, listDoctors, listServices, myAppointments } from '@/services/api';
import { TAB_SPACE, dayNum, dayShort, fmtTime, fullDoctorName, greeting, isoWeekday, monthShort, money, timeAgo, todayISO } from '@/lib/utils';
import { colors, gradients, radius, shadow } from '@/theme';

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();
  const { items, unread } = useNotifications();
  const appts = useAsync(() => myAppointments(profile!.id), [profile?.id], !!profile);
  const services = useAsync(listServices, []);
  const banners = useAsync(listBanners, []);
  const docs = useAsync(async () => {
    const [d, ids] = await Promise.all([listDoctors(), doctorIdsWorkingOn(isoWeekday())]);
    return d.map((x) => ({ ...x, today: ids.includes(x.id) }));
  }, []);

  useFocusEffect(useCallback(() => { appts.reload(); services.reload(); banners.reload(); }, [profile?.id])); // eslint-disable-line react-hooks/exhaustive-deps

  const today = todayISO();
  const upcoming = (appts.data ?? [])
    .filter((a) => (a.status === 'pending' || a.status === 'approved') && a.appointment_date >= today)
    .sort((a, b) => (a.appointment_date + a.start_time).localeCompare(b.appointment_date + b.start_time))[0];
  const first = (profile?.full_name ?? '').split(' ')[0];

  const actions = [
    { icon: 'calendar-outline' as const, label: 'Book\nAppointment', color: colors.primary, bg: colors.primarySoft, go: () => router.push('/(patient)/book') },
    { icon: 'people-outline' as const, label: 'Our\nDoctors', color: colors.success, bg: colors.successSoft, go: () => router.push('/doctors') },
    { icon: 'medkit-outline' as const, label: 'Services', color: colors.purple, bg: colors.purpleSoft, go: () => router.push('/(patient)/book') },
    { icon: 'heart-outline' as const, label: 'Health\nTips', color: colors.orange, bg: colors.orangeSoft, go: () => router.push('/tips') },
  ];

  return (
    <Screen bottomSpace={TAB_SPACE} onRefresh={() => { appts.reload(); docs.reload(); services.reload(); banners.reload(); }} refreshing={appts.loading && !!appts.data}>
      {/* header */}
      <View style={s.head}>
        <Avatar path={profile?.avatar_url} name={profile?.full_name} size={46} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{greeting()},</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>{profile?.full_name || 'Welcome'}</Text>
        </View>
        <Pressable onPress={() => router.push('/(patient)/notifications')} style={s.bell} hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          {unread > 0 && <View style={s.dot}><Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{unread > 9 ? '9+' : unread}</Text></View>}
        </Pressable>
      </View>

      {/* hero */}
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={{ flex: 1, paddingRight: 6 }}>
          <Text style={s.heroTitle}>Your Health,{'\n'}Our Priority</Text>
          <Text style={s.heroSub}>Expert care. Better movement. A healthier you.</Text>
          <Pressable onPress={() => router.push('/(patient)/book')} style={s.heroBtn}>
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>Book Appointment</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} style={{ marginLeft: 6 }} />
          </Pressable>
        </View>
        <HeroIllustration width={150} height={110} />
      </LinearGradient>

      {/* quick actions */}
      <View style={s.actions}>
        {actions.map((a) => (
          <Pressable key={a.icon} onPress={a.go} style={s.action}>
            <View style={[s.actionIcon, { backgroundColor: a.bg }]}><Ionicons name={a.icon} size={24} color={a.color} /></View>
            <Text style={s.actionLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* home banners — all active banners, no day filter */}
      {(banners.data ?? []).length > 0 && (
        <>
          <SectionTitle title="Offers & Stories" action="See All" onAction={() => router.push('/(patient)/book')} />
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {(banners.data ?? []).map((b) => (
              <Pressable key={b.id} style={s.bannerCard} onPress={() => { if (b.link_url) Linking.openURL(b.link_url); }}>
                <Image source={{ uri: b.image_url }} style={s.bannerImg} resizeMode="cover" />
                <View style={s.bannerText}>
                  <Text style={s.bannerTitle} numberOfLines={2}>{b.title}</Text>
                  {b.subtitle ? <Text style={s.bannerSub} numberOfLines={2}>{b.subtitle}</Text> : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* upcoming appointment */}
      <SectionTitle title="Upcoming Appointment" action="See all" onAction={() => router.push('/(patient)/appointments')} />
      {appts.loading && !appts.data ? (
        <Card><Text style={{ color: colors.textMuted }}>Loading…</Text></Card>
      ) : upcoming ? (
        <Card onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: upcoming.id } })} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={s.dateBox}>
            <Text style={s.dateDay}>{dayShort(upcoming.appointment_date)}</Text>
            <Text style={s.dateNum}>{dayNum(upcoming.appointment_date)}</Text>
            <Text style={s.dateDay}>{monthShort(upcoming.appointment_date)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>{upcoming.service?.name}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{fullDoctorName(upcoming.doctor?.full_name)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{fmtTime(upcoming.start_time)}</Text>
            <View style={{ marginTop: 6 }}><StatusBadge status={upcoming.status} /></View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      ) : (
        <Card>
          <Text style={{ color: colors.textMuted, marginBottom: 10 }}>You have no upcoming appointments.</Text>
          <Button title="Book your first visit" variant="outline" onPress={() => router.push('/(patient)/book')} style={{ minHeight: 44 }} />
        </Card>
      )}

      {/* services — rectangular grid of actual services */}
      <SectionTitle title="Our Services" action="See All" onAction={() => router.push('/(patient)/book')} />
      {services.loading && !services.data ? (
        <Card><Text style={{ color: colors.textMuted }}>Loading services…</Text></Card>
      ) : (services.data ?? []).length === 0 ? (
        <Card><Text style={{ color: colors.textMuted }}>No services yet.</Text></Card>
      ) : (
        <View style={s.grid}>
          {(services.data ?? []).map((sv) => {
            const v = sv.image_url ?? '';
            return (
              <Pressable key={sv.id} style={s.svcCard} onPress={() => router.push({ pathname: '/booking/new', params: { serviceId: sv.id } })}>
                {v.startsWith('icon:') ? (
                  <View style={s.svcIcon}><Ionicons name={v.slice(5) as any} size={26} color={colors.primary} /></View>
                ) : v.startsWith('http') ? (
                  <Image source={{ uri: v }} style={s.svcImg} resizeMode="cover" />
                ) : (
                  <View style={s.svcIcon}><ServiceArt category={sv.category} size={44} /></View>
                )}
                <Text style={s.svcName} numberOfLines={2}>{sv.name}</Text>
                <Text style={s.svcCat} numberOfLines={1}>{sv.category}</Text>
                <Text style={s.svcPrice}>From {money(sv.price)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <Button title="Book Appointment" onPress={() => router.push('/(patient)/book')} style={{ marginTop: 4 }} />

      {/* doctors */}
      <SectionTitle title="Available Doctors" action="View all" onAction={() => router.push('/doctors')} />
      {docs.data && docs.data.length === 0 ? (
        <Card><Text style={{ color: colors.textMuted }}>Doctors will appear here once the clinic adds them.</Text></Card>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
          {(docs.data ?? []).map((d) => (
            <Pressable key={d.id} onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: d.id } })} style={s.docCard}>
              <Avatar url={d.photo_url} seed={d.id} name={d.full_name} size={56} />
              <Text style={{ fontWeight: '700', color: colors.text, marginTop: 8, fontSize: 13, textAlign: 'center' }} numberOfLines={1}>{fullDoctorName(d.full_name)}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>{d.designation || 'Doctor'}</Text>
              <View style={[s.avail, { backgroundColor: d.today ? colors.successSoft : '#EEF1F5' }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: d.today ? colors.success : colors.textMuted }}>{d.today ? 'Available Today' : 'Not today'}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* recent notifications */}
      <SectionTitle title="Recent Notifications" action="See all" onAction={() => router.push('/(patient)/notifications')} />
      {items.length === 0 ? (
        <Card><Text style={{ color: colors.textMuted }}>No notifications yet.</Text></Card>
      ) : items.slice(0, 3).map((n) => (
        <Card key={n.id} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => (n.appointment_id ? router.push({ pathname: '/appointment/[id]', params: { id: n.appointment_id } }) : router.push('/(patient)/notifications'))}>
          <View style={[s.nIcon, !n.is_read && { backgroundColor: colors.primary }]}>
            <Ionicons name="notifications" size={16} color={n.is_read ? colors.primary : '#fff'} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 13 }} numberOfLines={1}>{n.title}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>{n.body}</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 10 }}>{timeAgo(n.created_at)}</Text>
        </Card>
      ))}

      {/* promo */}
      <Pressable onPress={() => router.push('/(patient)/book')} style={s.promo}>
        <ProgressBannerArt />
        <View style={StyleSheet.absoluteFill}>
          <Text style={s.promoText}>Small Steps,{'\n'}Big Progress</Text>
        </View>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 14 },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow, shadowOpacity: 0.08 },
  dot: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  hero: { borderRadius: radius.xl, padding: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...shadow },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 27 },
  heroSub: { color: '#DCEBFF', fontSize: 11, marginTop: 6, lineHeight: 16 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, marginTop: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  action: { width: '23%', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.lg, paddingVertical: 12, ...shadow, shadowOpacity: 0.06 },
  actionIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 10.5, color: colors.text, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  dateBox: { width: 56, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center' },
  dateDay: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  dateNum: { fontSize: 22, color: colors.text, fontWeight: '800', lineHeight: 26 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  svcCard: { width: '48.5%', backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...shadow, shadowOpacity: 0.07 },
  svcIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  svcImg: { width: '100%', height: 72, borderRadius: radius.md, marginBottom: 10 },
  svcName: { fontWeight: '700', color: colors.text, fontSize: 14, lineHeight: 18 },
  svcCat: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  svcPrice: { fontSize: 13, fontWeight: '800', color: colors.primary, marginTop: 6 },
  bannerCard: { width: Dimensions.get('window').width - 40, backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', marginRight: 12, borderWidth: 1, borderColor: colors.border, ...shadow, shadowOpacity: 0.07 },
  bannerImg: { width: '100%', height: 150 },
  bannerText: { padding: 12 },
  bannerTitle: { fontWeight: '800', color: colors.text, fontSize: 15, lineHeight: 19 },
  bannerSub: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  docCard: { width: 130, backgroundColor: '#fff', borderRadius: radius.lg, padding: 12, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E6F0FB' },
  avail: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  nIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  promo: { height: 90, borderRadius: radius.lg, overflow: 'hidden', marginTop: 18 },
  promoText: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 24, margin: 16 },
});
