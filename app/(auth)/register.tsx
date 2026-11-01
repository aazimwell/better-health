import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { Banner, Button, Header, Input, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';
import { friendlyError, isEmail, isPhone } from '@/lib/utils';

type F = { fullName: string; email: string; phone: string; password: string; confirm: string };

export default function Register() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const { control, handleSubmit, getValues, formState: { errors } } = useForm<F>({
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirm: '' },
  });

  const submit = handleSubmit(async (v) => {
    if (busy) return;
    if (!agree) return setErr('Please accept the Terms and Privacy Policy to continue.');
    setErr(''); setInfo(''); setBusy(true);
    try {
      const { needsConfirmation } = await signUp(v);
      if (needsConfirmation) setInfo('Account created! Check your email to confirm your address, then log in.');
      else router.replace('/');
    } catch (e) { setErr(friendlyError(e)); } finally { setBusy(false); }
  });

  const rules = {
    fullName: { required: 'Full name is required', minLength: { value: 3, message: 'Enter your full name' } },
    email: { required: 'Email is required', validate: (v: string) => isEmail(v) || 'Enter a valid email' },
    phone: { required: 'Phone number is required', validate: (v: string) => isPhone(v) || 'Enter a valid phone number' },
    password: { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } },
    confirm: { required: 'Confirm your password', validate: (v: string) => v === getValues('password') || 'Passwords do not match' },
  };

  return (
    <Screen keyboard>
      <Header title="Create Account" />
      {err ? <Banner type="error" text={err} /> : null}
      {info ? <Banner type="success" text={info} /> : null}
      <Controller control={control} name="fullName" rules={rules.fullName} render={({ field }) => (
        <Input label="Full name" icon="person-outline" placeholder="Your full name" value={field.value} onChangeText={field.onChange} error={errors.fullName?.message} />)} />
      <Controller control={control} name="email" rules={rules.email} render={({ field }) => (
        <Input label="Email address" icon="mail-outline" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} error={errors.email?.message} />)} />
      <Controller control={control} name="phone" rules={rules.phone} render={({ field }) => (
        <Input label="Phone number" icon="call-outline" placeholder="+880 …" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} error={errors.phone?.message} />)} />
      <Controller control={control} name="password" rules={rules.password} render={({ field }) => (
        <Input label="Password" icon="lock-closed-outline" placeholder="At least 8 characters" secure value={field.value} onChangeText={field.onChange} error={errors.password?.message} />)} />
      <Controller control={control} name="confirm" rules={rules.confirm} render={({ field }) => (
        <Input label="Confirm password" icon="lock-closed-outline" placeholder="Repeat password" secure value={field.value} onChangeText={field.onChange} error={errors.confirm?.message} />)} />

      <Pressable onPress={() => setAgree((a) => !a)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
        <Text style={{ flex: 1, marginLeft: 10, color: colors.text, fontSize: 13 }}>
          I accept the <Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => router.push('/legal/terms')}>Terms</Text> and{' '}
          <Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => router.push('/legal/privacy')}>Privacy Policy</Text>
        </Text>
      </Pressable>
      <Button title="Create Account" onPress={submit} loading={busy} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18 }}>
        <Text style={{ color: colors.textMuted }}>Already registered? </Text>
        <Pressable onPress={() => router.replace('/(auth)/login')}><Text style={{ color: colors.primary, fontWeight: '700' }}>Log in</Text></Pressable>
      </View>
    </Screen>
  );
}
