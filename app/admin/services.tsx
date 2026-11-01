import React, { useState } from 'react';
import { Image, Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, EmptyState, ErrorView, FormModal, Header, Input, Loading, Screen, Chip } from '@/components/ui';
import { ServiceArt } from '@/components/illustrations';
import { useAsync } from '@/hooks/useAsync';
import { listServices, saveService } from '@/services/api';
import { CATEGORIES, friendlyError, money } from '@/lib/utils';
import { colors } from '@/theme';
import type { Service } from '@/lib/types';

const ICONS = ['medkit-outline', 'fitness-outline', 'accessibility-outline', 'body-outline', 'bandage-outline', 'heart-outline', 'pulse-outline', 'walk-outline', 'bicycle-outline', 'football-outline', 'hand-left-outline', 'leaf-outline'] as const;

// The services table has no separate icon column, so an icon choice is stored
// in the existing image_url column as 'icon:<Ionicons name>'; a plain image
// URL in image_url is used as-is and takes precedence over the icon.
const blank = { id: '', name: '', description: '', category: 'Physiotherapy', price: '0', icon: '', image_url: '', is_active: true };

function ServiceThumb({ s, size = 52 }: { s: Service; size?: number }) {
  const v = s.image_url ?? '';
  if (v.startsWith('icon:')) {
    return (<View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={v.slice(5) as any} size={size * 0.5} color={colors.primary} />
    </View>);
  }
  if (v.startsWith('http')) {
    return <Image source={{ uri: v }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return <ServiceArt category={s.category} size={size} />;
}

export default function Services() {
  const { data, loading, error, reload } = useAsync(() => listServices({ includeInactive: true }), []);
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);

  const edit = (s?: Service) => {
    if (!s) { setF(blank); setOpen(true); return; }
    const v = s.image_url ?? '';
    setF({ id: s.id, name: s.name, description: s.description, category: s.category, price: String(s.price),
      icon: v.startsWith('icon:') ? v.slice(5) : '', image_url: v.startsWith('icon:') ? '' : v, is_active: s.is_active });
    setOpen(true);
  };
  const save = async () => {
    const price = parseFloat(f.price);
    if (f.name.trim().length < 3) return setMsg({ t: 'error', m: 'Enter a service name.' });
    if (isNaN(price) || price < 0) return setMsg({ t: 'error', m: 'Enter a valid price.' });
    setBusy(true);
    try { await saveService({ id: f.id || undefined, name: f.name.trim(), description: f.description.trim(), category: f.category, price, image_url: f.icon ? `icon:${f.icon}` : (f.image_url.trim() || null), is_active: f.is_active }); setOpen(false); reload(); setMsg({ t: 'success', m: 'Service saved.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  const toggle = async (s: Service, v: boolean) => {
    try { await saveService({ ...s, is_active: v }); reload(); } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); }
  };

  return (
    <Screen>
      <Header title="Services" />
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      <Button title="Add service" icon="add" onPress={() => edit()} style={{ marginBottom: 14 }} />
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (data ?? []).length === 0 ? <EmptyState title="No services" /> : (data ?? []).map((s) => (
        <Card key={s.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', opacity: s.is_active ? 1 : 0.6 }}>
          <ServiceThumb s={s} size={52} />
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
        <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 6 }}>Icon</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
          {ICONS.map((ic) => (
            <Pressable key={ic} onPress={() => setF({ ...f, icon: f.icon === ic ? '' : ic })} style={{ width: 42, height: 42, borderRadius: 21, marginRight: 8, marginBottom: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: f.icon === ic ? colors.primary : colors.primarySoft }}>
              <Ionicons name={ic} size={20} color={f.icon === ic ? '#fff' : colors.primary} />
            </Pressable>
          ))}
        </View>
        <Input label="Image URL (optional — overrides the icon if set)" value={f.image_url} onChangeText={(v) => setF({ ...f, image_url: v })} />
        <Button title="Save service" onPress={save} loading={busy} />
      </FormModal>
    </Screen>
  );
}
