import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, EmptyState, ErrorView, FormModal, Header, Input, Loading, Screen, Chip } from '@/components/ui';
import { ServiceArt } from '@/components/illustrations';
import { useAsync } from '@/hooks/useAsync';
import { listServices, saveService } from '@/services/api';
import { CATEGORIES, friendlyError, money } from '@/lib/utils';
import { colors } from '@/theme';
import type { Service } from '@/lib/types';

const blank = { id: '', name: '', description: '', category: 'Physiotherapy', price: '0', is_active: true };

export default function Services() {
  const { data, loading, error, reload } = useAsync(() => listServices({ includeInactive: true }), []);
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);

  const edit = (s?: Service) => { setF(s ? { id: s.id, name: s.name, description: s.description, category: s.category, price: String(s.price), is_active: s.is_active } : blank); setOpen(true); };
  const save = async () => {
    const price = parseFloat(f.price);
    if (f.name.trim().length < 3) return setMsg({ t: 'error', m: 'Enter a service name.' });
    if (isNaN(price) || price < 0) return setMsg({ t: 'error', m: 'Enter a valid price.' });
    setBusy(true);
    try { await saveService({ id: f.id || undefined, name: f.name.trim(), description: f.description.trim(), category: f.category, price, is_active: f.is_active }); setOpen(false); reload(); setMsg({ t: 'success', m: 'Service saved.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  const toggle = async (s: Service, v: boolean) => {
    try { await saveService({ id: s.id, name: s.name, category: s.category, is_active: v }); reload(); } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); }
  };

  return (
    <Screen>
      <Header title="Services" />
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      <Button title="Add service" icon="add" onPress={() => edit()} style={{ marginBottom: 14 }} />
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (data ?? []).length === 0 ? <EmptyState title="No services" /> : (data ?? []).map((s) => (
        <Card key={s.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', opacity: s.is_active ? 1 : 0.6 }}>
          <ServiceArt category={s.category} size={52} />
          <Pressable style={{ flex: 1, marginLeft: 12 }} onPress={() => edit(s)}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{s.name}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{s.category} · {money(s.price)}</Text>
          </Pressable>
          <Pressable onPress={() => edit(s)} hitSlop={8} style={{ marginRight: 10 }}><Ionicons name="create-outline" size={20} color={colors.primary} /></Pressable>
          <Switch value={s.is_active} onValueChange={(v) => toggle(s, v)} trackColor={{ true: colors.primary, false: '#CBD5E1' }} />
        </Card>
      ))}
      <FormModal visible={open} title={f.id ? 'Edit service' : 'New service'} onClose={() => setOpen(false)}>
        <Input label="Name" value={f.name} onChangeText={(v) => setF({ ...f, name: v })} />
        <Input label="Description" multiline value={f.description} onChangeText={(v) => setF({ ...f, description: v })} />
        <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 6 }}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          {CATEGORIES.map((c) => <Chip key={c} label={c} active={f.category === c} onPress={() => setF({ ...f, category: c })} />)}
        </View>
        <Input label="Starting price (৳)" keyboardType="decimal-pad" value={f.price} onChangeText={(v) => setF({ ...f, price: v })} />
        <Button title="Save service" onPress={save} loading={busy} />
      </FormModal>
    </Screen>
  );
}
