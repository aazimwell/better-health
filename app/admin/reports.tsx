import React, { useState } from 'react';
import { Share, Text, View } from 'react-native';
import { Banner, Button, Card, Chip, ErrorView, Header, Loading, Screen, SectionTitle } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { report } from '@/services/api';
import { toISODate } from '@/lib/utils';
import { colors } from '@/theme';

const RANGES = [{ k: 'Daily', d: 0 }, { k: 'Weekly', d: 6 }, { k: 'Monthly', d: 29 }] as const;

const csv = (r: any) => {
  const lines = [`Better Health report,${r.from},${r.to}`, '', 'Status,Count', ...Object.entries(r.by_status).map(([k, v]) => `${k},${v}`),
    '', 'Doctor,Total,Completed', ...r.by_doctor.map((d: any) => `"${d.name}",${d.total},${d.completed}`),
    '', 'Service,Total', ...r.by_service.map((s: any) => `"${s.name}",${s.total}`),
    '', 'Registration date,New patients', ...r.registrations.map((x: any) => `${x.day},${x.count}`)];
  return lines.join('\n');
};

export default function Reports() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);
  const to = toISODate(new Date());
  const from = toISODate(new Date(Date.now() - range.d * 86400000));
  const { data, loading, error, reload } = useAsync(() => report(from, to), [from, to]);
  const [err, setErr] = useState('');

  const exportCsv = async () => {
    try { await Share.share({ title: `better-health-report-${from}-${to}.csv`, message: csv(data) }); } catch (e: any) { setErr(e?.message ?? 'Could not share'); }
  };
  const total = data ? Object.values(data.by_status as Record<string, number>).reduce((a, b) => a + b, 0) : 0;
  const done = data?.by_status?.completed ?? 0, canc = data?.by_status?.cancelled ?? 0;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : '—');

  const Bar = ({ label, n, max, color }: { label: string; n: number; max: number; color: string }) => (
    <View style={{ marginVertical: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>{label}</Text><Text style={{ fontWeight: '700', color: colors.text }}>{n}</Text></View>
      <View style={{ height: 8, backgroundColor: '#EEF3F9', borderRadius: 4, marginTop: 3 }}><View style={{ height: 8, width: `${max ? (n / max) * 100 : 0}%`, backgroundColor: color, borderRadius: 4 }} /></View>
    </View>
  );

  return (
    <Screen>
      <Header title="Reports & Analytics" />
      <View style={{ flexDirection: 'row' }}>{RANGES.map((r) => <Chip key={r.k} label={`${r.k}`} active={range.k === r.k} onPress={() => setRange(r)} />)}</View>
      <Text style={{ color: colors.textMuted, marginTop: 8 }}>{from} → {to}</Text>
      {err ? <Banner type="error" text={err} /> : null}
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : data && (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            {[['Total', String(total)], ['Completed', pct(done)], ['Cancelled', pct(canc)]].map(([k, v]) => (
              <Card key={k} style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{v}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>{k}</Text></Card>
            ))}
          </View>
          <SectionTitle title="By status" />
          <Card>{Object.entries(data.by_status as Record<string, number>).length === 0 ? <Text style={{ color: colors.textMuted }}>No data.</Text> :
            Object.entries(data.by_status as Record<string, number>).map(([k, v]) => <Bar key={k} label={k} n={v} max={total} color={colors.primary} />)}</Card>
          <SectionTitle title="By doctor" />
          <Card>{data.by_doctor.length === 0 ? <Text style={{ color: colors.textMuted }}>No data.</Text> : data.by_doctor.map((d: any) => <Bar key={d.name} label={`${d.name} (${d.completed} completed)`} n={d.total} max={Math.max(...data.by_doctor.map((x: any) => x.total))} color={colors.success} />)}</Card>
          <SectionTitle title="By service" />
          <Card>{data.by_service.length === 0 ? <Text style={{ color: colors.textMuted }}>No data.</Text> : data.by_service.map((d: any) => <Bar key={d.name} label={d.name} n={d.total} max={Math.max(...data.by_service.map((x: any) => x.total))} color={colors.purple} />)}</Card>
          <SectionTitle title="New patient registrations" />
          <Card>{data.registrations.length === 0 ? <Text style={{ color: colors.textMuted }}>No registrations in this period.</Text> : data.registrations.map((x: any) => <Bar key={x.day} label={x.day} n={x.count} max={Math.max(...data.registrations.map((y: any) => y.count))} color={colors.orange} />)}</Card>
          <Button title="Export / share as CSV" icon="share-outline" onPress={exportCsv} style={{ marginTop: 16 }} />
        </>
      )}
    </Screen>
  );
}
