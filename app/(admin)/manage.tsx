import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, Header, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { TAB_SPACE } from '@/lib/utils';
import { colors } from '@/theme';

export default function Manage() {
  const router = useRouter();
  const { role } = useAuth();
  const go = (p: string) => () => router.push(p as any);
  return (
    <Screen bottomSpace={TAB_SPACE}>
      <Header title="Management" back={false} />
      <Card style={{ paddingVertical: 4 }}>
        <Row icon="people-outline" label="Patients" onPress={go('/admin/patients')} />
        <Row icon="medkit-outline" label="Doctors" onPress={go('/admin/doctors')} />
        <Row icon="people-circle-outline" label="Assistants" onPress={go('/admin/assistants')} />
        <Row icon="list-outline" label="Services" onPress={go('/admin/services')} />
        <Row icon="list-circle-outline" label="All appointments" onPress={go('/admin/appointments')} />
        <Row icon="bar-chart-outline" label="Reports & analytics" onPress={go('/admin/reports')} />
        <Row icon="megaphone-outline" label="Send announcement" onPress={go('/admin/announce')} />
        <Row icon="chatbubbles-outline" label="Support inbox" onPress={go('/admin/support')} />
        <Row icon="business-outline" label="Clinic settings" onPress={go('/admin/clinic')} />
        <Row icon="key-outline" label="Roles & admin access" last onPress={go('/admin/roles')} />
      </Card>
      {role !== 'super_admin' && (
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 6, flex: 1 }}>Granting admin access is limited to the Super Admin.</Text>
        </View>
      )}
    </Screen>
  );
}
