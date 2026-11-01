import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Avatar, Banner, Button, Card, ErrorView, FormModal, Header, Input, Loading, Screen, StatusBadge, confirmAction,
} from '@/components/ui';
import { RescheduleModal } from '@/components/RescheduleModal';
import { useAuth, isAdminRole } from '@/lib/auth';
import { useAsync } from '@/hooks/useAsync';
import {
  addPatientNote, appointmentHistory, approveAppointment, cancelAppointment, completeAppointment, getAppointment, getReview,
  patientNotes, rejectAppointment, setAdminComment, submitReview,
} from '@/services/api';
import { fmtRange, friendlyError, fullDoctorName, longDate, money, timeAgo } from '@/lib/utils';
import { colors, radius } from '@/theme';
import { supabase } from '@/lib/supabase';

/** One appointment screen for every role. Buttons are shown per role, and every action is re-checked by the database. */
export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { role, profile } = useAuth();
  const appt = useAsync(() => getAppointment(id), [id]);
  const hist = useAsync(() => appointmentHistory(id), [id]);
  const review = useAsync(() => getReview(id), [id], role === 'patient');
  const notes = useAsync(async () => (appt.data ? patientNotes(appt.data.patient_id) : []), [appt.data?.patient_id], (isAdminRole(role) || role === 'doctor') && !!appt.data);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'error' | 'success'; m: string } | null>(null);
  const [modal, setModal] = useState<null | 'reject' | 'complete' | 'cancel' | 'comment' | 'reschedule' | 'review' | 'note'>(null);
  const [f1, setF1] = useState('');
  const [f2, setF2] = useState('');
  const [rating, setRating] = useState(5);

  const refresh = () => { appt.reload(); hist.reload(); review.reload(); notes.reload(); };
  const close = () => { setModal(null); setF1(''); setF2(''); };

  /** runs a DB action: never shows success unless the database call succeeded */
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    if (busy) return;
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ t: 'success', m: ok }); close(); refresh(); }
    catch (e) { setMsg({ t: 'error', m: friendlyError(e) }); } finally { setBusy(false); }
  };

  if (appt.loading && !appt.data) return <Screen scroll={false}><Loading /></Screen>;
  if (appt.error || !appt.data) return <Screen><Header title="Appointment" /><ErrorView message={appt.error ?? 'Not found'} onRetry={appt.reload} /></Screen>;
  const a = appt.data;
  const isPatient = role === 'patient';
  const isAdmin = isAdminRole(role);
  const active = a.status === 'pending' || a.status === 'approved';
  const canManage = isAdmin || role === 'assistant';
  const isMyDoctorAppt = role === 'doctor';

  const Row = ({ icon, k, v }: { icon: keyof typeof Ionicons.glyphMap; k: string; v?: string | null }) => !v ? null : (
    <View style={{ flexDirection: 'row', paddingVertical: 9 }}>
      <Ionicons name={icon} size={18} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>{k}</Text>
        <Text style={{ color: colors.text, fontWeight: '600', marginTop: 1, lineHeight: 20 }}>{v}</Text>
      </View>
    </View>
  );

  return (
    <Screen onRefresh={refresh} refreshing={appt.loading && !!appt.data}>
      <Header title="Appointment Details" />
      {msg ? <Banner type={msg.t} text={msg.m} /> : null}

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '800', color: colors.text, fontSize: 17, flex: 1 }}>{a.service?.name}</Text>
          <StatusBadge status={a.status} />
        </View>
        <Text style={{ color: colors.textMuted, marginTop: 2, fontSize: 12 }}>Ref: {a.booking_ref}</Text>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
        <Row icon="person-outline" k="Doctor" v={fullDoctorName(a.doctor?.full_name)} />
        <Row icon="calendar-outline" k="Date" v={longDate(a.appointment_date)} />
        <Row icon="time-outline" k="Time" v={fmtRange(a.start_time, a.end_time)} />
        <Row icon="cash-outline" k="Fee from" v={a.service ? money(a.service.price) : null} />
        <Row icon="chatbubble-ellipses-outline" k="Reason for visit" v={a.patient_reason} />
        <Row icon="document-text-outline" k="Patient notes" v={a.patient_notes} />
        {a.status === 'completed' && <Row icon="checkmark-done-outline" k="Completed on" v={a.completed_at ? longDate(a.completed_at.slice(0, 10)) : null} />}
      </Card>

      {a.status === 'rejected' && (
        <Card style={{ marginTop: 12, backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft }}>
          <Text style={{ color: colors.danger, fontWeight: '800' }}>Request rejected</Text>
          <Text style={{ color: colors.text, marginTop: 6 }}>Reason: {a.rejection_reason}</Text>
          {a.admin_comment ? <Text style={{ color: colors.text, marginTop: 4 }}>Clinic comment: {a.admin_comment}</Text> : null}
        </Card>
      )}
      {a.status === 'cancelled' && a.cancellation_reason ? <Banner type="info" text={`Cancellation reason: ${a.cancellation_reason}`} /> : null}
      {a.status !== 'rejected' && a.admin_comment && !isPatient ? (
        <Card style={{ marginTop: 12 }}><Text style={{ fontWeight: '700', color: colors.text }}>Admin comment</Text><Text style={{ color: colors.text, marginTop: 4 }}>{a.admin_comment}</Text></Card>
      ) : null}
      {a.status === 'completed' && a.treatment_summary ? (
        <Card style={{ marginTop: 12 }}><Text style={{ fontWeight: '700', color: colors.text }}>Treatment summary</Text><Text style={{ color: colors.text, marginTop: 4, lineHeight: 20 }}>{a.treatment_summary}</Text></Card>
      ) : null}

      {/* patient contact — staff only */}
      {!isPatient && a.patient && (
        <Card style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 8 }}>Patient</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar path={a.patient.avatar_url} name={a.patient.full_name} size={46} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{a.patient.full_name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.patient.email}</Text>
            </View>
            {a.patient.phone ? (
              <Pressable onPress={() => Linking.openURL(`tel:${a.patient!.phone}`)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="call" size={18} color={colors.success} />
              </Pressable>
            ) : null}
          </View>
          {a.patient.phone ? <Text style={{ color: colors.text, marginTop: 8 }}>{a.patient.phone}</Text> : null}
        </Card>
      )}

      {/* ---------- actions ---------- */}
      <View style={{ marginTop: 16, gap: 10 }}>
        {isAdmin && a.status === 'pending' && (
          <>
            <Button title="Approve" icon="checkmark-circle" variant="success" loading={busy}
              onPress={async () => { if (await confirmAction('Approve request', 'Confirm this appointment and notify the patient?', 'Approve', false)) run(() => approveAppointment(a.id), 'Appointment approved. The patient has been notified.'); }} />
            <Button title="Reject" icon="close-circle" variant="danger" onPress={() => setModal('reject')} />
          </>
        )}
        {(isAdmin || isMyDoctorAppt) && a.status === 'approved' && (
          <Button title="Mark as Completed" icon="checkmark-done" onPress={() => setModal('complete')} />
        )}
        {canManage && active && <Button title="Reschedule / Change doctor" variant="outline" icon="swap-horizontal" onPress={() => setModal('reschedule')} />}
        {canManage && <Button title={a.admin_comment ? 'Edit comment' : 'Add comment'} variant="outline" icon="chatbox-outline" onPress={() => { setF1(a.admin_comment ?? ''); setModal('comment'); }} />}
        {(isAdmin || isMyDoctorAppt) && <Button title="Add internal patient note" variant="outline" icon="create-outline" onPress={() => setModal('note')} />}
        {(isPatient ? active : canManage && active) && <Button title="Cancel Appointment" variant="danger" icon="close" onPress={() => setModal('cancel')} />}
        {isPatient && a.status === 'completed' && !review.data && <Button title="Rate your visit" variant="outline" icon="star-outline" onPress={() => setModal('review')} />}
        {isPatient && review.data ? <Banner type="success" text={`You rated this visit ${review.data.rating}/5. Thank you!`} /> : null}
        {isPatient && a.status === 'rejected' && <Button title="Book a new appointment" onPress={() => router.replace('/(patient)/book')} />}
      </View>

      {/* internal notes (never visible to patients; RLS enforced) */}
      {(isAdmin || isMyDoctorAppt) && (notes.data ?? []).length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 6 }}>Internal notes</Text>
          {(notes.data ?? []).slice(0, 5).map((n: any) => (
            <View key={n.id} style={{ paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ color: colors.text }}>{n.note}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{timeAgo(n.created_at)}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* history */}
      <Card style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: '800', color: colors.text, marginBottom: 8 }}>History</Text>
        {(hist.data ?? []).length === 0 ? <Text style={{ color: colors.textMuted }}>No history yet.</Text> : (hist.data ?? []).map((h: any) => (
          <View key={h.id} style={{ flexDirection: 'row', paddingVertical: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5 }} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600', textTransform: 'capitalize' }}>{h.to_status}{h.note ? ` — ${h.note}` : ''}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{new Date(h.created_at).toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* ---------- modals ---------- */}
      <FormModal visible={modal === 'reject'} title="Reject request" onClose={close}>
        <Input label="Rejection reason (required)" multiline value={f1} onChangeText={setF1} placeholder="e.g. Doctor unavailable at this time" />
        <Input label="Additional comment (optional)" multiline value={f2} onChangeText={setF2} placeholder="Shown to the patient" />
        <Button title="Reject request" variant="danger" loading={busy} disabled={!f1.trim()} onPress={() => run(() => rejectAppointment(a.id, f1, f2), 'Request rejected. The patient has been notified.')} />
      </FormModal>
      <FormModal visible={modal === 'complete'} title="Complete appointment" onClose={close}>
        <Input label="Treatment summary (visible to patient)" multiline value={f1} onChangeText={setF1} placeholder="Short summary of the visit" />
        <Input label="Internal note (staff only)" multiline value={f2} onChangeText={setF2} />
        <Button title="Mark completed" loading={busy} onPress={() => run(() => completeAppointment(a.id, f1, f2), 'Appointment marked as completed.')} />
      </FormModal>
      <FormModal visible={modal === 'cancel'} title="Cancel appointment" onClose={close}>
        <Text style={{ color: colors.textMuted, marginBottom: 12 }}>This cannot be undone. {isPatient ? 'The clinic will be notified.' : 'The patient will be notified.'}</Text>
        <Input label="Reason (optional)" multiline value={f1} onChangeText={setF1} />
        <Button title="Yes, cancel appointment" variant="danger" loading={busy} onPress={() => run(() => cancelAppointment(a.id, f1), 'Appointment cancelled.')} />
      </FormModal>
      <FormModal visible={modal === 'comment'} title="Admin comment" onClose={close}>
        <Input multiline value={f1} onChangeText={setF1} placeholder="Comment" />
        <Button title="Save comment" loading={busy} onPress={() => run(() => setAdminComment(a.id, f1), 'Comment saved.')} />
      </FormModal>
      <FormModal visible={modal === 'note'} title="Internal patient note" onClose={close}>
        <Input multiline value={f1} onChangeText={setF1} placeholder="Visible to admins and treating doctors only" />
        <Button title="Save note" loading={busy} disabled={!f1.trim()} onPress={() => run(() => addPatientNote(a.patient_id, profile!.id, f1.trim(), a.id), 'Note saved.')} />
      </FormModal>
      <FormModal visible={modal === 'review'} title="Rate your visit" onClose={close}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 14 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)}><Ionicons name={n <= rating ? 'star' : 'star-outline'} size={38} color="#F5A524" /></Pressable>
          ))}
        </View>
        <Input multiline value={f1} onChangeText={setF1} placeholder="Share your experience (optional)" />
        <Button title="Submit review" loading={busy} onPress={() => run(() => submitReview({ doctor_id: a.doctor_id, appointment_id: a.id, patient_id: profile!.id, rating, comment: f1.trim() || undefined }), 'Thank you for your review!')} />
      </FormModal>
      {modal === 'reschedule' && (
        <RescheduleModal appt={a} visible onClose={close} onDone={() => { close(); setMsg({ t: 'success', m: 'Appointment rescheduled. The patient has been notified.' }); refresh(); }} />
      )}
    </Screen>
  );
}
