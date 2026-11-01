import React from 'react';
import { Header, Screen } from '@/components/ui';
import { TodayView } from '@/components/TodayView';
import { TAB_SPACE } from '@/lib/utils';

export default function AssistantToday() {
  return (
    <Screen bottomSpace={TAB_SPACE}>
      <Header title="Daily Schedule" back={false} />
      <TodayView showDoctor />
    </Screen>
  );
}
