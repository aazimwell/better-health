import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { homeFor, useAuth } from '@/lib/auth';

export default function AuthLayout() {
  const { session, role, loading } = useAuth();
  if (!loading && session && role) return <Redirect href={homeFor(role) as any} />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
