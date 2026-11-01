import React from 'react';
import { StaffTabs } from '@/components/StaffTabs';

export default function AssistantLayout() {
  return (
    <StaffTabs roles={['assistant']} tabs={[
      { name: 'today', title: 'Today', icon: 'today-outline', active: 'today' },
      { name: 'calendar', title: 'Calendar', icon: 'calendar-outline', active: 'calendar' },
      { name: 'alerts', title: 'Alerts', icon: 'notifications-outline', active: 'notifications', badge: true },
      { name: 'account', title: 'Account', icon: 'person-outline', active: 'person' },
    ]} />
  );
}
