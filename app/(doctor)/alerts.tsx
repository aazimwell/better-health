import React from 'react';
import { Header, Screen } from '@/components/ui';
import { NotificationList } from '../(patient)/notifications';
import { useNotifications } from '@/lib/notifications';
import { TAB_SPACE } from '@/lib/utils';

export default function DoctorAlerts() {
  const { reload, loading, items } = useNotifications();
  return (
    <Screen bottomSpace={TAB_SPACE} onRefresh={reload} refreshing={loading && items.length > 0}>
      <Header title="Notifications" back={false} />
      <NotificationList />
    </Screen>
  );
}
