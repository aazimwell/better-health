import React from 'react';
import { Header, Screen } from '@/components/ui';
import { CalendarView } from '@/components/CalendarView';
import { TAB_SPACE } from '@/lib/utils';

export default function DoctorCalendar() {
  return (
    <Screen bottomSpace={TAB_SPACE}>
      <Header title="Appointment History" back={false} />
      <CalendarView lockDoctorId="mine" />
    </Screen>
  );
}
