import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Card, ErrorView, Header, Loading, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { getClinic } from '@/services/api';
import { colors } from '@/theme';

/** No online payment gateway is integrated, so this page honestly says so instead of faking card entry. */
export default function Payments() {
  const { data, loading, error, reload } = useAsync(getClinic, []);
  return (
    <Screen>
      <Header title="Payment Methods" />
      {loading ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (
        <>
          <Banner type="info" text="Online payments are not available yet. Fees are paid at the clinic after your visit." />
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="cash-outline" size={22} color={colors.success} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontWeight: '800', color: colors.text }}>Pay at clinic</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{data?.clinic_name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{data?.address}</Text>
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}
