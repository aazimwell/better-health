import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { LogoMark } from '@/components/illustrations';
import { radius, shadow } from '@/theme';
import { useAuth } from '@/lib/auth';
import { Banner } from '@/components/ui';

export default function Welcome() {
  const router = useRouter();
  const { configured } = useAuth();
  return (
    <View style={{ flex: 1 }}>
      {/* Full-screen photo background (the photo file itself is unchanged) */}
      <Image
        source={require('../../src/assets/welcome-hero.webp')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Subtle dark gradient at top and bottom only, so the header text stays readable */}
      <LinearGradient
        colors={['rgba(4, 18, 48, 0.62)', 'rgba(4, 18, 48, 0.08)', 'rgba(4, 18, 48, 0.08)', 'rgba(4, 18, 48, 0.72)']}
        locations={[0, 0.38, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }} edges={['top', 'bottom']}>
        <View style={s.top}>
          <View style={s.brand}>
            <LogoMark size={46} />
            <View style={{ marginLeft: 10 }}>
              <Text style={s.brandName}>Better Health</Text>
              <Text style={s.brandSub}>Physiotherapy &amp; Chiropractic</Text>
            </View>
          </View>
          <Text style={s.headline}>Move Better,{'\n'}Live Healthier</Text>
          <Text style={s.sub}>Professional physiotherapy &amp; chiropractic care for a pain-free tomorrow.</Text>
        </View>

        <View style={s.sheet}>
          {!configured && <Banner type="info" text="Setup needed: add your Supabase URL and key to .env (see README)." />}
          <Button title="Log In" icon="arrow-forward" onPress={() => router.push('/(auth)/login')} style={{ backgroundColor: '#0B4FD8' }} />
          <Button title="Register" variant="outline" onPress={() => router.push('/(auth)/register')} style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderColor: '#0B4FD8' }} />
          <Pressable style={s.admin} onPress={() => router.push('/(auth)/admin-login')}>
            <Ionicons name="shield-checkmark" size={18} color="#0B4FD8" />
            <Text style={s.adminText}>Admin Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  top: { paddingHorizontal: 24, paddingTop: 12 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandName: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  brandSub: { fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' },
  headline: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', marginTop: 24, lineHeight: 40 },
  sub: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', marginTop: 10, lineHeight: 20, maxWidth: 290 },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 22, ...shadow },
  admin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(11, 79, 216, 0.35)', backgroundColor: 'rgba(11, 79, 216, 0.12)' },
  adminText: { marginLeft: 8, fontWeight: '700', color: '#0B4FD8' },
});
