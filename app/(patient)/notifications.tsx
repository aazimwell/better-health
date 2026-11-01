import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Card, EmptyState, Header, Loading, Screen } from '@/components/ui';
import { useNotifications } from '@/lib/notifications';
import { TAB_SPACE, timeAgo } from '@/lib/utils';
import { colors } from '@/theme';
import type { AppNotification } from '@/lib/types';

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  appointment: 'calendar', announcement: 'megaphone', reminder: 'alarm', system: 'information-circle',
};

/** Shared by patient tab and staff screens. */
export function NotificationList() {
  const router = useRouter();
  const { items, loading, unread, reload, read, readAll } = useNotifications();
  const open = async (n: AppNotification) => {
    await read(n);
    if (n.appointment_id) router.push({ pathname: '/appointment/[id]', params: { id: n.appointment_id } });
  };
  return (
    <>
      {unread > 0 && <Button title={`Mark all as read (${unread})`} variant="outline" onPress={readAll} style={{ marginBottom: 14, minHeight: 44 }} />}
      {loading && items.length === 0 ? <Loading /> : items.length === 0 ? (
        <EmptyState kind="bell" title="No notifications" message="Appointment updates and clinic announcements will appear here." />
      ) : items.map((n) => (
        <Card key={n.id} onPress={() => open(n)} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: n.is_read ? '#fff' : '#F1F8FF' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: n.is_read ? colors.primarySoft : colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={ICON[n.category] ?? 'notifications'} size={19} color={n.is_read ? colors.primary : '#fff'} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: n.is_read ? '600' : '800', color: colors.text }}>{n.title}</Text>
            {!!n.body && <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{n.body}</Text>}
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 4, textTransform: 'capitalize' }}>{n.category} · {timeAgo(n.created_at)}</Text>
          </View>
          {!n.is_read && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }} />}
        </Card>
      ))}
    </>
  );
}

export default function Notifications() {
  const { reload, loading, items } = useNotifications();
  return (
    <Screen bottomSpace={TAB_SPACE} onRefresh={reload} refreshing={loading && items.length > 0}>
      <Header title="Notifications" back={false} />
      <NotificationList />
    </Screen>
  );
}
