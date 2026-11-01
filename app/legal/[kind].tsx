import React from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card, ErrorView, Header, Loading, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { getClinic } from '@/services/api';
import { colors } from '@/theme';

/** Privacy policy & terms — text is edited by the admin in Clinic Settings. */
export default function Legal() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const { data, loading, error, reload } = useAsync(getClinic, []);
  const isTerms = kind === 'terms';
  return (
    <Screen>
      <Header title={isTerms ? 'Terms & Conditions' : 'Privacy Policy'} />
      {loading ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (
        <Card><Text style={{ color: colors.text, lineHeight: 22 }}>{isTerms ? data?.terms : data?.privacy_policy}</Text></Card>
      )}
    </Screen>
  );
}
