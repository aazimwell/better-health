import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, ErrorView, Header, Loading, Row, Screen } from '@/components/ui';
import { LogoMark } from '@/components/illustrations';
import { useAsync } from '@/hooks/useAsync';
import { getClinic, listServices } from '@/services/api';
import { colors } from '@/theme';

export default function About() {
  const router = useRouter();
  const clinic = useAsync(getClinic, []);
  const services = useAsync(listServices, []);
  const c = clinic.data;
  return (
    <Screen>
      <Header title="About Us" />
      {clinic.loading ? <Loading /> : clinic.error || !c ? <ErrorView message={clinic.error ?? 'Unavailable'} onRetry={clinic.reload} /> : (
        <>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <LogoMark size={64} />
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 8, textAlign: 'center' }}>{c.clinic_name}</Text>
          </View>
          <Card><Text style={{ color: colors.text, lineHeight: 22 }}>{c.introduction}</Text></Card>

          {(services.data ?? []).length > 0 && (
            <Card style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 6 }}>Our services</Text>
              {(services.data ?? []).map((s) => <Text key={s.id} style={{ color: colors.text, paddingVertical: 3 }}>• {s.name}</Text>)}
            </Card>
          )}

          <Card style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 6 }}>Contact & location</Text>
            <Line icon="location-outline" text={c.address} />
            {c.phone ? <Line icon="call-outline" text={c.phone} onPress={() => Linking.openURL(`tel:${c.phone}`)} /> : null}
            {c.email ? <Line icon="mail-outline" text={c.email} onPress={() => Linking.openURL(`mailto:${c.email}`)} /> : null}
            <Line icon="time-outline" text={c.opening_hours} />
            <Line icon="map-outline" text="Open in Maps" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`)} />
          </Card>

          <Card style={{ marginTop: 12, paddingVertical: 4 }}>
            <Row icon="lock-closed-outline" label="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
            <Row icon="document-text-outline" label="Terms & Conditions" onPress={() => router.push('/legal/terms')} />
            <Row icon="code-slash-outline" label="Developer" last onPress={() => router.push('/profile/developer')} />
          </Card>
        </>
      )}
    </Screen>
  );
}

const Line = ({ icon, text, onPress }: { icon: keyof typeof Ionicons.glyphMap; text: string; onPress?: () => void }) => (
  <View style={{ flexDirection: 'row', paddingVertical: 6 }}>
    <Ionicons name={icon} size={18} color={colors.primary} />
    <Text onPress={onPress} style={{ marginLeft: 10, flex: 1, color: onPress ? colors.primary : colors.text }}>{text}</Text>
  </View>
);
