export type Role = 'patient' | 'doctor' | 'assistant' | 'admin' | 'super_admin';
export type Status = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface Profile {
  id: string; role: Role; full_name: string; email: string | null; phone: string | null;
  avatar_url: string | null; is_active: boolean; created_at: string;
}
export interface PatientRow {
  id: string; date_of_birth: string | null; gender: string | null; address: string | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
  insurance_provider: string | null; insurance_number: string | null;
}
export interface Doctor {
  id: string; profile_id: string | null; full_name: string; designation: string; bio: string;
  qualifications: string; university: string; specializations: string[]; experience_years: number;
  consultation_fee: number; photo_url: string | null; rating_avg: number; rating_count: number; is_active: boolean;
}
export interface Service {
  id: string; name: string; description: string; category: string; price: number; image_url: string | null; is_active: boolean;
}
export interface Schedule { id: string; doctor_id: string; weekday: number; start_time: string; end_time: string; slot_minutes: number }
export interface Slot { slot_start: string; slot_end: string }
export interface Appointment {
  id: string; booking_ref: string; patient_id: string; doctor_id: string; service_id: string;
  appointment_date: string; start_time: string; end_time: string; status: Status;
  patient_reason: string; patient_notes: string | null; admin_comment: string | null; rejection_reason: string | null;
  treatment_summary: string | null; cancellation_reason: string | null;
  approved_by: string | null; approved_at: string | null; completed_at: string | null; created_at: string;
  service?: { name: string; category: string; price: number } | null;
  doctor?: { id: string; full_name: string; designation: string; photo_url: string | null } | null;
  patient?: { full_name: string; phone: string | null; email: string | null; avatar_url: string | null } | null;
}
export interface AppNotification {
  id: string; category: 'appointment' | 'announcement' | 'reminder' | 'system'; title: string; body: string;
  appointment_id: string | null; is_read: boolean; created_at: string;
}
export interface ClinicSettings {
  clinic_name: string; logo_url: string | null; address: string; phone: string; email: string; opening_hours: string;
  introduction: string; appointment_policy: string; cancellation_policy: string; cancellation_hours: number;
  privacy_policy: string; terms: string; timezone: string;
}
export interface MedicalHistory {
  existing_conditions: string; previous_treatments: string; allergies: string; medical_notes: string;
}
