import React from 'react';
import { Header, Screen } from '@/components/ui';
import { CalendarView } from '@/components/CalendarView';
import { TAB_SPACE } from '@/lib/utils';

export default function AssistantCalendar() {
  return (
    <Screen bottomSpace={TAB_SPACE}>
      <Header title="Appointments" back={false} />
      <CalendarView />
    </Screen>
  );
}
