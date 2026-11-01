import React from 'react';
import { Redirect } from 'expo-router';
import { homeFor, useAuth } from '@/lib/auth';
import { Loading, Screen } from '@/components/ui';

/** Entry point: restores the session, then routes by the role stored in the database. */
export default function Index() {
  const { loading, session, role } = useAuth();
  if (loading) return <Screen scroll={false}><Loading /></Screen>;
  if (!session || !role) return <Redirect href="/(auth)/welcome" />;
  return <Redirect href={homeFor(role) as any} />;
}
