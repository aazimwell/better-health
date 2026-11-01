import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Header, Screen } from '@/components/ui';
import { colors } from '@/theme';

// General wellness reminders — not medical advice, not clinic-specific claims.
const TIPS = [
  { icon: 'body-outline', t: 'Move regularly', d: 'Stand up and stretch every 30–45 minutes if you sit for long periods.' },
  { icon: 'water-outline', t: 'Stay hydrated', d: 'Drinking enough water supports muscles and joints.' },
  { icon: 'walk-outline', t: 'Build gradually', d: 'Increase exercise intensity slowly to avoid strain and injury.' },
  { icon: 'bed-outline', t: 'Rest and recover', d: 'Quality sleep helps your body repair itself.' },
  { icon: 'desktop-outline', t: 'Set up your workspace', d: 'Keep your screen at eye level and your feet flat on the floor.' },
  { icon: 'medkit-outline', t: 'Do not ignore pain', d: 'Persistent or worsening pain should be checked by a professional.' },
] as const;

export default function Tips() {
  return (
    <Screen>
      <Header title="Health Tips" />
      {TIPS.map((x) => (
        <Card key={x.t} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={x.icon} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>{x.t}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 18 }}>{x.d}</Text>
          </View>
        </Card>
      ))}
      <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 }}>General wellness information only — not a substitute for professional medical advice.</Text>
    </Screen>
  );
}
