import React, { useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Banner, Card, ErrorView, Header, Loading, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { getNotificationPrefs, saveNotificationPrefs } from '@/services/api';
import { friendlyError } from '@/lib/utils';
import { colors } from '@/theme';

const ITEMS = [
  { k: 'push_enabled', t: 'Push notifications', d: 'Alerts on your phone (needs push setup by the clinic)' },
  { k: 'appointment_updates', t: 'Appointment updates', d: 'Approved, rejected, rescheduled, cancelled, completed' },
  { k: 'announcements', t: 'Clinic announcements', d: 'News and important notices' },
  { k: 'reminders', t: 'Appointment reminders', d: 'Reminder before your visit' },
];

export default function NotifSettings() {
  const { profile } = useAuth();
  const { data, loading, error, reload } = useAsync(() => getNotificationPrefs(profile!.id), [profile?.id], !!profile);
  const [p, setP] = useState<any>({});
  const [err, setErr] = useState('');
  useEffect(() => { if (data) setP(data); }, [data]);

  const toggle = async (k: string, v: boolean) => {
    const prev = p; setP({ ...p, [k]: v }); setErr('');
    try { await saveNotificationPrefs(profile!.id, { [k]: v }); } catch (e) { setP(prev); setErr(friendlyError(e)); }
  };
  return (
    <Screen>
      <Header title="Notifications" />
      {err ? <Banner type="error" text={err} /> : null}
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (
        <Card>
          {ITEMS.map((i, idx) => (
            <View key={i.k} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: idx ? 1 : 0, borderTopColor: colors.border }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{i.t}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{i.d}</Text>
              </View>
              <Switch value={!!p[i.k]} onValueChange={(v) => toggle(i.k, v)} trackColor={{ true: colors.primary, false: '#CBD5E1' }} />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}
