import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { listNotifications, markAllRead, markRead } from '@/services/api';
import type { AppNotification } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }),
});

interface Ctx {
  items: AppNotification[]; unread: number; loading: boolean;
  reload: () => Promise<void>; read: (n: AppNotification) => Promise<void>; readAll: () => Promise<void>;
}
const NCtx = createContext<Ctx>({ items: [], unread: 0, loading: false, reload: async () => {}, read: async () => {}, readAll: async () => {} });
export const useNotifications = () => useContext(NCtx);

/** Registers an Expo push token. Delivery when the app is closed needs the `send-push` Edge Function + a Database Webhook (see supabase/functions/send-push/README.md) — without those two deploy steps, notifications only arrive in-app while open. */
async function registerPush(userId: string) {
  try {
    if (!Device.isDevice) return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Better Health', importance: Notifications.AndroidImportance.HIGH, lightColor: '#0B4FD8', vibrationPattern: [0, 250, 250, 250], showBadge: true });
    }
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;
    const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId;
    if (!projectId || String(projectId).startsWith('REPLACE')) return; // EAS project not linked yet
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
  } catch { /* push is an optional extra layer */ }
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const uid = profile?.id;
  const uidRef = useRef(uid);
  uidRef.current = uid;

  const reload = useCallback(async () => {
    if (!uidRef.current) return;
    setLoading(true);
    try { setItems(await listNotifications(uidRef.current)); } catch { /* keep old list */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!uid) { setItems([]); return; }
    reload();
    registerPush(uid);
    const ch = supabase.channel(`notif-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (p) => setItems((prev) => [p.new as AppNotification, ...prev.filter((x) => x.id !== (p.new as any).id)]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (p) => setItems((prev) => prev.map((x) => (x.id === (p.new as any).id ? (p.new as AppNotification) : x))))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [uid, reload]);

  // tapping a push notification opens the related appointment
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const id = (r.notification.request.content.data as any)?.appointment_id;
      if (id) router.push({ pathname: '/appointment/[id]', params: { id } });
    });
    return () => sub.remove();
  }, [router]);

  const read = useCallback(async (n: AppNotification) => {
    if (n.is_read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    try { await markRead(n.id); } catch { reload(); }
  }, [reload]);

  const readAll = useCallback(async () => {
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    try { await markAllRead(); } catch { reload(); }
  }, [reload]);

  const value = useMemo(() => ({ items, unread: items.filter((i) => !i.is_read).length, loading, reload, read, readAll }), [items, loading, reload, read, readAll]);
  return <NCtx.Provider value={value}>{children}</NCtx.Provider>;
}
