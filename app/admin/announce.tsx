import React, { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Header, Input, Screen, confirmAction } from '@/components/ui';
import { sendAnnouncement } from '@/services/api';
import { friendlyError } from '@/lib/utils';
import { colors } from '@/theme';

export default function Announce() {
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);
  const send = async () => {
    if (busy || !title.trim()) return;
    if (!(await confirmAction('Send announcement', 'This notifies all active patients. Continue?', 'Send', false))) return;
    setBusy(true); setMsg(null);
    try { const n = await sendAnnouncement(title, body); setTitle(''); setBody(''); setMsg({ t: 'success', m: `Sent to ${n} patient${n === 1 ? '' : 's'}.` }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  return (
    <Screen keyboard>
      <Header title="Announcement" />
      <Text style={{ color: colors.textMuted, marginBottom: 14 }}>Sends an in-app notification to every active patient who has announcements enabled.</Text>
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}
      <Input label="Title" value={title} onChangeText={setTitle} />
      <Input label="Message" multiline value={body} onChangeText={setBody} />
      <Button title="Send to patients" icon="megaphone" onPress={send} loading={busy} disabled={!title.trim()} />
    </Screen>
  );
}
