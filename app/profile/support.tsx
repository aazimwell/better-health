import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Banner, Button, Card, Header, Input, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { getClinic, mySupport, sendSupport } from '@/services/api';
import { friendlyError, timeAgo } from '@/lib/utils';
import { colors } from '@/theme';

export default function Support() {
  const { profile } = useAuth();
  const clinic = useAsync(getClinic, []);
  const msgs = useAsync(() => mySupport(profile!.id), [profile?.id], !!profile);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);

  const send = async () => {
    if (busy) return;
    if (!subject.trim() || !text.trim()) return setMsg({ t: 'error', m: 'Please fill in the subject and message.' });
    setBusy(true); setMsg(null);
    try { await sendSupport(profile!.id, subject.trim(), text.trim()); setSubject(''); setText(''); setMsg({ t: 'success', m: 'Message sent. The clinic will reply here.' }); msgs.reload(); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };

  return (
    <Screen keyboard>
      <Header title="Help & Support" />
      {clinic.data && (clinic.data.phone || clinic.data.email) ? (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {clinic.data.phone ? <Button title="Call clinic" icon="call" variant="outline" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${clinic.data!.phone}`)} /> : null}
          {clinic.data.email ? <Button title="Email" icon="mail" variant="outline" style={{ flex: 1 }} onPress={() => Linking.openURL(`mailto:${clinic.data!.email}`)} /> : null}
        </View>
      ) : null}
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      <Input label="Subject" value={subject} onChangeText={setSubject} />
      <Input label="Message" multiline value={text} onChangeText={setText} />
      <Button title="Send message" onPress={send} loading={busy} />
      {(msgs.data ?? []).length > 0 && <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text, marginTop: 24, marginBottom: 10 }}>Your messages</Text>}
      {(msgs.data ?? []).map((m: any) => (
        <Card key={m.id} style={{ marginBottom: 10 }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>{m.subject}</Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>{m.message}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>{timeAgo(m.created_at)} · {m.status}</Text>
          {m.admin_reply ? <View style={{ backgroundColor: colors.primarySoft, borderRadius: 10, padding: 10, marginTop: 8 }}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>Clinic reply</Text><Text style={{ color: colors.text, marginTop: 2 }}>{m.admin_reply}</Text></View> : null}
        </Card>
      ))}
    </Screen>
  );
}
