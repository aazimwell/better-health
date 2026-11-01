-- =====================================================================
-- Better Health — 001 schema (tables, constraints, indexes, triggers)
-- Run migrations 001 → 005 in order in the Supabase SQL editor.
-- =====================================================================
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type user_role as enum ('patient','doctor','assistant','admin','super_admin');
create type appointment_status as enum ('pending','approved','rejected','completed','cancelled');

-- generic updated_at trigger ------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- 1. profiles ----------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'patient',
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,               -- storage path in profile-photos bucket
  is_active boolean not null default true,
  terms_accepted_at timestamptz,
  expo_push_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on profiles(role);
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

-- 2. patients ----------------------------------------------------------
create table patients (
  id uuid primary key references profiles(id) on delete cascade,
  date_of_birth date,
  gender text check (gender in ('male','female','other')),
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  insurance_provider text,
  insurance_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger patients_updated before update on patients for each row execute function set_updated_at();

-- 3. doctors -----------------------------------------------------------
create table doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles(id) on delete set null,  -- login account (optional)
  full_name text not null,
  designation text not null default '',
  bio text not null default '',
  qualifications text not null default '',
  university text not null default '',
  specializations text[] not null default '{}',
  experience_years int not null default 0 check (experience_years >= 0),
  consultation_fee numeric(10,2) not null default 0 check (consultation_fee >= 0),
  photo_url text,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger doctors_updated before update on doctors for each row execute function set_updated_at();

-- 4. assistants --------------------------------------------------------
create table assistants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  permissions jsonb not null default
    '{"view_appointments":true,"manage_appointments":false,"notify_patients":false,"view_patients":true}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger assistants_updated before update on assistants for each row execute function set_updated_at();

-- 5. services ----------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null check (category in ('Physiotherapy','Chiropractic','Rehabilitation','Sports Injury')),
  price numeric(10,2) not null default 0 check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger services_updated before update on services for each row execute function set_updated_at();

-- 7. doctor_schedules (weekly recurring; weekday 1=Mon … 7=Sun) --------
create table doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 30 check (slot_minutes between 10 and 240),
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  unique (doctor_id, weekday, start_time)
);
create index doctor_schedules_doctor_idx on doctor_schedules(doctor_id);

-- 8. doctor_time_slots (date-specific blocked time / leave) ------------
create table doctor_time_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  is_blocked boolean not null default true,
  reason text,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index doctor_time_slots_idx on doctor_time_slots(doctor_id, slot_date);

-- 6. appointments ------------------------------------------------------
create table appointments (
  id uuid primary key default gen_random_uuid(),
  booking_ref text not null unique default ('BH-' || upper(substr(encode(gen_random_bytes(5),'hex'),1,8))),
  patient_id uuid not null references profiles(id) on delete restrict,
  doctor_id uuid not null references doctors(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status appointment_status not null default 'pending',
  patient_reason text not null,
  patient_notes text,
  admin_comment text,
  rejection_reason text,
  treatment_summary text,            -- visible to the patient once completed
  cancelled_by uuid references profiles(id),
  cancellation_reason text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  -- generated range used by the double-booking guard
  slot tsrange generated always as (tsrange(appointment_date + start_time, appointment_date + end_time)) stored,
  -- Two active (pending/approved) appointments can never overlap for the same doctor.
  constraint no_double_booking exclude using gist (doctor_id with =, slot with &&)
    where (status in ('pending','approved'))
);
create index appointments_patient_idx on appointments(patient_id, appointment_date);
create index appointments_doctor_idx on appointments(doctor_id, appointment_date);
create index appointments_status_idx on appointments(status, appointment_date);
create trigger appointments_updated before update on appointments for each row execute function set_updated_at();

-- 9. appointment_status_history ---------------------------------------
create table appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  from_status appointment_status,
  to_status appointment_status not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);
create index ash_appt_idx on appointment_status_history(appointment_id, created_at);

create or replace function log_appointment_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into appointment_status_history(appointment_id, from_status, to_status, changed_by, note)
    values (new.id, null, new.status, auth.uid(), 'Request submitted');
  elsif new.status is distinct from old.status
     or new.appointment_date is distinct from old.appointment_date
     or new.start_time is distinct from old.start_time
     or new.doctor_id is distinct from old.doctor_id then
    insert into appointment_status_history(appointment_id, from_status, to_status, changed_by, note)
    values (new.id, old.status, new.status, auth.uid(),
      case when new.status is distinct from old.status then coalesce(new.rejection_reason, new.cancellation_reason)
           else 'Rescheduled / doctor changed' end);
  end if;
  return new;
end $$;
create trigger appointments_history after insert or update on appointments
  for each row execute function log_appointment_change();

-- 10. notifications ----------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null default 'appointment'
    check (category in ('appointment','announcement','reminder','system')),
  title text not null,
  body text not null default '',
  appointment_id uuid references appointments(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id, is_read, created_at desc);

-- 11. notification_preferences ----------------------------------------
create table notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  appointment_updates boolean not null default true,
  announcements boolean not null default true,
  reminders boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 12. medical_histories -----------------------------------------------
create table medical_histories (
  patient_id uuid primary key references patients(id) on delete cascade,
  existing_conditions text not null default '',
  previous_treatments text not null default '',
  allergies text not null default '',
  medical_notes text not null default '',
  updated_at timestamptz not null default now()
);
create trigger medical_histories_updated before update on medical_histories for each row execute function set_updated_at();

-- 13. patient_notes (internal, never visible to patients) -------------
create table patient_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  author_id uuid not null references profiles(id),
  note text not null,
  created_at timestamptz not null default now()
);
create index patient_notes_idx on patient_notes(patient_id, created_at desc);

-- 14. doctor_reviews ---------------------------------------------------
create table doctor_reviews (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  patient_id uuid not null references profiles(id) on delete cascade,
  appointment_id uuid not null unique references appointments(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create or replace function refresh_doctor_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare d uuid := coalesce(new.doctor_id, old.doctor_id);
begin
  update doctors set
    rating_avg = coalesce((select round(avg(rating)::numeric,2) from doctor_reviews where doctor_id = d),0),
    rating_count = (select count(*) from doctor_reviews where doctor_id = d)
  where id = d;
  return null;
end $$;
create trigger reviews_rating after insert or update or delete on doctor_reviews
  for each row execute function refresh_doctor_rating();

-- 15. clinic_settings (single row) ------------------------------------
create table clinic_settings (
  id int primary key default 1 check (id = 1),
  clinic_name text not null default 'Better Health Physiotherapy & Chiropractic Center',
  logo_url text,
  address text not null default 'Clinic address — set in Admin → Clinic Settings',
  phone text not null default '',
  email text not null default '',
  opening_hours text not null default 'Sat–Thu: 9:00 AM – 5:00 PM',
  introduction text not null default 'Professional physiotherapy and chiropractic care.',
  appointment_policy text not null default 'Appointments are confirmed only after clinic approval.',
  cancellation_policy text not null default 'Please cancel at least 12 hours before your appointment.',
  cancellation_hours int not null default 12 check (cancellation_hours >= 0),
  privacy_policy text not null default 'Your personal and medical information is kept private and used only for your care.',
  terms text not null default 'By using this app you agree to the clinic''s terms of service.',
  timezone text not null default 'Asia/Dhaka',
  notification_settings jsonb not null default '{"notify_admin_on_request":true,"reminders":true}',
  updated_at timestamptz not null default now()
);
create trigger clinic_settings_updated before update on clinic_settings for each row execute function set_updated_at();

-- 16. admin_activity_logs ---------------------------------------------
create table admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index admin_logs_idx on admin_activity_logs(created_at desc);

-- 17. support_messages -------------------------------------------------
create table support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  admin_reply text,
  created_at timestamptz not null default now()
);

-- extra: admin_applications (admin access is never self-granted) -------
create table admin_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create unique index admin_app_one_pending on admin_applications(user_id) where status = 'pending';

-- new auth user → profile (ALWAYS role = patient; client metadata role is ignored)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, role, full_name, email, phone, terms_accepted_at)
  values (new.id, 'patient',
          coalesce(new.raw_user_meta_data->>'full_name',''),
          new.email,
          new.raw_user_meta_data->>'phone',
          case when (new.raw_user_meta_data->>'terms_accepted') = 'true' then now() end);
  insert into patients(id) values (new.id);
  insert into medical_histories(patient_id) values (new.id);
  insert into notification_preferences(user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
