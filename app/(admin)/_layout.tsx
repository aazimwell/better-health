import React from 'react';
import { StaffTabs } from '@/components/StaffTabs';

export default function AdminLayout() {
  return (
    <StaffTabs roles={['admin', 'super_admin']} tabs={[
      { name: 'dashboard', title: 'Dashboard', icon: 'grid-outline', active: 'grid' },
      { name: 'requests', title: 'Requests', icon: 'mail-unread-outline', active: 'mail-unread', badge: true },
      { name: 'calendar', title: 'Calendar', icon: 'calendar-outline', active: 'calendar' },
      { name: 'manage', title: 'Manage', icon: 'settings-outline', active: 'settings' },
      { name: 'account', title: 'Account', icon: 'person-outline', active: 'person' },
    ]} />
  );
}
