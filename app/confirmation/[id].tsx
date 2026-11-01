import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Banner, Button, Card, ErrorView, Loading, Screen, StatusBadge } from '@/components/ui';
import { ConfirmIllustration } from '@/components/illustrations';
import { useAsync } from '@/hooks/useAsync';
import { getAppointment, getClinic } from '@/services/api';
import { fmtRange, fullDoctorName, longDate } from '@/lib/utils';
import { colors } from '@/theme';

/** Shown only after the database confirmed the appointment row. Pending ≠ confirmed. */
export default function Confirmation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const appt = useAsync(() => getAppointment(id), [id]);
  const clinic = useAsync(getClinic, []);

  if (appt.loading && !appt.data) return <Screen scroll={false}><Loading /></Screen>;
  if (appt.error || !appt.data) return <Screen><ErrorView message={appt.error ?? 'We could not load this appointment.'} onRetry={appt.reload} /></Screen>;
  const a = appt.data;
  const confirmed = a.status === 'approved' || a.status === 'completed';
  const pending = a.status === 'pending';

  const rows: [keyof typeof Ionicons.glyphMap, string][] = [
    ['calendar-outline', longDate(a.appointment_date)],
    ['time-outline', fmtRange(a.start_time, a.end_time)],
    ['location-outline', clinic.data ? `${clinic.data.clinic_name}\n${clinic.data.address}` : '—'],
    ['pricetag-outline', `Booking ID: ${a.booking_ref}`],
  ];

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <ConfirmIllustration size={170} pending={pending} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 10, textAlign: 'center' }}>
          {confirmed ? 'Appointment Confirmed!' : pending ? 'Appointment Request Submitted' : `Appointment ${a.status}`}
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 6, maxWidth: 300 }}>
          {pending ? 'The clinic will review your request. You will be notified once it is approved or declined.' : confirmed ? 'Your booking has been confirmed by the clinic.' : 'See your appointments for details.'}
        </Text>
      </View>

      <Card style={{ marginTop: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16 }}>{a.service?.name}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 2 }}>{fullDoctorName(a.doctor?.full_name)}</Text>
          </View>
          <StatusBadge status={a.status} />
        </View>
        {rows.map(([icon, text], i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingTop: 12 }}>
            <Ionicons name={icon} size={19} color={colors.primary} />
            <Text style={{ marginLeft: 12, color: colors.text, flex: 1, lineHeight: 20 }}>{text}</Text>
          </View>
        ))}
      </Card>

      <View style={{ marginTop: 14 }}>
        <Banner type={confirmed ? 'success' : 'info'} text={pending ? 'Status: Pending approval. A notification will appear in the app when the clinic responds.' : 'You will receive notifications about any changes to this appointment.'} />
      </View>
      <Button title="Go to My Appointments" icon="arrow-forward" onPress={() => router.replace('/(patient)/appointments')} />
      <Button title="Back to Home" variant="ghost" onPress={() => router.replace('/(patient)/home')} style={{ marginTop: 6 }} />
    </Screen>
  );
}
