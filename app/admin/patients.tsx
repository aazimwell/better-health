import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar, Button, Card, EmptyState, ErrorView, Header, Loading, Screen, StatusBadge } from '@/components/ui';
import { listPatients } from '@/services/api';
import { friendlyError } from '@/lib/utils';
import { colors, radius } from '@/theme';
import type { Profile } from '@/lib/types';

const PAGE = 30;

export default function Patients() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Profile[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async (reset: boolean) => {
    setLoading(true); setErr('');
    try {
      const rows = await listPatients(q, reset ? 0 : items.length, PAGE);
      setItems(reset ? rows : [...items, ...rows]);
      setMore(rows.length === PAGE);
    } catch (e) { setErr(friendlyError(e)); } finally { setLoading(false); }
  };
  useEffect(() => { const t = setTimeout(() => load(true), 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Screen>
      <Header title="Patients" />
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search name, email or phone" placeholderTextColor="#9FB0C6" style={{ flex: 1, marginLeft: 8, color: colors.text }} />
      </View>
      {err ? <ErrorView message={err} onRetry={() => load(true)} /> : loading && items.length === 0 ? <Loading /> : items.length === 0 ? (
        <EmptyState kind="people" title="No patients found" />
      ) : (
        <>
          {items.map((p) => (
            <Card key={p.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push({ pathname: '/admin/patient/[id]', params: { id: p.id } })}>
              <Avatar path={p.avatar_url} name={p.full_name} size={46} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{p.full_name || '(no name)'}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{p.email}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{p.phone}</Text>
              </View>
              {!p.is_active && <View style={{ backgroundColor: colors.dangerSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ color: colors.danger, fontSize: 10, fontWeight: '700' }}>Disabled</Text></View>}
            </Card>
          ))}
          {more && <Button title="Load more" variant="outline" loading={loading} onPress={() => load(false)} />}
        </>
      )}
    </Screen>
  );
}
