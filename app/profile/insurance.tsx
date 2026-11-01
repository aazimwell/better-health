import React, { useEffect, useState } from 'react';
import { Banner, Button, ErrorView, Header, Input, Loading, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import { getPatient, updateMyProfile } from '@/services/api';
import { friendlyError } from '@/lib/utils';

export default function Insurance() {
  const { profile } = useAuth();
  const { data, loading, error, reload } = useAsync(() => getPatient(profile!.id), [profile?.id], !!profile);
  const [prov, setProv] = useState('');
  const [num, setNum] = useState('');
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) { setProv(data.insurance_provider ?? ''); setNum(data.insurance_number ?? ''); } }, [data]);

  const save = async () => {
    if (busy) return;
    setBusy(true); setMsg(null);
    try { await updateMyProfile(profile!.id, {}, { insurance_provider: prov.trim() || null, insurance_number: num.trim() || null }); setMsg({ t: 'success', m: 'Insurance details saved.' }); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };
  return (
    <Screen keyboard>
      <Header title="Insurance & Coverage" />
      {loading && !data ? <Loading /> : error ? <ErrorView message={error} onRetry={reload} /> : (
        <>
          {msg ? <Banner type={msg.t} text={msg.m} /> : null}
          <Input label="Insurance provider" value={prov} onChangeText={setProv} placeholder="Leave blank if none" />
          <Input label="Policy / member number" value={num} onChangeText={setNum} />
          <Button title="Save" onPress={save} loading={busy} />
        </>
      )}
    </Screen>
  );
}
