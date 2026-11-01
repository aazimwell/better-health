import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Card, Header, Row, Screen, confirmAction } from './ui';
import { useAuth } from '@/lib/auth';
import { TAB_SPACE } from '@/lib/utils';
import { colors } from '@/theme';

/** Account tab shared by admin, doctor and assistant. */
export function StaffAccount({ extra }: { extra?: React.ReactNode }) {
  const router = useRouter();
  const { profile, signOut, role } = useAuth();
  const logout = async () => {
    if (!(await confirmAction('Log out', 'Are you sure you want to log out?', 'Log out'))) return;
    await signOut();
    router.replace('/(auth)/welcome');
  };
  return (
    <Screen bottomSpace={TAB_SPACE}>
      <Header title="Account" back={false} />
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar path={profile?.avatar_url} name={profile?.full_name} size={60} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{profile?.full_name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{profile?.email}</Text>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 }}>{role?.replace('_', ' ')}</Text>
        </View>
      </Card>
      {extra}
      <Card style={{ marginTop: 16, paddingVertical: 4 }}>
        <Row icon="person-outline" label="Personal Information" onPress={() => router.push('/profile/personal')} />
        <Row icon="notifications-outline" label="Notifications" onPress={() => router.push('/staff-notifications')} />
        <Row icon="information-circle-outline" label="About & Developer" onPress={() => router.push('/profile/developer')} />
        <Row icon="log-out-outline" label="Logout" danger last onPress={logout} />
      </Card>
    </Screen>
  );
}
