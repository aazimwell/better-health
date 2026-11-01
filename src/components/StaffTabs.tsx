import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/notifications';
import { Loading, Screen } from './ui';
import { PremiumTabBar } from './PremiumTabBar';
import { colors } from '@/theme';
import type { Role } from '@/lib/types';

type Icon = keyof typeof Ionicons.glyphMap;
export interface StaffTab { name: string; title: string; icon: Icon; active: Icon; badge?: boolean }

/** Role-guarded bottom tabs for admin / doctor / assistant. The guard is UX only — RLS is the real protection. */
export function StaffTabs({ roles, tabs }: { roles: Role[]; tabs: StaffTab[] }) {
  const { session, role, loading } = useAuth();
  const { unread } = useNotifications();
  const insets = useSafeAreaInsets();
  if (loading) return <Screen scroll={false}><Loading /></Screen>;
  if (!session || !role || !roles.includes(role)) return <Redirect href="/" />;
  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: '#8FA3BD',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: '#fff', borderTopWidth: 0, height: 60 + insets.bottom, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 6),
          borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'absolute',
          shadowColor: '#1A4F99', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 12,
        },
        tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 10 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{
          title: t.title,
          tabBarBadge: t.badge && unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? t.active : t.icon} size={24} color={color} />,
        }} />
      ))}
    </Tabs>
  );
}
