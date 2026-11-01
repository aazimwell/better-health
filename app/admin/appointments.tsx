import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Chip, EmptyState, ErrorView, Header, Loading, Screen, StatusBadge } from '@/components/ui';
import { listAppointments, listDoctors, listServices } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { fmtTime, friendlyError, fullDoctorName } from '@/lib/utils';
import { colors } from '@/theme';
import type { Appointment } from '@/lib/types';

const PAGE = 30;

/** Filter by status, doctor and service; paginated. */
export default function AllAppointments() {
  const router = useRouter();
  const [status, setStatus] = useState(''); const [doctorId, setDoctorId] = useState(''); const [serviceId, setServiceId] = useState('');
  const [items, setItems] = useState<Appointment[]>([]); const [more, setMore] = useState(false); const [loading, setLoading] = useState(true); const [err, setErr] = useState('');
  const docs = useAsync(() => listDoctors({ includeInactive: true }), []);
  const svcs = useAsync(() => listServices({ includeInactive: true }), []);

  const load = async (reset: boolean) => {
    setLoading(true); setErr('');
    try {
      const rows = await listAppointments({ status: status || undefined, doctorId: doctorId || undefined, serviceId: serviceId || undefined, limit: PAGE, offset: reset ? 0 : items.length });
      setItems(reset ? rows : [...items, ...rows]); setMore(rows.length === PAGE);
    } catch (e) { setErr(friendlyError(e)); } finally { setLoading(false); }
  };
  useEffect(() => { load(true); }, [status, doctorId, serviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen>
      <Header title="All Appointments" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {['', 'pending', 'approved', 'completed', 'cancelled', 'rejected'].map((s) => <Chip key={s} label={s ? s[0].toUpperCase() + s.slice(1) : 'Any status'} active={status === s} onPress={() => setStatus(s)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <Chip label="All doctors" active={!doctorId} onPress={() => setDoctorId('')} />
        {(docs.data ?? []).map((d) => <Chip key={d.id} label={fullDoctorName(d.full_name)} active={doctorId === d.id} onPress={() => setDoctorId(d.id)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <Chip label="All services" active={!serviceId} onPress={() => setServiceId('')} />
        {(svcs.data ?? []).map((s) => <Chip key={s.id} label={s.name} active={serviceId === s.id} onPress={() => setServiceId(s.id)} />)}
      </ScrollView>
      {err ? <ErrorView message={err} onRetry={() => load(true)} /> : loading && items.length === 0 ? <Loading /> : items.length === 0 ? <EmptyState title="No appointments" message="Try different filters." /> : (
        <>
          {items.map((a) => (
            <Card key={a.id} style={{ marginBottom: 10 }} onPress={() => router.push({ pathname: '/appointment/[id]', params: { id: a.id } })}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{a.patient?.full_name} · {a.service?.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.appointment_date} · {fmtTime(a.start_time)} · {fullDoctorName(a.doctor?.full_name)}</Text>
                </View>
                <StatusBadge status={a.status} />
              </View>
            </Card>
          ))}
          {more && <Button title="Load more" variant="outline" loading={loading} onPress={() => load(false)} />}
        </>
      )}
    </Screen>
  );
}
