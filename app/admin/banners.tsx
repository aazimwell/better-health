import React, { useState } from 'react';
import { Alert, Image, Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, EmptyState, ErrorView, FormModal, Header, Input, Loading, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { deleteBanner, listBanners, saveBanner } from '@/services/api';
import { friendlyError } from '@/lib/utils';
import { colors } from '@/theme';
import type { HomeBanner } from '@/lib/types';

// Admin home banners — same pattern as the admin services screen.
// A banner is an image URL + an optional link URL; as many as wanted can be
// added. The home screen shows every active banner (no day/weekday filter).
const blank = { id: '', title: '', subtitle: '', image_url: '', link_url: '', sort_order: '0', is_active: true };

export default function Banners() {
  const { data, loading, error, reload } = useAsync(() => listBanners({ includeInactive: true }), []);
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);

  const edit = (b?: HomeBanner) => {
    setF(b ? { id: b.id, title: b.title, subtitle: b.subtitle ?? '', image_url: b.image_url, link_url: b.link_url ?? '', sort_order: String(b.sort_order), is_active: b.is_active } : blank);
    setOpen(true);
  };
  const save = async () => {
    if (f.title.trim().length < 3) return setMsg({ t: 'error', m: 'Enter a banner title.' });
    if (!f.image_url.trim().startsWith('http')) return setMsg({ t: 'error', m: 'Enter a valid image URL (link starting with http).' });
    if (f.link_url.trim() && !f.link_url.trim().startsWith('http')) return setMsg({ t: 'error', m: 'Enter a valid link URL (starting with http) or leave it blank.' });
    const sort_order = parseInt(f.sort_order, 10);
    if (isNaN(sort_order) || sort_order < 0) return setMsg({ t: 'error', m: 'Sort order must be 0 or more.' });
    setBusy(true);
    try {
      await saveBanner({ id: f.id || undefined, title: f.title.trim(), subtitle: f.subtitle.trim() || null, image_url: f.image_url.trim(), link_url: f.link_url.trim() || null, sort_order, is_active: f.is_active });
      setOpen(false); reload(); setMsg({ t: 'success', m: 'Banner saved.' });
    } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  const toggle = async (b: HomeBanner, v: boolean) => {
    try { await saveBanner({ ...b, is_active: v }); reload(); } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); }
  };
  const remove = (b: HomeBanner) => {
    Alert.alert('Delete banner?', `"${b.title}" will be removed from the home screen.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteBanner(b.id); reload(); setMsg({ t: 'success', m: 'Banner deleted.' }); } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } } },
    ]);
  };

  return (
    <Screen>
      <Header title="Home banners" />
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      <Button title="Add banner" icon="add" onPress={() => edit()} style={{ marginBottom: 14 }} />
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (data ?? []).length === 0 ? <EmptyState title="No banners" /> : (data ?? []).map((b) => (
        <Card key={b.id} style={{ marginBottom: 10, opacity: b.is_active ? 1 : 0.6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={{ uri: b.image_url }} style={{ width: 52, height: 52, borderRadius: 10 }} />
            <Pressable style={{ flex: 1, marginLeft: 12 }} onPress={() => edit(b)}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{b.title}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{b.subtitle || 'No subtitle'} · Order {b.sort_order}</Text>
            </Pressable>
            <Pressable onPress={() => edit(b)} hitSlop={8} style={{ marginRight: 10 }}><Ionicons name="create-outline" size={20} color={colors.primary} /></Pressable>
            <Pressable onPress={() => remove(b)} hitSlop={8} style={{ marginRight: 10 }}><Ionicons name="trash-outline" size={20} color={colors.danger} /></Pressable>
            <Switch value={b.is_active} onValueChange={(v) => toggle(b, v)} trackColor={{ true: colors.primary, false: '#CBD5E1' }} />
          </View>
        </Card>
      ))}
      <FormModal visible={open} title={f.id ? 'Edit banner' : 'New banner'} onClose={() => setOpen(false)}>
        <Input label="Title (e.g. 20% off physiotherapy)" value={f.title} onChangeText={(v) => setF({ ...f, title: v })} />
        <Input label="Subtitle (e.g. a discount or a patient review)" multiline value={f.subtitle} onChangeText={(v) => setF({ ...f, subtitle: v })} />
        <Input label="Image URL (link)" value={f.image_url} onChangeText={(v) => setF({ ...f, image_url: v })} />
        <Input label="Link URL (optional — opened when the banner is tapped)" value={f.link_url} onChangeText={(v) => setF({ ...f, link_url: v })} />
        <Input label="Sort order (lower shows first)" keyboardType="decimal-pad" value={f.sort_order} onChangeText={(v) => setF({ ...f, sort_order: v })} />
        <Button title="Save banner" onPress={save} loading={busy} />
      </FormModal>
    </Screen>
  );
}
