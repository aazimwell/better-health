import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, Header, Input, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';
import { friendlyError, isEmail } from '@/lib/utils';

/**
 * Admin login. Permission is verified from profiles.role in the database inside signIn(adminOnly);
 * a non-admin account is signed straight back out. All admin data is additionally protected by RLS.
 */
export default function AdminLogin() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!isEmail(email)) return setErr('Enter a valid email address.');
    if (!password) return setErr('Enter your password.');
    setErr(''); setBusy(true);
    try { await signIn(email, password, { adminOnly: true }); router.replace('/'); }
    catch (e) { setErr(friendlyError(e)); } finally { setBusy(false); }
  };

  return (
    <Screen keyboard>
      <Header title="Admin Login" />
      <View style={{ alignItems: 'center', marginVertical: 18 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="shield-checkmark" size={38} color={colors.primary} />
        </View>
        <Text style={{ color: colors.textMuted, marginTop: 10, textAlign: 'center' }}>Restricted area. Only authorised clinic administrators can continue.</Text>
      </View>
      {err ? <Banner type="error" text={err} /> : null}
      <Input label="Admin email" icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="admin@clinic.com" />
      <Input label="Password" icon="lock-closed-outline" secure value={password} onChangeText={setPassword} placeholder="Password" onSubmitEditing={submit} />
      <Pressable onPress={() => router.push('/(auth)/forgot')} style={{ alignSelf: 'flex-end', marginBottom: 18 }}>
        <Text style={{ color: colors.primary, fontWeight: '600' }}>Forgot password?</Text>
      </Pressable>
      <Button title="Log In as Admin" icon="shield-checkmark" onPress={submit} loading={busy} />
      <Card style={{ marginTop: 22 }}>
        <Text style={{ fontWeight: '700', color: colors.text }}>Need admin access?</Text>
        <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 13 }}>
          Admin accounts are never created by public sign-up. Register as a normal user, then ask the Super Admin to approve your application.
        </Text>
        <Button title="Apply for admin access" variant="outline" onPress={() => router.push('/(auth)/admin-apply')} style={{ marginTop: 12, minHeight: 44 }} />
      </Card>
    </Screen>
  );
}
