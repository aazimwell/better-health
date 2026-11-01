import React from 'react';
import { Header, Screen } from '@/components/ui';
import { TodayView } from '@/components/TodayView';
import { TAB_SPACE } from '@/lib/utils';

export default function DoctorToday() {
  return (
    <Screen bottomSpace={TAB_SPACE}>
      <Header title="My Appointments" back={false} />
      <TodayView />
    </Screen>
  );
}
