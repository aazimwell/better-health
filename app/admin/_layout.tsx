import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { isAdminRole, useAuth } from '@/lib/auth';

/** UX guard only — every query/RPC behind these screens is enforced by RLS in the database. */
export default function AdminStack() {
  const { role, loading } = useAuth();
  if (!loading && !isAdminRole(role)) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
