import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/notifications';
import { Loading, Screen } from '@/components/ui';
import { colors } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;
const TABS: { name: string; title: string; icon: IconName; active: IconName }[] = [
  { name: 'home', title: 'Home', icon: 'home-outline', active: 'home' },
  { name: 'book', title: 'Book', icon: 'add-circle-outline', active: 'add-circle' },
  { name: 'appointments', title: 'Appointments', icon: 'calendar-outline', active: 'calendar' },
  { name: 'notifications', title: 'Alerts', icon: 'notifications-outline', active: 'notifications' },
  { name: 'profile', title: 'Profile', icon: 'person-outline', active: 'person' },
];

export default function PatientLayout() {
  const { session, role, loading } = useAuth();
  const { unread } = useNotifications();
  const insets = useSafeAreaInsets();
  if (loading) return <Screen scroll={false}><Loading /></Screen>;
  if (!session || role !== 'patient') return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8FA3BD',
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
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarBadge: t.name === 'notifications' && unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? t.active : t.icon} size={24} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
