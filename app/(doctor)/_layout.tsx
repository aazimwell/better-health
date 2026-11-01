import React from 'react';
import { StaffTabs } from '@/components/StaffTabs';

export default function DoctorLayout() {
  return (
    <StaffTabs roles={['doctor']} tabs={[
      { name: 'today', title: 'Today', icon: 'today-outline', active: 'today' },
      { name: 'calendar', title: 'Calendar', icon: 'calendar-outline', active: 'calendar' },
      { name: 'schedule', title: 'Schedule', icon: 'time-outline', active: 'time' },
      { name: 'alerts', title: 'Alerts', icon: 'notifications-outline', active: 'notifications', badge: true },
      { name: 'account', title: 'Account', icon: 'person-outline', active: 'person' },
    ]} />
  );
}
