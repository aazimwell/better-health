import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, EmptyState, ErrorView, FormModal, Header, Input, Loading, Screen } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { replySupport, supportInbox } from '@/services/api';
import { friendlyError, timeAgo } from '@/lib/utils';
import { colors } from '@/theme';

export default function SupportInbox() {
  const { data, loading, error, reload } = useAsync(supportInbox, []);
  const [sel, setSel] = useState<any>(null); const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const send = async () => {
    setBusy(true); setErr('');
    try { await replySupport(sel.id, reply.trim()); setSel(null); setReply(''); reload(); } catch (e) { setErr(friendlyError(e)); } finally { setBusy(false); }
  };
  return (
    <Screen onRefresh={reload} refreshing={loading && !!data}>
      <Header title="Support Inbox" />
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (data ?? []).length === 0 ? <EmptyState kind="bell" title="No messages" /> : (data ?? []).map((m: any) => (
        <Card key={m.id} style={{ marginBottom: 10 }} onPress={() => { setSel(m); setReply(m.admin_reply ?? ''); }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700', color: colors.text, flex: 1 }}>{m.subject}</Text>
            <Text style={{ color: m.status === 'open' ? colors.warning : colors.success, fontSize: 11, fontWeight: '700' }}>{m.status}</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{m.profile?.full_name} · {timeAgo(m.created_at)}</Text>
          <Text style={{ color: colors.text, marginTop: 4 }} numberOfLines={2}>{m.message}</Text>
        </Card>
      ))}
      <FormModal visible={!!sel} title={sel?.subject ?? ''} onClose={() => setSel(null)}>
        {err ? <Banner type="error" text={err} /> : null}
        <Text style={{ color: colors.text, marginBottom: 12 }}>{sel?.message}</Text>
        <Input label="Reply" multiline value={reply} onChangeText={setReply} />
        <Button title="Send reply & resolve" onPress={send} loading={busy} disabled={!reply.trim()} />
      </FormModal>
    </Screen>
  );
}
