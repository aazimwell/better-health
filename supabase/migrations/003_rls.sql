-- =====================================================================
-- Better Health — 003 Row Level Security
-- Security is enforced here, not by hidden buttons.
-- =====================================================================
alter table profiles                  enable row level security;
alter table patients                  enable row level security;
alter table doctors                   enable row level security;
alter table assistants                enable row level security;
alter table services                  enable row level security;
alter table doctor_schedules          enable row level security;
alter table doctor_time_slots         enable row level security;
alter table appointments              enable row level security;
alter table appointment_status_history enable row level security;
alter table notifications             enable row level security;
alter table notification_preferences  enable row level security;
alter table medical_histories         enable row level security;
alter table patient_notes             enable row level security;
alter table doctor_reviews            enable row level security;
alter table clinic_settings           enable row level security;
alter table admin_activity_logs       enable row level security;
alter table support_messages          enable row level security;
alter table admin_applications        enable row level security;

-- helper: does the current doctor have an appointment with this patient?
create or replace function doctor_has_patient(p_patient uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from appointments a
                 where a.patient_id = p_patient and a.doctor_id = my_doctor_id()
                   and a.status in ('pending','approved','completed'))
$$;

-- profiles ----------------------------------------------------------------
create policy profiles_select on profiles for select to authenticated using (
  id = auth.uid() or is_admin() or assistant_can('view_patients')
  or (role = 'patient' and doctor_has_patient(id)));
create policy profiles_update_own on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());   -- role/is_active protected by trigger
create policy profiles_admin_update on profiles for update to authenticated
  using (is_admin()) with check (is_admin());

-- patients ------------------------------------------------------------------
create policy patients_select on patients for select to authenticated using (
  id = auth.uid() or is_admin() or assistant_can('view_patients') or doctor_has_patient(id));
create policy patients_update_own on patients for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy patients_admin_update on patients for update to authenticated
  using (is_admin()) with check (is_admin());

-- doctors: active doctors are public to signed-in users ---------------------
create policy doctors_select on doctors for select to authenticated using (
  is_active or is_admin() or profile_id = auth.uid() or assistant_can('view_appointments'));
create policy doctors_admin_all on doctors for all to authenticated
  using (is_admin()) with check (is_admin());
create policy doctors_update_self on doctors for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- assistants ------------------------------------------------------------------
create policy assistants_select on assistants for select to authenticated using (
  is_admin() or profile_id = auth.uid());
create policy assistants_admin_all on assistants for all to authenticated
  using (is_admin()) with check (is_admin());

-- services --------------------------------------------------------------------
create policy services_select on services for select to authenticated using (is_active or is_admin());
create policy services_admin_all on services for all to authenticated
  using (is_admin()) with check (is_admin());

-- schedules / blocked slots ----------------------------------------------------
create policy schedules_select on doctor_schedules for select to authenticated using (true);
create policy schedules_admin_all on doctor_schedules for all to authenticated
  using (is_admin()) with check (is_admin());
create policy schedules_doctor_own on doctor_schedules for all to authenticated
  using (doctor_id = my_doctor_id()) with check (doctor_id = my_doctor_id());

create policy slots_select on doctor_time_slots for select to authenticated using (
  is_admin() or doctor_id = my_doctor_id() or assistant_can('view_appointments'));
create policy slots_admin_all on doctor_time_slots for all to authenticated
  using (is_admin()) with check (is_admin());
create policy slots_doctor_own on doctor_time_slots for all to authenticated
  using (doctor_id = my_doctor_id()) with check (doctor_id = my_doctor_id());

-- appointments: READ only; all writes go through RPCs ---------------------------
create policy appointments_select on appointments for select to authenticated using (
  patient_id = auth.uid() or is_admin() or doctor_id = my_doctor_id() or assistant_can('view_appointments'));

create policy history_select on appointment_status_history for select to authenticated using (
  exists (select 1 from appointments a where a.id = appointment_id and (
    a.patient_id = auth.uid() or is_admin() or a.doctor_id = my_doctor_id() or assistant_can('view_appointments'))));

-- notifications (own only; read-state changed via RPC) ---------------------------
create policy notifications_select on notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_delete_own on notifications for delete to authenticated using (user_id = auth.uid());

create policy notif_prefs_own on notification_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- medical histories (private) -----------------------------------------------------
create policy medical_own on medical_histories for all to authenticated
  using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy medical_admin_read on medical_histories for select to authenticated using (is_admin());
create policy medical_doctor_read on medical_histories for select to authenticated using (doctor_has_patient(patient_id));

-- internal patient notes (never visible to patients) -------------------------------
create policy pnotes_select on patient_notes for select to authenticated using (
  is_admin() or (my_doctor_id() is not null and doctor_has_patient(patient_id)));
create policy pnotes_insert on patient_notes for insert to authenticated with check (
  author_id = auth.uid() and (is_admin() or (my_doctor_id() is not null and doctor_has_patient(patient_id))));

-- reviews ---------------------------------------------------------------------------
create policy reviews_select on doctor_reviews for select to authenticated using (true);
create policy reviews_insert on doctor_reviews for insert to authenticated with check (
  patient_id = auth.uid() and exists (
    select 1 from appointments a where a.id = appointment_id and a.patient_id = auth.uid()
      and a.doctor_id = doctor_reviews.doctor_id and a.status = 'completed'));

-- clinic settings --------------------------------------------------------------------
create policy clinic_select on clinic_settings for select to anon, authenticated using (true);
create policy clinic_admin_update on clinic_settings for update to authenticated
  using (is_admin()) with check (is_admin());

-- logs / support / applications -----------------------------------------------------
create policy logs_admin_select on admin_activity_logs for select to authenticated using (is_admin());

create policy support_insert on support_messages for insert to authenticated with check (user_id = auth.uid());
create policy support_select on support_messages for select to authenticated using (user_id = auth.uid() or is_admin());
create policy support_admin_update on support_messages for update to authenticated
  using (is_admin()) with check (is_admin());

create policy admin_app_select on admin_applications for select to authenticated using (
  user_id = auth.uid() or is_super_admin());

-- realtime ----------------------------------------------------------------------------
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table appointments;
