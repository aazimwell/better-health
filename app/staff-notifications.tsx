import React from 'react';
import { Header, Screen } from '@/components/ui';
import { NotificationList } from './(patient)/notifications';
import { useNotifications } from '@/lib/notifications';

export default function StaffNotifications() {
  const { reload, loading, items } = useNotifications();
  return (
    <Screen onRefresh={reload} refreshing={loading && items.length > 0}>
      <Header title="Notifications" />
      <NotificationList />
    </Screen>
  );
}
