import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Banner, Button, Header, Input, Screen } from '@/components/ui';
import { LogoMark } from '@/components/illustrations';
import { useAuth, homeFor } from '@/lib/auth';
import { colors } from '@/theme';
import { friendlyError, isEmail } from '@/lib/utils';

type F = { email: string; password: string };

export default function Login() {
  const router = useRouter();
  const { signIn, profile } = useAuth();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<F>({ defaultValues: { email: '', password: '' } });

  const submit = handleSubmit(async (v) => {
    if (busy) return; // prevent duplicate submissions
    setErr(''); setBusy(true);
    try {
      await signIn(v.email, v.password);
      router.replace('/');
    } catch (e) { setErr(friendlyError(e)); } finally { setBusy(false); }
  });

  return (
    <Screen keyboard>
      <Header title="Welcome back" />
      <View style={{ alignItems: 'center', marginVertical: 14 }}><LogoMark size={64} /></View>
      <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 20 }}>Log in to manage your appointments</Text>
      {err ? <Banner type="error" text={err} /> : null}
      <Controller control={control} name="email" rules={{ required: 'Email is required', validate: (v) => isEmail(v) || 'Enter a valid email' }}
        render={({ field }) => (
          <Input label="Email" icon="mail-outline" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address"
            value={field.value} onChangeText={field.onChange} error={errors.email?.message} />
        )} />
      <Controller control={control} name="password" rules={{ required: 'Password is required' }}
        render={({ field }) => (
          <Input label="Password" icon="lock-closed-outline" placeholder="Your password" secure
            value={field.value} onChangeText={field.onChange} error={errors.password?.message} onSubmitEditing={submit} />
        )} />
      <Pressable onPress={() => router.push('/(auth)/forgot')} style={{ alignSelf: 'flex-end', marginBottom: 18 }}>
        <Text style={{ color: colors.primary, fontWeight: '600' }}>Forgot password?</Text>
      </Pressable>
      <Button title="Log In" onPress={submit} loading={busy} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
        <Text style={{ color: colors.textMuted }}>New here? </Text>
        <Pressable onPress={() => router.replace('/(auth)/register')}><Text style={{ color: colors.primary, fontWeight: '700' }}>Create an account</Text></Pressable>
      </View>
    </Screen>
  );
}
