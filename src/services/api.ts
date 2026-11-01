import { supabase } from '@/lib/supabase';
import type {
  Appointment, AppNotification, ClinicSettings, Doctor, MedicalHistory, PatientRow, Profile, Schedule, Service, Slot,
} from '@/lib/types';

/** Throws on error so callers can show a real error (never simulate success). */
function ok<T>(res: { data: T | null; error: any }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

const APPT_SELECT =
  '*, service:services(name,category,price), doctor:doctors(id,full_name,designation,photo_url), ' +
  'patient:profiles!appointments_patient_id_fkey(full_name,phone,email,avatar_url)';

/* ---------- clinic & catalog ---------- */
export async function getClinic(): Promise<ClinicSettings> {
  return ok(await supabase.from('clinic_settings').select('*').eq('id', 1).single());
}
export async function updateClinic(patch: Partial<ClinicSettings>) {
  ok(await supabase.from('clinic_settings').update(patch).eq('id', 1));
}

export async function listServices(opts: { includeInactive?: boolean } = {}): Promise<Service[]> {
  let q = supabase.from('services').select('*').order('created_at');
  if (!opts.includeInactive) q = q.eq('is_active', true);
  return ok(await q);
}
export async function saveService(s: Partial<Service> & { name: string; category: string }) {
  if (s.id) ok(await supabase.from('services').update(s).eq('id', s.id));
  else ok(await supabase.from('services').insert(s));
}

export async function listDoctors(opts: { includeInactive?: boolean } = {}): Promise<Doctor[]> {
  let q = supabase.from('doctors').select('*').order('full_name');
  if (!opts.includeInactive) q = q.eq('is_active', true);
  return ok(await q);
}
export async function getDoctor(id: string): Promise<Doctor> {
  return ok(await supabase.from('doctors').select('*').eq('id', id).single());
}
export async function saveDoctor(d: Partial<Doctor> & { full_name: string }): Promise<string> {
  if (d.id) { ok(await supabase.from('doctors').update(d).eq('id', d.id)); return d.id; }
  const row = ok(await supabase.from('doctors').insert(d).select('id').single()) as { id: string };
  return row.id;
}
export async function getSchedules(doctorId: string): Promise<Schedule[]> {
  return ok(await supabase.from('doctor_schedules').select('*').eq('doctor_id', doctorId).order('weekday').order('start_time'));
}
export async function addSchedule(s: Omit<Schedule, 'id'>) {
  ok(await supabase.from('doctor_schedules').insert(s));
}
export async function deleteSchedule(id: string) {
  ok(await supabase.from('doctor_schedules').delete().eq('id', id));
}
export async function addBlockedTime(b: { doctor_id: string; slot_date: string; start_time: string; end_time: string; reason?: string }) {
  ok(await supabase.from('doctor_time_slots').insert({ ...b, is_blocked: true }));
}
export async function listBlockedTimes(doctorId: string) {
  return ok(await supabase.from('doctor_time_slots').select('*').eq('doctor_id', doctorId)
    .gte('slot_date', new Date().toISOString().slice(0, 10)).order('slot_date')) as any[];
}
export async function deleteBlockedTime(id: string) {
  ok(await supabase.from('doctor_time_slots').delete().eq('id', id));
}
export async function getAvailableSlots(doctorId: string, date: string, exclude?: string): Promise<Slot[]> {
  return ok(await supabase.rpc('get_available_slots', { p_doctor: doctorId, p_date: date, p_exclude: exclude ?? null }));
}
export async function doctorReviews(doctorId: string) {
  return ok(await supabase.from('doctor_reviews').select('rating,comment,created_at').eq('doctor_id', doctorId)
    .order('created_at', { ascending: false }).limit(10)) as any[];
}

/* ---------- appointments ---------- */
export async function bookAppointment(a: { service: string; doctor: string; date: string; start: string; reason: string; notes?: string }): Promise<Appointment> {
  return ok(await supabase.rpc('book_appointment', {
    p_service: a.service, p_doctor: a.doctor, p_date: a.date, p_start: a.start, p_reason: a.reason, p_notes: a.notes ?? null,
  }));
}
export async function getAppointment(id: string): Promise<Appointment> {
  return ok(await supabase.from('appointments').select(APPT_SELECT).eq('id', id).single());
}
export async function myAppointments(patientId: string): Promise<Appointment[]> {
  return ok(await supabase.from('appointments').select(APPT_SELECT).eq('patient_id', patientId)
    .order('appointment_date', { ascending: false }).order('start_time', { ascending: false }).limit(200));
}
export async function appointmentsInRange(from: string, to: string, f: { doctorId?: string; status?: string } = {}): Promise<Appointment[]> {
  let q = supabase.from('appointments').select(APPT_SELECT).gte('appointment_date', from).lte('appointment_date', to)
    .order('appointment_date').order('start_time');
  if (f.doctorId) q = q.eq('doctor_id', f.doctorId);
  if (f.status) q = q.eq('status', f.status);
  return ok(await q);
}
export async function listAppointments(f: { status?: string; doctorId?: string; serviceId?: string; date?: string; limit?: number; offset?: number } = {}): Promise<Appointment[]> {
  let q = supabase.from('appointments').select(APPT_SELECT).order('appointment_date', { ascending: false }).order('start_time', { ascending: false });
  if (f.status) q = q.eq('status', f.status);
  if (f.doctorId) q = q.eq('doctor_id', f.doctorId);
  if (f.serviceId) q = q.eq('service_id', f.serviceId);
  if (f.date) q = q.eq('appointment_date', f.date);
  const lim = f.limit ?? 30, off = f.offset ?? 0;
  return ok(await q.range(off, off + lim - 1));
}
export async function pendingRequests(): Promise<Appointment[]> {
  return ok(await supabase.from('appointments').select(APPT_SELECT).eq('status', 'pending').order('created_at', { ascending: true }));
}
export const approveAppointment = async (id: string) => ok(await supabase.rpc('approve_appointment', { p_id: id }));
export const rejectAppointment = async (id: string, reason: string, comment?: string) =>
  ok(await supabase.rpc('reject_appointment', { p_id: id, p_reason: reason, p_comment: comment ?? null }));
export const cancelAppointment = async (id: string, reason?: string) =>
  ok(await supabase.rpc('cancel_appointment', { p_id: id, p_reason: reason ?? null }));
export const rescheduleAppointment = async (id: string, date: string, start: string, doctor?: string) =>
  ok(await supabase.rpc('reschedule_appointment', { p_id: id, p_date: date, p_start: start, p_doctor: doctor ?? null }));
export const completeAppointment = async (id: string, summary?: string, internal?: string) =>
  ok(await supabase.rpc('complete_appointment', { p_id: id, p_summary: summary ?? null, p_internal_note: internal ?? null }));
export const setAdminComment = async (id: string, comment: string) =>
  ok(await supabase.rpc('set_admin_comment', { p_id: id, p_comment: comment }));
export async function appointmentHistory(id: string) {
  return ok(await supabase.from('appointment_status_history').select('*').eq('appointment_id', id).order('created_at')) as any[];
}

/* ---------- patient profile ---------- */
export async function getPatient(id: string): Promise<PatientRow> {
  return ok(await supabase.from('patients').select('*').eq('id', id).single());
}
export async function updateMyProfile(id: string, profile: Partial<Profile>, patient: Partial<PatientRow>) {
  if (Object.keys(profile).length) ok(await supabase.from('profiles').update(profile).eq('id', id));
  if (Object.keys(patient).length) ok(await supabase.from('patients').update(patient).eq('id', id));
}
export async function getMedical(id: string): Promise<MedicalHistory> {
  return ok(await supabase.from('medical_histories').select('*').eq('patient_id', id).single());
}
export async function saveMedical(id: string, m: MedicalHistory) {
  ok(await supabase.from('medical_histories').update(m).eq('patient_id', id));
}
export async function sendSupport(userId: string, subject: string, message: string) {
  ok(await supabase.from('support_messages').insert({ user_id: userId, subject, message }));
}
export async function mySupport(userId: string) {
  return ok(await supabase.from('support_messages').select('*').eq('user_id', userId).order('created_at', { ascending: false })) as any[];
}
export async function getNotificationPrefs(userId: string) {
  return ok(await supabase.from('notification_preferences').select('*').eq('user_id', userId).single()) as any;
}
export async function saveNotificationPrefs(userId: string, p: any) {
  ok(await supabase.from('notification_preferences').update(p).eq('user_id', userId));
}
export async function submitReview(a: { doctor_id: string; appointment_id: string; patient_id: string; rating: number; comment?: string }) {
  ok(await supabase.from('doctor_reviews').insert(a));
}

/* ---------- notifications ---------- */
export async function listNotifications(userId: string, limit = 50): Promise<AppNotification[]> {
  return ok(await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit));
}
export const markRead = async (id: string) => ok(await supabase.rpc('mark_notification_read', { p_id: id }));
export const markAllRead = async () => ok(await supabase.rpc('mark_all_notifications_read'));

/* ---------- admin ---------- */
export async function dashboardStats(): Promise<any> { return ok(await supabase.rpc('admin_dashboard_stats')); }
export async function report(from: string, to: string): Promise<any> { return ok(await supabase.rpc('admin_report', { p_from: from, p_to: to })); }
export async function recentActivity() {
  return ok(await supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(15)) as any[];
}
export async function listPatients(search = '', offset = 0, limit = 30): Promise<(Profile)[]> {
  let q = supabase.from('profiles').select('*').eq('role', 'patient').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (search.trim()) q = q.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
  return ok(await q);
}
export async function listStaff(role: 'assistant' | 'doctor'): Promise<any[]> {
  if (role === 'assistant') {
    return ok(await supabase.from('assistants').select('*, profile:profiles(full_name,email,phone)').order('created_at', { ascending: false }));
  }
  return ok(await supabase.from('doctors').select('*, profile:profiles(email)').order('full_name'));
}
export async function updateAssistant(id: string, patch: { permissions?: any; is_active?: boolean }) {
  ok(await supabase.from('assistants').update(patch).eq('id', id));
}
export async function setPatientActive(id: string, active: boolean) {
  ok(await supabase.from('profiles').update({ is_active: active }).eq('id', id));
}
export async function setRole(email: string, role: string, doctorId?: string) {
  ok(await supabase.rpc('admin_set_role', { p_email: email, p_role: role, p_doctor_id: doctorId ?? null }));
}
export async function sendAnnouncement(title: string, body: string): Promise<number> {
  return ok(await supabase.rpc('send_announcement', { p_title: title, p_body: body }));
}
export async function patientNotes(patientId: string) {
  return ok(await supabase.from('patient_notes').select('*').eq('patient_id', patientId).order('created_at', { ascending: false })) as any[];
}
export async function addPatientNote(patientId: string, authorId: string, note: string, appointmentId?: string) {
  ok(await supabase.from('patient_notes').insert({ patient_id: patientId, author_id: authorId, note, appointment_id: appointmentId ?? null }));
}
export async function applyForAdmin(message: string) { ok(await supabase.rpc('apply_for_admin', { p_message: message })); }
export async function adminApplications() {
  return ok(await supabase.from('admin_applications').select('*, profile:profiles(full_name,email)').eq('status', 'pending')) as any[];
}
export async function reviewAdminApplication(id: string, approve: boolean) {
  ok(await supabase.rpc('review_admin_application', { p_id: id, p_approve: approve }));
}
export async function supportInbox() {
  return ok(await supabase.from('support_messages').select('*, profile:profiles(full_name,email)').order('created_at', { ascending: false }).limit(50)) as any[];
}
export async function replySupport(id: string, reply: string) {
  ok(await supabase.from('support_messages').update({ admin_reply: reply, status: 'resolved' }).eq('id', id));
}

/** Doctor ids that have a working schedule on a given ISO weekday (1=Mon … 7=Sun). */
export async function doctorIdsWorkingOn(weekday: number): Promise<string[]> {
  const rows = ok(await supabase.from('doctor_schedules').select('doctor_id').eq('weekday', weekday)) as { doctor_id: string }[];
  return Array.from(new Set(rows.map((r) => r.doctor_id)));
}
export async function allSchedules(): Promise<Schedule[]> {
  return ok(await supabase.from('doctor_schedules').select('*'));
}

export async function getReview(appointmentId: string) {
  return ok(await supabase.from('doctor_reviews').select('rating,comment').eq('appointment_id', appointmentId).maybeSingle()) as { rating: number; comment: string | null } | null;
}
