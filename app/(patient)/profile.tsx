import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar, Banner, Card, Header, Row, Screen, confirmAction } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { TAB_SPACE } from '@/lib/utils';
import { colors } from '@/theme';

export default function Profile() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [err, setErr] = useState('');

  const logout = async () => {
    if (!(await confirmAction('Log out', 'Are you sure you want to log out?', 'Log out'))) return;
    try { await signOut(); router.replace('/(auth)/welcome'); } catch (e: any) { setErr(e?.message ?? 'Could not log out'); }
  };

  const go = (p: string) => () => router.push(p as any);
  return (
    <Screen bottomSpace={TAB_SPACE}>
      <Header title="My Profile" back={false} />
      {err ? <Banner type="error" text={err} /> : null}
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar path={profile?.avatar_url} name={profile?.full_name} size={64} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{profile?.full_name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{profile?.email}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{profile?.phone}</Text>
        </View>
        <Ionicons name="create-outline" size={22} color={colors.primary} onPress={go('/profile/personal')} />
      </Card>
      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <Row icon="person-outline" label="Personal Information" onPress={go('/profile/personal')} />
        <Row icon="document-text-outline" label="Medical History" onPress={go('/profile/medical')} />
        <Row icon="shield-checkmark-outline" label="Insurance & Coverage" onPress={go('/profile/insurance')} />
        <Row icon="card-outline" label="Payment Methods" onPress={go('/profile/payments')} />
        <Row icon="notifications-outline" label="Notifications" onPress={go('/profile/notif-settings')} />
        <Row icon="help-buoy-outline" label="Help & Support" onPress={go('/profile/support')} />
        <Row icon="information-circle-outline" label="About Us" onPress={go('/profile/about')} />
        <Row icon="log-out-outline" label="Logout" danger last onPress={logout} />
      </Card>
    </Screen>
  );
}
