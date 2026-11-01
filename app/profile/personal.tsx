import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Banner, Button, ErrorView, Header, Input, Loading, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { getPatient, updateMyProfile } from '@/services/api';
import { pickCompressedImage, uploadMyAvatar } from '@/services/storage';
import { friendlyError, isPhone } from '@/lib/utils';
import { colors, radius } from '@/theme';

const GENDERS = ['male', 'female', 'other'];

/** Used for patients and (name/phone/photo only) for staff. */
export default function Personal() {
  const { profile, role, refreshProfile } = useAuth();
  const isPatient = role === 'patient';
  const pat = useAsync(() => getPatient(profile!.id), [profile?.id], !!profile && isPatient);
  const [f, setF] = useState({ full_name: '', phone: '', date_of_birth: '', gender: '', address: '', ec_name: '', ec_phone: '' });
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setF((x) => ({
      ...x, full_name: profile.full_name ?? '', phone: profile.phone ?? '',
      date_of_birth: pat.data?.date_of_birth ?? '', gender: pat.data?.gender ?? '', address: pat.data?.address ?? '',
      ec_name: pat.data?.emergency_contact_name ?? '', ec_phone: pat.data?.emergency_contact_phone ?? '',
    }));
  }, [profile, pat.data]);

  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    if (busy || !profile) return;
    if (f.full_name.trim().length < 3) return setMsg({ t: 'error', m: 'Enter your full name.' });
    if (!isPhone(f.phone)) return setMsg({ t: 'error', m: 'Enter a valid phone number.' });
    if (f.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(f.date_of_birth)) return setMsg({ t: 'error', m: 'Date of birth must be YYYY-MM-DD.' });
    setBusy(true); setMsg(null);
    try {
      await updateMyProfile(profile.id, { full_name: f.full_name.trim(), phone: f.phone.trim() },
        isPatient ? {
          date_of_birth: f.date_of_birth || null, gender: f.gender || null, address: f.address.trim() || null,
          emergency_contact_name: f.ec_name.trim() || null, emergency_contact_phone: f.ec_phone.trim() || null,
        } : {});
      await refreshProfile();
      setMsg({ t: 'success', m: 'Profile saved.' });
    } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };

  const changePhoto = async () => {
    if (!profile) return;
    try {
      const uri = await pickCompressedImage();
      if (!uri) return;
      setBusy(true);
      await uploadMyAvatar(profile.id, uri);
      await refreshProfile();
      setMsg({ t: 'success', m: 'Photo updated.' });
    } catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };

  return (
    <Screen keyboard>
      <Header title="Personal Information" />
      {pat.loading && isPatient && !pat.data ? <Loading /> : pat.error ? <ErrorView message={pat.error} onRetry={pat.reload} /> : (
        <>
          {msg ? <Banner type={msg.t} text={msg.m} /> : null}
          <View style={{ alignItems: 'center', marginBottom: 18 }}>
            <Avatar path={profile?.avatar_url} name={profile?.full_name} size={96} key={profile?.avatar_url} />
            <Pressable onPress={changePhoto} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 6 }}>Change photo</Text>
            </Pressable>
          </View>
          <Input label="Full name" value={f.full_name} onChangeText={set('full_name')} />
          <Input label="Email" value={profile?.email ?? ''} editable={false} />
          <Input label="Phone number" keyboardType="phone-pad" value={f.phone} onChangeText={set('phone')} />
          {isPatient && (
            <>
              <Input label="Date of birth (YYYY-MM-DD)" placeholder="1995-04-23" value={f.date_of_birth} onChangeText={set('date_of_birth')} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>Gender (optional)</Text>
              <View style={{ flexDirection: 'row', marginBottom: 14 }}>
                {GENDERS.map((g) => (
                  <Pressable key={g} onPress={() => set('gender')(f.gender === g ? '' : g)}
                    style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, marginRight: 8, borderWidth: 1.5, borderColor: f.gender === g ? colors.primary : colors.border, backgroundColor: f.gender === g ? colors.primary : '#fff' }}>
                    <Text style={{ color: f.gender === g ? '#fff' : colors.text, fontWeight: '600', textTransform: 'capitalize' }}>{g}</Text>
                  </Pressable>
                ))}
              </View>
              <Input label="Address" multiline value={f.address} onChangeText={set('address')} />
              <Input label="Emergency contact name" value={f.ec_name} onChangeText={set('ec_name')} />
              <Input label="Emergency contact phone" keyboardType="phone-pad" value={f.ec_phone} onChangeText={set('ec_phone')} />
            </>
          )}
          <Button title="Save changes" onPress={save} loading={busy} />
        </>
      )}
    </Screen>
  );
}
