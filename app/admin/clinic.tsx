import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Banner, Button, ErrorView, Header, Input, Loading, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { getClinic, updateClinic } from '@/services/api';
import { pickCompressedImage, publicUrl, uploadImage } from '@/services/storage';
import { friendlyError } from '@/lib/utils';
import { colors } from '@/theme';

const FIELDS: [string, string, boolean?][] = [
  ['clinic_name', 'Clinic name'], ['address', 'Address', true], ['phone', 'Phone'], ['email', 'Email'], ['opening_hours', 'Opening hours', true],
  ['introduction', 'Introduction (About Us)', true], ['appointment_policy', 'Appointment policy', true], ['cancellation_policy', 'Cancellation policy', true],
  ['cancellation_hours', 'Patient cancellation window (hours before visit)'], ['privacy_policy', 'Privacy policy', true], ['terms', 'Terms & conditions', true],
];

export default function ClinicSettings() {
  const { data, loading, error, reload } = useAsync(getClinic, []);
  const [f, setF] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);
  useEffect(() => { if (data) { setF(Object.fromEntries(FIELDS.map(([k]) => [k, String((data as any)[k] ?? '')]))); setLogo(data.logo_url); } }, [data]);

  const save = async () => {
    const hrs = parseInt(f.cancellation_hours, 10);
    if (!f.clinic_name?.trim()) return setMsg({ t: 'error', m: 'Clinic name is required.' });
    if (isNaN(hrs) || hrs < 0) return setMsg({ t: 'error', m: 'Cancellation window must be a number of hours.' });
    setBusy(true); setMsg(null);
    try { await updateClinic({ ...f, cancellation_hours: hrs } as any); setMsg({ t: 'success', m: 'Clinic settings saved.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  const uploadLogo = async () => {
    try {
      const uri = await pickCompressedImage(512); if (!uri) return;
      setBusy(true); await uploadImage('clinic-assets', 'logo.jpg', uri);
      const url = publicUrl('clinic-assets', 'logo.jpg'); await updateClinic({ logo_url: url }); setLogo(url); setMsg({ t: 'success', m: 'Logo uploaded.' });
    } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };

  return (
    <Screen keyboard>
      <Header title="Clinic Settings" />
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (
        <>
          {msg ? <Banner type={msg.t} text={msg.m} /> : null}
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <Avatar url={logo} name={f.clinic_name} size={80} />
            <Pressable onPress={uploadLogo} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}><Ionicons name="image-outline" size={18} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 6 }}>Upload logo</Text></Pressable>
          </View>
          {FIELDS.map(([k, label, multi]) => <Input key={k} label={label} multiline={multi} value={f[k] ?? ''} onChangeText={(v) => setF({ ...f, [k]: v })} keyboardType={k === 'cancellation_hours' ? 'number-pad' : 'default'} />)}
          <Button title="Save settings" onPress={save} loading={busy} />
        </>
      )}
    </Screen>
  );
}
