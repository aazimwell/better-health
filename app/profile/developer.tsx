import React from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Header, Screen } from '@/components/ui';
import { DeveloperPlaceholder, LogoMark } from '@/components/illustrations';
import { APP_VERSION, DEVELOPER } from '@/config';
import { colors, gradients, radius, shadow } from '@/theme';

export default function Developer() {
  return (
    <Screen>
      <Header title="Developer" />
      <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 24, alignItems: 'center', ...shadow }}>
        <View style={{ borderWidth: 4, borderColor: '#fff', borderRadius: 56, overflow: 'hidden' }}>
          {DEVELOPER.photo ? <Image source={DEVELOPER.photo} style={{ width: 104, height: 104 }} /> : <DeveloperPlaceholder size={104} />}
        </View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 12 }}>{DEVELOPER.name}</Text>
        <Text style={{ color: '#DCEBFF', fontWeight: '600' }}>{DEVELOPER.role}</Text>
      </LinearGradient>

      <Card style={{ marginTop: 16 }}>
        <Text style={{ color: colors.text, lineHeight: 22 }}>{DEVELOPER.description}</Text>
      </Card>
      <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
        <LogoMark size={40} />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontWeight: '800', color: colors.text }}>Better Health</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Version {APP_VERSION}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Developed by {DEVELOPER.name}</Text>
        </View>
      </Card>
      {DEVELOPER.links.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 10 }}>
          {DEVELOPER.links.map((l) => (
            <Pressable key={l.url} onPress={() => Linking.openURL(l.url)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name={l.icon as any} size={18} color={colors.primary} />
              <Text style={{ marginLeft: 8, fontWeight: '700', color: colors.text }}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
