import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui';
import { LogoMark, WelcomeIllustration } from '@/components/illustrations';
import { colors, radius, shadow } from '@/theme';
import { useAuth } from '@/lib/auth';
import { Banner } from '@/components/ui';

export default function Welcome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { configured } = useAuth();
  return (
    <LinearGradient colors={['#CFE6FF', '#E6F2FF', '#F7FBFF']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={s.top}>
          <View style={s.brand}>
            <LogoMark size={46} />
            <View style={{ marginLeft: 10 }}>
              <Text style={s.brandName}>Better Health</Text>
              <Text style={s.brandSub}>Physiotherapy & Chiropractic</Text>
            </View>
          </View>
          <Text style={s.headline}>Move Better,{'\n'}Live Healthier</Text>
          <Text style={s.sub}>Professional physiotherapy & chiropractic care for a pain-free tomorrow.</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <WelcomeIllustration width={width} height={(width * 250) / 340} />
        </View>

        <View style={s.sheet}>
          {!configured && <Banner type="info" text="Setup needed: add your Supabase URL and key to .env (see README)." />}
          <Button title="Log In" icon="arrow-forward" onPress={() => router.push('/(auth)/login')} />
          <Button title="Register" variant="outline" onPress={() => router.push('/(auth)/register')} style={{ marginTop: 12 }} />
          <Pressable style={s.admin} onPress={() => router.push('/(auth)/admin-login')}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={s.adminText}>Admin Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  top: { paddingHorizontal: 24, paddingTop: 12 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandName: { fontSize: 26, fontWeight: '800', color: colors.primary },
  brandSub: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  headline: { fontSize: 34, fontWeight: '800', color: colors.text, marginTop: 24, lineHeight: 40 },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 10, lineHeight: 20, maxWidth: 290 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 22, ...shadow },
  admin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgLight },
  adminText: { marginLeft: 8, fontWeight: '700', color: colors.text },
});
